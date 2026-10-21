-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'In Progress',
ADD COLUMN     "credits" INTEGER NOT NULL DEFAULT 4,
ADD COLUMN     "instructorRole" TEXT NOT NULL DEFAULT 'Instructor',
ADD COLUMN     "schedule" TEXT NOT NULL DEFAULT 'Schedule not set',
ADD COLUMN     "thumbnail" TEXT NOT NULL DEFAULT '';
