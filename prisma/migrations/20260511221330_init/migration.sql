-- CreateTable
CREATE TABLE "EmissionFactor" (
    "id" SERIAL NOT NULL,
    "activityType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "factor" DOUBLE PRECISION NOT NULL,
    "scope" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmissionFactor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmissionRecord" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "activityType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "emissionFactor" DOUBLE PRECISION NOT NULL,
    "emission" DOUBLE PRECISION NOT NULL,
    "scope" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "factorId" INTEGER,

    CONSTRAINT "EmissionRecord_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EmissionRecord" ADD CONSTRAINT "EmissionRecord_factorId_fkey" FOREIGN KEY ("factorId") REFERENCES "EmissionFactor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
