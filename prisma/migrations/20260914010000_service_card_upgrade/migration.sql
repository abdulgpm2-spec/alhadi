-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "employeeInstructions" TEXT,
ADD COLUMN     "serviceType" TEXT NOT NULL DEFAULT 'NEW';

-- CreateTable
CREATE TABLE "ServiceCorrectionOption" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "note" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceCorrectionOption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ServiceCorrectionOption_serviceId_idx" ON "ServiceCorrectionOption"("serviceId");

-- CreateIndex
CREATE INDEX "Service_serviceType_idx" ON "Service"("serviceType");

-- AddForeignKey
ALTER TABLE "ServiceCorrectionOption" ADD CONSTRAINT "ServiceCorrectionOption_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
