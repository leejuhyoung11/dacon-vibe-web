# WARROOM PRD — DAKER 작전실 기능 명세

> 경진대회 출품용 피처. 기존 DAKER 플랫폼(daker.ai)에 추가하는 팀 협업 허브.
> Vercel 배포 환경 기준. 바이브 코딩 툴 사용.

---

## 1. 개요 (What & Why)

### 문제
DAKER에서 팀을 만들면 그 다음 순간 플랫폼을 이탈한다.
카카오톡, 노션, 깃허브로 흩어지며 DAKER는 팀 구성 후 할 수 있는 게 "메시지 버튼" 하나뿐이다.
결과: 348팀 참가, 33팀만 제출 (제출 완료율 9.5%)

### 솔루션
**작전실 (Warroom)** — 팀이 구성된 순간부터 제출 완료까지 모든 협업이 일어나는 팀 전용 공간.

---

## 2. URL 구조

```
/warroom                     ← 내 모든 작전실 목록 페이지
/warroom/:teamSlug           ← 특정 팀의 작전실 내부
/warroom/:teamSlug?tab=tasks ← 태스크 보드 탭
/warroom/:teamSlug?tab=chat  ← 채팅 탭
/warroom/:teamSlug?tab=docs  ← 공유 문서 탭
/warroom/:teamSlug?tab=submit← 제출 허브 탭
```

---

## 3. 상단 네비게이션바 변경

기존 네비 순서:
```
DAKER | 해커톤 | 팀빌딩 | 커뮤니티 | 학습 | 쇼케이스 | 더보기
```

변경 후:
```
DAKER | 해커톤 | 팀빌딩 | [작전실 🔴2] | 커뮤니티 | 학습 | 쇼케이스 | 더보기
```

### 작전실 버튼 스펙
- 위치: 팀빌딩 바로 오른쪽
- 스타일: `background: #185FA5; color: #fff; font-weight: 500;` (파란 채움 버튼)
- 배지: 내가 속한 활성 작전실 수 (숫자). 마감 임박 시 빨간색 강조
- 클릭 시: `/warroom` 페이지로 이동
- 조건부 표시: 로그인 + 1개 이상 작전실 있을 때만 배지 표시

---

## 4. `/warroom` — 작전실 목록 페이지

### 레이아웃
```
[헤더: "작전실" + 서브타이틀 "내가 속한 팀의 협업 공간"]
[필터 탭: 전체 N | 진행 중 N | 마감 임박 N | 완료]
[카드 그리드: repeat(auto-fill, minmax(260px, 1fr))]
```

### 작전실 카드 구성 요소 (위→아래 순서)
1. **컬러바** (6px 높이): 팀 만들기 시 선택한 배너 그라디언트 색상 그대로 사용
2. **해커톤명** (11px, muted): 예) "월간 해커톤 : 긴급 인수인계"
3. **팀명** (14px, bold): 예) "Object-Oriented"
4. **팀원 아바타 + 다음 마감** (한 줄, space-between)
   - 아바타: 22px 원형, 이니셜, 겹치기(-5px margin)
   - 마감: "기획서 D-4" — D-3 이하면 빨간색, D-7 이하면 주황색, 그 외 회색
5. **진행률 바**: "완료 태스크 / 전체 태스크" 텍스트 + 3px 높이 바
6. **상태 태그**: "마감 임박" (빨간), "순조로움" (초록), "완료됨" (회색)

### 카드 상태별 스타일
- **마감 임박** (D-3 이하): `border: 1px solid #E24B4A` 빨간 테두리
- **진행 중**: 기본 border
- **완료**: `opacity: 0.6`

### 정렬 순서
마감 임박 카드 → 진행 중 카드 → 완료 카드 (각 그룹 내에서 마감일 오름차순)

---

## 5. `/warroom/:teamSlug` — 작전실 내부

### 상단 서브 네비게이션
```
[← 작전실]  [팀명]  |  [태스크 보드]  [채팅 🔴3]  [공유 문서]  [제출 허브 D-4]
```
- 배경: `var(--color-background-secondary)`
- 높이: 44px
- 탭에 미읽음 메시지 수 / 마감 D-day 배지 표시

### 전체 레이아웃 (2컬럼)
```
[메인 영역 (flex: 1)]  |  [사이드바 (280px 고정)]
```

### 사이드바 고정 콘텐츠 (모든 탭에서 동일하게 표시)

**다음 마감 섹션**
```
기획서 제출        3/29 21:00    [D-4 · 미제출] ← 빨간 뱃지
최종 웹링크 제출   4/5 21:00     [D-11]         ← 주황 뱃지
발표자료 제출      4/12 21:00    [D-18]         ← 초록 뱃지
```
- 해커톤 상세 페이지의 마감 데이터와 자동 연동
- 각 마감 카드 클릭 시 제출 허브 탭으로 이동

**팀원 섹션**
- 아바타(26px) + 이름 + 역할 + 온라인 표시 (초록/회색 6px 점)

