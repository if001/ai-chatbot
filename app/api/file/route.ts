import { NextResponse, NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import fs from "fs";
import path from "path";
import { nanoid } from "@/lib/utils";
import { FileResult } from "@/lib/types";

// const FileSchema = z.object({
//   file: z
//     .instanceof(Blob)
//     .refine((file) => file.size <= 5 * 1024 * 1024, {
//       message: "File size should be less than 5MB",
//     })
//     // Update the file type based on the kind of files you want to accept
//     .refine((file) => ["image/jpeg", "image/png"].includes(file.type), {
//       message: "File type should be JPEG or PNG",
//     }),
// });

const uploadFilePath = "public/files";

const FileSchema = z.object({
  file: z
    .instanceof(Blob)
    .refine((file) => file.size <= 5 * 1024 * 1024, {
      message: "File size should be less than 5MB",
    })
    // Update the file type based on the kind of files you want to accept
    .refine((file) => ["text/plain"].includes(file.type), {
      message: "File type should be Text",
    }),
});

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (request.body === null) {
    return new Response("Request body is empty", { status: 400 });
  }

  try {
    const formData = await request.formData();

    const files = formData.getAll("file") as Blob[];
    if (files.length == 0) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const successFiles: Blob[] = [];
    const fileResults: FileResult[] = [];
    files.forEach((file) => {
      const validatedFile = FileSchema.safeParse({ file });
      if (validatedFile.success) {
        successFiles.push(file);
      } else {
        const errorMessage = validatedFile.error.errors
          .map((error) => error.message)
          .join(", ");
        fileResults.push({
          file: file as File,
          message: errorMessage,
        } as FileResult);
      }
    });

    const upload = successFiles.map(async (file) => {
      try {
        const filename = (file as File).name;
        const fileBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(fileBuffer);
        const uploadDir = path.join(process.cwd(), uploadFilePath);
        const filePath = path.join(uploadDir, filename);
        fs.writeFileSync(filePath, buffer);
        return {
          id: nanoid(),
          file: file as File,
          message: "ok",
        } as FileResult;
      } catch (e) {
        console.log("upload faild", e);
        return { file: file as File, message: "upload faild" } as FileResult;
      }
    });

    const results = await Promise.all(upload);
    const okFiles = results
      .filter((v) => v.message === "ok")
      .map((v) => ({
        id: v.id,
        name: v.file.name,
        message: v.message,
      }));
    const ngFiles = fileResults
      .filter((v) => v.message !== "ok")
      .map((v) => ({
        name: v.file.name,
        message: v.message,
      }));
    return NextResponse.json(
      { okFiles: okFiles, ngFiles: ngFiles },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 },
    );
  }
}

export function GET() {
  try {
    return Response.json({ message: "file" }, { status: 200 });
  } catch (err) {
    return Response.json({ message: "server error" }, { status: 500 });
  }
}
