-- CreateTable
CREATE TABLE "users" (
    "id" VARCHAR(36) NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "avatar_url" TEXT NOT NULL,
    "bio" TEXT NOT NULL DEFAULT '',
    "current_streak" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "passwords" (
    "user_id" VARCHAR(36) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "passwords_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "learning_logs" (
    "id" VARCHAR(36) NOT NULL,
    "user_id" VARCHAR(36) NOT NULL,
    "topic" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "minutes_spent" INTEGER NOT NULL DEFAULT 30,
    "minutes_completed" INTEGER NOT NULL DEFAULT 0,
    "sticky_color" TEXT NOT NULL DEFAULT 'bg-yellow-100',
    "date_logged" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "learning_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "log_reactions" (
    "id" VARCHAR(36) NOT NULL,
    "log_id" VARCHAR(36) NOT NULL,
    "user_id" VARCHAR(36) NOT NULL,
    "reaction_type" VARCHAR(10) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "log_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fragments" (
    "id" VARCHAR(36) NOT NULL,
    "log_id" VARCHAR(36) NOT NULL,
    "user_id" VARCHAR(36) NOT NULL,
    "message" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fragments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_links" (
    "id" VARCHAR(36) NOT NULL,
    "log_id" VARCHAR(36) NOT NULL,
    "added_by" VARCHAR(36) NOT NULL,
    "url" TEXT NOT NULL,
    "title" VARCHAR(300) NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "external_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "learning_logs_user_id_idx" ON "learning_logs"("user_id");

-- CreateIndex
CREATE INDEX "learning_logs_date_logged_idx" ON "learning_logs"("date_logged");

-- CreateIndex
CREATE INDEX "learning_logs_created_at_idx" ON "learning_logs"("created_at");

-- CreateIndex
CREATE INDEX "log_reactions_log_id_idx" ON "log_reactions"("log_id");

-- CreateIndex
CREATE INDEX "log_reactions_user_id_idx" ON "log_reactions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "log_reactions_log_id_user_id_reaction_type_key" ON "log_reactions"("log_id", "user_id", "reaction_type");

-- CreateIndex
CREATE INDEX "fragments_log_id_idx" ON "fragments"("log_id");

-- CreateIndex
CREATE INDEX "fragments_user_id_idx" ON "fragments"("user_id");

-- CreateIndex
CREATE INDEX "fragments_created_at_idx" ON "fragments"("created_at");

-- CreateIndex
CREATE INDEX "external_links_log_id_idx" ON "external_links"("log_id");

-- CreateIndex
CREATE INDEX "external_links_added_by_idx" ON "external_links"("added_by");

-- AddForeignKey
ALTER TABLE "passwords" ADD CONSTRAINT "passwords_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_logs" ADD CONSTRAINT "learning_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "log_reactions" ADD CONSTRAINT "log_reactions_log_id_fkey" FOREIGN KEY ("log_id") REFERENCES "learning_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "log_reactions" ADD CONSTRAINT "log_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fragments" ADD CONSTRAINT "fragments_log_id_fkey" FOREIGN KEY ("log_id") REFERENCES "learning_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fragments" ADD CONSTRAINT "fragments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_links" ADD CONSTRAINT "external_links_log_id_fkey" FOREIGN KEY ("log_id") REFERENCES "learning_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_links" ADD CONSTRAINT "external_links_added_by_fkey" FOREIGN KEY ("added_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
