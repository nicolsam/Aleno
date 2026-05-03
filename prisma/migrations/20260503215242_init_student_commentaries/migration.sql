-- AlterTable
ALTER TABLE "user_schools" RENAME CONSTRAINT "teacher_schools_pkey" TO "user_schools_pkey";
ALTER TABLE "user_schools" ALTER COLUMN "role" SET DEFAULT 'TEACHER';

-- AlterTable
ALTER TABLE "users" RENAME CONSTRAINT "teachers_pkey" TO "users_pkey";

-- CreateTable
CREATE TABLE "student_commentaries" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "commentary" TEXT NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_commentaries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "student_commentaries_student_id_idx" ON "student_commentaries"("student_id");

-- RenameForeignKey
ALTER TABLE "audit_logs" RENAME CONSTRAINT "audit_logs_teacher_id_fkey" TO "audit_logs_user_id_fkey";

-- RenameForeignKey
ALTER TABLE "student_reading_history" RENAME CONSTRAINT "student_reading_history_teacher_id_fkey" TO "student_reading_history_user_id_fkey";

-- RenameForeignKey
ALTER TABLE "user_schools" RENAME CONSTRAINT "teacher_schools_school_id_fkey" TO "user_schools_school_id_fkey";

-- RenameForeignKey
ALTER TABLE "user_schools" RENAME CONSTRAINT "teacher_schools_teacher_id_fkey" TO "user_schools_user_id_fkey";

-- RenameForeignKey
ALTER TABLE "user_sessions" RENAME CONSTRAINT "user_sessions_teacher_id_fkey" TO "user_sessions_user_id_fkey";

-- AddForeignKey
ALTER TABLE "student_commentaries" ADD CONSTRAINT "student_commentaries_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_commentaries" ADD CONSTRAINT "student_commentaries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "teachers_email_key" RENAME TO "users_email_key";

-- Migrate existing notes from student_reading_history to student_commentaries
INSERT INTO "student_commentaries" ("id", "student_id", "user_id", "commentary", "recorded_at", "created_at", "updated_at")
SELECT
    gen_random_uuid()::TEXT,
    "student_id",
    "user_id",
    "notes",
    "recorded_at",
    "created_at",
    "recorded_at"
FROM "student_reading_history"
WHERE "notes" IS NOT NULL AND "notes" != '';
