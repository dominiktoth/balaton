import { db } from '../../db';

export async function createIncome({ amount, date, storeId }: { amount: number; date: Date; storeId: string }) {
  return db.income.create({
    data: { amount, date, storeId },
  });
}

export async function getIncomesByStore(storeId: string) {
  return db.income.findMany({
    where: { storeId },
    orderBy: { date: 'desc' },
  });
}

export async function getAllIncomes() {
  return db.income.findMany({
    orderBy: { date: 'desc' },
  });
}

export async function updateIncome(id: string, amount: number, date: Date) {
  return db.income.update({
    where: { id },
    data: { amount, date },
  });
}

export async function deleteIncome(id: string) {
  return db.income.delete({
    where: { id },
  });
}

export async function getIncomeSummaryByStore(storeId: string) {
  return db.income.aggregate({
    where: { storeId },
    _sum: { amount: true },
    _count: { _all: true },
  });
} 