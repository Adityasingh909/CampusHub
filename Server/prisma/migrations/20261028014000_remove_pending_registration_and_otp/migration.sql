-- DropForeignKey
ALTER TABLE "AssignmentSubmission" DROP CONSTRAINT "AssignmentSubmission_pendingRegistrationId_fkey";

-- DropForeignKey
ALTER TABLE "Enrollment" DROP CONSTRAINT "Enrollment_pendingRegistrationId_fkey";

-- AlterTable
ALTER TABLE "AssignmentSubmission" DROP COLUMN "pendingRegistrationId";

-- AlterTable
ALTER TABLE "Enrollment" DROP COLUMN "pendingRegistrationId";

-- DropTable
DROP TABLE "PendingRegistration";
