import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /**
   * 컨테이너 이미지용 최소 산출물. `next build`가 `.next/standalone`에 실행에 필요한 파일만
   * 모아 주므로 런타임 단계에서 `npm install`을 하지 않는다.
   *
   * ⚠️ `public`과 `.next/static`은 자동으로 들어가지 않는다. 손으로 복사해야 `server.js`가
   *    그 둘을 서빙한다(Next 문서 `output` 항목). 복사는 Dockerfile이 한다.
   */
  output: 'standalone',

  /**
   * sharp를 산출물에 강제로 포함한다.
   *
   * `next/image`의 자체 최적화는 sharp를 런타임에 불러오는데, 정적 분석으로는 그 의존이
   * 잡히지 않아 standalone에서 빠질 수 있다. 빠지면 이미지 최적화가 런타임에 실패한다.
   * Next 문서가 네이티브 자산의 공통 패턴으로 이 설정을 제시한다.
   */
  outputFileTracingIncludes: {
    '/*': ['node_modules/sharp/**/*'],
  },

  images: {
    /**
     * 변환할 이미지 폭을 실제 사용처로 좁힌다.
     *
     * 자체 호스팅에서 `next/image`는 요청된 (원본, 폭, 품질) 조합마다 Node 프로세스 안의
     * sharp로 변환하고 그 결과를 캐시한다. 기본값은 `deviceSizes` 8종 + `imageSizes` 8종이라
     * 쓰이지도 않는 크기까지 변환·캐시될 수 있다. 이 앱은 모바일 전용 시안(`max-w-mobile`
     * 393px)이고 컴포넌트가 `sizes`를 고정값으로 넘기므로 필요한 폭이 정해져 있다.
     *
     * 값의 근거는 각 이미지의 표시 폭과 그 2배(레티나)다. 표시 폭은 `sizes="NNNpx"`(홈 카드류)
     * 와 고정 `width={NNN}`(일러스트·미리보기류) 두 형태로 나타나므로 둘 다 넣었다.
     *
     *   배너 393 · 스플래쉬 마스코트 342 · 판매자 미리보기 336 · 브랜드딜 260 · 빈 상태 246
     *   결제수단 160 · 상품카드 121 · 와이드 120 · 브랜드행 106 · 행 65 · 주문 60 · 오류 123
     *
     * 목록에 없는 폭을 요청하면 그보다 큰 값으로 올림된다. 원본보다 큰 값으로 올라가면
     * 확대가 일어나므로, 새 화면을 만들 때 표시 폭이 늘면 여기에도 추가한다.
     */
    deviceSizes: [393, 786],
    imageSizes: [60, 65, 106, 121, 130, 160, 212, 242, 260, 320, 336, 342, 492, 520, 672, 684],

    /**
     * 변환 결과 캐시 수명. 목 이미지는 파일명이 바뀌지 않으면 내용도 안 바뀌고, 실제 데이터는
     * 업로드마다 URL이 달라진다. 짧게 잡을 이유가 없다.
     */
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
};

export default nextConfig;
