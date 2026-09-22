'use client';

import { useMemo, useState } from 'react';

import { PackageOpen, SearchX } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { AlertDialog } from '@/components/ui/AlertDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { ERROR_ACTION_CLASS, ErrorScreen } from '@/components/ui/ErrorScreen';
import { ErrorState } from '@/components/ui/ErrorState';
import { SegmentControl } from '@/components/ui/SegmentControl';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { CANCEL_AWARD_DIALOG } from '@/constants/awardCancel';
import { ERROR_SCREEN_RETRY_LABEL } from '@/constants/commonMessages';
import {
  getParticipationStatusMeta,
  PARTICIPATION_TAB_ALL,
  PARTICIPATION_TABS,
  type ParticipationTab,
} from '@/constants/participationStatus';
import { ParticipationCard } from '@/features/participation/components/ParticipationCard';
import { useMyDemands } from '@/features/participation/hooks/useMyDemands';
import { useInfiniteScrollSentinel } from '@/hooks/useInfiniteScrollSentinel';
import type { ParticipationItem } from '@/types/participation';

// B-17 내 뭉치 참여 목록의 상호작용 셸(client). 탭(=상태 필터)마다 실API를 따로 조회하고
// (`useMyDemands`), 받은 목록을 날짜별로 묶어 보여 준다. 조회가 클라이언트인 이유는
// `lib/demandApi.ts` 주석 참고(SID httpOnly 쿠키는 브라우저만 갖고 있다).
//
// 상태별 카드 액션(시안): **해당 필터 탭에서만** 카드 아래 버튼이 뜬다('전체' 탭엔 없음).
//  · 확인필요(ACTION_REQUIRED) — '대체상품 확인하기' → 대체상품 수락/거절(B-16, `substituteHref`).
//  · 배정완료(ALLOCATED)   — '낙찰 취소하기' → 파괴적 확인 다이얼로그. 아직 mock(아래 주석).
//
// ⚠️ 첫 로딩·조회 실패·이어 받기·이어 받기 실패는 시안이 없다(명세 `🖌️ 디자인 필요`). 주문 목록
//    (`features/order/components/OrderList.tsx`)과 같은 방침으로 공용 ErrorScreen·ErrorState·Skeleton을
//    재사용한다.

interface DateGroup {
  date: string;
  items: ParticipationItem[];
}

/**
 * 목록을 날짜별로 묶는다. 서버가 이미 마감 임박순(`desire_end_at ASC`)으로 주지만, 화면은 최근
 * 접수일이 위로 오도록 날짜 내림차순으로 다시 정렬해 묶는다('YYYY.MM.DD'는 zero-pad라 문자열 비교가
 * 곧 날짜 비교). JS sort는 안정 정렬이라 같은 날짜 안의 원래 순서(응답 순서)는 보존된다.
 */
function groupByDate(items: ParticipationItem[]): DateGroup[] {
  const groups: DateGroup[] = [];
  const indexByDate = new Map<string, number>();

  const sorted = [...items].sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
  for (const item of sorted) {
    const existing = indexByDate.get(item.requestedAt);
    if (existing === undefined) {
      indexByDate.set(item.requestedAt, groups.length);
      groups.push({ date: item.requestedAt, items: [item] });
    } else {
      groups[existing].items.push(item);
    }
  }

  return groups;
}

interface ParticipationListProps {
  /** 배정완료(낙찰) 카드 탭 시 이동할 낙찰 결과(B-19) 경로. 라우트 문자열은 페이지가 주입한다
   *  (features/ 컴포넌트는 경로를 직접 들지 않는다 — exitHref·editHref 등과 같은 방침). */
  awardResultHref: string;
  /** 확인필요 카드의 '대체상품 확인하기' 탭 시 이동할 대체상품 수락/거절(B-16) 경로 빌더.
   *  수요 id가 필요해 문자열이 아니라 함수로 받는다(라우트 지식은 페이지가 갖는다). */
  substituteHref: (demandId: string) => string;
}

