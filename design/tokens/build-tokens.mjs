/**
 * Figma Variables(DTCG JSON) -> Tailwind CSS v4 변수 생성기
 *
 *   node design/tokens/build-tokens.mjs
 *
 * 입력은 `design/tokens/raw/`, 출력은 `src/app/globals.css`입니다.
 * 생성 후 `npm run format`으로 정렬합니다(커밋 시 lint-staged가 자동으로도 처리합니다).
 *
 * ## 이름을 두 층으로 나누는 이유
 *
 * 모드가 갈리는 토큰(semantic)은 아래처럼 **이름을 분리**해야 합니다.
 *
 *   1층  :root / .dark        --content-primary: #0a0a0a
 *   2층  @theme inline        --color-content-primary: var(--content-primary)
 *
 * 한 층으로 합쳐서 `@theme inline`과 `.dark`가 같은 이름을 쓰면, 유틸리티에 라이트 값이
 * 그대로 박혀 다크모드가 동작하지 않습니다. 실제로 컴파일해 확인한 사실입니다.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const RAW = join(HERE, 'raw');
const OUT = join(HERE, '..', '..', 'src', 'app', 'globals.css');

/** Pretendard는 CDN에서 받습니다. 폰트를 자체 호스팅하게 되면 이 줄을 교체합니다. */
const FONT_CDN =
  "@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.css');";

const FONT_FALLBACK = [
  '-apple-system',
  'BlinkMacSystemFont',
  'system-ui',
  'Roboto',
  "'Helvetica Neue'",
  "'Segoe UI'",
  "'Apple SD Gothic Neo'",
  "'Noto Sans KR'",
  "'Malgun Gothic'",
  'sans-serif',
];

const read = (path) => JSON.parse(readFileSync(path, 'utf8'));

/** DTCG 트리를 `{ 'a/b/c': 노드 }`로 평탄화합니다. */
function flatten(node, path = [], out = {}) {
  if (node && typeof node === 'object') {
    if ('$value' in node) {
      out[path.join('/')] = node;
    } else {
      for (const [key, value] of Object.entries(node)) {
        if (key.startsWith('$')) continue;
        flatten(value, [...path, key], out);
      }
    }
  }
  return out;
}

/** `{ hex, alpha }` -> CSS 색. 알파가 1 미만이면 8자리 hex로 씁니다. */
function toCssColor(value) {
  if (typeof value !== 'object' || value === null) return String(value);
  const hex = (value.hex ?? '#000000').toLowerCase();
  const alpha = value.alpha ?? 1;
  if (alpha >= 1) return hex;
  return `${hex}${Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0')}`;
}

/**
 * Figma 토큰 경로 -> CSS 변수 조각.
 * `-p` 접미사는 램프의 primary 표시일 뿐이라 벗깁니다(`brand/400-p` -> `brand-400`).
 */
function slug(path) {
  return path.split('/').join('-').replace(/-p$/, '').toLowerCase();
}

/** `opacity/brand/400-A10` -> `brand-a10` */
function opacitySlug(path) {
  const matched = path.match(/^opacity\/([^/]+)\/\d+-A(\d+)$/);
  return matched ? `${matched[1]}-a${matched[2]}` : slug(path);
}

/** `raw/` 안에서 접두 번호로 컬렉션 폴더를 찾습니다. 없으면 `null`. */
function collection(prefix) {
  const found = readdirSync(RAW).find((name) => name.startsWith(prefix));
  return found ? join(RAW, found) : null;
}

/** 폴더 안의 특정 파일을 읽어 평탄화합니다. 파일이 없으면 `null`. */
function loadFlat(dir, fileName) {
  if (!dir) return null;
  const path = fileName
    ? join(dir, fileName)
    : join(
        dir,
        readdirSync(dir).find((name) => name.endsWith('.json')),
      );
  return existsSync(path) ? flatten(read(path)) : null;
}

// ── 입력 ────────────────────────────────────────────────────────────────
const primitives = loadFlat(collection('01'));
const semanticLight = loadFlat(collection('02'), 'light.tokens.json');
const semanticDark = loadFlat(collection('02'), 'dark.tokens.json');
const numbers = loadFlat(collection('04'));
const typography = loadFlat(collection('05'));
const responsive = loadFlat(collection('06'));

