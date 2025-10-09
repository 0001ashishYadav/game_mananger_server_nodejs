-- CreateEnum
CREATE TYPE "public"."Roles" AS ENUM ('USER', 'ADMIN');

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "role" "public"."Roles" NOT NULL DEFAULT 'USER';
