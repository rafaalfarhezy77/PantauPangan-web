import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { searchHistories } from "@/lib/db/schema";

export async function POST(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({
        success: true,
        message: "Anonymous search, history skipped",
      });
    }

    const body = await request.json().catch(() => ({}));
    const { commodityId, level, provinceCode, periodFrom, periodTo } = body;

    if (!commodityId) {
      return NextResponse.json(
        { success: false, error: "commodityId is required" },
        { status: 400 }
      );
    }

    await db.insert(searchHistories).values({
      userId: user.id,
      commodityId: Number(commodityId),
      level: level || "konsumen",
      provinceCode: provinceCode || null,
      periodFrom: periodFrom || null,
      periodTo: periodTo || null,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.warn("[SearchHistory] Error saving:", err);
    return NextResponse.json(
      { success: false, error: "Failed to save history" },
      { status: 500 }
    );
  }
}
