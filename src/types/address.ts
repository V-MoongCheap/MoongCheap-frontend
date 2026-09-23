/**
 * 배송지(B-30) 화면이 요구하는 타입.
 *
 * `types/user.ts`와 같은 원칙이다. 백엔드 응답을 옮긴 것이 아니라 **화면이 필요로 하는 모양**이며,
 * 규격이 나오면 API 계층에서 변환해 이 타입으로 맞춘다.
 */

/**
 * 등록된 배송지 한 건.
 *
 * 주소를 `postalCode` · `address` · `addressDetail` 셋으로 쪼개 갖는다. 앞의 둘은 우편번호
 * 검색 결과가 채우고 사용자가 고칠 수 없으며(시안에서 읽기 전용), 상세주소만 직접 입력한다.
 * 목록에서 한 줄로 합쳐 보여줄 때만 이어 붙인다.
 */
export interface Address {
  id: string;
  /** 배송지명. 시안 예시 '집' · '회사'. */
  name: string;
  isDefault: boolean;
  postalCode: string;
  /** 우편번호 검색이 채우는 도로명/지번 주소. */
  address: string;
  addressDetail: string;
  /** 공동현관 출입번호. '공동현관번호 없음'을 체크했거나 비워 두면 undefined. */
  entranceCode?: string;
  recipient: string;
  /**
   * 표시용 전화번호. `formatPhone`으로 포맷해 보여 준다.
   * ⚠️ 목록 조회에서 온 값은 백엔드가 마스킹한 것이다(`010-****-5678`). 폼에 채우거나 다시 보내면
   * 안 된다 — 원본이 필요하면 `AddressDetail.phoneRaw`를 쓴다.
   */
  phone: string;
}

/**
 * 단건 조회로 받은 배송지(수정 화면 전용). 목록의 `Address`와 타입을 갈라, 마스킹된 목록 값이
 * 수정 폼·수정 요청으로 흘러 들어가지 못하게 한다(`updateAddress`가 이 타입만 받는다).
 */
export interface AddressDetail extends Address {
  /** 하이픈 없는 원본 번호. 단건 응답만 마스킹하지 않는다. */
  phoneRaw: string;
  /**
   * 배송 요청사항. 시안·폼에 없어 화면에 보이지 않는다. 수정 `PATCH`가 전체 교체라 기존 값을
   * 다시 보내 보존하려고만 들고 있다.
   */
  requestMessage?: string;
}
