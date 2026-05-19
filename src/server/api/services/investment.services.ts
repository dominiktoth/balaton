import { db } from '~/server/db';
import { type Prisma, type Investment } from '@prisma/client';

export const createInvestment = async (
  amount: number,
  storeId: string,
  date?: Date,
  note?: string,
): Promise<Investment> => {
  return db.investment.create({
    data: { amount, storeId, note, ...(date ? { date } : {}) },
  });
};

export const getAllInvestments = async (
  strandSlug?: string,
): Promise<Prisma.InvestmentGetPayload<{ include: { store: true } }>[]> => {
  return db.investment.findMany({
    where: strandSlug ? { store: { strand: { slug: strandSlug } } } : undefined,
    orderBy: { date: 'desc' },
    include: {
      store: true,
    },
  });
};

export const updateInvestment = async (
  id: string,
  amount: number,
  date: Date,
  note?: string,
): Promise<Investment> => {
  return db.investment.update({
    where: { id },
    data: { amount, date, note },
  });
};

export const deleteInvestment = async (id: string): Promise<Investment> => {
  return db.investment.delete({
    where: { id },
  });
};
