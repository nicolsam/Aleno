ALTER TABLE "teachers" RENAME TO "users";
ALTER TABLE "teacher_schools" RENAME TO "user_schools";

ALTER TABLE "user_sessions" RENAME COLUMN "teacher_id" TO "user_id";
ALTER TABLE "audit_logs" RENAME COLUMN "teacher_id" TO "user_id";
ALTER TABLE "user_schools" RENAME COLUMN "teacher_id" TO "user_id";
ALTER TABLE "student_reading_history" RENAME COLUMN "teacher_id" TO "user_id";

UPDATE "user_schools"
SET "role" = CASE
  WHEN "role" = 'admin' THEN 'COORDINATOR'
  WHEN "role" = 'teacher' THEN 'TEACHER'
  ELSE UPPER("role")
END;

CREATE TABLE "user_invites" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "school_id" TEXT NOT NULL,
  "token_hash" TEXT NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "accepted_at" TIMESTAMP(3),
  "created_by_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "user_invites_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_invites_token_hash_key" ON "user_invites"("token_hash");
CREATE INDEX "user_invites_email_idx" ON "user_invites"("email");
CREATE INDEX "user_invites_school_id_idx" ON "user_invites"("school_id");

ALTER TABLE "user_invites" ADD CONSTRAINT "user_invites_school_id_fkey"
  FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_invites" ADD CONSTRAINT "user_invites_created_by_id_fkey"
  FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