// component 컬렉션(03)은 단일 모드(Mode 1)로 도착했습니다. 배지 표면색은 모드에 안 갈리는
// 고정 틴트(대부분 primitive A20 별칭)라 semantic처럼 light/dark로 분기하지 않고,
// primitive와 같은 mode-agnostic @theme 블록에 출력합니다.
const component = loadFlat(collection('03'));

/** 모드가 갈리는 토큰(semantic). */
const modedLight = semanticLight;
const modedDark = semanticDark;
const modedKeys = Object.keys(modedLight).sort();

/** `number` 컬렉션의 `{number-reference-value.16}` 별칭을 실제 값으로 풉니다. */
function numberValue(key) {
  const value = numbers[key]?.$value;
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.startsWith('{')) {
    return numbers[value.slice(1, -1).replace(/\./g, '/')]?.$value;
  }
  return undefined;
}

// ── 출력 ────────────────────────────────────────────────────────────────
const lines = [];
const write = (text = '') => lines.push(text);

write('/* design/tokens/build-tokens.mjs가 생성한 파일입니다. 직접 수정하지 마세요. */');
write('/* 값을 바꾸려면 design/tokens/raw/의 JSON을 교체하고 생성기를 다시 돌립니다. */');
write(FONT_CDN);
write("@import 'tailwindcss';");
write("@source '../**/*.{ts,tsx}';");
write();
write('/* 다크모드 전환 방식이 확정되기 전이라 클래스와 data-theme을 모두 받습니다. */');
write(
  "@custom-variant dark (&:where(.dark, .dark *, [data-theme='dark'], [data-theme='dark'] *));",
);
write();

const emitModed = (table, indent = '  ') =>
  modedKeys.map((key) => `${indent}--${slug(key)}: ${toCssColor(table[key].$value)};`).join('\n');

write('/* ── 1층: 모드가 갈리는 값. 이름을 2층과 분리해야 다크모드가 동작합니다 ── */');
write(':root {');
write('  /* 네이티브 요소(폼 컨트롤·스크롤바·자동완성 등)도 테마를 따르게 한다 */');
write('  color-scheme: light;');
write(emitModed(modedLight));
write('}');
write();
write('/* 기기 설정이 다크일 때. data-theme으로 라이트를 명시한 경우는 제외합니다. */');
write('@media (prefers-color-scheme: dark) {');
write("  :root:not([data-theme='light']) {");
write('    color-scheme: dark;');
write(emitModed(modedDark, '    '));
write('  }');
write('}');
write();
write('/* 사용자가 직접 다크를 고른 경우. 기기 설정보다 우선합니다. */');
write(".dark,\n[data-theme='dark'] {");
write('  color-scheme: dark;');
write(emitModed(modedDark));
write('}');
write();
write('/* ── 2층: Tailwind 배선. inline이라 유틸리티가 var()를 그대로 참조합니다 ── */');
write('@theme inline {');
for (const key of modedKeys) write(`  --color-${slug(key)}: var(--${slug(key)});`);
write('}');
write();

