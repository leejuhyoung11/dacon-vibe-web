# CHANGELOG

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
