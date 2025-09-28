ALTER TABLE "embeddings" RENAME COLUMN "resource_id" TO "resourceId";--> statement-breakpoint
ALTER TABLE "resources" RENAME COLUMN "namespaceID" TO "namespaceId";--> statement-breakpoint
ALTER TABLE "embeddings" DROP CONSTRAINT "embeddings_resource_id_resources_id_fk";
--> statement-breakpoint
ALTER TABLE "resources" DROP CONSTRAINT "resources_namespaceID_namespace_id_fk";
--> statement-breakpoint
ALTER TABLE "embeddings" ADD CONSTRAINT "embeddings_resourceId_resources_id_fk" FOREIGN KEY ("resourceId") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_namespaceId_namespace_id_fk" FOREIGN KEY ("namespaceId") REFERENCES "public"."namespace"("id") ON DELETE cascade ON UPDATE restrict;