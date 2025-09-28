"use server";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getNamespaceByUserID } from "@/lib/db/queries";
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
