import "server-only";
import { NextResponse } from "next/server";
import { MfdsError } from "./mfds";
export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
}
export function apiError(error: unknown) {
  if (error instanceof MfdsError) return json({ error: { code: error.code, message: error.message } }, error.status);
  return json({ error: { code: "INTERNAL_ERROR", message: "요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요." } }, 500);
}
