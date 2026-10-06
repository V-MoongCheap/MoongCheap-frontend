import type { Page, Request, Route } from '@playwright/test';

import type { DemandCreateRequestDto } from '@/lib/demandApi';
import type { ProductCatalogDetailDto } from '@/lib/productApi';
import type { ProductSearchItemDto } from '@/lib/productSearchApi';
import type { ShippingAddressRequestDto, ShippingAddressResponseDto } from '@/types/api/address';
import type { DemandItemDto } from '@/types/api/demand';
import type { CatalogDemandBoardCardDto } from '@/types/api/demandBoard';
import type { PaymentMethodResponseDto } from '@/types/api/payment';

/**
 * E2E용 가짜 백엔드.
 *
 * 앱은 이 주소로 빌드되고(`playwright.config.ts`), 브라우저가 이 주소로 보내는 요청을 전부 여기서
 * 응답한다. 응답 모양은 `src/types/api`·`src/lib/*Api.ts`의 DTO를 그대로 따른다.
 *
 * 상태를 기억한다. 로그인하면 이후 `/api/members/me`가 회원을 돌려주고, 배송지·수요를 등록하면 목록
 * 조회에 나타난다. 그래서 '등록 → 목록 반영' 같은 흐름을 실제 백엔드 없이 검증할 수 있다.
 */
export const E2E_API_BASE_URL = 'http://api.e2e.test';

/**
 * 테스트용 앱 서버 포트. `playwright.config.ts`도 이 값을 쓴다. 두 곳에 따로 적으면 포트만 바뀌었을 때
 * 아래 CORS 허용 주소가 어긋나, 브라우저가 응답을 막아 모든 요청이 '네트워크 오류'로 보인다.
 */
export const E2E_APP_PORT = 3100;

const APP_ORIGIN = `http://localhost:${E2E_APP_PORT}`;

export interface FakeMember {
  loginId: string;
  password: string;
  nickname: string;
}

export interface FakeBackendState {
  /** 로그인할 수 있는 계정. */
  member: FakeMember;
  /** true면 처음부터 로그인된 세션으로 시작한다. */
  loggedIn: boolean;
  catalogs: ProductCatalogDetailDto[];
  catalogBoards: Record<number, CatalogDemandBoardCardDto[]>;
  addresses: ShippingAddressResponseDto[];
  paymentMethods: PaymentMethodResponseDto[];
  myDemands: DemandItemDto[];
}

/** 앱이 보낸 요청 기록. 테스트가 '무엇을 보냈는지' 확인할 때 쓴다. */
export interface RecordedRequest {
  method: string;
  path: string;
  body: unknown;
}

interface JsonResponse {
  status: number;
  body?: unknown;
}

/** 실패 응답 봉투. 백엔드 공통 형식(`docs/api-error-responses.md`)과 같다. */
function apiError(status: number, code: string, message: string): JsonResponse {
  return { status, body: { code, message, fieldErrors: [] } };
}

function readBody(request: Request): unknown {
  const raw = request.postData();
  if (raw === null || raw === '') {
    return null;
  }
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return raw;
  }
}

export class FakeBackend {
  readonly state: FakeBackendState;
  readonly requests: RecordedRequest[] = [];
  /** 처리 규칙이 없는 요청. 테스트 끝에 비어 있어야 화면이 예상한 API만 불렀다는 뜻이다. */
  readonly unhandled: string[] = [];
  private nextId = 1000;

  constructor(state: FakeBackendState) {
    this.state = state;
  }

  async install(page: Page): Promise<void> {
    await page.route(`${E2E_API_BASE_URL}/**`, (route) => this.handle(route));
  }

  private async handle(route: Route): Promise<void> {
    const request = route.request();
    const headers = {
      'Access-Control-Allow-Origin': APP_ORIGIN,
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // JSON 본문 요청은 브라우저가 사전 요청(OPTIONS)을 먼저 보낸다.
    if (request.method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers });
      return;
    }

    const url = new URL(request.url());
    const body = readBody(request);
    this.requests.push({ method: request.method(), path: url.pathname + url.search, body });

