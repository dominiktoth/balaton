import { db } from '~/server/db';
import { type Strand } from '@prisma/client';

export async function getAllStrands(): Promise<Strand[]> {
  return db.strand.findMany({
    orderBy: { name: 'asc' },
  });
}

export async function getStrandBySlug(slug: string): Promise<Strand | null> {
  return db.strand.findUnique({
    where: { slug },
  });
}
