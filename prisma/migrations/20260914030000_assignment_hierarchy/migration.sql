-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "employeeId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "supervisorId" TEXT;

-- CreateIndex
CREATE INDEX "Customer_employeeId_idx" ON "Customer"("employeeId");

-- CreateIndex
CREATE INDEX "User_supervisorId_idx" ON "User"("supervisorId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
