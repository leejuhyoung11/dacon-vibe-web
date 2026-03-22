# DESIGN

## 컬러 시스템

전체 테마는 **lime-600 기반**, daker.ai 파랑(blue-500)과 동일 명도·채도의 green 계열로 변환.

| 역할 | Tailwind 클래스 | oklch (globals.css) |
|------|----------------|---------------------|
| Primary (메인 액션) | `lime-600` | `oklch(0.52 0.17 135)` |
| Primary Light | `lime-500` | — |
| Primary Bright (CTA) | `lime-400` | — |
| Background | `lime-50 틴트` | `oklch(0.99 0.008 120)` |
| 다크모드 Primary | `lime-400 영역` | `oklch(0.72 0.18 135)` |

### 상태(Status) 색상

| 상태 | 색 | 클래스 |
|------|----|--------|
| 진행중 (ongoing) | 초록 | `bg-green-500` |
| 예정 (upcoming) | 연두 | `bg-lime-400` |
| 종료 (ended) | 회색 | `bg-gray-400` |
| 마일스톤 current | 황색 | `bg-amber-400`, `text-amber-500` |
| 공지 박스 | 황색 border | `border-amber-200 bg-amber-50` |

### 메달 색상 (랭킹)

1위 `text-yellow-500` · 2위 `text-gray-400` · 3위 `text-amber-600`

---

## 컴포넌트 패턴

### 카드
```
rounded-xl border border-border bg-card p-6
```

### 버튼 — Primary
```
rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity
```

### 버튼 — Secondary (outline)
```
rounded-lg border border-white/30 px-6 py-3 font-semibold text-white hover:bg-white/10 transition-colors
```

### 입력 (input · select · textarea)
```
rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring
```

### 테이블
```
rounded-xl border border-border overflow-hidden
thead: bg-muted/40
상위 3행 highlight: bg-primary/5
hover: hover:bg-muted/30
```

### 배지 (Badge)
- 태그: `variant="outline"` + `text-xs`
- 상태: `variant="default"` + 색상 override (`bg-green-500 text-white`)
- 마감: `variant="secondary"`

---

## 네이밍 패턴

### 파일·컴포넌트
| 종류 | 패턴 | 예시 |
|------|------|------|
| 페이지 컴포넌트 | `XxxPage` | `HackathonsPage`, `CampPage` |
| UI 컴포넌트 | `XxxTable`, `XxxItem`, `XxxTimeline` | `LeaderboardTable`, `HackathonListItem` |
| 헬퍼 함수 (내부) | camelCase | `getDday`, `getMilestoneStatus` |

### localStorage 키
```
hackathons · hackathon_details · teams · leaderboards · submissions · __seeded__
```

### storage.ts 함수
| 동작 | 패턴 |
|------|------|
| 읽기 | `getXxx()` |
| 쓰기 | `addXxx()`, `updateXxx()` |
| 초기화 | `seedData()`, `isSeeded()`, `markSeeded()` |

### slug 규칙
- kebab-case + 날짜 suffix: `monthly-vibe-coding-2026-02`
- 해커톤명 약어 가능: `aimers-8-model-lite`

---

## 레이아웃 규칙

- 최대 너비: `max-w-6xl` (모든 페이지 공통)
- 수평 패딩: `px-4`
- Navbar 높이: `h-14`, `sticky top-0 z-50`
- 히어로 최소 높이: `min-h-[560px]` (메인), `py-14` (목록)
