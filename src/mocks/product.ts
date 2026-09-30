import { findMockSearchResult } from '@/mocks/search';
import type { ProductDetail } from '@/types/product';
import type { ProductSearchResult } from '@/types/search';

/**
 * B-08 상품 상세 목 데이터. 백엔드 상품 상세 규격이 없어 화면 검수용으로만 쓴다.
 *
 * 시안이 두 상태를 그린다.
 *  - 시나리오 1(node 1153:72748): 진행중인 뭉치 퀵 참여 0건 — 딜 카드 없음
 *  - 시나리오 2(node 1153:73735): 진행중인 뭉치 퀵 참여 3건 — 딜 카드 가로 스크롤
 * 한 컴포넌트가 `quickDeals` 길이만으로 두 상태를 그린다.
 *
 * 비슷한 상품 썸네일은 반입된 홈 에셋(#60)을 재사용하고, 대표 사진은 흰 배경 상세 사진을 쓴다
 * (아래 `GOLD_DETAIL_IMAGE`). 상품설명(description)은 BE 연동 시 실데이터로
 * 덮이므로(client fetch, [[lib/productApi]]), mock에는 표시 확인용 텍스트만 둔다.
 *
 * 정보 아코디언(상품 상세정보·배송정보·교환/환불/반품 정보)은 비워 둔다. 본문 시안·명세·백엔드 필드가
 * 모두 없어, 채우던 개발용 안내 문구('연동 후 제공됩니다')가 사용자에게 그대로 보였다(#218).
 * 비어 있으면 화면이 섹션을 숨긴다. 문구가 정해지면 여기에 넣는다.
 */

/**
 * 브랜드 원형 로고(종근당건강). 시안 `1153:73743`(24×24) 자리에 저장소에 반입돼 있던 원본 로고를 쓴다.
 * 디자인 QA(9/28 '이미지 누락')에서 빈 원이 지적돼 연결했다. 백엔드는 브랜드 로고를 주지 않아
 * 실데이터 상품은 브랜드 줄 자체가 숨는다(`useProductCatalogOverlay`).
 */
const CKD_BRAND_LOGO = '/images/product-detail/2-4.webp';

/**
 * 상세 대표 사진. 홈 카드 사진(`main-home/card-list-1`)은 배경이 회색(#f6f6f6)이라 상세의 흰 이미지
 * 영역 안에서 회색 사각형으로 보였다(디자인 QA 9/28 '베리어블 누락'). 시안 B-08처럼 흰 배경 사진을 쓴다.
 * - 골드: 저장소에 반입돼 있던 상세 사진
 * - 코어맥스: 시안 `1153:73739`의 이미지 원본(500×500)
 */
const GOLD_DETAIL_IMAGE = '/images/product-detail/2-1.webp';
const CORE_MAX_DETAIL_IMAGE = '/images/product-detail/2-5.webp';

