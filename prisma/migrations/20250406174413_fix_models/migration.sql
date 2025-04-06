/*
  Warnings:

  - You are about to drop the column `description` on the `Expense` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Product` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Expense" DROP COLUMN "description";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "description";
