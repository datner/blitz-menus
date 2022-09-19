/*
  Warnings:

  - Added the required column `orderItemModifierId` to the `OrderItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "orderItemModifierId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderItemModifierId_fkey" FOREIGN KEY ("orderItemModifierId") REFERENCES "OrderItemModifier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