function hoursFromNow(hours: number): string {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

/** 시나리오 1 — 퀵 참여 0건. 홈 card-list-1 '락토핏 골드'(demand-1)에 대응. */
const goldDetail: ProductDetail = {
  id: 'demand-1',
  name: '[종근당건강] 락토핏 생유산균 골드',
  brandName: '종근당건강',
  brandLogoUrl: CKD_BRAND_LOGO,
  spec: '프로바이오틱스 80포 160g',
  listPrice: 29900,
  thumbnailUrl: GOLD_DETAIL_IMAGE,
  description:
    '대한민국 1등 유산균 락토핏 생유산균 골드입니다.\n건강한 장 건강을 위한 프로바이오틱스와 아연을 함께 담았습니다.\n하루 한 포, 간편하게 챙기는 유산균 습관을 시작해보세요.\n\n[주요 특징]\n· 프로바이오틱스 100억 CFU 보장\n· 아연 함유로 정상적인 면역기능에 도움\n· 장 건강과 면역 건강을 한 번에\n· 80포 대용량 구성으로 온 가족이 함께\n\n[섭취 방법]\n1일 1회, 1회 1포를 물과 함께 섭취하세요.\n\n[보관 방법]\n직사광선을 피해 서늘하고 건조한 곳에 보관하세요.',
  viewingCount: 504,
  similarThumbnails: [
    '/images/main-home/card-list-1/1-2.webp',
    '/images/main-home/card-list-1/1-4.webp',
  ],
  quickDeals: [],
  infoSections: [],
};

/**
 * 시나리오 2 — 퀵 참여 3건. 홈 card-list-1 '락토핏 코어'(demand-3)에 대응.
 *
 * `deadline`은 `TimeBadge`가 실시간 카운트다운으로 그리므로 조회 시점 기준이어야 한다.
 * 모듈 초기화 때 한 번만 계산하면 오래 켜둔 dev 서버에서 굳어 `00:00:00`이 되므로,
 * 값이 아니라 팩터리로 두고 `mockGetProductDetail`가 부를 때마다 새로 만든다.
 */
function createCoreMaxDetail(): ProductDetail {
  return {
    id: 'demand-3',
    name: '[종근당건강] 락토핏 생유산균 코어맥스',
    brandName: '종근당건강',
    brandLogoUrl: CKD_BRAND_LOGO,
    spec: '프로바이오틱스 80포 160g',
    listPrice: 33900,
    thumbnailUrl: CORE_MAX_DETAIL_IMAGE,
    description:
      '락토핏 생유산균 코어맥스, 더 강력해진 유산균 케어.\n장 건강이 걱정된다면 코어맥스로 시작하세요.\n\n[주요 특징]\n· 고함량 프로바이오틱스 배합\n· 아연 함유로 면역 건강까지\n· 장까지 살아서 도달하는 코팅 유산균\n· 80포 대용량 구성\n\n[섭취 방법]\n1일 1회, 1회 1포를 물과 함께 섭취하세요.\n\n[보관 방법]\n직사광선을 피해 서늘하고 건조한 곳에 보관하세요.',
    viewingCount: 231,
    similarThumbnails: [
      '/images/main-home/card-list-1/1-1.webp',
      '/images/main-home/card-list-1/1-2.webp',
    ],
    quickDeals: [
      {
        id: 'deal-1',
        deadline: hoursFromNow(0.15),
        participantCount: 1200,
        desiredPriceLabel: '1만원 이하',
        sellerCount: 3,
      },
      {
        id: 'deal-2',
        dday: 1,
        participantCount: 150,
        desiredPriceLabel: '2만원 이하',
        sellerCount: 2,
      },
      {
        id: 'deal-3',
        dday: 2,
        participantCount: 150,
        desiredPriceLabel: '3만원 이하',
        sellerCount: 1,
      },
    ],
    infoSections: [],
  };
}

/** demand-3(코어맥스)만 실시간 deadline이 있어 팩터리로, 나머지는 값으로 등록한다. */
const PRODUCT_DETAILS: Readonly<Record<string, () => ProductDetail>> = {
  [goldDetail.id]: () => goldDetail,
  'demand-3': createCoreMaxDetail,
};

/**
 * 검색 결과 목(`mocks/search.ts`) 카드 id → 같은 상품의 상세 목 id.
 *
 * 검색 API는 로그인이 필요해 미로그인이면 검색이 목으로 떨어지고, 목 카드의 id(`catalog-search-*`)로
 * 상세에 들어온다. 이 id가 상세 목에 없어 골드를 눌러도 코어맥스가 열렸다(디자인팀 회신 9/29, #225).
 */
const SEARCH_CARD_DETAIL_IDS: Readonly<Record<string, string>> = {
  'catalog-search-2': 'demand-3',
  'catalog-search-3': goldDetail.id,
};

/**
 * 상세 목이 없는 검색 목 카드(뷰티·다이어트·당케어)의 상세. 카드에 있는 상품명·규격·사진만 쓴다.
 *
 * 상품설명·브랜드·열람수·비슷한 상품은 카드에 없어 비우고, 화면이 그 줄을 숨긴다. 로그인 시 실데이터로
 * 덮을 때(`useProductCatalogOverlay`)와 같은 방식이라 없는 문구를 만들지 않는다. 퀵 참여는 0건이다.
 */
function createSearchCardDetail(card: ProductSearchResult): ProductDetail {
  return {
    id: card.id,
    name: card.name,
    spec: card.spec,
    thumbnailUrl: card.thumbnailUrl,
    quickDeals: [],
    infoSections: [],
  };
}

/**
 * 상품 상세 조회. 홈/검색 카드가 넘기는 id로 찾는다.
 *
 * 1. 상세 목이 있는 id(홈 카드, 검색 목의 골드·코어맥스)는 그 상세
 * 2. 상세 목이 없는 검색 목 카드는 카드 값으로 만든 상세
 * 3. 그 밖의 id(홈의 다른 카드)는 시나리오 2(퀵 참여 있는 상세)를 기본값으로 돌려 화면이 항상 채워지게 한다.
 */
export async function mockGetProductDetail(productId: string): Promise<ProductDetail> {
  const create = PRODUCT_DETAILS[SEARCH_CARD_DETAIL_IDS[productId] ?? productId];
  if (create !== undefined) {
    return { ...create(), id: productId };
  }
  const searchCard = findMockSearchResult(productId);
  if (searchCard !== undefined) {
    return createSearchCardDetail(searchCard);
  }
  return { ...createCoreMaxDetail(), id: productId };
}
