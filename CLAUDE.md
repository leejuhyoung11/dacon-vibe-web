# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 요약

"긴급 인수인계 해커톤(daker-handover-2026-03)" 참가작 — 제공된 명세서와 예시 데이터를 기반으로 해커톤 관리 플랫폼을 구현하는 웹서비스.

## 구조 규칙

- UI 구조는 `Hackathon-UI-Flow.png` 다이어그램을 따른다
- 기능 명세는 `memo.png` 기준
- 더미 데이터는 `data/example/*.json` 활용 (별도 API 없음)
- 데이터 저장은 **localStorage** 만 사용 (서버/DB 없음)

## 기술 스택

Next.js 14 App Router · TypeScript · Tailwind CSS · shadcn/ui · lucide-react · Vercel 배포

## 주요 경로

| 라우트 | 역할 |
|--------|------|
| `/` | 메인 (히어로 + 통계) |
| `/hackathons` | 해커톤 목록 + 필터 |
| `/hackathons/[slug]` | 해커톤 상세 (탭 7개) |
| `/camp` | 팀 모집 · 생성 |
| `/rankings` | 글로벌 랭킹 |

## 데이터 레이어

- `src/lib/types.ts` — 전체 타입 정의
- `src/lib/storage.ts` — localStorage CRUD (`getXxx`, `addXxx`, `updateXxx`)
- `src/lib/seed.ts` — 초기 더미 데이터 (최초 실행 시 자동 주입)

## 개발 명령

```bash
npm run dev     # localhost:3000
npm run build   # 프로덕션 빌드 확인
```

Node.js 위치: `/Users/juhyoung/Library/Application Support/com.raycast.macos/NodeJS/runtime/22.14.0/bin/node`

## 작업 규칙

모든 작업 완료 후 반드시 아래 문서를 갱신할 것:

| 문서 | 갱신 조건 |
|------|----------|
| `docs/CHANGELOG.md` | 기능 추가·버그 수정·배포 등 모든 작업 완료 시 |
| `docs/PROGRESS.md` | 완성 항목 체크, 새 TODO 추가 시 |
| `docs/DECISIONS.md` | 기술 선택·구조 결정이 새로 발생했을 때 |
| `docs/research.md` | 대화에서 기획 방향이 결정되었을 때 |

## 문서

- [docs/PROGRESS.md](docs/PROGRESS.md) — 완성·미완성·TODO
- [docs/DESIGN.md](docs/DESIGN.md) — 컬러·컴포넌트·네이밍 규칙
- [docs/TEAM.md](docs/TEAM.md) — 역할 분담·커밋 규칙
- [docs/research.md](docs/research.md) — 대화 기반 기획 누적 메모
- [docs/CHANGELOG.md](docs/CHANGELOG.md) — 날짜별 작업 기록
- [docs/DECISIONS.md](docs/DECISIONS.md) — 기술 결정 근거
