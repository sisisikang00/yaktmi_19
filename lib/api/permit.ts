import "server-only";
import { requestMfds } from "./mfds";
import type { PermitDetailItem, PermitListItem } from "@/lib/types/mfds";
const BASE = "https://apis.data.go.kr/1471000/DrugPrdtPrmsnInfoService08";
export function searchPermits(query: string, page = 1, pageSize = 12) {
  return requestMfds<PermitListItem>(`${BASE}/getDrugPrdtPrmsnInq08`, "serviceKey", { item_name: query, pageNo: page, numOfRows: pageSize });
}
export function getPermit(id: string) {
  return requestMfds<PermitDetailItem>(`${BASE}/getDrugPrdtPrmsnDtlInq08`, "serviceKey", { item_seq: id, pageNo: 1, numOfRows: 1 });
}
