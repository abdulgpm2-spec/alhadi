-- CreateTable
CREATE TABLE "ServiceCustomField" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "labelMr" TEXT,
    "fieldType" TEXT NOT NULL DEFAULT 'TEXT',
    "options" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "marathiEnabled" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceCustomField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkCustomFieldValue" (
    "id" TEXT NOT NULL,
    "workId" TEXT NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "valueMr" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkCustomFieldValue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ServiceCustomField_serviceId_idx" ON "ServiceCustomField"("serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceCustomField_serviceId_fieldKey_key" ON "ServiceCustomField"("serviceId", "fieldKey");

-- CreateIndex
CREATE INDEX "WorkCustomFieldValue_workId_idx" ON "WorkCustomFieldValue"("workId");

-- AddForeignKey
ALTER TABLE "ServiceCustomField" ADD CONSTRAINT "ServiceCustomField_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkCustomFieldValue" ADD CONSTRAINT "WorkCustomFieldValue_workId_fkey" FOREIGN KEY ("workId") REFERENCES "Work"("id") ON DELETE CASCADE ON UPDATE CASCADE;
