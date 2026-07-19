-- AlterTable
ALTER TABLE "testimonials" ADD COLUMN     "is_deleted" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "testimonials_is_deleted_idx" ON "testimonials"("is_deleted");
