'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';

import { ErrorState } from '@/components/ui/ErrorState';

// 부분 트리용 에러 바운더리. App Router의 error.tsx가 '세그먼트 전체'를 잡는 것과 달리,
// 이 컴포넌트는 감싼 하위 트리 하나만 격리해, 그 트리가 터져도 형제 트리와 상위 화면은 살려 둔다.
//
// error.tsx는 라우트 단위라 트리 일부만 감쌀 수 없다. 그래서 별도 바운더리가 필요하고,
// React에서 렌더 오류를 잡는 라이프사이클은 클래스 컴포넌트에만 있어 구현은 클래스로 둔다
// (공개 API는 프로젝트 규칙대로 함수 컴포넌트로 노출한다 — 파일 하단 참고).
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

class ErrorBoundaryInner extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
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
    // 오류 상태에서 resetKeys가 바뀐 건 '다른 입력으로 다시 시도'라는 신호 — 사용자가
    // 재시도를 누르지 않아도 복구되도록 오류를 턴다. 정상 상태에선 볼 필요가 없어 조기 반환.
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

// 공개 API는 함수 컴포넌트로 노출한다(프로젝트 규칙: export function). 오류 포착 라이프사이클이
// 클래스 전용이라 구현만 내부 클래스에 두고, props는 손대지 않고 그대로 넘긴다.
export function ErrorBoundary(props: ErrorBoundaryProps): ReactNode {
  return <ErrorBoundaryInner {...props} />;
}

// resetKeys는 id 같은 원시 식별자 배열을 전제로 하므로 원소별 Object.is 얕은 비교로 충분하다.
// 깊은 비교는 불필요하게 매 렌더 순회 비용만 늘린다.
function areKeysEqual(
  a: readonly unknown[] | undefined,
  b: readonly unknown[] | undefined,
): boolean {
  if (a === b) return true;
  if (a === undefined || b === undefined) return false;
  if (a.length !== b.length) return false;
  return a.every((value, index) => Object.is(value, b[index]));
}
