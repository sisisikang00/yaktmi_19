import "server-only";
import { requestMfds } from "./mfds";
import type { IdentificationItem } from "@/lib/types/mfds";
export function getIdentification(params: { name?: string; id?: string; page: number; pageSize: number }) {
  return requestMfds<IdentificationItem>("https://apis.data.go.kr/1471000/MdcinGrnIdntfcInfoService03/getMdcinGrnIdntfcInfoList03", "serviceKey", { item_name: params.name ?? "", item_seq: params.id ?? "", pageNo: params.page, numOfRows: params.pageSize });
}
