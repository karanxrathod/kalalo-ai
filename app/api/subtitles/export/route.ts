import { NextRequest, NextResponse } from "next/server";
import { POST as exportHandler } from "@/app/api/export/route";

export async function POST(request: NextRequest) {
  return exportHandler(request);
}
