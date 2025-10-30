import { NextResponse } from "next/server";
import { computeMetrics } from "@/server/data/analytics";
import { getDashboardSnapshot } from "@/server/data/store";

export async function GET() {
  const snapshot = getDashboardSnapshot();
  const metrics = computeMetrics(snapshot);

  return NextResponse.json({
    snapshot,
    metrics
  });
}
