import type { ReactNode } from 'react';

import Image from 'next/image';

import { getParticipationStatusMeta } from '@/constants/participationStatus';
import { ParticipationDeadline } from '@/features/participation/components/ParticipationDeadline';
import { cn } from '@/lib/cn';
import { isRenderableImageSrc } from '@/lib/imageSource';
import type { ParticipationItem } from '@/types/participation';

// B-17 내 뭉치 참여 카드 한 건. 시안 구성:
//  [썸네일 + 상태배지 오버레이]  [마감 표기(D-N·마감 임박 카운트다운·마감) · N명 참여 배지]
//                               상품명(볼드)
//                               규격 요약 | 수량 : N개
//  가격 라벨(상태별 priceHeading — 완료='낙찰가', 그 외='희망가격대')
//  가격(볼드)
//  [상태별 액션 버튼(선택)]
//
// 상태별 하단 액션(대체상품 확인하기·참여 취소)은 호출부(client)가 action 슬롯으로 주입한다.
// 카드 본문 탭은 onOpenDetail로 받는다. 상태별 이동 경로(수요 상세·낙찰 결과·준비 중)는 호출부가 정한다.
//
// 썸네일은 앱이 서빙하는 경로일 때만 그리고, 아니면 회색 자리를 둔다(외부 URL은 next/image가
// 던진다 — lib/imageSource.ts). AwardResultView·SubstituteOfferView와 같은 방침이다(#229).

interface ParticipationCardProps {
  item: ParticipationItem;
  /** 카드 본문 탭 → 수요 상세(B-12) 진입. 없으면 본문은 비상호작용. */
  onOpenDetail?: () => void;
  /** 상태별 하단 액션(선택). 필터 탭에서만 주입된다. */
  action?: ReactNode;
  /**
   * 첫 화면에 보이는 카드인지. 참이면 썸네일을 지연 로드하지 않는다. 첫 카드 썸네일이 참여 목록 화면의
   * LCP 요소라 지연 로드 대상에서 뺀다. 썸네일은 목록 응답 뒤에 생겨서, Phase 4 측정에서 이 변경만으로는
   * LCP 차이가 없었다.
   */
  isAboveFold?: boolean;
}

export function ParticipationCard({
  item,
  onOpenDetail,
  action,
  isAboveFold = false,
}: ParticipationCardProps) {
  const meta = getParticipationStatusMeta(item.status);

  const body = (
    <>
      <div className="flex w-full gap-3">
        {/* 썸네일(없거나 그릴 수 없으면 회색 자리) + 상태 배지 오버레이 */}
        <div className="relative size-20 shrink-0">
          <div
            aria-hidden
            className="bg-surface-secondary rounded-12 relative size-20 overflow-hidden"
          >
            {isRenderableImageSrc(item.thumbnailUrl) && (
              <Image
                alt=""
                className="object-cover"
                fetchPriority={isAboveFold ? 'high' : undefined}
                fill
                loading={isAboveFold ? 'eager' : undefined}
                sizes="80px"
                src={item.thumbnailUrl}
              />
            )}
          </div>
          <span
            className={cn(
              'text-caption-10 rounded-round absolute top-1 left-1 px-1.5 py-0.5',
              meta.badgeClass,
            )}
          >
            {meta.badgeLabel}
          </span>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-0.5 text-left">
          <div className="flex items-center gap-1.5">
            {item.deadline !== undefined && (
              <ParticipationDeadline
                deadline={item.deadline}
                isAwaitingAward={item.isAwaitingAward}
              />
            )}
            {/* 참여 인원은 보드가 배정된 뒤에만 있다. 아직 보드가 없는 '모이는 중' 수요는 배지 생략. */}
            {item.participantCount !== undefined && (
              <span className="text-caption-10 bg-surface-visibility text-content-visibility rounded-round px-1.5 py-0.5">
                {item.participantCount.toLocaleString('ko-KR')}명 참여
              </span>
            )}
          </div>
          <p className="text-body-15 text-content-primary truncate">{item.productName}</p>
          {/* 규격 요약·수량 부제. 둘 중 있는 것만, 둘 다 있으면 구분자로 잇는다. 둘 다 없으면 생략. */}
          {(item.specSummary !== undefined || item.quantity !== undefined) && (
            <p className="text-caption-12 text-content-quarternary truncate">
              {item.specSummary !== undefined && item.specSummary}
              {item.specSummary !== undefined && item.quantity !== undefined && (
                <>
                  {' '}
                  <span className="text-content-quinary">|</span>{' '}
                </>
              )}
              {item.quantity !== undefined && `수량 : ${item.quantity}개`}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col">
        <p className="text-caption-10 text-content-quarternary">{meta.priceHeading}</p>
        <p className="text-heading-18 text-content-primary">{item.priceLabel}</p>
      </div>
    </>
  );

  return (
    <article className="border-border-subtle rounded-16 bg-background-default flex flex-col gap-3 border p-3">
      {onOpenDetail !== undefined ? (
        <button
          type="button"
          onClick={onOpenDetail}
          className="focus-visible:ring-effect-focus-ring-primary flex w-full flex-col gap-3 rounded-sm text-left outline-none focus-visible:ring-2"
        >
          {body}
        </button>
      ) : (
        <div className="flex w-full flex-col gap-3">{body}</div>
      )}

      {action}
    </article>
  );
}
