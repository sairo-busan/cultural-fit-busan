import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET() {
  try {
    const db = await getDb();
    await db.command({ ping: 1 });
    return NextResponse.json({ mongodb: "ok" });
  } catch (error) {
    return NextResponse.json(
      { mongodb: "error", detail: (error as Error).message },
      { status: 500 }
    );
  }
}
