-- CreateTable
CREATE TABLE "WorkCostEntry" (
    "id" TEXT NOT NULL,
    "workId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkCostEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkCostEntry_workId_idx" ON "WorkCostEntry"("workId");

-- AddForeignKey
ALTER TABLE "WorkCostEntry" ADD CONSTRAINT "WorkCostEntry_workId_fkey" FOREIGN KEY ("workId") REFERENCES "Work"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkCostEntry" ADD CONSTRAINT "WorkCostEntry_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
