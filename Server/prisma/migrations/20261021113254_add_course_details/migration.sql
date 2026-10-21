-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "learningObjectives" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "officeHours" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "syllabusUrl" TEXT NOT NULL DEFAULT '';
