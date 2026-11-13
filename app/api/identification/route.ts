import { getIdentification } from "@/lib/api/identification";
import { pageNumber, queryText, MfdsError } from "@/lib/api/mfds";
import { identificationMedicine, validMedicines } from "@/lib/api/normalize";
import { apiError, json } from "@/lib/api/response";
export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const name = queryText(params.get("name"), "약 이름");
    const shape = queryText(params.get("shape"), "모양", 20);
    const color = queryText(params.get("color"), "색상", 20);
    const imprint = queryText(params.get("imprint"), "각인", 40).toLocaleLowerCase();

    const form = queryText(params.get("form"), "제형", 30);
    const line = queryText(params.get("line"), "분할선", 10);
    if (!name && !shape && !color && !imprint && !form && !line) throw new MfdsError("QUERY_REQUIRED", "이름, 모양, 색상, 제형, 분할선, 각인 중 하나 이상 입력해주세요.", 400);
    const page = pageNumber(params.get("page"));
    // These filters are NOT documented upstream request parameters. Filter only official response records.
    const upstreamSize = 100;
    const batch = await getIdentification({ name, page, pageSize: upstreamSize });
    const matches = batch.items.filter((i) => (!shape || i.DRUG_SHAPE === shape) && (!color || [i.COLOR_CLASS1, i.COLOR_CLASS2].includes(color)) && (!form || i.FORM_CODE_NAME?.includes(form)) && (!line || [i.LINE_FRONT, i.LINE_BACK].includes(line)) && (!imprint || [i.PRINT_FRONT, i.PRINT_BACK].some((v) => v?.toLocaleLowerCase().includes(imprint))));
    return json({ items: validMedicines(matches.map(identificationMedicine)), nextPage: page * upstreamSize < batch.total ? page + 1 : null, scanned: batch.items.length, startPage: page, endPage: page });
  } catch (error) { return apiError(error); }
}