export function ParticipationList({ awardResultHref, substituteHref }: ParticipationListProps) {
  const [tab, setTab] = useState<ParticipationTab>(PARTICIPATION_TAB_ALL);
  const [cancelTarget, setCancelTarget] = useState<ParticipationItem | null>(null);
  // 낙찰 취소는 아직 mock이다(백엔드 DELETE는 "MVP 범위 X"·별도 이슈 후속). 확정 시 취소한 수요를
  // 세션 동안 목록에서 감추기 위해 id를 모아 두고 클라이언트에서 걸러 낸다. 실연동되면 이 상태를
  // 지우고 mutation + 캐시 무효화로 바꾼다.
  const [cancelledIds, setCancelledIds] = useState<ReadonlySet<string>>(new Set());
  const { showComingSoon, showToast } = useToast();
  const router = useRouter();

  const {
    data,
    isError,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
  } = useMyDemands(tab);

  // 목록 끝이 가까워지면 다음 20건을 받는다(`BR-B17-01-11`). 이어 받기가 실패하면 감지를 멈추고
  // 아래 재시도 버튼을 기다린다. 감지 로직은 주문 목록과 공유한다(`useInfiniteScrollSentinel`).
  const canLoadMore = hasNextPage && !isFetchingNextPage && !isFetchNextPageError;
  const sentinelRef = useInfiniteScrollSentinel(canLoadMore, fetchNextPage);

  // 카드 본문 탭 → 상세. 배정완료(낙찰됨)는 낙찰 결과(B-19)로 보낸다. 그 외 상태의 상세는
  // 수요 상세(B-12)인데 라우트 부재라 '준비 중' 토스트로 둔다.
  function openDetail(item: ParticipationItem) {
    if (item.status === 'ALLOCATED') {
      router.push(awardResultHref);
      return;
    }
    showComingSoon();
  }

  // 낙찰 취소 확정(mock). 대상 항목을 감추고 안내 토스트를 띄운다. 실제 상태 전이는 BE 연동 시.
  function handleConfirmCancel() {
    if (cancelTarget === null) {
      return;
    }
    const removed = cancelTarget.id;
    setCancelledIds((prev) => new Set(prev).add(removed));
    setCancelTarget(null);
    showToast(CANCEL_AWARD_DIALOG.successToast);
  }

  const items = useMemo(() => {
    const all = data?.pages.flatMap((page) => page.items) ?? [];
    return cancelledIds.size === 0 ? all : all.filter((item) => !cancelledIds.has(item.id));
  }, [data, cancelledIds]);

  const groups = useMemo(() => groupByDate(items), [items]);

  // 시안: 액션 버튼은 해당 상태 필터 탭에서만 노출('전체' 제외).
  const inFilteredTab = tab !== PARTICIPATION_TAB_ALL;

  // 본문은 네 상태로 갈린다: 첫 조회 실패 → 전체화면 오류, 첫 조회 중 → 스켈레톤, 결과 없음 → 빈 상태,
  // 그 외 → 목록. SegmentControl(탭)과 취소 다이얼로그는 어느 상태에서나 유지한다.
  let content;
  if (data === undefined && isError) {
    // 첫 조회 실패. 이어 받기 실패는 받은 목록을 지우지 않고 목록 아래에서 따로 알린다(목록 안).
    content = (
      <ErrorScreen>
        <button className={ERROR_ACTION_CLASS} onClick={() => void refetch()} type="button">
          {ERROR_SCREEN_RETRY_LABEL}
        </button>
      </ErrorScreen>
    );
  } else if (data === undefined) {
    // 첫 조회 중.
    content = (
      <div aria-busy className="flex w-full flex-1 flex-col gap-3 px-4 pt-4" role="status">
        <span className="sr-only">참여 목록을 불러오는 중</span>
        {[0, 1, 2].map((n) => (
          <Skeleton key={n} className="rounded-16 h-32 w-full" />
        ))}
      </div>
    );
  } else if (groups.length === 0 && !hasNextPage) {
    // 결과 없음. '전체' 탭이 비면 참여 이력 자체가 없는 것(콜드스타트), 특정 탭이 비면 그 탭 결과 없음.
    // ⚠️ 다음 페이지가 남아 있으면(예: 낙찰취소 mock으로 현재 페이지 항목이 전부 숨겨진 경우) 빈 상태로
    //    끊지 않고 아래 목록 분기로 떨어뜨려 sentinel을 그려 이어받기를 계속한다.
    // 아이콘은 exception 일러스트(#60) 병합 전까지 lucide placeholder를 쓴다.
    content =
      tab === PARTICIPATION_TAB_ALL ? (
        <EmptyState
          className="flex-1"
          description="관심 있는 상품의 수요에 참여해 보세요."
          icon={<PackageOpen aria-hidden className="size-12" />}
          title="아직 참여한 수요가 없어요"
        />
      ) : (
        <EmptyState
          className="flex-1"
          description="다른 상태 탭을 확인해 보세요."
          icon={<SearchX aria-hidden className="size-12" />}
          title={getParticipationStatusMeta(tab).emptyTitle}
        />
      );
  } else {
    // 목록. 실제 목록을 그릴 때만 트리를 만든다.
    content = (
      <div className="flex w-full flex-col">
        {groups.map((group, index) => (
          <section key={group.date} className="flex w-full flex-col">
            {/* 날짜 그룹 사이 회색 구분 밴드(첫 그룹 제외). */}
            {index > 0 && <div aria-hidden className="bg-surface-secondary h-2 w-full" />}
            {/* createdAt이 비어 date가 ''인 방어적 경우엔 빈 헤더를 그리지 않는다. */}
            {group.date !== '' && (
              <h2 className="text-heading-18 text-content-primary px-4 pt-4 pb-2">{group.date}</h2>
            )}
            <ul className="flex w-full flex-col gap-3 px-4 pb-2">
              {group.items.map((item) => (
                <li key={item.id}>
                  <ParticipationCard
                    action={renderAction(item, inFilteredTab, {
                      onSubstitute: () => router.push(substituteHref(item.id)),
                      onCancel: () => setCancelTarget(item),
                    })}
                    item={item}
                    onOpenDetail={() => openDetail(item)}
                  />
                </li>
              ))}
            </ul>
          </section>
        ))}

        {isFetchingNextPage && (
          <div aria-busy className="px-4 pt-3" role="status">
            <span className="sr-only">참여 목록을 불러오는 중</span>
            <Skeleton className="rounded-16 h-32 w-full" />
          </div>
        )}

        {isFetchNextPageError && <ErrorState onRetry={() => void fetchNextPage()} />}

        {/* 다음 페이지 감지용 표식. 높이가 없어 보이지 않는다. */}
        <div aria-hidden ref={sentinelRef} />
      </div>
    );
  }

  return (
    <div className="flex w-full flex-1 flex-col">
      <SegmentControl
        ariaLabel="참여 상태 필터"
        onChange={setTab}
        options={PARTICIPATION_TABS}
        value={tab}
      />

      {content}

      <AlertDialog
        cancelLabel={CANCEL_AWARD_DIALOG.cancelLabel}
        confirmLabel={CANCEL_AWARD_DIALOG.confirmLabel}
        isOpen={cancelTarget !== null}
        message={CANCEL_AWARD_DIALOG.message}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleConfirmCancel}
        title={CANCEL_AWARD_DIALOG.title}
      />
    </div>
  );
}

interface ActionHandlers {
  onSubstitute: () => void;
  onCancel: () => void;
}

/**
 * 카드 하단 액션 버튼. 시안대로 해당 상태 필터 탭에서만 렌더한다(전체 탭·기타 상태는 없음).
 * 두 버튼 모두 회색 풀폭 버튼 스타일이다.
 */
function renderAction(item: ParticipationItem, inFilteredTab: boolean, handlers: ActionHandlers) {
  if (!inFilteredTab) {
    return undefined;
  }

  const label =
    item.status === 'ACTION_REQUIRED'
      ? '대체상품 확인하기'
      : item.status === 'ALLOCATED'
        ? '낙찰 취소하기'
        : null;
  if (label === null) {
    return undefined;
  }

  const onClick = item.status === 'ACTION_REQUIRED' ? handlers.onSubstitute : handlers.onCancel;

  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-surface-secondary text-content-primary text-button-14 active:bg-surface-tertiary rounded-12 flex h-11 w-full items-center justify-center"
    >
      {label}
    </button>
  );
}
