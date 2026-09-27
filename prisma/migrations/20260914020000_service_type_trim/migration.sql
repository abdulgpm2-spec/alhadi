UPDATE "Service" SET "serviceType" = 'NEW' WHERE "serviceType" NOT IN ('NEW', 'CORRECTION', 'RENEWAL', 'REPRINT', 'PRINT');
