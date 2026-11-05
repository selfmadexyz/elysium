ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "author_id" text;--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "posts" WHERE "author_id" IS NULL) THEN
    RAISE EXCEPTION 'Migration 0002 requires a reviewed author_id backfill for existing posts; see docs/deployment.md';
  END IF;
END $$;--> statement-breakpoint
ALTER TABLE "posts" ALTER COLUMN "author_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "posts_authorId_idx" ON "posts" USING btree ("author_id");