    const response = this.respond(request.method(), url, body);
    if (response === undefined) {
      this.unhandled.push(`${request.method()} ${url.pathname}${url.search}`);
    }
    const { status, body: responseBody } = response ?? apiError(404, 'E2E_404', '처리 규칙 없음');
    await route.fulfill({
      status,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: responseBody === undefined ? '' : JSON.stringify(responseBody),
    });
  }

  private respond(method: string, url: URL, body: unknown): JsonResponse | undefined {
    const path = url.pathname;
    const s = this.state;
    const unauthorized = apiError(401, 'COMMON_401', '로그인이 필요합니다.');

    /* ── 인증 ── */
    if (method === 'POST' && path === '/api/auth/login') {
      const { loginId, password } = body as { loginId: string; password: string };
      if (loginId !== s.member.loginId || password !== s.member.password) {
        return apiError(401, 'AUTH_006', '아이디 또는 비밀번호가 일치하지 않습니다.');
      }
      s.loggedIn = true;
      return { status: 200, body: { loginId } };
    }
    if (method === 'GET' && path === '/api/members/me') {
      if (!s.loggedIn) {
        return unauthorized;
      }
      return {
        status: 200,
        body: {
          loginId: s.member.loginId,
          nickname: s.member.nickname,
          phoneNumberMasked: '010-****-5678',
          email: 'e2e@moongcheap.test',
          joinedAt: '2026-09-01T10:00:00',
          isSeller: false,
          linkedProviders: [],
          seller: null,
        },
      };
    }

    /* ── 수요보드 목록(상품 상세 퀵참여 카드) ── */
    const boardsMatch = /^\/api\/demand-boards\/catalog\/(\d+)$/.exec(path);
    if (method === 'GET' && boardsMatch !== null) {
      const boards = s.catalogBoards[Number(boardsMatch[1])] ?? [];
      return {
        status: 200,
        body: { demandBoards: boards, size: boards.length, hasNext: false, page: 0 },
      };
    }

    /* ── 이하 로그인 필요 ── */
    // 검색·도감도 여기 아래다. 실제 백엔드가 둘 다 세션을 요구한다(`lib/productSearchApi.ts`의
    // permitAll 주석, 비로그인 상품 상세에서 `/api/product-catalog/{id}` 401 실측).
    if (path.startsWith('/api/') && !s.loggedIn) {
      return unauthorized;
    }

    /* ── 상품 검색·도감 ── */
    if (method === 'GET' && path === '/api/products-search/search') {
      const q = (url.searchParams.get('q') ?? '').trim();
      const products: ProductSearchItemDto[] = s.catalogs
        .filter((c) => q !== '' && c.name.includes(q))
        .map((c) => ({
          id: c.id,
          name: c.name,
          specSummary: c.specSummary,
          listPrice: c.listPrice,
          thumbnailUrl: c.thumbnailUrl,
          status: 'ACTIVE',
        }));
      return { status: 200, body: { products, size: products.length, hasNext: false, page: 0 } };
    }
    const catalogMatch = /^\/api\/product-catalog\/(\d+)$/.exec(path);
    if (method === 'GET' && catalogMatch !== null) {
      const catalog = s.catalogs.find((c) => c.id === Number(catalogMatch[1]));
      return catalog === undefined
        ? apiError(404, 'PRODUCT_001', '상품을 찾을 수 없습니다.')
        : { status: 200, body: catalog };
    }

    /* ── 배송지 ── */
    if (path === '/api/shipping-addresses') {
      if (method === 'GET') {
        // 백엔드 규칙: 기본 배송지 우선, 최근 등록순
        const sorted = [...s.addresses].sort(
          (a, b) => Number(b.isDefault) - Number(a.isDefault) || b.id - a.id,
        );
        return { status: 200, body: sorted };
      }
      if (method === 'POST') {
        const dto = body as ShippingAddressRequestDto;
        const isFirst = s.addresses.length === 0;
        const isDefault = isFirst || dto.setAsDefault === true;
        if (isDefault) {
          s.addresses.forEach((a) => (a.isDefault = false));
        }
        const id = this.nextId++;
        s.addresses.push({
          id,
          alias: dto.alias,
          recipientName: dto.recipientName,
          phoneNumberMasked: dto.phoneNumber.replace(/^(\d{3})\d{4}(\d{4})$/, '$1-****-$2'),
          zipcode: dto.zipcode,
          address: dto.address,
          addressDetail: dto.addressDetail ?? null,
          entranceCode: dto.entranceCode ?? null,
          requestMessage: dto.requestMessage ?? null,
          isDefault,
        });
        return { status: 201, body: { id } };
      }
    }

    /* ── 주문 요약(마이페이지) ── */
    if (method === 'GET' && path === '/api/orders/summary') {
      return {
        status: 200,
        body: { paymentCompleted: 0, preparingShipment: 0, shipped: 0, delivered: 0 },
      };
    }

    /* ── 결제수단 ── */
    if (method === 'GET' && path === '/api/payments/methods') {
      return { status: 200, body: s.paymentMethods };
    }

    /* ── 내 수요(참여) ── */
    if (path === '/api/members/me/demand') {
      if (method === 'GET') {
        const statuses = url.searchParams.getAll('statuses');
        // 백엔드 규칙: statuses 미전달이면 완료(CLOSED)를 뺀 진행 중 상태만 준다.
        const active = ['UNASSIGNED', 'SUBSTITUTE_OFFERED', 'ASSIGNED', 'PAYMENT_PENDING'];
        const demands = s.myDemands.filter((d) =>
          (statuses.length > 0 ? statuses : active).includes(d.status),
        );
        return { status: 200, body: { demands, size: demands.length, hasNext: false, page: 0 } };
      }
      if (method === 'POST') {
        const dto = body as DemandCreateRequestDto;
        const catalog = s.catalogs.find((c) => c.id === dto.catalogId);
        if (catalog === undefined) {
          return apiError(404, 'PRODUCT_001', '상품을 찾을 수 없습니다.');
        }
        if (s.myDemands.some((d) => d.catalog.id === dto.catalogId && d.status !== 'CLOSED')) {
          return apiError(409, 'DEMAND_001', '이미 진행 중인 수요가 있습니다.');
        }
        const id = this.nextId++;
        s.myDemands.unshift({
          id,
          status: 'UNASSIGNED',
          desiredPriceMin: dto.desiredPriceMin,
          desiredPriceMax: dto.desiredPriceMax,
          product: null,
          desireEndAt: '2026-12-31T23:00:00',
          quantity: dto.quantity,
          extraRequirement: dto.extraRequirement ?? null,
          isSubstitutable: dto.isSubstitutable,
          createdAt: '2026-10-01T10:00:00',
          catalog: {
            id: catalog.id,
            name: catalog.name,
            specSummary: catalog.specSummary,
            thumbnailUrl: catalog.thumbnailUrl,
            listPrice: catalog.listPrice,
          },
          demandBoard: null,
        });
        return { status: 201, body: { id } };
      }
    }

    return undefined;
  }
}
