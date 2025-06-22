import { db } from '~/server/db';
import { type Prisma, type Expense } from '@prisma/client';

export const createExpense = async (amount: number, storeId: string, date?: Date): Promise<Expense> => {
  return db.expense.create({
    data: { amount, storeId, ...(date ? { date } : {}) },
  });
};

export const getAllExpenses = async (): Promise<Prisma.ExpenseGetPayload<{ include: { store: true } }>[]> => {
  return db.expense.findMany({
    orderBy: { date: 'desc' },
    include: {
      store: true,
    },
  });
};

export const updateExpense = async (id: string, amount: number, date: Date): Promise<Expense> => {
  return db.expense.update({
    where: { id },
    data: { amount, date },
  });
};

export const deleteExpense = async (id: string): Promise<Expense> => {
  return db.expense.delete({
    where: { id },
  });
};
