import { getEasy } from "@/lib/api/easy-drug";
import { getPermit } from "@/lib/api/permit";
import { getIdentification } from "@/lib/api/identification";
import { MfdsError, itemCode, plainText } from "@/lib/api/mfds";
import { easyMedicine, identificationMedicine } from "@/lib/api/normalize";
import { apiError, json } from "@/lib/api/response";
import type { MedicineDetail } from "@/lib/types/medicine";
export async function GET(_request: Request, context: RouteContext<"/api/medicines/[id]">) {
  try {
    const id = itemCode((await context.params).id);
    const results = await Promise.allSettled([getEasy(id), getPermit(id), getIdentification({ id, page: 1, pageSize: 1 })]);
    const easy = results[0].status === "fulfilled" ? results[0].value.items.find((i) => i.itemSeq === id) : undefined;
    const permit = results[1].status === "fulfilled" ? results[1].value.items.find((i) => i.ITEM_SEQ === id) : undefined;
    const identification = results[2].status === "fulfilled" ? results[2].value.items.find((i) => i.ITEM_SEQ === id) : undefined;
    if (!easy && !permit && !identification) {
      const failure = results.find((result) => result.status === "rejected");
      if (failure?.status === "rejected") throw failure.reason;
      throw new MfdsError("NOT_FOUND", "해당 의약품 정보를 찾을 수 없습니다.", 404);
    }
    const sources = ["e약은요", "제품 허가정보", "낱알식별정보"];
    const item: MedicineDetail = {
      ...(easy ? easyMedicine(easy) : identification ? identificationMedicine(identification) : { id, name: plainText(permit?.ITEM_NAME) ?? "제품명 미제공", manufacturer: plainText(permit?.ENTP_NAME) ?? "업체명 미제공", source: "permit" as const }),
      efficacy: plainText(easy?.efcyQesitm) ?? plainText(permit?.EE_DOC_DATA),
      dosage: plainText(easy?.useMethodQesitm) ?? plainText(permit?.UD_DOC_DATA),
      warnings: plainText(easy?.atpnWarnQesitm), precautions: plainText(easy?.atpnQesitm) ?? plainText(permit?.NB_DOC_DATA),
      interactions: plainText(easy?.intrcQesitm), sideEffects: plainText(easy?.seQesitm),
      storage: plainText(easy?.depositMethodQesitm) ?? plainText(permit?.STORAGE_METHOD),
      ingredients: plainText(permit?.MATERIAL_NAME) ?? plainText(permit?.MAIN_ITEM_INGR),
      barcode: plainText(permit?.BAR_CODE), category: plainText(permit?.ETC_OTC_CODE) ?? plainText(identification?.ETC_OTC_NAME), form: plainText(identification?.FORM_CODE_NAME),
      permitDate: plainText(permit?.ITEM_PERMIT_DATE), permitKind: plainText(permit?.PERMIT_KIND_NAME),
      cancelStatus: plainText(permit?.CANCEL_NAME), updatedAt: plainText(easy?.updateDe) ?? plainText(permit?.CHANGE_DATE),
      sourceErrors: results.flatMap((r, i) => r.status === "rejected" ? [sources[i]] : []),
    };
    if (!item.image && identification) item.image = identificationMedicine(identification).image;
    return json(item);
  } catch (error) { return apiError(error); }
}

