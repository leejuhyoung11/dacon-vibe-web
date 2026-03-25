# DECISIONS

기술 선택, 구조 결정, 라이브러리 선택 등의 판단 근거를 기록한다.

---

## Next.js 14 App Router 선택
- **선택**: React 프레임워크로 Next.js 14 App Router 사용
- **이유**: Vercel 배포 필수 조건 → Next.js + Vercel은 zero-config 최적 조합. SSG/SSR 지원, 파일 기반 라우팅으로 5개 라우트 구조에 적합
- **날짜**: 2026-03-22

---

## Supabase 선택 (localStorage → PostgreSQL)
- **선택**: 데이터 레이어를 localStorage에서 Supabase(PostgreSQL + Auth)로 전환
- **이유**: Vercel 배포 후 다른 브라우저/기기 간 데이터 공유 불가 → Supabase는 무료 티어 + Next.js SSR 공식 지원(`@supabase/ssr`) + 내장 Auth로 단일 서비스 커버
- **트레이드오프**: JSONB 패턴으로 타입 전체를 JSON 컬럼 1개에 저장 → 스키마 마이그레이션 없이 유연한 타입 변경 가능하지만 DB 레벨 쿼리·인덱싱 제한
- **날짜**: 2026-03-25

---

## SSR-safe Supabase 클라이언트 (typeof window 가드)
- **선택**: `supabase.ts`에서 `typeof window === "undefined"` 체크 후 `undefined` 반환
- **이유**: `createBrowserClient`는 URL validation을 즉시 실행 → 서버 빌드 타임에 `NEXT_PUBLIC_SUPABASE_URL` 없으면 "Must be a valid HTTP or HTTPS URL" 에러 발생. `typeof window` 가드로 클라이언트 전용 실행 보장
- **트레이드오프**: 서버 컴포넌트에서 `supabase`를 직접 사용 불가 (현재 모든 DB 호출이 클라이언트 컴포넌트라 문제 없음)
- **날짜**: 2026-03-25

---

## Google OAuth 팝업 방식
- **선택**: `skipBrowserRedirect: true` + `window.open()` 팝업으로 로그인
- **이유**: 전체 페이지 이동 시 현재 스크롤·상태가 초기화됨. 팝업은 부모 창 상태 유지하면서 인증 완료 후 자동 닫힘
- **세션 전파 방식**: 콜백을 server Route Handler(`route.ts`) 대신 client page(`page.tsx`)로 구현 → `exchangeCodeForSession` 클라이언트 실행 → Supabase가 localStorage에 세션 저장 → storage 이벤트로 부모 창 `onAuthStateChange` 자동 트리거 → 새로고침 없이 Navbar 상태 갱신
- **날짜**: 2026-03-25

---

## Tailwind CSS + shadcn/ui 조합
- **선택**: 스타일링에 Tailwind CSS, UI 컴포넌트에 shadcn/ui (Button·Badge·Tabs)
- **이유**: 빠른 프로토타입에 최적. shadcn/ui는 radix-ui 기반으로 접근성 보장, 복사 방식이라 번들 최소화. Tabs 컴포넌트는 해커톤 상세 탭 7개 구현에 직접 사용
- **날짜**: 2026-03-22

---

## lime/green 컬러 테마
- **선택**: daker.ai 파랑(blue-500)과 동일 명도·채도의 lime-600 기반 green 테마
- **이유**: 사용자 지시 — "연두색에서 초록색 사이, 이 파랑색과 비슷한 명도·채도". oklch 색공간에서 hue만 변환하여 통일된 채도/명도 유지
- **날짜**: 2026-03-22

---

## seed.ts 인라인 더미 데이터
- **선택**: `data/example/*.json`을 `web/src/lib/seed.ts`에 인라인 TypeScript 상수로 보관, 실제 DB 시드는 `web/supabase/schema.sql` SQL INSERT
- **이유**: seed.ts는 타입 참조용으로 유지. 실제 Supabase DB 시드는 schema.sql의 `on conflict do nothing` INSERT로 한 번만 실행
- **날짜**: 2026-03-25 (변경), 2026-03-22 (최초)

---

## web/ 서브디렉토리 구조
- **선택**: 레포 루트(`dacon_vibe/`)가 아닌 `web/` 서브디렉토리에 Next.js 앱 생성
- **이유**: `create-next-app`이 기존 파일(`CLAUDE.md`, `data/`)과 충돌하여 서브디렉토리에 생성. GitHub repo는 `web/`을 root로 push. Vercel도 root directory 자동 감지
- **날짜**: 2026-03-22

---

## 글로벌 랭킹 단순 점수 정렬 (임시 결정)
- **선택**: 모든 해커톤의 leaderboard entries를 score 내림차순으로 단순 정렬
- **이유**: 빠른 구현 우선. metric 타입(0~1 범위)과 vote 타입(0~100 범위)의 단위가 달라 점수 비교가 부정확한 문제가 있음 → TODO로 분류, 추후 정규화 필요
- **날짜**: 2026-03-22
