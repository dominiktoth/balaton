import { NextResponse } from "next/server";
import { db } from "~/server/db";

export async function GET() {
  try {
    // Simple query to keep the database active
    await db.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      message: "Database is alive",
    });
  } catch (error) {
    console.error("Keep-alive failed:", error);
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        message: "Database connection failed",
      },
      { status: 500 },
    );
  }
}
