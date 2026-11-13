import "server-only";
import { get } from "node:https";

export class MfdsError extends Error {
  constructor(public code: string, message: string, public status = 502) { super(message); }
}
export const PAGE_SIZE = 12;
export function queryText(value: string | null, name: string, max = 100): string {
  const text = (value ?? "").trim();
  if (text.length > max || /[\u0000-\u001f]/.test(text)) throw new MfdsError("INVALID_QUERY", `${name} 입력을 확인해주세요.`, 400);
  return text;
}
export function pageNumber(value: string | null): number {
  if (value === null) return 1;
  if (!/^[1-9]\d{0,4}$/.test(value)) throw new MfdsError("INVALID_PAGE", "페이지 번호를 확인해주세요.", 400);
  return Number(value);
}
export function itemCode(value: string): string {
  if (!/^\d{9}$/.test(value)) throw new MfdsError("INVALID_ID", "품목기준코드를 확인해주세요.", 400);
  return value;
}

function record(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}
// Supports both the JSON array and the Swagger items.item wrapper. Unknown payloads fail closed.
export function parseEnvelope<T>(payload: unknown): { items: T[]; total: number } {
  const root = record(payload);
  const response = record(root?.response) ?? root;
  const header = record(response?.header);
  if (!header || !["00", "0", "0000"].includes(String(header.resultCode))) {
    throw new MfdsError("MFDS_REJECTED", "식약처 API 요청이 거절되었습니다. 서버의 활용 신청 승인 및 인증키 설정을 확인해주세요.");
  }
  const body = record(response?.body);
  const total = Number(body?.totalCount);
  if (!body || !Number.isSafeInteger(total) || total < 0) throw new MfdsError("MFDS_FORMAT", "식약처 응답 형식을 확인할 수 없습니다.");
  const raw = body.items;
  if ((raw == null || raw === "") && total === 0) return { items: [], total };
  const nested = record(raw);
  const entries = Array.isArray(raw) ? raw : nested?.item;
  const items = Array.isArray(entries) ? entries : record(entries) ? [entries] : total === 0 ? [] : undefined;
  if (!items || items.some((item) => !record(item))) throw new MfdsError("MFDS_FORMAT", "식약처 응답 형식을 확인할 수 없습니다.");
  return { items: items as T[], total };
}
export function plainText(value: unknown): string | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  return value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<\/(?:p|div|section|article|item|document)>|<br\s*\/?\s*>/gi, "\n")
    .replace(/<[^>]*>/g, "").replace(/&nbsp;/gi, " ").replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, "&").replace(/\n{3,}/g, "\n\n").trim() || undefined;
}
export function imageUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  try {
    const url = new URL(value);
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) return undefined;
    if (url.protocol === "http:") url.protocol = "https:";
    return url.href;
  } catch { return undefined; }
}

export async function requestMfds<T>(endpoint: string, keyParam: "ServiceKey" | "serviceKey", params: Record<string, string | number>) {
  const rawKey = process.env.MFDS_SERVICE_KEY?.trim();
  if (!rawKey) throw new MfdsError("MFDS_NOT_CONFIGURED", "의약품 조회를 준비 중입니다. 서버에 MFDS_SERVICE_KEY 환경변수 설정이 필요합니다.", 503);
  let key: string;
  try { key = decodeURIComponent(rawKey); } catch { throw new MfdsError("MFDS_KEY_FORMAT", "서버의 식약처 인증키 설정 형식을 확인해주세요.", 503); }
  const url = new URL(endpoint);
  url.searchParams.set(keyParam, key);
  url.searchParams.set("type", "json");
  for (const [name, value] of Object.entries(params)) if (value !== "") url.searchParams.set(name, String(value));
  try {
    // Native HTTPS avoids Next fetch tracing/cache metadata recording credential-bearing URLs.
    const payload = await new Promise<unknown>((resolve, reject) => {
      const request = get(url, { signal: AbortSignal.timeout(12000), headers: { Accept: "application/json" } }, (response) => {
        if (response.statusCode !== 200) {
          response.resume();
          reject(new MfdsError("MFDS_UNAVAILABLE", "식약처 서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요."));
          return;
        }
        let bytes = 0;
        const chunks: Buffer[] = [];
        response.on("data", (chunk: Buffer) => {
          bytes += chunk.length;
          if (bytes > 8 * 1024 * 1024) {
            response.destroy();
            reject(new MfdsError("MFDS_FORMAT", "식약처 응답이 허용된 크기를 초과했습니다."));
          } else chunks.push(chunk);
        });
        response.on("error", reject);
        response.on("end", () => {
          try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8"))); } catch { reject(new MfdsError("MFDS_FORMAT", "식약처 응답 형식을 확인할 수 없습니다.")); }
        });
      });
      request.on("error", reject);
    });
    return parseEnvelope<T>(payload);
  } catch (error) {
    if (error instanceof MfdsError) throw error;
    // Never forward/log fetch errors, URLs, upstream resultMsg, or raw response bodies: they may contain keys.
    throw new MfdsError("MFDS_UNAVAILABLE", "식약처 응답을 받지 못했습니다. 잠시 후 다시 시도해주세요.");
  }
}

