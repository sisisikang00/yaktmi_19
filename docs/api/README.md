# 공식 API 확인 기록

확인일: 2026-11-13. 공공데이터포털 원문 HTML의 Swagger JSON과 요청/응답 표를 확인했습니다. 실제 인증 호출은 로컬 키 설정 후 검증해야 합니다.

| API | 원문 | 확인한 경로 |
| --- | --- | --- |
| e약은요 | https://www.data.go.kr/data/15075057/openapi.do | `https://apis.data.go.kr/1471000/DrbEasyDrugInfoService/getDrbEasyDrugList` |
| 제품 허가 목록 | https://www.data.go.kr/data/15095677/openapi.do | `https://apis.data.go.kr/1471000/DrugPrdtPrmsnInfoService08/getDrugPrdtPrmsnInq08` |
| 제품 허가 상세 | 위와 같음 | `https://apis.data.go.kr/1471000/DrugPrdtPrmsnInfoService08/getDrugPrdtPrmsnDtlInq08` |
| 낱알식별 | https://www.data.go.kr/data/15057639/openapi.do | `https://apis.data.go.kr/1471000/MdcinGrnIdntfcInfoService03/getMdcinGrnIdntfcInfoList03` |

- e약은요: `ServiceKey`(대문자 S), `itemName`, `itemSeq`, `pageNo`, `numOfRows`, `type=json`.
- 허가 목록: `serviceKey`, `item_name`, `pageNo`, `numOfRows`, `type=json`.
- 허가 상세: `serviceKey`, `item_seq`, `pageNo`, `numOfRows`, `type=json`.
- 낱알식별: `serviceKey`, `item_name`, `item_seq`, `pageNo`, `numOfRows`, `type=json`.
- 목록 모양/색상/각인 필터는 공식 요청변수가 아니므로 외부 요청에 추가하지 않습니다.
- Swagger의 개별 응답 필드는 문자열입니다. 페이지 수/총계는 문자열 또는 숫자로 들어오는 경우를 검증 후 수치화합니다. JSON 배열과 Swagger의 `items.item` 래퍼를 모두 처리합니다.
- 허가/낱알식별의 공개 Swagger를 [15095677.json](./15095677.json), [15057639.json](./15057639.json)에 저장했습니다. e약은요 페이지는 Swagger JSON이 비어 있어 HTML의 요청/출력 표를 기준으로 타입을 정의했습니다.
- 허가 상세의 `EE_DOC_DATA`, `UD_DOC_DATA`, `NB_DOC_DATA`, `MATERIAL_NAME` 및 날짜 필드를 사용합니다. 문서 문자열은 태그를 제거한 일반 텍스트로 렌더링하며 HTML을 직접 삽입하지 않습니다.
- 인증키 없는 호출과 외부 실패는 실제 데이터로 가장하지 않습니다. 테스트용 레코드는 테스트 파일 안에서만 사용합니다.
