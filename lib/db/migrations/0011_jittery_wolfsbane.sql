ALTER TABLE "embeddings" DROP CONSTRAINT "embeddings_resourceId_resources_id_fk";
--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "summary" text;--> statement-breakpoint
ALTER TABLE "embeddings" ADD CONSTRAINT "embeddings_resourceId_resources_id_fk" FOREIGN KEY ("resourceId") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE restrict;