---

## 6. 탭 1 — 태스크 보드

### 칸반 구조 (3컬럼)
```
[To-do]          [진행 중]          [완료]
컬럼 헤더 색상:  회색 배경    파란 배경      초록 배경
```

### 태스크 카드 속성
- 제목 (13px, bold)
- 담당자 (팀원 선택 드롭다운, "미배정" 기본값)
- 마감일 (날짜 선택, 해커톤 마감일과 연동 옵션)
- 우선순위: 높음 / 중 / 낮음 (선택사항)

### 마감일 뱃지
- D-3 이하: `background: #FCEBEB; color: #A32D2D` (빨간)
- D-7 이하: `background: #FAEEDA; color: #854F0B` (주황)
- D-7 초과: `background: var(--bg-secondary); color: var(--text-tertiary)` (회색)

### 자동 생성 태스크 (팀 생성 시)
해커톤 일정 데이터 기반으로 아래 태스크 자동 생성:
1. "기획서 작성" → 마감: 기획서 제출일 / 담당자: 미배정
2. "산출물 개발" → 마감: 산출물 제출일 / 담당자: 미배정
3. "최종 웹링크 제출" → 마감: 최종 제출일 / 담당자: 미배정

### 인터랙션
- 카드 드래그앤드롭으로 컬럼 간 이동
- 각 컬럼 하단에 "+ 태스크 추가" 버튼
- 카드 클릭 시 상세 모달 (제목 편집, 담당자 변경, 마감일 변경)

### 데이터 저장
```javascript
// localStorage 키 구조
localStorage.setItem(`tasks:${teamSlug}`, JSON.stringify([
  {
    id: 'task_001',
    title: '기획서 작성',
    assignee: 'user_id_or_null',
    dueDate: '2026-03-29T21:00:00',
    status: 'todo', // 'todo' | 'inprogress' | 'done'
    priority: 'high', // 'high' | 'medium' | 'low'
    createdAt: '2026-03-25T10:00:00'
  }
]))
```

---

## 7. 탭 2 — 팀 채팅

### 구현 방안 (우선순위 순)
1. **1안 (권고)**: 오픈카톡 링크를 팀 생성 시 입력받아 iframe 또는 외부 링크로 연결
   - 이유: 실시간 동기화를 별도 서버 없이 해결
   - UX: "채팅" 탭 클릭 시 "팀 오픈카톡 링크 등록" 또는 등록된 링크로 이동 버튼
2. **2안 (데모용)**: 메시지 게시판 형태 (새로고침 기반, localStorage 저장)
3. **3안 (이상적)**: Firebase Realtime DB 무료 티어 활용

### 2안 구현 시 UI (게시판 형태)
```
[메시지 입력창]  [전송]
─────────────────────────────
14:32  Juhyoung: UX 플로우 완성했어요
14:35  Korin: 확인했어요! 기획서에 반영할게요
[시스템] 기획서 제출 마감까지 4일 남았습니다
```
- 시스템 메시지: 마감 D-1, D-0 자동 표시
- 데이터: `localStorage.setItem('chat:${teamSlug}', messages)`

---

## 8. 탭 3 — 공유 문서

### 기능
- 마크다운 에디터 (심플한 textarea + 미리보기 토글)
- 자동 저장 (1초 debounce)
- 마지막 수정자 + 수정 시각 표시
- "기획서로 제출" 버튼 → 제출 허브 탭으로 이동 + 내용 자동 연동

### 데이터 저장
```javascript
localStorage.setItem(`docs:${teamSlug}`, JSON.stringify({
  content: '# 기획서\n\n...',
  lastEditedBy: 'Juhyoung',
  lastEditedAt: '2026-03-25T14:30:00'
}))
```

### 최소 구현 (데모용)
```html
<textarea id="editor" placeholder="# 기획서 제목..."></textarea>
<div id="preview" class="markdown-preview"></div>
<button onclick="togglePreview()">미리보기</button>
<button onclick="saveToSubmitHub()">기획서로 제출 →</button>
```

---

## 9. 탭 4 — 제출 허브 ⭐ (가장 중요)

### 마감별 카드 뷰
해커톤의 각 제출 마감을 카드로 표시:

```
┌─────────────────────────────────────────┐
│  📄 기획서 제출          D-4 · 3/29 21:00│
│                                         │
│  팀원 확인 상태:                         │
│  [J ✓] [K ?]                            │
│                                         │
│  제출 링크: [URL 입력 또는 업로드]        │
│                                         │
│  [제출하기 →]  ← 전원 확인 시 활성화     │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  🔗 최종 웹링크 제출      D-11 · 4/5 21:00│
│  [대기 중]                              │
└─────────────────────────────────────────┘
```

### 팀원 확인 시스템
- 각 팀원이 "제출물 확인" 버튼 클릭 → 아바타에 ✓ 표시
- 전원 확인 완료 시 "제출하기" 버튼 활성화
- (선택적 강제 또는 권고 모드 — 미구현 시 전원 확인 없이도 제출 가능하되 경고 표시)

