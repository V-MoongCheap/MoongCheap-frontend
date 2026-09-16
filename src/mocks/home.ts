import type { HomeBanner, HomeBrand, HomeBrandDeal, HomeProductCard } from '@/types/home';

/**
 * 홈피드 목 데이터. API가 없어 화면 검수용으로만 쓴다.
 *
 * 백엔드 도메인 A에 홈 섹션용 엔드포인트가 없다. `GET /api/product-catalog`은 "상위 9개"를
 * `{ id, name, thumbnailUrl }`로만 주기 때문에 시안의 어떤 섹션도 채울 수 없다(문의 발송함).
 *
 * 문구는 전부 시안 `981:19122`(배너 프로토타입 11장)에서 읽은 그대로다.
 * 이미지 경로는 반입 이슈(#60)가 정한 이름을 그대로 쓴다.
 *
 * `imagePosition`은 시안 프로토타입(`1153:80631`)의 배너별 이미지 배치값을 옮긴 것이다. 원본 비율이
 * 배너마다 달라(세로형 · 아주 넓은 형 등) 전부 가운데로 맞추면 시안과 다른 부분이 보인다. 시안이
 * 기본 `object-cover`를 쓰는 배너는 값을 넣지 않는다.
 */
const mockBanners: readonly HomeBanner[] = [
  {
    id: 'banner-1',
    imageUrl: '/images/main-home/banner-carousel/banner-1.webp',
    title: '라라스윗 아이스크림 공구',
    description: '저당 아이스크림의 권위자! 공구떴다.',
    // 시안: 높이 110.91% · top -10.75% → 세로 넘침의 98.5% 지점이라 사실상 아래 정렬.
    imagePosition: 'bottom',
  },
  {
    id: 'banner-2',
    imageUrl: '/images/main-home/banner-carousel/banner-2.webp',
    title: '메디큐브 공구 특가',
    description: '메디큐브 뷰티디바이스 공구 특가! 오늘만 있는기회',
  },
  {
    id: 'banner-3',
    imageUrl: '/images/main-home/banner-carousel/banner-3.webp',
    title: '다이어트 빵 공구 기획전',
    description: '다이어트 때 빵 땡긴다면?',
  },
  // 시안 4번(신라면 블랙)은 문구가 이미지에 인쇄돼 있어 오버레이가 없다.
  {
    id: 'banner-4',
    imageUrl: '/images/main-home/banner-carousel/banner-4.webp',
    // 인쇄된 문구를 대체 텍스트로 옮긴다. 시안 이미지에서 읽은 값이라 디자인 확인 대상이다
    // (원문 표기는 `辛라면 블랙`).
    imageAltText: '깊고 진한 신라면 블랙',
    // 시안: 폭 228.99% · left -49.68% → 가로 넘침의 38% 지점.
    imagePosition: 'horizontal38',
  },
  {
    id: 'banner-5',
    imageUrl: '/images/main-home/banner-carousel/banner-5.webp',
    title: '락토핏 골드 특가',
    description: '60개입을 만원대에 GET',
  },
  // 시안 6번(비비고)도 문구가 이미지에 인쇄돼 있다.
  {
    id: 'banner-6',
    imageUrl: '/images/main-home/banner-carousel/banner-6.webp',
    imageAltText: '새로워진 비비고 세계를 더 맛있게',
    // 시안: 폭 135.46% · left 0.13% → 왼쪽 정렬.
    imagePosition: 'left',
  },
  {
    id: 'banner-7',
    imageUrl: '/images/main-home/banner-carousel/banner-7.webp',
    title: '저당 아이스크림 기획전',
    description: '파인트 3개를 만원대로?',
  },
  {
    id: 'banner-8',
    imageUrl: '/images/main-home/banner-carousel/banner-8.webp',
    title: '지금 현재 인기 과자 조리퐁',
    description: '크라운제과 기획전 공구를 만나보세요!',
    // 시안: 높이 171.56% · top -56.13% → 세로 넘침의 78% 지점.
    imagePosition: 'lower78',
  },
  {
    id: 'banner-9',
    imageUrl: '/images/main-home/banner-carousel/banner-9.webp',
    title: '콘칩 공구 기획전',
    description: '24개입 1박스가 5천원대 이하?!',
    // 시안: 높이 171.56% · top -71.53% → 세로 넘침의 끝(99.96%)이라 아래 정렬.
    imagePosition: 'bottom',
  },
  {
    id: 'banner-10',
    imageUrl: '/images/main-home/banner-carousel/banner-10.webp',
    title: '락토핏 기획전',
    description: '유산균으로 건강관리 해보세요!',
  },
  {
    id: 'banner-11',
    imageUrl: '/images/main-home/banner-carousel/banner-11.webp',
    title: '저당 과자 기획전',
    description: '다이어트에도 가볍게!',
  },
];

