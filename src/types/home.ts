/**
 * 홈피드(B-03) 화면 타입.
 *
 * 백엔드 도메인 A의 `ProductCatalogSummaryDto`가 `{ id, name, thumbnailUrl }` 3개뿐이라 시안의
 * 카드를 채울 수 없다. 연동 시점에 필드가 추가될 것을 전제로, 이름은 DTO 표기를 그대로 따르고
 * 아직 규격이 없는 값만 덧붙였다(문의 발송함).
 */

/** 상품 도감 요약. 백엔드 `ProductCatalogSummaryDto`와 같은 이름을 쓴다. */
export interface ProductCatalogSummary {
  id: string;
  name: string;
  /** 이미지 반입 전에는 비어 있다. 없으면 카드가 회색 자리를 그린다. */
  thumbnailUrl?: string;
}

/** 홈 카드가 보여주는 공구 정보. 명세에 아직 없는 값이라 목에만 있다. */
export interface HomeProductCard extends ProductCatalogSummary {
  /** 브랜드·셀러명. 시안에서 상품명 아래 회색 한 줄로 나온다. */
  brandName?: string;
  /**
   * 참여 인원. 시안 `현재 1200명` / `1,200명 참여`.
   * 성사된 공구(card-list-4)에는 인원 표시가 없어 선택값이다.
   */
  participantCount?: number;
  /** 응찰한 판매자 수. 시안 `참여업체 3곳`. */
  sellerCount?: number;
  /**
   * 희망 가격대 라벨. 시안이 문자열로 그린다(`3만원 이하`).
   * 성사된 공구에서는 `희망가격대` 설명 없이 코랄색 값만 나온다.
   */
  desiredPriceLabel: string;
  /**
   * 마감까지 남은 시간. 시안이 두 가지로 그린다.
   * - `dday`  : `D-2` 뱃지
   * - `deadline`: `12:06:03` 실시간 카운트다운. ISO 문자열로 두고 화면에서 계산한다.
   */
  dday?: number;
  deadline?: string;
}

/**
 * 배너 이미지에서 보여 줄 부분.
 *
 * 시안은 배너마다 이미지 확대율과 위치를 따로 준다(프로토타입 `1153:80631`의 각 변형). 전부
 * 가운데로 맞추면 시안과 다른 부분이 보인다. 시안 배치값을 초점으로 옮긴 것이 아래 값이다.
 *
 *   `center`       시안이 `object-cover` 기본값을 쓰는 배너(2·3·5·7·10·11)
 *   `bottom`       세로 넘침의 거의 끝까지 내린 배너(1은 98.5%, 9는 99.96%)
 *   `lower78`      세로 넘침의 78% 지점(8번: 높이 171.56% · top -56.13%)
 *   `left`         가로로 넘치는 이미지를 왼쪽에 붙인 배너(6번: 폭 135.46% · left 0.13%)
 *   `horizontal38` 가로 넘침의 38% 지점(4번: 폭 228.99% · left -49.68%)
 */
export type HomeBannerImagePosition = 'center' | 'bottom' | 'lower78' | 'left' | 'horizontal38';

/** 배너 캐러셀 한 장. */
export interface HomeBanner {
  id: string;
  /**
   * 배너 위에 흰 글씨로 얹는 문구. 시안 4번(신라면)·6번(비비고)은 문구가 이미지에 인쇄돼 있어
   * 오버레이가 없다. 그래서 선택값이다.
   */
  title?: string;
  description?: string;
  imageUrl?: string;
  /**
   * 문구가 이미지에 인쇄된 배너의 대체 텍스트. 오버레이 문구(`title`)가 있는 배너는 그 문구가
   * 곧 설명이므로 비워 두고, 인쇄형 배너만 채운다.
   */
  imageAltText?: string;
  /** 이미지에서 보여 줄 부분. 없으면 가운데(`center`)다. */
  imagePosition?: HomeBannerImagePosition;
}

/** 브랜드별 인기 공구 섹션의 브랜드 칩. */
export interface HomeBrand {
  id: string;
  name: string;
  logoUrl?: string;
}

/** 브랜드딜 카드(card-list-5). 상품이 아니라 브랜드 기획전이라 필드가 다르다. */
export interface HomeBrandDeal {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  dday: number;
}
