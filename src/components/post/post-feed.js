import { html } from '../../core/html.js';
import { routeChange } from '../../core/router.js';
import { fetchPosts } from '../../api/posts.js';
import './post-card.js';

// 한 페이지당 불러올 게시글 수
const DEFAULT_PAGE_SIZE = 10;

// 게시글 목록(피드) 컴포넌트
export class PostFeed extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    // 스타일 정의
    const style = html`
      <style>
        :host {
          display: block;
          width: 100%;
        }

        .post-page__content {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-width: var(--content-width, 600px);
          margin: 0 auto;
        }

        .post-page__header {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: stretch;
          margin-bottom: 8px;
          flex-direction: column;
        }

        .post-page__title {
          text-align: center;
          margin-bottom: 12px;
          font-size: 24px;
          font-weight: 200;
          color: #222;
          line-height: 1.4;
        }

        .post-page__title strong {
          color: #000;
          font-weight: 700;
        }

        .post-page__write-btn {
          padding: 12px 24px;
          border-radius: 999px;
          border: none;
          background-color: #aca0eb;
          color: #fff;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
          align-self: flex-end;
        }

        .post-page__write-btn:hover {
          background-color: #7f6aee;
        }

        .post-page__list {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .post-page__status {
          width: 100%;
          text-align: center;
          margin-top: 8px;
          color: #7a7a7a;
          font-size: 14px;
        }

        #post-sentinel {
          width: 100%;
          height: 1px;
        }
      </style>
    `;

    // 레이아웃 정의
    const layout = html`
      <div class="post-page__content">
        <div class="post-page__header">
          <p class="post-page__title">
            안녕하세요,<br />
            아무 말 대잔치 <strong>게시판</strong> 입니다.
          </p>
          <button class="post-page__write-btn" type="button">게시글 작성</button>
        </div>

        <div class="post-page__list" id="post-list"></div>
        <p class="post-page__status" id="post-status">게시글을 불러오는 중입니다...</p>
        <div id="post-sentinel" aria-hidden="true"></div>
      </div>
    `;

    // Shadow DOM에 추가
    this.shadowRoot.append(style, layout);

    // 주요 요소 참조
    this.listEl = this.shadowRoot.querySelector('#post-list');
    this.statusEl = this.shadowRoot.querySelector('#post-status');
    this.sentinelEl = this.shadowRoot.querySelector('#post-sentinel');
    this.writeButton = this.shadowRoot.querySelector('.post-page__write-btn');

    // 이벤트 핸들러 바인딩
    this.handleWriteClick = this.handleWriteClick.bind(this);
    this.handleIntersect = this.handleIntersect.bind(this);
  }

  // 컴포넌트가 DOM에 연결될 때 실행
  connectedCallback() {
    // 페이지 크기 및 정렬 방식 설정
    this.pageSize = Number(this.getAttribute('page-size')) || DEFAULT_PAGE_SIZE;
    this.sort = this.getAttribute('sort') || 'desc';

    // 초기 상태 설정
    this.resetState();

    // 이벤트 등록
    this.writeButton?.addEventListener('click', this.handleWriteClick);

    // 스크롤 감시자(IntersectionObserver) 설정
    this.setupObserver();

    // 첫 번째 페이지 불러오기
    this.loadPosts();
  }

  // 컴포넌트가 DOM에서 제거될 때 실행
  disconnectedCallback() {
    this.writeButton?.removeEventListener('click', this.handleWriteClick);
    this.cleanupObserver();
  }

  // 상태 요소 반환 (안전하게 다시 참조)
  getStatusEl() {
    if (!this.statusEl || !this.statusEl.isConnected) {
      this.statusEl = this.shadowRoot.querySelector('#post-status');
    }
    return this.statusEl;
  }

  // 리스트 요소 반환
  getListEl() {
    if (!this.listEl || !this.listEl.isConnected) {
      this.listEl = this.shadowRoot.querySelector('#post-list');
    }
    return this.listEl;
  }

  // 감시용 센티넬 요소 반환
  getSentinelEl() {
    if (!this.sentinelEl || !this.sentinelEl.isConnected) {
      this.sentinelEl = this.shadowRoot.querySelector('#post-sentinel');
    }
    return this.sentinelEl;
  }

  // 상태 텍스트 업데이트
  updateStatus(message) {
    const status = this.getStatusEl();
    if (!status) {
      console.warn('[PostFeed] 상태 요소가 누락되어 상태 업데이트를 건너뜁니다: ', message);
      return;
    }
    status.textContent = message;
  }

  // 리스트 초기화
  clearList() {
    const list = this.getListEl();
    if (!list) {
      console.warn('[PostFeed] 리스트 요소가 누락되어 초기화를 건너뜁니다.');
      return;
    }
    list.innerHTML = '';
  }

  // 피드 상태 초기화
  resetState() {
    if (!this.getListEl() || !this.getStatusEl() || !this.getSentinelEl()) {
      console.error('[PostFeed] 필요한 DOM 노드가 누락되었습니다');
      return;
    }
    this.page = 1;          // 현재 페이지
    this.isLoading = false; // 로딩 중 여부
    this.hasMore = true;    // 추가 페이지 존재 여부
    this.clearList();
    this.updateStatus('게시글을 불러오는 중입니다...');
  }

  // "게시글 작성" 버튼 클릭 시 실행
  handleWriteClick() {
    routeChange('/post/new');
  }

  // 스크롤 감시자 콜백 (센티넬이 화면에 보이면 다음 페이지 로드)
  handleIntersect(entries) {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        this.loadPosts();
      }
    });
  }

  // IntersectionObserver 설정
  setupObserver() {
    this.cleanupObserver(); // 기존 옵저버 제거
    const sentinel = this.getSentinelEl();
    if (!sentinel) return;

    this.observer = new IntersectionObserver(this.handleIntersect, {
      rootMargin: '200px', // 200px 앞에서 미리 로드
    });

    this.observer.observe(sentinel);
  }

  // IntersectionObserver 해제
  cleanupObserver() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  // 게시글 데이터 로드
  async loadPosts() {
    // 이미 로딩 중이거나 더 이상 게시글이 없으면 중단
    if (this.isLoading || !this.hasMore) return;

    // 필수 DOM 요소 검증
    if (!this.getListEl() || !this.getStatusEl() || !this.getSentinelEl()) {
      console.error('[PostFeed] 필요한 DOM 노드가 누락되었습니다');
      return;
    }

    // 로딩 상태 활성화
    this.isLoading = true;
    this.updateStatus('게시글을 불러오는 중입니다...');
    console.time(`loadPosts(page=${this.page})`); // 성능 측정

    try {
      // API 호출
      const { posts, total } = await fetchPosts({
        page: this.page,
        size: this.pageSize,
        sort: this.sort,
      });

      // 최신순 정렬 (서버 응답이 정렬되어 있지 않을 경우 대비)
      const sortedPosts = [...posts].sort((a, b) => {
        const aTime = new Date(a?.created_at || a?.createdAt || 0).getTime();
        const bTime = new Date(b?.created_at || b?.createdAt || 0).getTime();
        return bTime - aTime;
      });

      // 게시글이 없는 경우
      if (!sortedPosts.length && this.page === 1) {
        this.updateStatus('게시글이 없습니다.');
        this.hasMore = false;
        return;
      }

      // 게시글 카드 컴포넌트 생성 및 추가
      sortedPosts.forEach((post) => {
        const card = document.createElement('post-card');
        card.post = post;
        this.getListEl()?.appendChild(card);
      });

      // 페이지 계산 및 다음 로딩 여부 확인
      const loaded = this.page * this.pageSize;
      const totalCount =
        typeof total === 'number' && total > 0 ? total : loaded + posts.length;

      if (loaded >= totalCount || !posts.length) {
        this.hasMore = false;
        this.updateStatus('모든 게시글을 확인했습니다.');
      } else {
        this.updateStatus('스크롤을 내려 더 많은 게시글을 확인하세요.');
      }

      // 다음 페이지로 이동
      this.page += 1;
    } catch (error) {
      this.updateStatus(`게시글을 불러오지 못했습니다: ${error.message}`);
      this.hasMore = false;
    } finally {
      // 로딩 종료
      console.timeEnd(`loadPosts(page=${this.page - 1})`);
      this.isLoading = false;
    }
  }
}

// 커스텀 엘리먼트 등록
customElements.define('post-feed', PostFeed);
