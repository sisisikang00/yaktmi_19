import { searchEasy } from "@/lib/api/easy-drug";
import { searchPermits } from "@/lib/api/permit";
import { MfdsError, pageNumber, PAGE_SIZE, queryText } from "@/lib/api/mfds";
import { easyMedicine, permitMedicine, validMedicines } from "@/lib/api/normalize";
import { apiError, json } from "@/lib/api/response";
export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const query = queryText(params.get("q"), "약 이름");
    if (!query) throw new MfdsError("QUERY_REQUIRED", "약 이름을 입력해주세요.", 400);
    const page = pageNumber(params.get("page"));
    const source = params.get("source") ?? "permit";
    if (source !== "easy" && source !== "permit") throw new MfdsError("INVALID_SOURCE", "검색 범위를 확인해주세요.", 400);
    const result = source === "easy" ? await searchEasy(query, page, PAGE_SIZE).then((r) => ({ ...r, items: r.items.map(easyMedicine) })) : await searchPermits(query, page, PAGE_SIZE).then((r) => ({ ...r, items: r.items.map(permitMedicine) }));
    return json({ items: validMedicines(result.items), total: result.total, page, pageSize: PAGE_SIZE });
  } catch (error) { return apiError(error); }
}
