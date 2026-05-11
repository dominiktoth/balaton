// store.service.ts
import { db } from '~/server/db';
import { type Store } from '@prisma/client';

export async function createStore(name: string, strandId: string): Promise<Store> {
    return db.store.create({
      data: { name, strandId },
    });

}

export async function getAllStores(strandSlug?: string): Promise<Store[]> {
    return db.store.findMany({
      where: strandSlug ? { strand: { slug: strandSlug } } : undefined,
      orderBy: { name: 'asc' },
    });

}

export async function deleteStore(id: string): Promise<Store> {
    return db.store.delete({
      where: { id },
    });

}
