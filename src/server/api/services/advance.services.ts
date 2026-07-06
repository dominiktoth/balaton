import { db } from '../../db';
import { type Prisma } from '@prisma/client';

type Tx = Prisma.TransactionClient;

/**
 * Consume open advances (oldest first) to cover a wage's uncovered part.
 * Updates both the advances' `used` and the wage's paidAmount/advanceConsumed/
 * paid/paidAt. Returns how much was consumed.
 */
export async function coverWageFromAdvances(
  tx: Tx,
  workerId: string,
  wageId: string,
): Promise<number> {
  const wage = await tx.wage.findUnique({ where: { id: wageId } });
  if (!wage) return 0;
  let need = wage.amount - wage.paidAmount;
  if (need <= 0) return 0;

  const advances = await tx.advance.findMany({
    where: { workerId },
    orderBy: { date: 'asc' },
  });

  let consumed = 0;
  for (const adv of advances) {
    if (need <= 0) break;
    const balance = adv.amount - adv.used;
    if (balance <= 0) continue;
    const take = Math.min(balance, need);
    await tx.advance.update({
      where: { id: adv.id },
      data: { used: { increment: take } },
    });
    consumed += take;
    need -= take;
  }

  if (consumed > 0) {
    const newPaidAmount = wage.paidAmount + consumed;
    const fullyPaid = newPaidAmount >= wage.amount;
    await tx.wage.update({
      where: { id: wageId },
      data: {
        paidAmount: newPaidAmount,
        advanceConsumed: wage.advanceConsumed + consumed,
        paid: fullyPaid,
        paidAt: fullyPaid ? new Date() : null,
      },
    });
  }
  return consumed;
}

/**
 * Return a wage's advance-sourced cover back to the worker's advances
 * (most recent advance first). Used when a workshift/wage is deleted or a
 * wage is toggled back to unpaid.
 */
export async function refundWageAdvance(
  tx: Tx,
  workerId: string,
  advanceConsumed: number,
): Promise<void> {
  let refund = advanceConsumed;
  if (refund <= 0) return;
  const advances = await tx.advance.findMany({
    where: { workerId, used: { gt: 0 } },
    orderBy: { date: 'desc' },
  });
  for (const adv of advances) {
    if (refund <= 0) break;
    const back = Math.min(adv.used, refund);
    await tx.advance.update({
      where: { id: adv.id },
      data: { used: { decrement: back } },
    });
    refund -= back;
  }
}

/**
 * Record a new advance for a worker. The advance first covers already
 * pending wages (oldest first, scoped to dateFrom when given); whatever
 * remains stays as an open balance that future wages consume automatically.
 */
export async function createAdvance({
  workerId,
  amount,
  date,
  note,
  dateFrom,
}: {
  workerId: string;
  amount: number;
  date: Date;
  note?: string;
  dateFrom?: Date;
}) {
  return db.$transaction(async (tx) => {
    const advance = await tx.advance.create({
      data: { workerId, amount, date, note },
    });

    // Cover pending wages oldest-first from this advance
    const pending = await tx.wage.findMany({
      where: {
        workerId,
        ...(dateFrom ? { date: { gte: dateFrom } } : {}),
      },
      orderBy: { date: 'asc' },
    });

    let balance = amount;
    let coveredCount = 0;
    let coveredTotal = 0;
    for (const w of pending) {
      if (balance <= 0) break;
      const need = w.amount - w.paidAmount;
      if (need <= 0) continue;
      const take = Math.min(balance, need);
      const newPaid = w.paidAmount + take;
      const fullyPaid = newPaid >= w.amount;
      await tx.wage.update({
        where: { id: w.id },
        data: {
          paidAmount: newPaid,
          advanceConsumed: w.advanceConsumed + take,
          paid: fullyPaid,
          paidAt: fullyPaid ? new Date() : null,
        },
      });
      balance -= take;
      coveredTotal += take;
      coveredCount += 1;
    }

    const updated = await tx.advance.update({
      where: { id: advance.id },
      data: { used: coveredTotal },
    });

    return { advance: updated, coveredCount, coveredTotal, remaining: balance };
  });
}

export async function getAdvancesByWorker(workerId: string) {
  return db.advance.findMany({
    where: { workerId },
    orderBy: { date: 'desc' },
  });
}

export async function deleteAdvance(id: string) {
  const adv = await db.advance.findUnique({ where: { id } });
  if (!adv) throw new Error('Az előleg nem található.');
  if (adv.used > 0) {
    throw new Error(
      'Ez az előleg már részben fel lett használva, nem törölhető.',
    );
  }
  return db.advance.delete({ where: { id } });
}
