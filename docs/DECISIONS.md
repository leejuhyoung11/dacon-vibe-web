# DECISIONS

기술 선택, 구조 결정, 라이브러리 선택 등의 판단 근거를 기록한다.

---

## Next.js 14 App Router 선택
- **선택**: React 프레임워크로 Next.js 14 App Router 사용
- **이유**: Vercel 배포 필수 조건 → Next.js + Vercel은 zero-config 최적 조합. SSG/SSR 지원, 파일 기반 라우팅으로 5개 라우트 구조에 적합
- **날짜**: 2026-03-22

---

## localStorage 전용 데이터 레이어
- **선택**: 서버·DB 없이 localStorage만 사용
- **이유**: 대회 명세서에 "더미 데이터/로컬 저장소(localStorage 등)를 활용해 구현" 명시. 심사자가 별도 키 없이 확인 가능해야 하므로 외부 의존성 최소화
- **날짜**: 2026-03-22

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
- **선택**: `data/example/*.json`을 `web/src/lib/seed.ts`에 인라인 TypeScript 상수로 복사
- **이유**: Next.js App Router에서 `public/` 외 JSON 파일을 클라이언트에서 직접 fetch하려면 추가 설정 필요. 인라인으로 두면 빌드 타임에 포함되고 localStorage 시드 로직과 타입 안전성 보장
- **날짜**: 2026-03-22

---

## web/ 서브디렉토리 구조
- **선택**: 레포 루트(`dacon_vibe/`)가 아닌 `web/` 서브디렉토리에 Next.js 앱 생성
- **이유**: `create-next-app`이 기존 파일(`CLAUDE.md`, `data/`)과 충돌하여 서브디렉토리에 생성. GitHub repo는 `web/`을 root로 push. Vercel도 root directory 자동 감지
- **날짜**: 2026-03-22

---

## SeedInitializer 분리 컴포넌트
- **선택**: seed 로직을 `layout.tsx` 안 `"use client"` 컴포넌트로 분리
- **이유**: App Router에서 layout.tsx는 서버 컴포넌트. localStorage 접근은 클라이언트 전용이므로 별도 `SeedInitializer` 클라이언트 컴포넌트로 분리 후 layout에서 import
- **날짜**: 2026-03-22

---

## 글로벌 랭킹 단순 점수 정렬 (임시 결정)
- **선택**: 모든 해커톤의 leaderboard entries를 score 내림차순으로 단순 정렬
- **이유**: 빠른 구현 우선. metric 타입(0~1 범위)과 vote 타입(0~100 범위)의 단위가 달라 점수 비교가 부정확한 문제가 있음 → TODO로 분류, 추후 정규화 필요
- **날짜**: 2026-03-22
