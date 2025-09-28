"use server";

import { NextRequest, NextResponse } from "next/server";
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return NextResponse.json({ message: "resource/id" }, { status: 200 });
}
