"use server";

import { NextResponse, NextRequest } from "next/server";

import {
  ResourceRequest,
  Resources,
  insertResourceSchema,
  resourceRequest,
} from "@/lib/db/schema";
import { auth } from "@/app/(auth)/auth";
import { insertResoureces, insertEmbedding } from "@/lib/db/queries";
import { getResourceByNamespaceID } from "@/lib/db/queries";
import { generateEmbeddings } from "@/lib/ai/embedding";
import fs from "fs";
import path from "path";

const uploadFilePath = "public/files";
export async function POST(request: ResourceRequest) {
  return Response.json({ message: "resources" }, { status: 200 });

  // try {
  //   const session = await auth();
  //   if (!session) {
  //     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  //   }

  //   const params = resourceRequest.parse(request);

  //   const resourcesData = params.fileIDs.map((fileID) => {
  //     const uploadDir = path.join(process.cwd(), uploadFilePath);
  //     const filePath = path.join(uploadDir, fileID);
  //     const data = fs.readFileSync(filePath, "utf-8");
  //     return { name: fileID, content: data, namespaceID: params.namespaceID };
  //   });

  //   const resultResources = await insertResoureces(resourcesData);

  //   const insertEmbeddings = resultResources.map(async (r: Resources) => {
  //     const embeddings = await generateEmbeddings(r.content);
  //     insertEmbedding(r.id, embeddings);
  //   });
  //   const embeddings = await Promise.all(insertEmbeddings);

  //   return NextResponse.json({ objects: resultResources }, { status: 200 });
  // } catch (error) {
  //   // return error instanceof Error && error.message.length > 0
  //   //   ? error.message
  //   //   : 'Error, please try again.';
  //   return NextResponse.json(
  //     { error: "Internal Server Error" },
  //     { status: 500 },
  //   );
  // }
}

export async function GET(request: NextRequest) {
  return Response.json({ message: "resources" }, { status: 200 });
  // try {
  //   const session = await auth();
  //   if (!session) {
  //     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  //   }

  //   const namespaceID = request.nextUrl.searchParams.get('namespaceID')
  //   if(!namespaceID) {
  //     return Response.json({message: "namespaceID required"}, { status: 400 });
  //   }

  //   const docs = await getResourceByNamespaceID(id);

  //   const docs = [{ name: "web" }, { name: "sample.text" }];

  //   return Response.json(docs, { status: 200 });
  // } catch (err) {
  //   return Response.json({ message: "server error" }, { status: 500 });
}
