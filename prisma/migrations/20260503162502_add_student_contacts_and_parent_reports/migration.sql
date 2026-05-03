CREATE TABLE "student_contacts" (
  "id" TEXT NOT NULL,
  "student_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "relationship" TEXT,
  "phone" TEXT NOT NULL,
  "whatsapp_phone" TEXT NOT NULL,
  "is_primary" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "student_contacts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "student_parent_report_links" (
  "id" TEXT NOT NULL,
  "student_id" TEXT NOT NULL,
  "created_by_id" TEXT NOT NULL,
  "token_hash" TEXT NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "revoked_at" TIMESTAMP(3),
  "last_viewed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "student_parent_report_links_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "student_parent_report_links_token_hash_key" ON "student_parent_report_links"("token_hash");
CREATE INDEX "student_contacts_student_id_idx" ON "student_contacts"("student_id");
CREATE INDEX "student_parent_report_links_student_id_idx" ON "student_parent_report_links"("student_id");
CREATE INDEX "student_parent_report_links_expires_at_idx" ON "student_parent_report_links"("expires_at");

ALTER TABLE "student_contacts"
  ADD CONSTRAINT "student_contacts_student_id_fkey"
  FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "student_parent_report_links"
  ADD CONSTRAINT "student_parent_report_links_student_id_fkey"
  FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "student_parent_report_links"
  ADD CONSTRAINT "student_parent_report_links_created_by_id_fkey"
  FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