### 제출 후 상태
```
✅ 제출 완료
2026.03.29 20:54:33 by Juhyoung
[재제출 가능 — 마감까지 2분 남음]
```
제출 후 팀 채팅에 자동 메시지: "[시스템] Juhyoung이 기획서를 제출했습니다 (20:54)"

### 데이터 저장
```javascript
localStorage.setItem(`submissions:${teamSlug}`, JSON.stringify({
  'planning_doc': {
    status: 'submitted', // 'pending' | 'submitted'
    url: 'https://...',
    submittedBy: 'Juhyoung',
    submittedAt: '2026-03-29T20:54:33',
    confirmedBy: ['Juhyoung', 'Korin']
  }
}))
```

---

## 10. 진입점 연결

### A. 팀 상세 페이지 (`/basecamp/:teamSlug`)
기존 "메시지" 버튼 옆에 추가:
```html
<button onclick="navigate('/warroom/:teamSlug')" class="btn-primary">
  작전실 입장 →
</button>
```
팀원에게만 표시. 비팀원은 버튼 숨김 또는 비활성화.

### B. 해커톤 상세 페이지 (`/hackathons/:slug`)
참가 진행 단계 스텝바의 3단계:
```
1. 참가 신청 ✓  →  2. 팀 구성 ✓  →  3. 작전실에서 제출 [클릭]
```
3단계 클릭 시 해당 팀의 작전실로 이동.

### C. 알림
마감 D-1, D-0 알림 클릭 시 `/warroom/:teamSlug?tab=submit`으로 직접 이동.

---

## 11. 작전실 자동 생성 트리거

다음 두 조건 중 하나 충족 시 작전실 자동 생성:
1. 팀장이 "팀 만들기" 완료 + 해커톤 연결된 경우
2. 팀원이 팀에 합류 승인된 경우

자동 생성 시:
- 기본 태스크 3개 자동 생성 (섹션 6 참고)
- 팀원 전체에게 "작전실이 열렸습니다" 알림 발송

---

## 12. 데이터 구조 요약 (localStorage)

```javascript
// 팀별 태스크
`tasks:${teamSlug}`         → Task[]

// 팀별 채팅 메시지
`chat:${teamSlug}`          → Message[]

// 팀별 공유 문서
`docs:${teamSlug}`          → { content, lastEditedBy, lastEditedAt }

// 팀별 제출 상태
`submissions:${teamSlug}`   → { [deadlineId]: SubmissionStatus }

// 작전실 목록 (내가 속한 팀 슬러그 목록)
`warroom:myTeams`           → string[] (teamSlugs)
```

---

## 13. 구현 우선순위

| 순위 | 기능 | 이유 |
|------|------|------|
| 1 | 상단바 버튼 + `/warroom` 목록 페이지 | 진입점이 없으면 아무것도 안 됨 |
| 2 | 제출 허브 탭 | 가장 임팩트 큰 기능. 제출 완료율 직결 |
| 3 | 태스크 보드 탭 | DAU 상승의 핵심 |
| 4 | 공유 문서 탭 | 기획서 작성 경험 개선 |
| 5 | 채팅 탭 | 오픈카톡 링크 연동으로 최소 구현 |

---

## 14. 디자인 토큰 (기존 DAKER 스타일 유지)

```css
/* 기존 플랫폼 CSS 변수 그대로 사용 */
--color-background-primary   /* 흰색 카드 배경 */
--color-background-secondary /* 페이지 배경 */
--color-text-primary         /* 본문 텍스트 */
--color-text-secondary       /* 부가 텍스트 */
--color-border-tertiary      /* 0.5px 기본 보더 */
--border-radius-lg           /* 12px 카드 */
--border-radius-md           /* 8px 컴포넌트 */

/* 작전실 신규 색상 */
--warroom-urgent: #E24B4A    /* 마감 임박 */
--warroom-warning: #EF9F27  /* 주의 */
--warroom-safe: #1D9E75     /* 안전 */
--warroom-primary: #185FA5  /* 상단바 버튼 */
```

---

## 15. 목업 참고 이미지

위 PRD와 함께 `warroom_mockup.png` 이미지를 참고할 것.
이미지에는 다음이 포함됨:
1. `/warroom` 목록 페이지 (카드 그리드)

위 PRD와 함께 `warroom_slug_mockup.png` 이미지를 참고할 것.
이미지에는 다음이 포함됨:
1. `/warroom/:teamSlug` 내부 (태스크 보드 탭 + 사이드바)


## 16. 현재 프로젝트 구조 고려

위의 명세 사항중 현재 프로젝트 구조와 상충하는 부분이 있다면 현재 구조를 우선으로 고려하여 구현할 것.
(예 : 명세서에는 local storage 에 저장하는 구조이지만 supabase 를 쓰고 있다면 이에 맞춰서 구조 수정)