/*
  Warnings:

  - You are about to drop the column `template_id` on the `invitations` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `invitations` table. All the data in the column will be lost.
  - You are about to drop the column `companions_count` on the `rsvps` table. All the data in the column will be lost.
  - You are about to drop the column `guest_name` on the `rsvps` table. All the data in the column will be lost.
  - You are about to drop the column `will_attend` on the `rsvps` table. All the data in the column will be lost.
  - You are about to drop the column `thumbnail_url` on the `templates` table. All the data in the column will be lost.
  - You are about to drop the `orders` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[purchase_id]` on the table `invitations` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `event_location` to the `invitations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `event_title` to the `invitations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `purchase_id` to the `invitations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `invitations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `attendance` to the `rsvps` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `rsvps` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `templates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `editable_fields` to the `templates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `preview_image` to the `templates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `templates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RsvpAttendance" AS ENUM ('YES', 'NO');

-- CreateEnum
CREATE TYPE "TemplateCategory" AS ENUM ('Weddings', 'Bridal Showers', 'Engagement Parties', 'Birthdays', 'Corporate Events');

-- DropForeignKey
ALTER TABLE "invitations" DROP CONSTRAINT "invitations_template_id_fkey";

-- DropForeignKey
ALTER TABLE "invitations" DROP CONSTRAINT "invitations_user_id_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_template_id_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_user_id_fkey";

-- DropIndex
DROP INDEX "invitations_template_id_idx";

-- DropIndex
DROP INDEX "invitations_user_id_idx";

-- AlterTable
ALTER TABLE "invitations" DROP COLUMN "template_id",
DROP COLUMN "user_id",
ADD COLUMN     "allow_guest_uploads" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "contact_name" TEXT,
ADD COLUMN     "contact_phone" TEXT,
ADD COLUMN     "event_details" JSONB[] DEFAULT ARRAY[]::JSONB[],
ADD COLUMN     "event_location" TEXT NOT NULL,
ADD COLUMN     "event_location_ar" TEXT,
ADD COLUMN     "event_location_en" TEXT,
ADD COLUMN     "event_program" JSONB[] DEFAULT ARRAY[]::JSONB[],
ADD COLUMN     "event_title" TEXT NOT NULL,
ADD COLUMN     "event_title_ar" TEXT,
ADD COLUMN     "event_title_en" TEXT,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "language_mode" TEXT NOT NULL DEFAULT 'both',
ADD COLUMN     "moments" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "purchase_id" UUID NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "welcome_text_ar" TEXT,
ADD COLUMN     "welcome_text_en" TEXT,
ALTER COLUMN "location_url" DROP NOT NULL,
ALTER COLUMN "welcome_text" DROP NOT NULL;

-- AlterTable
ALTER TABLE "rsvps" DROP COLUMN "companions_count",
DROP COLUMN "guest_name",
DROP COLUMN "will_attend",
ADD COLUMN     "attendance" "RsvpAttendance" NOT NULL,
ADD COLUMN     "guests_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "message" TEXT,
ADD COLUMN     "name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "templates" DROP COLUMN "thumbnail_url",
ADD COLUMN     "category" "TemplateCategory" NOT NULL DEFAULT 'Weddings',
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "description_ar" TEXT,
ADD COLUMN     "description_en" TEXT,
ADD COLUMN     "editable_fields" JSONB NOT NULL,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "preview_image" TEXT NOT NULL,
ADD COLUMN     "title_ar" TEXT,
ADD COLUMN     "title_en" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "demo_link" DROP NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "password_hash" DROP NOT NULL,
ALTER COLUMN "phone_number" DROP NOT NULL;

-- DropTable
DROP TABLE "orders";

-- DropEnum
DROP TYPE "OrderStatus";

-- CreateTable
CREATE TABLE "purchase_requests" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "template_id" UUID NOT NULL,
    "contact_email" TEXT NOT NULL,
    "contact_phone" TEXT NOT NULL,
    "language_mode" TEXT NOT NULL DEFAULT 'both',
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchases" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "template_id" UUID NOT NULL,
    "purchase_request_id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "language_mode" TEXT NOT NULL DEFAULT 'both',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "testimonials" (
    "id" UUID NOT NULL,
    "purchase_id" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "testimonials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_revoked" BOOLEAN NOT NULL DEFAULT false,
    "replaced_by" TEXT,
    "revoked_at" TIMESTAMP(3),
    "revoked_reason" TEXT,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "purchase_requests_user_id_idx" ON "purchase_requests"("user_id");

-- CreateIndex
CREATE INDEX "purchase_requests_template_id_idx" ON "purchase_requests"("template_id");

-- CreateIndex
CREATE INDEX "purchase_requests_status_idx" ON "purchase_requests"("status");

-- CreateIndex
CREATE INDEX "purchase_requests_user_id_status_idx" ON "purchase_requests"("user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "purchases_purchase_request_id_key" ON "purchases"("purchase_request_id");

-- CreateIndex
CREATE UNIQUE INDEX "purchases_slug_key" ON "purchases"("slug");

-- CreateIndex
CREATE INDEX "purchases_user_id_idx" ON "purchases"("user_id");

-- CreateIndex
CREATE INDEX "purchases_template_id_idx" ON "purchases"("template_id");

-- CreateIndex
CREATE UNIQUE INDEX "testimonials_purchase_id_key" ON "testimonials"("purchase_id");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "invitations_purchase_id_key" ON "invitations"("purchase_id");

-- CreateIndex
CREATE INDEX "invitations_purchase_id_idx" ON "invitations"("purchase_id");

-- CreateIndex
CREATE INDEX "invitations_is_active_idx" ON "invitations"("is_active");

-- CreateIndex
CREATE INDEX "templates_is_active_idx" ON "templates"("is_active");

-- CreateIndex
CREATE INDEX "templates_category_idx" ON "templates"("category");

-- AddForeignKey
ALTER TABLE "purchase_requests" ADD CONSTRAINT "purchase_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_requests" ADD CONSTRAINT "purchase_requests_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_purchase_request_id_fkey" FOREIGN KEY ("purchase_request_id") REFERENCES "purchase_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_purchase_id_fkey" FOREIGN KEY ("purchase_id") REFERENCES "purchases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_purchase_id_fkey" FOREIGN KEY ("purchase_id") REFERENCES "purchases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
