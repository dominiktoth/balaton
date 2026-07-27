import { db } from '../../db';

export type StatsRangeInput = {
  strandSlug: string;
  from: Date;
  to: Date;
};

const iso = (value: Date) => value.toISOString();

/**
 * Egy strand összes statisztikához szükséges sora a megadott időszakra.
 * Szándékosan sovány mezőlista: a bontásokat (hét, nap, bolt, dolgozó)
 * a kliens számolja a `~/lib/stats` tiszta függvényeivel.
 */
export async function getStatsData({ strandSlug, from, to }: StatsRangeInput) {
  const strandFilter = { strand: { slug: strandSlug } };
  const date = { gte: from, lte: to };

  const [stores, incomes, expenses, investments, wages, shifts, workers] =
    await Promise.all([
      db.store.findMany({
        where: strandFilter,
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
      db.income.findMany({
        where: { store: strandFilter, date },
        select: { amount: true, date: true, storeId: true },
      }),
      db.expense.findMany({
        where: { store: strandFilter, date },
        select: { amount: true, date: true, storeId: true },
      }),
      db.investment.findMany({
        where: { store: strandFilter, date },
        select: { amount: true, date: true, storeId: true, note: true },
        orderBy: { date: 'desc' },
      }),
      db.wage.findMany({
        where: { workShift: { store: strandFilter }, date },
        select: {
          amount: true,
          date: true,
          workerId: true,
          paid: true,
          paidAmount: true,
          workShift: { select: { storeId: true } },
        },
      }),
      db.workShift.findMany({
        where: { store: strandFilter, date },
        select: { date: true, storeId: true, workerId: true },
      }),
      db.worker.findMany({
        where: { stores: { some: strandFilter } },
        select: {
          id: true,
          name: true,
          dailyWage: true,
          advances: { select: { amount: true, used: true } },
        },
        orderBy: { name: 'asc' },
      }),
    ]);

  return {
    stores,
    incomes: incomes.map((r) => ({
      date: iso(r.date),
      storeId: r.storeId,
      amount: r.amount,
    })),
    expenses: expenses.map((r) => ({
      date: iso(r.date),
      storeId: r.storeId,
      amount: r.amount,
    })),
    investments: investments.map((r) => ({
      date: iso(r.date),
      storeId: r.storeId,
      amount: r.amount,
      note: r.note,
    })),
    wages: wages.map((w) => ({
      date: iso(w.date),
      storeId: w.workShift?.storeId ?? null,
      amount: w.amount,
      workerId: w.workerId,
      paid: w.paid,
      paidAmount: w.paidAmount,
    })),
    shifts: shifts.map((s) => ({
      date: iso(s.date),
      storeId: s.storeId,
      workerId: s.workerId,
    })),
    workers: workers.map((w) => ({
      id: w.id,
      name: w.name,
      dailyWage: w.dailyWage,
      advanceBalance: w.advances.reduce(
        (acc, a) => acc + Math.max(0, a.amount - a.used),
        0,
      ),
    })),
  };
}

/**
 * Halmozott értékek egy dátumig (a megtérülés-görbe nyitóegyenlegéhez),
 * plusz az első rögzített nap — ebből jön a "teljes időszak" preset.
 */
export async function getStatsOpening({
  strandSlug,
  before,
}: {
  strandSlug: string;
  before: Date;
}) {
  const strandFilter = { strand: { slug: strandSlug } };
  const date = { lt: before };

  const [income, expense, wage, investment, firstIncome, firstExpense] =
    await Promise.all([
      db.income.aggregate({
        where: { store: strandFilter, date },
        _sum: { amount: true },
      }),
      db.expense.aggregate({
        where: { store: strandFilter, date },
        _sum: { amount: true },
      }),
      db.wage.aggregate({
        where: { workShift: { store: strandFilter }, date },
        _sum: { amount: true },
      }),
      db.investment.aggregate({
        where: { store: strandFilter, date },
        _sum: { amount: true },
      }),
      db.income.findFirst({
        where: { store: strandFilter },
        orderBy: { date: 'asc' },
        select: { date: true },
      }),
      db.expense.findFirst({
        where: { store: strandFilter },
        orderBy: { date: 'asc' },
        select: { date: true },
      }),
    ]);

  const candidates = [firstIncome?.date, firstExpense?.date].filter(
    (d): d is Date => !!d,
  );
  const firstActivity = candidates.length
    ? new Date(Math.min(...candidates.map((d) => d.getTime())))
    : null;

  const incomeSum = income._sum.amount ?? 0;
  const expenseSum = expense._sum.amount ?? 0;
  const wageSum = wage._sum.amount ?? 0;

  return {
    profit: incomeSum - expenseSum - wageSum,
    investment: investment._sum.amount ?? 0,
    income: incomeSum,
    expense: expenseSum,
    wage: wageSum,
    firstActivity: firstActivity ? iso(firstActivity) : null,
  };
}
