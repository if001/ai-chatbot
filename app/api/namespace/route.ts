import { NextResponse, NextRequest } from "next/server";
import { namespaceRequest } from "@/lib/types";
import {
  getNamespacesByUserID,
  insertNamespaceWithResourceAndEmbeddings,
  findEmbeddingsByNamespaceId,
  getResourceByNamespaceID,
  getResources,
} from "@/lib/db/queries";
import { auth } from "@/app/(auth)/auth";
import { pagedParam } from "@/lib/types";
//import type { PagedParam } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const queryObj = Object.fromEntries(searchParams.entries());
    const params = pagedParam.safeParse(queryObj);
    if (!params.success) {
      return Response.json({ message: "bad requst" }, { status: 400 });
    }

    const [total, namespaces] = await getNamespacesByUserID(
      session.user.id,
      params.data.page_index,
      params.data.per_page,
    );
    const hasMore =
      (total as number) > params.data.per_page * params.data.page_index;
    return Response.json(
      {
        objects: namespaces,
        page: params.data.page_index,
        per_page: params.data.per_page,
        total: total,
        has_more: hasMore,
      },
      { status: 200 },
    );
  } catch (err) {
    console.log("err", err);
    return Response.json({ message: "server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const parsed = namespaceRequest.safeParse(body);
    if (!parsed.success) {
      return Response.json({ message: "bad request" }, { status: 400 });
    }

    const namespaceWithResources =
      await insertNamespaceWithResourceAndEmbeddings(
        session?.user.id,
        parsed.data.fileIds,
      );

    return Response.json(namespaceWithResources, { status: 200 });
  } catch (err) {
    console.log("err", err);
    return Response.json({ message: "server error" }, { status: 500 });
  }
}

//export function POST() {
// const form = new multiparty.Form();
// form.parse(req, async (err, fields, files) => {
//   if (err) {
//     return res.status(400).json({ message: "Error parsing form data" });
//   }
//   if (!files) {
//     return res.status(400).json({ error: "No file uploaded" });
//   }
//   const uploadedFiles: string[] = [];
//   for (const file of Object.values(files) as UploadedFile[][]) {
//     if (!file || file.length === 0) {
//       continue;
//     }
//     const uploadedFile = file[0] as UploadedFile;
//     if (process.env.NODE_ENV !== "production") {
//       // In local development, move the file from the OS temp directory to the project 'tmp' directory
//       const projectTmpDir = path.join(process.cwd(), "tmp");
//       fs.mkdirSync(projectTmpDir, { recursive: true });
//       const newFilePath = path.join(
//         projectTmpDir,
//         uploadedFile.originalFilename,
//       );
//       fs.renameSync(uploadedFile.path, newFilePath);
//       uploadedFiles.push(newFilePath);
//     } else {
//       // In production, just use the file as is
//       uploadedFiles.push(uploadedFile.path);
//     }
//   }
//   if (uploadedFiles.length > 0) {
//     return res.status(200).json({
//       message: `Files ${uploadedFiles.join(", ")} uploaded and moved!`,
//     });
//   } else {
//     return res.status(400).json({ message: "No files uploaded" });
//   }
// });
//}
