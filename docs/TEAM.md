# TEAM

## 역할 분담

| 역할 | 담당자 | 주요 작업 영역 |
|------|--------|--------------|
| 기획 / PM | | 기능 우선순위, UX 방향, research.md 관리 |
| 프론트엔드 | | 페이지 구현, 컴포넌트, 스타일링 |
| 데이터 / 시드 | | seed.ts, storage.ts, 타입 정의 |
| 디자인 | | 컬러 시스템, 레이아웃, 반응형 |
| 배포 | | Vercel 설정, 도메인, PR 머지 |

---

## 브랜치 전략

```
main          ← 배포 브랜치 (Vercel 연동)
feat/xxx      ← 기능 개발
fix/xxx       ← 버그 수정
chore/xxx     ← 설정·문서·리팩토링
```

- `main`으로 직접 push 금지 — PR 후 머지
- PR은 최소 1인 리뷰 후 머지

---

## 커밋 메시지 규칙

```
<type>: <한글 또는 영문 요약>

type 목록:
  feat    새 기능
  fix     버그 수정
  style   UI·스타일 (로직 변경 없음)
  refactor  리팩토링
  chore   설정·문서·패키지
  data    seed 데이터·타입 변경
```

### 예시
```
feat: 해커톤 상세 탭 7개 구현
fix: 메인 히어로 카드 overflow-hidden 제거
style: 리더보드 상위 3위 highlight 추가
chore: docs/ 폴더 및 PROGRESS.md 생성
```

---

## 작업 규칙

- 모든 컴포넌트는 `web/src/components/<도메인>/` 에 위치
- 페이지 로직은 page.tsx, 재사용 UI는 components/ 로 분리
- localStorage 읽기/쓰기는 반드시 `web/src/lib/storage.ts` 를 통해서만
- 새 데이터 필드 추가 시 `types.ts` → `seed.ts` → `storage.ts` 순서로 업데이트
- 하드코딩된 문자열은 한국어 기준 (서비스 언어: 한국어)
