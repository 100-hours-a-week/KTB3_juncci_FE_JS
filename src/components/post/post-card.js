import { html } from '../../core/html.js';
import { routeChange } from '../../core/router.js';
import { formatCount, formatDateTime } from '../../utils/format.js';

// 게시글 카드 컴포넌트
export class PostCard extends HTMLElement {
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

        .post-card {
          --card-padding: 20px;
          background-color: #fff;
          border-radius: 16px;
          padding: 15px var(--card-padding);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05);
          cursor: pointer;
          transition: transform 0.15s, box-shadow 0.15s;
          width: 100%;
          box-sizing: border-box;
          max-width: var(--content-width, 600px);
          margin: 0 auto;
        }

        .post-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.1);
        }

        .post-card__title {
          font-size: 20px;
          font-weight: 700;
          margin: 0 0 12px;
          color: #222;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .post-card__meta {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
          color: #515251;
          margin-bottom: 16px;
          gap: 8px;
        }

        .post-card__counts {
          display: flex;
          gap: 12px;
        }

        .post-card__author {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 14px;
          color: #222;
        }

        .post-card__avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background-color: #d9d9d9;
          flex-shrink: 0;
        }

        .post-card__divider {
          border: none;
          background: #CCCCCC;
          height: 1px;
          margin: 12px calc(-1 * var(--card-padding));
        }

        .post-card__author-name {
          font-weight: 700;
        }
      </style>
    `;

    // HTML 구조 정의
    const layout = html`
      <article class="post-card">
        <h3 class="post-card__title"></h3>
        <div class="post-card__meta">
          <div class="post-card__counts">
            <span class="post-card__like"></span>
            <span class="post-card__comment"></span>
            <span class="post-card__view"></span>
          </div>
          <time class="post-card__time"></time>
        </div>
        <hr class="post-card__divider" />
        <div class="post-card__author">
          <div class="post-card__avatar"></div>
          <span class="post-card__author-name"></span>
        </div>
      </article>
    `;

    // Shadow DOM 구성
    this.shadowRoot.append(style, layout);

    // 주요 요소 참조
    this.cardEl = this.shadowRoot.querySelector('.post-card');
    this.titleEl = this.shadowRoot.querySelector('.post-card__title');
    this.likeEl = this.shadowRoot.querySelector('.post-card__like');
    this.commentEl = this.shadowRoot.querySelector('.post-card__comment');
    this.viewEl = this.shadowRoot.querySelector('.post-card__view');
    this.timeEl = this.shadowRoot.querySelector('.post-card__time');
    this.authorEl = this.shadowRoot.querySelector('.post-card__author-name');
    this.dividerEl = this.shadowRoot.querySelector('.post-card__divider');

    // 클릭 이벤트 핸들러 바인딩
    this.handleClick = this.handleClick.bind(this);
  }

  // 컴포넌트가 DOM에 추가될 때 실행
  connectedCallback() {
    this.cardEl.addEventListener('click', this.handleClick);
  }

  // 컴포넌트가 DOM에서 제거될 때 실행
  disconnectedCallback() {
    this.cardEl.removeEventListener('click', this.handleClick);
  }

  // 게시글 데이터 설정자
  set post(value) {
    this._post = value;
    this.render();
  }

  // 게시글 데이터 접근자
  get post() {
    return this._post;
  }

  // 카드 클릭 시 게시글 상세 페이지로 이동
  handleClick() {
    if (this._post?.post_id) {
      routeChange(`/post/${this._post.post_id}`);
    }
  }

  // 화면 렌더링
  render() {
    if (!this._post) return;

    // 제목, 작성자, 날짜, 통계 정보 처리
    const title = this._post.title || '제목 없음';
    const displayTitle = title.length > 26 ? `${title.slice(0, 26)}…` : title;
    const authorName = this._post.author_name || this._post.author || '익명';

    // 데이터 화면에 반영
    this.titleEl.textContent = displayTitle;
    this.titleEl.title = title;
    this.likeEl.textContent = `좋아요 ${formatCount(this._post.like_count)}`;
    this.commentEl.textContent = `댓글 ${formatCount(this._post.comment_count)}`;
    this.viewEl.textContent = `조회수 ${formatCount(this._post.view_count)}`;
    this.timeEl.textContent = formatDateTime(this._post.created_at);
    this.authorEl.textContent = authorName;
    this.dividerEl.style.display = 'block';
  }
}

// 커스텀 엘리먼트 등록
customElements.define('post-card', PostCard);
