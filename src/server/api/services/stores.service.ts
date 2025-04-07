// store.service.ts
import { db } from '~/server/db';
import { type Store } from '@prisma/client';

export async function createStore(name: string): Promise<Store> {
    return db.store.create({
      data: { name },
    });

}

export async function getAllStores(): Promise<Store[]> {
    return db.store.findMany({
      
    });

}

export async function deleteStore(id: string): Promise<Store> {
    return db.store.delete({
      where: { id },
    });

}

