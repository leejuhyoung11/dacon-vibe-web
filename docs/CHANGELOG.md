# CHANGELOG

## 2026-03-25

### Supabase 연동 (localStorage → PostgreSQL)
- `@supabase/supabase-js` + `@supabase/ssr` 패키지 설치
- `src/lib/supabase.ts` 신규 — SSR-safe 브라우저 클라이언트 (`typeof window` 가드로 빌드 타임 URL validation 오류 방지)
- `src/lib/storage.ts` 전면 교체 — 모든 함수 `async`, Supabase JSONB 쿼리로 변경 (함수 시그니처 유지)
- `src/components/layout/SeedInitializer.tsx` — stub으로 단순화 (시드는 `supabase/schema.sql` SQL INSERT로 이관)
- `web/supabase/schema.sql` 신규 — DDL + RLS 정책 + 전체 시드 데이터 (hackathons 3, teams 4, leaderboards 2)
- `.env.local` — `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 추가

### Google OAuth 팝업 로그인
- `src/lib/auth.ts` 신규 — `signInWithGoogle()` / `signOut()` / `getSession()` 헬퍼
  - `skipBrowserRedirect: true` + `window.open()` 팝업 방식
  - `queryParams: { prompt: "select_account" }` — 항상 계정 선택 강제
  - 팝업 닫힘 감지 후 `supabase.auth.getSession()` 호출
- `src/app/auth/callback/page.tsx` 신규 (이전 `route.ts` 삭제)
  - 클라이언트 컴포넌트로 OAuth code 교환 → localStorage에 세션 저장 → `window.close()`
  - `onAuthStateChange`가 부모 창에서 자동 트리거되어 새로고침 없이 로그인 상태 반영
  - `fixed inset-0 bg-background z-[9999]` 오버레이로 팝업에서 레이아웃 flash 방지
- GitHub 로그인 제거 (Google 단독)

### Navbar 개선
- 링크 구조: 메인 / 해커톤 / 캠프 / 랭킹 (4개)
- 현재 페이지 `bg-primary text-primary-foreground shadow-sm` 색깔 박스 active 표시
- 글씨 크기 키우고 `font-bold` 적용
- 로그인 버튼 추가, 로그인 시 이니셜 동그라미 아이콘만 표시 (이메일 텍스트 제거)
- 로그아웃 시 `window.location.reload()` 새로고침

### 로딩·에러·빈 상태
- 모든 페이지(`/`, `/hackathons`, `/hackathons/[slug]`, `/camp`, `/rankings`)에 `status: "loading" | "loaded" | "error"` 패턴 적용
- 로딩 중: "로딩중..." / 에러: "데이터를 불러오는 중 오류가 발생했습니다." / 데이터 없음: "데이터 없음" 표시

### 인증 게이트
- `/camp` — 비로그인 시 상단 Google 로그인 배너 표시, 팀 만들기 버튼 비활성
- `/hackathons/[slug]` 제출 탭 — 비로그인 시 로그인 유도 메시지

---

## 2026-03-22

- Next.js 14 App Router 프로젝트 초기 세팅 (`web/`)
- Tailwind CSS + shadcn/ui + lucide-react 설치
- `src/lib/types.ts` — Hackathon · HackathonDetail · Team · Leaderboard · Submission TypeScript 타입 정의
- `src/lib/storage.ts` — localStorage CRUD 유틸 (get/set/seed/isSeeded)
- `src/lib/seed.ts` — 예시 JSON 기반 더미 데이터 인라인화 (해커톤 3개, 팀 4개, 리더보드 2개)
- `SeedInitializer` 클라이언트 컴포넌트로 앱 최초 실행 시 자동 시드
- `Navbar` — 로고 + 해커톤 목록 + 랭킹 2개 링크 + 다크모드 토글
- `/` 메인 페이지 — lime 그라디언트 히어로 + 통계 카드 3개 (daker.ai 구조 참고)
- `/hackathons` — dacon.io/competitions 구조: 히어로 + 필터 탭 + 수평 리스트
- `/hackathons/[slug]` — 탭 7개 (개요·평가·일정·상금·팀·제출·리더보드)
- `MilestoneTimeline` — done·current·upcoming 상태별 세로 타임라인
- `LeaderboardTable` — scoreBreakdown·artifacts 조건부 렌더링
- `/camp` — 팀 목록 그리드 + 팀 생성 폼 + 필터 (해커톤·모집중·역할)
- `/rankings` — 전체 leaderboard 통합 글로벌 순위 테이블
- lime/green 테마 시스템 CSS custom properties 적용 (globals.css)
- 히어로 `overflow-hidden` 제거 → 통계 카드 클리핑 버그 수정
- GitHub 연동: https://github.com/leejuhyoung11/dacon-vibe-web
- Vercel 배포: https://vercel.com/leejuhyoung11s-projects/dacon-vibe-web
- 프로젝트 문서화: CLAUDE.md · docs/PROGRESS · DESIGN · TEAM · research · CHANGELOG · DECISIONS
