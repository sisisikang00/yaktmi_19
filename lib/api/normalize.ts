import "server-only";
import type { EasyDrugItem, PermitListItem, IdentificationItem } from "@/lib/types/mfds";
import type { Medicine } from "@/lib/types/medicine";
import { imageUrl, plainText } from "./mfds";
export function easyMedicine(item: EasyDrugItem): Medicine {
  return { id: item.itemSeq ?? "", name: plainText(item.itemName) ?? "제품명 미제공", manufacturer: plainText(item.entpName) ?? "업체명 미제공", image: imageUrl(item.itemImage), source: "easy" };
}
export function permitMedicine(item: PermitListItem): Medicine {
  return { id: item.ITEM_SEQ ?? "", name: plainText(item.ITEM_NAME) ?? "제품명 미제공", manufacturer: plainText(item.ENTP_NAME) ?? "업체명 미제공", image: imageUrl(item.BIG_PRDT_IMG_URL), source: "permit", category: plainText(item.SPCLTY_PBLC) };
}
export function identificationMedicine(item: IdentificationItem): Medicine {
  return { id: item.ITEM_SEQ ?? "", name: plainText(item.ITEM_NAME) ?? "제품명 미제공", manufacturer: plainText(item.ENTP_NAME) ?? "업체명 미제공", image: imageUrl(item.ITEM_IMAGE), source: "identification", category: plainText(item.ETC_OTC_NAME), form: plainText(item.FORM_CODE_NAME), shape: plainText(item.DRUG_SHAPE), color: [item.COLOR_CLASS1, item.COLOR_CLASS2].filter(Boolean).join(" / ") || undefined, imprint: [item.PRINT_FRONT, item.PRINT_BACK].filter(Boolean).join(" / ") || undefined };
}
export function validMedicines(items: Medicine[]): Medicine[] {
  return items.filter((item) => /^\d{9}$/.test(item.id));
}

