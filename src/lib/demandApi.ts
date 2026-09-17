import { PRICE_BANDS } from '@/constants/businessRules';
import type { DemandFormValues } from '@/types/demandForm';

import { apiFetch, parseCreatedId } from './api';

/**
 * 수요 등록(B-09) 백엔드 호출.
 *
 * `lib/addressApi.ts`와 같은 규칙이다. 화면은 백엔드 DTO를 모르고 폼 값(`DemandFormValues`)만
 * 안다. 변환은 전부 이 파일이 맡는다. 인증은 SID httpOnly 쿠키라 `apiFetch`가 `credentials`를
 * 붙이고, 세션이 필요하므로 **브라우저에서만** 부른다.
 *
 * 백엔드 소스(V-MoongCheap/MoongCheap-backend@develop `DemandController`·`DemandCreateRequestDto`·
 * `DemandService.create`)로 규격을 확인해 작성했다(2026-09-17).
 *
 * 🔴 **제출 배선 보류 사유(#112)**: `payMethodId`는 필수이고, `DemandService.create`가 회원의
 *    ACTIVE 브랜드페이 결제수단 존재를 검증한다(`existsByIdAndMemberIdAndStatus`). 그런데 백엔드에
 *    결제수단을 등록·조회하는 엔드포인트가 아직 없어(토스 브랜드페이 미배선) 프론트가 유효한
 *    `payMethodId`를 얻을 방법이 없다. 그래서 이 모듈(요청/매핑/호출)은 완성해 두되, 실제 제출은
 *    결제수단 조회 API가 생긴 뒤 화면에서 연결한다. 그 전까지 `DemandFormView`는 준비중을 알린다.
 */

/**
 * `POST /api/members/me/demand` 요청 바디. 백엔드 `DemandCreateRequestDto`(record)와 필드가 일치한다.
 *
 * - 동의 4종은 백엔드에서 전부 `@AssertTrue`라 반드시 true여야 한다. DB에는 저장하지 않고 검증만 한다.
 * - `desireEndAt`(마감시각)은 서버가 `now + 2일`로 자동 세팅하므로 보내지 않는다.
 */
export interface DemandCreateRequestDto {
  catalogId: number;
  payMethodId: number;
  /** 희망 최소가(≥0). 화면 가격 구간의 `min`. */
  desiredPriceMin: number;
  /** 희망 최대가(≥0). 화면 가격 구간의 `max`. */
  desiredPriceMax: number;
  /** 수량(1~99). */
  quantity: number;
  /** 추가 요청사항(≤200). 없으면 생략한다. */
  extraRequirement?: string;
  /** 대체 상품 수용 여부. */
  isSubstitutable: boolean;
  autoPaymentAgreed: boolean;
  privacyCollectionAgreed: boolean;
  privacyThirdPartyAgreed: boolean;
  paymentAgencyTermsAgreed: boolean;
}

/**
 * 화면이 분기하는 수요 등록 고유 에러 코드(백엔드 `ErrorCode`). `ApiError.code`로 온다.
 * - `DEMAND_001`: 같은 카탈로그에 진행 중인 수요가 이미 있음(409).
 * - `PAY_001`   : 유효한 결제수단이 없음(404). payMethodId 미배선 상태에서 나오는 코드.
 */
export const DEMAND_ERROR_CODE = {
  ALREADY_EXISTS: 'DEMAND_001',
  PAY_METHOD_NOT_FOUND: 'PAY_001',
} as const;

/**
 * 폼 값을 등록 바디로 옮긴다. 카탈로그·결제수단 id는 폼 밖에서 정해지므로 인자로 받는다.
 *
 * - **가격**: 폼은 구간(`priceBand`) 하나를 고르고, 백엔드는 min·max를 받는다. `PRICE_BANDS`의
 *   경계값을 그대로 보낸다(최상위 `over_100k`의 max는 내부 상한 999,999로, 화면엔 노출하지 않지만
 *   저장값으로는 그대로 쓴다 — `businessRules.ts` 주석). 구간 미선택은 등록 불가라 방어적으로 던진다.
 * - **추가 요청사항**: 폼의 대체상품 가능 범위(`substituteNote`)를 옮긴다. 별도의 자유 요청 입력이
 *   폼에 없어 이 값이 유일한 자연어 필드다. 단, 이 노트는 대체상품에 **동의했을 때만** 의미가 있으므로
 *   `isSubstitutable`이 참이고 값이 있을 때만 보낸다. 동의 안 함으로 되돌리면(노트 상태는 남는다)
 *   과거 노트가 딸려 가지 않도록 한다.
 * - **동의 4종 1:1 매핑**: 백엔드가 개인정보 수집·이용(`privacyCollectionAgreed`)과 제3자 제공
 *   (`privacyThirdPartyAgreed`)을 나눠 받으므로, 폼도 두 동의를 따로 받아 각각 그대로 옮긴다. 하나의
 *   동의를 두 필드에 함께 넣어 받지 않은 동의를 참으로 꾸미지 않는다(동의 무결성).
 */
export function toDemandCreateRequest(
  values: DemandFormValues,
  ids: { catalogId: number; payMethodId: number },
): DemandCreateRequestDto {
  const band = PRICE_BANDS.find((b) => b.key === values.priceBand);
  if (band === undefined) {
    throw new Error('희망 가격대를 선택해야 수요를 등록할 수 있습니다.');
  }

  const isSubstitutable = values.substituteAgreed ?? false;
  const note = values.substituteNote.trim();

  return {
    catalogId: ids.catalogId,
    payMethodId: ids.payMethodId,
    desiredPriceMin: band.min,
    desiredPriceMax: band.max,
    quantity: values.quantity,
    extraRequirement: isSubstitutable && note !== '' ? note : undefined,
    isSubstitutable,
    autoPaymentAgreed: values.consents.autoPayment,
    privacyCollectionAgreed: values.consents.privacyCollection,
    privacyThirdPartyAgreed: values.consents.privacyThirdParty,
    paymentAgencyTermsAgreed: values.consents.pgTerms,
  };
}

/**
 * 수요 등록. 성공 시 생성된 수요 id를 돌려준다.
 *
 * 같은 카탈로그에 진행 중인 수요가 있으면 409(`DEMAND_001`), 결제수단이 유효하지 않으면
 * 404(`PAY_001`)가 `ApiError`로 올라온다. 화면이 `error.code`로 분기한다.
 *
 * `POST /api/members/me/demand` → 생성된 id
 */
export async function createDemand(payload: DemandCreateRequestDto): Promise<string> {
  const response = await apiFetch('/api/members/me/demand', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseCreatedId(response);
}
