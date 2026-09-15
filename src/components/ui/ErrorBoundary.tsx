'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';

import { ErrorState } from '@/components/ui/ErrorState';

// 부분 트리용 에러 바운더리. App Router의 error.tsx가 '세그먼트 전체'를 잡는 것과 달리,
// 이 컴포넌트는 '한 화면 안의 특정 위젯'만 감싸 그 위젯이 터져도 나머지 화면은 살려 둔다.
// 예) 홈에서 추천 섹션 하나가 렌더 중 예외를 던져도 헤더·다른 섹션은 그대로 보이게.
//
// error.tsx는 라우트 단위라 위젯 단위로는 못 쓴다. 그래서 클래스형 바운더리가 따로 필요하다
// (React에서 에러를 잡는 라이프사이클 훅은 클래스 컴포넌트에만 있다).
//
// 기본 폴백은 인라인 오류(ui/ErrorState) + 재시도다. 재시도를 누르면 바운더리 상태를 초기화해
// children을 다시 렌더한다. 화면에 맞는 다른 생김새가 필요하면 fallback으로 갈아끼운다.

interface ErrorBoundaryProps {
  children: ReactNode;
  /**
   * 오류 시 대신 그릴 내용. reset을 받아 재시도 버튼에 연결할 수 있는 렌더 함수, 또는 고정 노드.
   * 생략하면 ui/ErrorState(문구 + 새로고침)를 쓴다.
   */
  fallback?: ReactNode | ((props: { error: Error; reset: () => void }) => ReactNode);
  /** 오류 로깅·리포팅 훅(선택). error.tsx와 같은 지점에서 리포팅 도구에 물릴 수 있다. */
  onError?: (error: Error, info: ErrorInfo) => void;
  /**
   * 값이 바뀌면 바운더리를 자동으로 초기화한다(예: 재조회할 id). 오류 후 상위가 데이터를
   * 바꿨을 때 사용자가 재시도를 안 눌러도 복구되게 한다.
   */
  resetKeys?: readonly unknown[];
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // 원인 파악용 로깅. 에러 리포팅 도구가 도입되면 onError 또는 이 지점에서 전송한다.
    console.error('[ErrorBoundary] 위젯 처리 실패:', error);
    this.props.onError?.(error, info);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    // resetKeys가 하나라도 바뀌면 오류를 털고 children을 다시 렌더한다.
    if (this.state.error === null) return;
    if (!areKeysEqual(prevProps.resetKeys, this.props.resetKeys)) {
      this.reset();
    }
  }

  reset = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    const { error } = this.state;
    const { children, fallback } = this.props;

    if (error === null) return children;

    if (typeof fallback === 'function') {
      return fallback({ error, reset: this.reset });
    }
    if (fallback !== undefined) {
      return fallback;
    }
    return <ErrorState onRetry={this.reset} />;
  }
}

// resetKeys 얕은 비교. 배열 유무·길이·각 원소를 Object.is로 본다.
function areKeysEqual(
  a: readonly unknown[] | undefined,
  b: readonly unknown[] | undefined,
): boolean {
  if (a === b) return true;
  if (a === undefined || b === undefined) return false;
  if (a.length !== b.length) return false;
  return a.every((value, index) => Object.is(value, b[index]));
}
