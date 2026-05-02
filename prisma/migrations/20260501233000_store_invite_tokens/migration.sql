ALTER TABLE "user_invites" ADD COLUMN "token" TEXT;

CREATE UNIQUE INDEX "user_invites_token_key" ON "user_invites"("token");
