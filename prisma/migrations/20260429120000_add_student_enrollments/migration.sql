-- AlterTable
ALTER TABLE "classes" ADD COLUMN "academic_year" INTEGER NOT NULL DEFAULT 2026;

-- Rebuild class uniqueness so the same grade/section/shift can exist in different years.
DROP INDEX "classes_school_id_grade_section_shift_key";
CREATE UNIQUE INDEX "classes_school_id_grade_section_shift_academic_year_key"
ON "classes"("school_id", "grade", "section", "shift", "academic_year");

-- CreateTable
CREATE TABLE "student_enrollments" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL,
    "ended_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "student_enrollments_pkey" PRIMARY KEY ("id")
);

-- Backfill one enrollment per existing student using the current class pointer.
INSERT INTO "student_enrollments" ("id", "student_id", "class_id", "started_at", "created_at", "updated_at")
SELECT
    'enrollment_' || "id",
    "id",
    "class_id",
    DATE '2026-01-01',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "students";

-- AlterTable
ALTER TABLE "student_reading_history" ADD COLUMN "enrollment_id" TEXT;

-- Backfill existing reading history to the migrated enrollment.
UPDATE "student_reading_history"
SET "enrollment_id" = "student_enrollments"."id"
FROM "student_enrollments"
WHERE "student_reading_history"."student_id" = "student_enrollments"."student_id";

ALTER TABLE "student_reading_history" ALTER COLUMN "enrollment_id" SET NOT NULL;

-- CreateIndex
CREATE INDEX "student_enrollments_student_id_idx" ON "student_enrollments"("student_id");
CREATE INDEX "student_enrollments_class_id_idx" ON "student_enrollments"("class_id");

-- AddForeignKey
ALTER TABLE "student_enrollments" ADD CONSTRAINT "student_enrollments_student_id_fkey"
FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "student_enrollments" ADD CONSTRAINT "student_enrollments_class_id_fkey"
FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "student_reading_history" ADD CONSTRAINT "student_reading_history_enrollment_id_fkey"
FOREIGN KEY ("enrollment_id") REFERENCES "student_enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
