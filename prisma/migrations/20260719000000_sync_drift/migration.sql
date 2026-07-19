-- AlterTable
ALTER TABLE "invitations" ADD COLUMN "allow_companions" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "show_moments" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "rsvps" ADD COLUMN "is_deleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "is_hidden" BOOLEAN NOT NULL DEFAULT false;
