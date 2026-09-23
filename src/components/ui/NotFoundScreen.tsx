import { ERROR_ACTION_CLASS, ErrorScreen } from '@/components/ui/ErrorScreen';
import { GoBackButton } from '@/components/ui/GoBackButton';
import { ERROR_SCREEN_RETRY_LABEL } from '@/constants/commonMessages';

// 404 본문. 라우트 404(not-found.tsx)와, client에서 조회해 보고서야 없는 줄 아는 화면이 같은
// 모양을 쓴다. 후자는 세션 쿠키가 필요해 client에서 조회하므로 `notFound()`로 not-found.tsx를
// 부를 수 없어 이 컴포넌트를 직접 그린다.
//
// 문구·버튼 동작의 근거는 not-found.tsx 주석을 따른다. 부모 셸(높이)은 호출부가 씌운다.
//
// fallbackHref: 주소를 직접 입력해 들어온 경우 뒤로 갈 곳이 없어 버튼이 아무 일도 하지 않는다
// (`GoBackButton` 주석). 링크로 공유되는 주소는 여기에 갈 곳을 준다.

interface NotFoundScreenProps {
  /** 돌아갈 히스토리가 없을 때 이동할 경로. 생략 시 항상 뒤로 가기. */
  fallbackHref?: string;
}

export function NotFoundScreen({ fallbackHref }: NotFoundScreenProps) {
  return (
    <ErrorScreen>
      <GoBackButton className={ERROR_ACTION_CLASS} fallbackHref={fallbackHref}>
        {ERROR_SCREEN_RETRY_LABEL}
      </GoBackButton>
    </ErrorScreen>
  );
}