write('/* ── 모드와 무관한 값 ── */');
write('@theme {');
write('  /* color primitives */');
for (const key of Object.keys(primitives).sort()) {
  if (key.startsWith('opacity/')) continue;
  write(`  --color-${slug(key)}: ${toCssColor(primitives[key].$value)};`);
}
write();
write('  /* color primitives: 알파 변형 */');
for (const key of Object.keys(primitives).sort()) {
  if (!key.startsWith('opacity/')) continue;
  write(`  --color-${opacitySlug(key)}: ${toCssColor(primitives[key].$value)};`);
}
if (component) {
  write();
  write('  /* component: badge 표면색 (모드 무관, 대부분 primitive A20 별칭) */');
  for (const key of Object.keys(component)) {
    write(`  --color-${slug(key)}: ${toCssColor(component[key].$value)};`);
  }
}
write();
write('  /* radius */');
for (const key of Object.keys(numbers)) {
  if (!key.startsWith('radius/')) continue;
  write(`  --radius-${key.split('/')[1].replace(/^radius-/, '')}: ${numberValue(key)}px;`);
}
write();
write('  /* 모바일 기준 디자인 폭 */');
write(`  --container-mobile: ${responsive['responsive-size'].$value}px;`);
write();
// 아래 세 값만 raw가 아니라 생성기에 박습니다. responsive 내보내기에 `Mobile` 모드의
// `responsive-size: 393` 하나뿐이고, 태블릿 834 · 웹 1440 · 컨테이너 1200은 디자인 파트에서
// 문서로 전달받았습니다(Figma Variable에 Tablet/Web 모드가 아직 없습니다). 모드가 추가되면
// 위 `--container-mobile`과 같은 방식으로 raw에서 읽도록 바꿉니다.
//
// 좌우 여백은 새 토큰을 만들지 않습니다. 전달값 16 · 32 · 120이 Tailwind 기본 스케일의
// `px-4` · `px-8` · `px-30`으로 그대로 나옵니다.
write('  /* 반응형 기준폭. Tailwind가 이 이름에서 tablet: · web: 변형을 만듭니다 */');
write('  --breakpoint-tablet: 834px;');
write('  --breakpoint-web: 1440px;');
write();
// ⚠️ `--container-mobile`과 뜻이 다릅니다. 모바일은 **화면 폭**(393)이라 `max-w-mobile`이 앱
//    셸 전체를 가운데로 모으는 데 쓰이고, 웹은 **본문 폭**(1200)이라 배경은 화면 전체로 두고
//    안쪽 본문 래퍼에만 씁니다. 이름이 나란해 보여도 적용 지점이 다릅니다.
//
//    태블릿 컨테이너 폭은 넣지 않았습니다. 전달받은 값이 화면 폭 834와 여백 32뿐이고 본문 폭은
//    문서에 없습니다. 필요해지면 그때 디자인에 확인하고 한 줄 추가합니다.
write('  /* 웹 본문 컨테이너 폭(화면 1440 - 좌우 여백 120씩) */');
write('  --container-web: 1200px;');
write();
write('  /* font family. CDN이 제공하는 이름은 Pretendard Variable입니다 */');
const family = typography['font-family/pretendard'].$value;
write(`  --font-sans: '${family} Variable', ${family}, ${FONT_FALLBACK.join(', ')};`);
write();
write('  /* typography: 크기 · 행간 · 굵기를 한 유틸리티로 묶습니다 */');
const sizeKeys = Object.keys(typography)
  .filter((key) => key.startsWith('font-size/'))
  .sort();
for (const sizeKey of sizeKeys) {
  const rest = sizeKey.slice('font-size/'.length); // heading/heading-24
  const name = rest.split('/').pop(); // heading-24
  write(`  --text-${name}: ${typography[sizeKey].$value}px;`);
  const lineHeight = typography[`line-height/${rest}`]?.$value;
  const weight = typography[`font-weight/${rest}`]?.$value;
  if (lineHeight !== undefined) write(`  --text-${name}--line-height: ${lineHeight}px;`);
  if (weight !== undefined) write(`  --text-${name}--font-weight: ${weight};`);
}
write('}');
write();
write('/* number 컬렉션의 값은 전부 4의 배수라 Tailwind 기본 spacing과 그대로 맞습니다. */');
write('/* 예: 디자인 gap-16 -> gap-4 · height-44 -> h-11 · margin/default 16 -> p-4 */');
write(
  '/* --spacing-*를 새로 만들지 않는 이유는 기본 스케일을 덮으면 p-16을 64px로 오해하기 때문입니다. */',
);
write();
write('body {');
write('  background: var(--background-default);');
write('  color: var(--content-primary);');
write('  font-family: var(--font-sans);');
write('}');

writeFileSync(OUT, lines.join('\n') + '\n');

const count = (table, filter = () => true) => Object.keys(table).filter(filter).length;
console.log(`생성 완료: src/app/globals.css`);
console.log(`  모드 전환  ${modedKeys.length}개 x 2모드 (semantic ${count(semanticLight)})`);
console.log(
  `  primitives ${count(primitives, (k) => !k.startsWith('opacity/'))}개 + 알파 ${count(primitives, (k) => k.startsWith('opacity/'))}개`,
);
console.log(`  component ${count(component ?? {})}개 (badge 표면색, 모드 무관)`);
console.log(
  `  radius ${count(numbers, (k) => k.startsWith('radius/'))}개 · typography ${sizeKeys.length}개`,
);
