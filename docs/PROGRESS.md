# PROGRESS

## ✅ 완성

| 항목 | 파일 |
|------|------|
| 라우트 5개 구현 (`/` · `/hackathons` · `/hackathons/[slug]` · `/camp` · `/rankings`) | `web/src/app/` |
| localStorage 데이터 레이어 | `web/src/lib/storage.ts` |
| 앱 최초 실행 시 더미 데이터 자동 시드 | `web/src/lib/seed.ts` |
| TypeScript 타입 정의 (Hackathon · Team · Leaderboard · Submission) | `web/src/lib/types.ts` |
| 해커톤 상세 탭 7개 (개요·평가·일정·상금·팀·제출·리더보드) | `web/src/app/hackathons/[slug]/page.tsx` |
| 마일스톤 세로 타임라인 (done·current·upcoming 상태) | `MilestoneTimeline.tsx` |
| 리더보드 테이블 (scoreBreakdown·artifacts 조건부 렌더링) | `LeaderboardTable.tsx` |
| 팀 목록 · 팀 생성 폼 · 필터 | `web/src/app/camp/page.tsx` |
| 글로벌 랭킹 테이블 | `web/src/app/rankings/page.tsx` |
| 다크모드 토글 (localStorage 기반) | `Navbar.tsx` |
| lime/green 테마 시스템 (CSS custom properties) | `globals.css` |
| Vercel 배포 | https://vercel.com/leejuhyoung11s-projects/dacon-vibe-web |
| GitHub 연동 | https://github.com/leejuhyoung11/dacon-vibe-web |

---

## ⚠️ 미완성 / 버그

| 항목 | 위치 | 내용 |
|------|------|------|
| 제출 teamName 하드코딩 | `[slug]/page.tsx:54` | `teamName: "나의 팀"` — 사용자 입력 없음 |
| 글로벌 랭킹 점수 단위 불일치 | `rankings/page.tsx` | metric(0.7421)과 vote(87.5)를 동일 기준으로 정렬 |
| 제출 후 리더보드 미반영 | `[slug]/page.tsx` | `addSubmission` 호출 후 `updateLeaderboard` 미연결 |
| 팀 memberCount 고정 | `camp/page.tsx:42` | 새 팀 생성 시 항상 1, 이후 변경 불가 |
| 팀 수정·삭제 기능 없음 | `camp/page.tsx` | 생성만 가능 |
| 썸네일 placeholder | `seed.ts` | `placehold.co` 더미 URL 사용 중 |
| "참여 방법 알아보기" 버튼 미동작 | `hackathons/page.tsx:45` | 클릭 이벤트 없음 |
| 메인 페이지 하단 섹션 없음 | `app/page.tsx` | daker.ai 레퍼런스처럼 Features 섹션 등 추가 여지 |

---

## 📋 TODO (우선순위 순)

1. **제출 → 리더보드 연동**: 제출 완료 시 해당 hackathon의 leaderboard entry 추가
2. **사용자 식별**: 팀명 직접 입력 또는 간단한 닉네임 저장
3. **글로벌 랭킹 정규화**: 해커톤 타입(metric/vote)별 점수 분리 표시
4. **메인 페이지 확장**: Features 섹션, 진행 중 해커톤 카드 미리보기
5. **팀 수정/삭제**: camp 페이지에서 자신이 만든 팀 관리
6. **실제 썸네일**: placeholder 대신 각 해커톤에 맞는 이미지
7. **UX 개선 논의**: research.md 참고