export async function mockGetHomeBanners(): Promise<readonly HomeBanner[]> {
  return mockBanners;
}

/**
 * card-list-1(유산균에서 현재 수요가 있어요!) 목록. 시안 `981:18263`의 값 그대로다.
 *
 * ⚠️ 시안 3번 카드만 희망가격대가 `3만원이하`로 띄어쓰기가 빠져 있다. 같은 목록 안 표기
 * 불일치라 실수로 보고 `3만원 이하`로 통일했다. 문구가 아니라 표기 규칙이라 판단.
 *
 * `deadline`은 화면 확인용으로 현재 시각 기준 상대값을 만든다. 정적 렌더라 빌드 시각이
 * 기준이 되므로, 실제 마감 시각은 API 연동 때 서버 값으로 바뀐다.
 */
function hoursFromNow(hours: number): string {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

function buildDemandProducts(): readonly HomeProductCard[] {
  return [
    {
      id: 'demand-1',
      name: '락토핏 생유산균 골드',
      thumbnailUrl: '/images/main-home/card-list-1/1-1.webp',
      participantCount: 1200,
      sellerCount: 3,
      desiredPriceLabel: '3만원 이하',
      dday: 1,
    },
    {
      id: 'demand-2',
      name: '락토핏 다이어트',
      thumbnailUrl: '/images/main-home/card-list-1/1-2.webp',
      participantCount: 800,
      sellerCount: 2,
      desiredPriceLabel: '2만원 이하',
      dday: 2,
    },
    {
      id: 'demand-3',
      name: '락토핏 코어',
      thumbnailUrl: '/images/main-home/card-list-1/1-3.webp',
      participantCount: 680,
      sellerCount: 4,
      desiredPriceLabel: '3만원 이하',
      deadline: hoursFromNow(3),
    },
    {
      id: 'demand-4',
      name: '락토핏 당케어 데일리',
      thumbnailUrl: '/images/main-home/card-list-1/1-4.webp',
      participantCount: 180,
      sellerCount: 1,
      desiredPriceLabel: '3만원 이하',
      deadline: hoursFromNow(1),
    },
    {
      id: 'demand-5',
      name: '락토핏 뷰티',
      thumbnailUrl: '/images/main-home/card-list-1/1-5.webp',
      participantCount: 220,
      sellerCount: 5,
      desiredPriceLabel: '1만원 이하',
      dday: 1,
    },
  ];
}

export async function mockGetDemandProducts(): Promise<readonly HomeProductCard[]> {
  return buildDemandProducts();
}

/** card-list-2(성사 직전 공구). 시안 `981:18273`. */
function buildClosingProducts(): readonly HomeProductCard[] {
  return [
    {
      id: 'closing-1',
      name: '지리산 감자 2kg',
      thumbnailUrl: '/images/main-home/card-list-2/2-1.webp',
      participantCount: 1800,
      sellerCount: 5,
      desiredPriceLabel: '1만원 이하',
      deadline: hoursFromNow(12),
    },
    {
      id: 'closing-2',
      name: '군산 양배추 5kg',
      thumbnailUrl: '/images/main-home/card-list-2/2-2.webp',
      participantCount: 1530,
      sellerCount: 2,
      desiredPriceLabel: '3만원 이하',
      dday: 2,
    },
    {
      id: 'closing-3',
      name: '제주 애월 당근 3kg',
      thumbnailUrl: '/images/main-home/card-list-2/2-3.webp',
      participantCount: 1420,
      sellerCount: 3,
      desiredPriceLabel: '3만원 이하',
      dday: 2,
    },
    {
      id: 'closing-4',
      name: '홍천 급냉 찐 옥수수 1kg',
      thumbnailUrl: '/images/main-home/card-list-2/2-4.webp',
      participantCount: 1240,
      sellerCount: 1,
      desiredPriceLabel: '1만원 이하',
      dday: 1,
    },
    {
      id: 'closing-5',
      name: '해남 고구마 5kg',
      thumbnailUrl: '/images/main-home/card-list-2/2-5.webp',
      participantCount: 1320,
      sellerCount: 6,
      desiredPriceLabel: '5만원 이하',
      dday: 1,
    },
  ];
}

/** card-list-6(참여가능 마감 직전 공구). 시안 `981:18307`. 전부 카운트다운이다. */
function buildDeadlineProducts(): readonly HomeProductCard[] {
  return [
    {
      id: 'deadline-1',
      name: '국내산 생 들기름 250ml',
      thumbnailUrl: '/images/main-home/card-list-6/6-1.webp',
      participantCount: 780,
      sellerCount: 1,
      desiredPriceLabel: '2만원 이하',
      deadline: hoursFromNow(11),
    },
    {
      id: 'deadline-2',
      name: '카누 미니 30입 5개',
      thumbnailUrl: '/images/main-home/card-list-6/6-2.webp',
      participantCount: 126,
      sellerCount: 2,
      desiredPriceLabel: '1만원 이하',
      deadline: hoursFromNow(10),
    },
    {
      id: 'deadline-3',
      name: '청수당 말차라떼 18g*35입',
      thumbnailUrl: '/images/main-home/card-list-6/6-3.webp',
      participantCount: 1420,
      sellerCount: 1,
      desiredPriceLabel: '3만원 이하',
      deadline: hoursFromNow(9),
    },
    {
      id: 'deadline-4',
      name: '화이트하임 5박스',
      thumbnailUrl: '/images/main-home/card-list-6/6-4.webp',
      participantCount: 1240,
      sellerCount: 3,
      desiredPriceLabel: '3만원 이하',
      deadline: hoursFromNow(7),
    },
    {
      id: 'deadline-5',
      name: '쿠크다스 4박스',
      thumbnailUrl: '/images/main-home/card-list-6/6-5.webp',
      participantCount: 1320,
      sellerCount: 2,
      desiredPriceLabel: '1만원 이하',
      deadline: hoursFromNow(3),
    },
  ];
}

export async function mockGetClosingProducts(): Promise<readonly HomeProductCard[]> {
  return buildClosingProducts();
}

export async function mockGetDeadlineProducts(): Promise<readonly HomeProductCard[]> {
  return buildDeadlineProducts();
}

/**
 * card-list-4(성사된 공구에 바로 참여해보세요!). 시안 `981:18293`.
 *
 * ⚠️ 2번 상품명이 시안에 `매디큐브 뷰티디자이스 종합전`으로 적혀 있다. 같은 시안 배너에는
 * `메디큐브 뷰티디바이스`로 나와 표기가 어긋난다. 상품명은 표기 규칙이 아니라 내용이라
 * 임의로 고치지 않고 시안 그대로 두었다. 디자인 확인 대상.
 *
 * ⚠️ 3번 희망가격이 시안에 `5천원이하`로 띄어쓰기가 빠져 있다. card-list-1과 같은 사례라
 * `5천원 이하`로 통일했다.
 */
const mockSucceededProducts: readonly HomeProductCard[] = [
  {
    id: 'succeeded-1',
    name: '휴대용 미니 선풍기',
    thumbnailUrl: '/images/main-home/card-list-4/4-1.webp',
    sellerCount: 2,
    desiredPriceLabel: '1만원 이하',
  },
  {
    id: 'succeeded-2',
    name: '매디큐브 뷰티디자이스 종합전',
    thumbnailUrl: '/images/main-home/card-list-4/4-2.webp',
    sellerCount: 1,
    desiredPriceLabel: '10만원 이하',
  },
  {
    id: 'succeeded-3',
    name: '오리지널 왕 칫솔 5개입 1+1',
    thumbnailUrl: '/images/main-home/card-list-4/4-3.webp',
    sellerCount: 5,
    desiredPriceLabel: '5천원 이하',
  },
  {
    id: 'succeeded-4',
    name: '펩시제로 제로슈거 라임향 355ml(24개)',
    thumbnailUrl: '/images/main-home/card-list-4/4-4.webp',
    sellerCount: 3,
    desiredPriceLabel: '1만원 이하',
  },
  {
    id: 'succeeded-5',
    name: '매일유업 소화가잘되는 우유 24개',
    thumbnailUrl: '/images/main-home/card-list-4/4-5.webp',
    sellerCount: 2,
    desiredPriceLabel: '2만원 이하',
  },
];

/** card-list-5(현재 인기 브랜드딜). 시안 `981:18301`. */
const mockBrandDeals: readonly HomeBrandDeal[] = [
  {
    id: 'brand-deal-1',
    title: '매일유업 브랜드딜',
    description: '매일유업의 상품을 최저가로 구매해보세요',
    imageUrl: '/images/main-home/card-list-5/5-1.webp',
    dday: 2,
  },
  {
    id: 'brand-deal-2',
    title: '종근당 건강 브랜드딜',
    description: '종근당 건강의 상품을 최저가로 구매해보세요',
    imageUrl: '/images/main-home/card-list-5/5-2.webp',
    dday: 1,
  },
  {
    id: 'brand-deal-3',
    title: '비비고 상품 브랜드딜',
    description: '비비고의 상품을 최저가로 구매해보세요',
    imageUrl: '/images/main-home/card-list-5/5-3.webp',
    dday: 1,
  },
];

export async function mockGetSucceededProducts(): Promise<readonly HomeProductCard[]> {
  return mockSucceededProducts;
}

export async function mockGetBrandDeals(): Promise<readonly HomeBrandDeal[]> {
  return mockBrandDeals;
}

/**
 * card-list-7(현재 인기 공구 상품). 시안 `981:18319`. 한 열에 2장씩 3열.
 *
 * ⚠️ 마감 배지 표기가 열마다 다르다. 1열은 `D-1`·`D-2`만, 2·3열은 `D-1 15:02:11`처럼 D-day와
 * 카운트다운을 함께 쓴다. 규칙을 알 수 없어 시안에 적힌 그대로 넣었다.
 */
function buildPopularProducts(): readonly HomeProductCard[] {
  return [
    {
      id: 'popular-1',
      name: '크라운 우베 시리즈 기획전',
      brandName: '크라운제과',
      thumbnailUrl: '/images/main-home/card-list-7/7-1.webp',
      participantCount: 1254,
      desiredPriceLabel: '2만원 이하',
      dday: 1,
    },
    {
      id: 'popular-2',
      name: '라라스윗 과자 기획전',
      brandName: '라라스윗',
      thumbnailUrl: '/images/main-home/card-list-7/7-2.webp',
      participantCount: 340,
      desiredPriceLabel: '1만원 이하',
      dday: 2,
    },
    {
      id: 'popular-3',
      name: '3in1 믹스커피 2종 (택1)',
      brandName: 'G7',
      thumbnailUrl: '/images/main-home/card-list-7/7-3.webp',
      participantCount: 280,
      desiredPriceLabel: '3만원 이하',
      dday: 1,
      deadline: hoursFromNow(15),
    },
    {
      id: 'popular-4',
      name: '끓여먹는 차 5종 (택1)',
      brandName: '동서식품',
      thumbnailUrl: '/images/main-home/card-list-7/7-4.webp',
      participantCount: 120,
      desiredPriceLabel: '1만원 이하',
      dday: 0,
      deadline: hoursFromNow(23),
    },
    {
      id: 'popular-5',
      name: '햄 가득 송탄식 부대찌개',
      brandName: '차려낸',
      thumbnailUrl: '/images/main-home/card-list-7/7-5.webp',
      participantCount: 80,
      desiredPriceLabel: '1만원 이하',
      dday: 1,
      deadline: hoursFromNow(1),
    },
    {
      id: 'popular-6',
      name: '춘천 국물 닭갈비 떡볶이',
      brandName: '올마레',
      thumbnailUrl: '/images/main-home/card-list-7/7-6.webp',
      participantCount: 330,
      desiredPriceLabel: '1만원 이하',
      dday: 1,
      deadline: hoursFromNow(3),
    },
  ];
}

/** card-list-8 브랜드 칩. 이름은 이미지 반입 이슈(#60)가 정리한 대응표를 따른다. */
const mockBrands: readonly HomeBrand[] = [
  { id: 'brand-1', name: '라라스윗', logoUrl: '/images/main-home/card-list-8/brand-1.webp' },
  { id: 'brand-2', name: '동서식품', logoUrl: '/images/main-home/card-list-8/brand-2.webp' },
  { id: 'brand-3', name: '크라운', logoUrl: '/images/main-home/card-list-8/brand-3.webp' },
  { id: 'brand-4', name: '해태', logoUrl: '/images/main-home/card-list-8/brand-4.webp' },
  { id: 'brand-5', name: '농심', logoUrl: '/images/main-home/card-list-8/brand-5.webp' },
  { id: 'brand-6', name: '풀무원', logoUrl: '/images/main-home/card-list-8/brand-6.webp' },
  { id: 'brand-7', name: '청정원', logoUrl: '/images/main-home/card-list-8/brand-7.webp' },
];

/** card-list-8 목록. 시안은 첫 칩(라라스윗)이 선택된 상태만 그린다. */
function buildBrandProducts(): readonly HomeProductCard[] {
  return [
    {
      id: 'by-brand-1',
      name: '저당 요거트바 딸기/복숭아',
      brandName: '라라스윗',
      thumbnailUrl: '/images/main-home/card-list-8/8-1.webp',
      participantCount: 1830,
      desiredPriceLabel: '1만원 이하',
      deadline: hoursFromNow(13),
    },
    {
      id: 'by-brand-2',
      name: '라라스윗 파인트',
      brandName: '라라스윗',
      thumbnailUrl: '/images/main-home/card-list-8/8-2.webp',
      participantCount: 1240,
      desiredPriceLabel: '1만원 이하',
      deadline: hoursFromNow(11),
    },
    {
      id: 'by-brand-3',
      name: '라라스윗 저당 팝콘',
      brandName: '라라스윗',
      thumbnailUrl: '/images/main-home/card-list-8/8-3.webp',
      participantCount: 867,
      desiredPriceLabel: '5천원 이하',
      dday: 2,
    },
  ];
}

export async function mockGetPopularProducts(): Promise<readonly HomeProductCard[]> {
  return buildPopularProducts();
}

export async function mockGetBrands(): Promise<readonly HomeBrand[]> {
  return mockBrands;
}

export async function mockGetBrandProducts(): Promise<readonly HomeProductCard[]> {
  return buildBrandProducts();
}

/** card-list-3(뭉치님의 관심사 추천!). 시안 `981:18285`. */
function buildInterestProducts(): readonly HomeProductCard[] {
  return [
    {
      id: 'interest-1',
      name: '데체코 스파게티면 1kg',
      thumbnailUrl: '/images/main-home/card-list-3/3-1.webp',
      participantCount: 50,
      sellerCount: 3,
      desiredPriceLabel: '5천원 이하',
      dday: 2,
    },
    {
      id: 'interest-2',
      name: '데체코 토마토 파스타 소스 3종',
      thumbnailUrl: '/images/main-home/card-list-3/3-2.webp',
      participantCount: 600,
      sellerCount: 1,
      desiredPriceLabel: '1만원 이하',
      deadline: hoursFromNow(14),
    },
    {
      id: 'interest-3',
      name: '국내산 한돈 삼겹살 3kg',
      thumbnailUrl: '/images/main-home/card-list-3/3-3.webp',
      participantCount: 450,
      sellerCount: 2,
      desiredPriceLabel: '1만원 이하',
      deadline: hoursFromNow(11),
    },
    {
      id: 'interest-4',
      name: '비비고 왕교자 1.05kg',
      thumbnailUrl: '/images/main-home/card-list-3/3-4.webp',
      participantCount: 127,
      sellerCount: 4,
      desiredPriceLabel: '2만원 이하',
      deadline: hoursFromNow(8),
    },
    {
      id: 'interest-5',
      name: '사세 매콤점보 닭다리 1kg',
      thumbnailUrl: '/images/main-home/card-list-3/3-5.webp',
      participantCount: 170,
      sellerCount: 1,
      desiredPriceLabel: '3만원 이하',
      deadline: hoursFromNow(0.07),
    },
  ];
}

export async function mockGetInterestProducts(): Promise<readonly HomeProductCard[]> {
  return buildInterestProducts();
}
