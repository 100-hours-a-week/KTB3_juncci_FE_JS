# <mark> Vanilla JS - 게시판 구현 </mark>

> 순수 JavaScript로 구현한 **SPA(Single Page Application)** 프로젝트
> 
> **프레임워크 없이 프론트엔드의 본질**을 학습하기 위한 실습 프로젝트입니다.

---

## 프로젝트 소개

이 프로젝트는 **라우팅, 상태 관리, 컴포넌트 기반 UI, 가상 DOM(예정)** 등을
라이브러리 없이 직접 구현하여, **SPA의 핵심 동작 원리를 이해하는 것**을 목표로 합니다.

* Web Components + Shadow DOM을 활용한 컴포넌트 구조 실험
* Virtual DOM을 통한 효율적인 렌더링 시도(예정)
* Hash 기반 라우터 직접 구현
* 게시글 CRUD 및 댓글 관리 기능
* LocalStorage/SessionStorage를 통한 인증 관리

---

## 기술 스택

| 구분     | 사용 기술                                       |
| ------ | ------------------------------------------- |
| 언어     | **JavaScript (ES6+)**, HTML, CSS            |
| 구조     | Web Components, Hash Router, Virtual DOM(예정)    |
| 데이터 관리 | localStorage / sessionStorage 기반 상태 유지      |
| API 통신 | Fetch API (RESTful)                         |
| 설계 전략  | 전역 스타일 관리 + 모듈 기반 컴포넌트 설계                   |

---

## 폴더 구조

```
├── index.html                     # 앱 진입점 (루트 HTML)
└── src
    ├── api                         # 서버 API 통신 모듈
    │   ├── comments.js             # 댓글 관련 API (등록, 수정, 삭제, 조회)
    │   ├── posts.js                # 게시글 관련 API (CRUD, 목록 조회 등)
    │   └── users.js                # 사용자 관련 API (로그인, 회원가입, 프로필 등)
    │
    ├── components                  # UI 및 페이지 구성 컴포넌트
    │   ├── account                 # 계정 관련 폼 컴포넌트
    │   │   ├── password-form.js    # 비밀번호 변경/재설정 폼
    │   │   └── profile-form.js     # 프로필 수정 폼
    │   │
    │   ├── header.js               # 상단 헤더 컴포넌트 (공통 네비게이션)
    │   │
    │   ├── layout                  # 레이아웃 관련 컴포넌트
    │   │   └── container.js        # 페이지 레이아웃 컨테이너 (wrapper 역할)
    │   │
    │   ├── login-form              # 로그인 관련 폼
    │   │   └── login-form.js       # 로그인 입력 컴포넌트
    │   │
    │   ├── post                    # 게시글 관련 컴포넌트 모음
    │   │   ├── comment-item.js         # 단일 댓글 아이템
    │   │   ├── post-card.js            # 게시글 카드 (리스트 아이템)
    │   │   ├── post-comment-section.js # 댓글 영역 전체 관리 (입력 + 목록)
    │   │   ├── post-detail-view.js     # 게시글 상세 보기 화면
    │   │   ├── post-editor.js          # 게시글 작성/수정 폼
    │   │   └── post-feed.js            # 게시글 목록 (무한 스크롤 피드)
    │   │
    │   ├── signup-form             # 회원가입 관련 폼
    │   │   └── signup-form.js      # 회원가입 입력 컴포넌트
    │   │
    │   └── ui                      # 공통 UI 컴포넌트 (재사용성 높은 요소)
    │       ├── button.js           # 커스텀 버튼 (<custom-button>)
    │       ├── confirm-modal.js    # 확인 모달 (삭제 확인 등)
    │       └── input-box.js        # 입력 필드 컴포넌트 (<input> 커스터마이징)
    │
    ├── core                        # 앱의 핵심 로직 (공통 시스템)
    │   ├── app.js                  # 앱 초기화 / 엔트리 포인트 (라우팅 연결)
    │   ├── events.js               # 전역 이벤트 버스 (커스텀 이벤트 관리)
    │   ├── html.js                 # HTML 템플릿 유틸리티 (Tagged Template Literal)
    │   ├── router.js               # SPA 라우터 (경로 변경 및 페이지 전환)
    │   └── store.js                # 전역 상태 관리 (예: 사용자 세션, 토큰)
    │
    ├── pages                       # 실제 페이지 단위 컴포넌트 (라우터에 연결됨)
    │   ├── account-password.js     # 비밀번호 변경 페이지
    │   ├── account-profile.js      # 프로필 수정 페이지
    │   ├── login.js                # 로그인 페이지
    │   ├── main.js                 # 메인 피드 페이지 (게시글 목록)
    │   ├── post-detail.js          # 게시글 상세 페이지
    │   ├── post-edit.js            # 게시글 수정 페이지
    │   ├── post-write.js           # 게시글 작성 페이지
    │   ├── post.js                 # 게시글 메인 라우트 페이지 (피드 + 공통 로직)
    │   └── signup.js               # 회원가입 페이지
    │
    ├── styles                      # 전역 스타일 및 테마
    │   └── global.css              # 글로벌 스타일 (reset, 폰트, 기본 색상 등)
    │
    └── utils                       # 유틸리티 함수 모음 (비즈니스 로직 보조)
        ├── auth.js                 # 인증 관련 유틸 (토큰, 로그인 상태 확인 등)
        ├── comment-cache.js        # 댓글 캐시 관리 (로컬 저장 / 메모이징)
        ├── format.js               # 날짜, 문자열 등 포맷 관련 함수
        └── validators.js           # 폼 검증 유틸 (이메일, 비밀번호 등)

```

---

## 데이터 흐름 
<img src="https://github.com/user-attachments/assets/28458d2c-622e-4d06-8f97-b4295b4f9e0b" width="500" />

---

## 주요 구현 포인트

### 1. 라우팅 전략

* `hashchange` 이벤트를 기반으로 SPA 라우팅 구현
* 새로고침 시에도 상태 유지가 가능하도록 `location.hash` 사용
* `routeChange()`로 수동 네비게이션 제어

### 2. 컴포넌트 설계

* Web Component(`CustomElement`) + Shadow DOM으로 캡슐화
* 전역 스타일 충돌 방지
* 게시글, 댓글, 폼 등을 독립적인 단위로 구성

---

