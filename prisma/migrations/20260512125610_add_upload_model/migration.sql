-- AlterTable
ALTER TABLE "EmissionRecord" ADD COLUMN     "uploadId" INTEGER;

-- CreateTable
CREATE TABLE "Upload" (
    "id" SERIAL NOT NULL,
    "fileName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Upload_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EmissionRecord" ADD CONSTRAINT "EmissionRecord_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "Upload"("id") ON DELETE SET NULL ON UPDATE CASCADE;
