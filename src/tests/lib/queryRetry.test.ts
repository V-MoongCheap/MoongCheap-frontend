import { describe, expect, it } from 'vitest';

import { ApiError } from '@/lib/api';
import { shouldRetryQuery } from '@/lib/queryRetry';

describe('shouldRetryQuery', () => {
  it.each([0, 500, 503, 599])('status %i은 한 번 재시도한다', (status) => {
    expect(shouldRetryQuery(0, new ApiError('실패', status))).toBe(true);
  });

  it('재시도는 한 번까지만 한다', () => {
    expect(shouldRetryQuery(1, new ApiError('실패', 503))).toBe(false);
  });

  it.each([400, 401, 404, 409])('서버가 거절한 %i은 재시도하지 않는다', (status) => {
    expect(shouldRetryQuery(0, new ApiError('실패', status))).toBe(false);
  });

  it('표준 밖의 코드는 재시도하지 않는다', () => {
    expect(shouldRetryQuery(0, new ApiError('실패', 999))).toBe(false);
  });

  it('응답 매핑 중 깨진 오류(ApiError 아님)는 재시도하지 않는다', () => {
    expect(shouldRetryQuery(0, new SyntaxError('Unexpected token'))).toBe(false);
  });
});
