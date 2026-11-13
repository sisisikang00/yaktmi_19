import "server-only";
import { requestMfds } from "./mfds";
import type { EasyDrugItem } from "@/lib/types/mfds";
const ENDPOINT = "https://apis.data.go.kr/1471000/DrbEasyDrugInfoService/getDrbEasyDrugList";
export function searchEasy(query: string, page = 1, pageSize = 12) {
  return requestMfds<EasyDrugItem>(ENDPOINT, "ServiceKey", { itemName: query, pageNo: page, numOfRows: pageSize });
}
export function getEasy(id: string) {
  return requestMfds<EasyDrugItem>(ENDPOINT, "ServiceKey", { itemSeq: id, pageNo: 1, numOfRows: 1 });
}
