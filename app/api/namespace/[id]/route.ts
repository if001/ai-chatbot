"use server";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import {
  deleteNamespaceById,
  getNamespaceByUserID,
  insertResorcesAndEmbeddings,
} from "@/lib/db/queries";
import { namespaceRequest } from "@/lib/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const id = (await params).id;

  try {
    const namespace = await getNamespaceByUserID(id, session.user.id);
    return NextResponse.json(namespace);
  } catch (err) {
    console.log("err", err);
    return NextResponse.json(
      { error: "internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const id = (await params).id;

    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const parsed = namespaceRequest.safeParse(body);
    if (!parsed.success) {
      return Response.json({ message: "bad request" }, { status: 400 });
    }

    const resources = await insertResorcesAndEmbeddings(
      session?.user.id,
      id,
      parsed.data.fileIds,
    );

    return Response.json({ objects: resources }, { status: 200 });
  } catch (err) {
    console.log("err", err);
    return Response.json({ message: "server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const id = (await params).id;

  const session = await auth();
  if (!session?.user) {
    return Response.json({ message: "unauthorized" }, { status: 401 });
  }

  await deleteNamespaceById({ id });
  return Response.json({ message: "oke" }, { status: 200 });
}
