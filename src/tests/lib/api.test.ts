import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError, apiFetch, parseCreatedId } from '@/lib/api';

/** 가짜 fetch가 돌려줄 응답을 정한다. */
function respondWith(response: Response) {
  const fetchMock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

/** apiFetch가 던진 ApiError를 꺼낸다. */
async function catchApiError(promise: Promise<unknown>): Promise<ApiError> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof ApiError) {
      return error;
    }
    throw error;
  }
  throw new Error('ApiError가 발생하지 않았습니다.');
}

describe('apiFetch', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', 'http://localhost:8080/');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('베이스 URL을 붙이고 세션 쿠키를 싣는다(끝 슬래시 중복 없음)', async () => {
    const fetchMock = respondWith(new Response('{}', { status: 200 }));

    await apiFetch('/api/members/me');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8080/api/members/me',
      expect.objectContaining({ credentials: 'include' }),
    );
  });

  it('평면 실패 본문에서 코드·메시지·필드 오류를 읽는다', async () => {
    respondWith(
      Response.json(
        {
          code: 'COMMON_400',
          message: '입력값을 확인해주세요.',
          fieldErrors: [{ field: 'quantity', message: '1 이상' }, { field: 1 }],
        },
        { status: 400 },
      ),
    );

    const error = await catchApiError(apiFetch('/api/x'));

    expect(error).toMatchObject({
      status: 400,
      code: 'COMMON_400',
      message: '입력값을 확인해주세요.',
    });
    // 형태가 어긋난 원소는 버린다
    expect(error.fieldErrors).toEqual([{ field: 'quantity', message: '1 이상' }]);
  });

  it('시큐리티 필터의 감싼 봉투({ success, data, error })도 안쪽을 읽는다', async () => {
    respondWith(
      Response.json(
        {
          success: false,
          data: null,
          error: { code: 'COMMON_401', message: '로그인이 필요합니다.' },
        },
        { status: 401 },
      ),
    );

    const error = await catchApiError(apiFetch('/api/x'));

    expect(error).toMatchObject({
      status: 401,
      code: 'COMMON_401',
      message: '로그인이 필요합니다.',
    });
  });

  it('본문이 JSON이 아니면(게이트웨이 502 HTML 등) 상태 코드 기본 문구로 던진다', async () => {
    respondWith(new Response('<html>Bad Gateway</html>', { status: 502 }));

    const error = await catchApiError(apiFetch('/api/x'));

    expect(error).toMatchObject({
      status: 502,
      code: null,
      message: '요청이 실패했습니다(HTTP 502).',
    });
  });

  it('네트워크 오류는 status 0으로 던진다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    const error = await catchApiError(apiFetch('/api/x'));

    expect(error.status).toBe(0);
  });

  it('베이스 URL이 없으면 요청하지 않고 status 0으로 던진다', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', '');
    const fetchMock = respondWith(new Response('{}'));

    const error = await catchApiError(apiFetch('/api/x'));

    expect(error.status).toBe(0);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('parseCreatedId', () => {
  it('{ id: number } 응답에서 id를 문자열로 돌려준다', async () => {
    await expect(parseCreatedId(Response.json({ id: 207 }, { status: 201 }))).resolves.toBe('207');
  });

  it('안전 정수를 넘는 id는 반올림된 값을 돌려주지 않고 실패시킨다', async () => {
    const response = new Response('{"id": 9007199254740993}', { status: 201 });

    await expect(parseCreatedId(response)).rejects.toBeInstanceOf(ApiError);
  });

  it.each([
    ['id가 문자열', '{"id": "207"}'],
    ['id 없음', '{}'],
    ['본문이 JSON이 아님', 'created'],
  ])('%s이면 실패시킨다', async (_, body) => {
    await expect(parseCreatedId(new Response(body, { status: 201 }))).rejects.toBeInstanceOf(
      ApiError,
    );
  });
});
