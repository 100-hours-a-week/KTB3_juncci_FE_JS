import { html } from '../../core/html.js';
import { formatDateTime } from '../../utils/format.js';
import '../ui/confirm-modal.js';

// 댓글 아이템 컴포넌트
export class CommentItem extends HTMLElement {
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

        .comment-item {
          padding: 18px 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .comment-item__top {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: flex-start;
        }

        .comment-item__header {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
          min-width: 0;
        }

        .comment-item__avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #d9d9d9;
          flex-shrink: 0;
        }

        .comment-item__meta {
          display: flex;
          gap: 20px;
          align-items: center;
          justify-content: center;
        }

        .comment-item__name {
          font-weight: 600;
          color: #222;
        }

        .comment-item__date {
          font-size: 12px;
          color: #7a7a7a;
        }

        .comment-item__body {
          font-size: 14px;
          color: #444;
          line-height: 1.5;
          white-space: pre-wrap;
          padding: 0px 50px;
          margin: 0;
        }

        .comment-item__actions {
          display: flex;
          gap: 8px;
          flex-shrink: 0;
        }

        .comment-item__actions button {
          padding: 8px 18px;
          border-radius: 12px;
          border: 1px solid #cfcfcf;
          background: #fff;
          font-size: 13px;
          color: #4b4b4b;
          cursor: pointer;
        }

        .comment-item__actions button:hover {
          border-color: #9d9d9d;
          background: #f3f3f3;
        }

        .comment-item__actions button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      </style>
    `;

    // 기본 구조 템플릿
    const layout = html`
      <article class="comment-item">
        <div class="comment-item__top">
          <div class="comment-item__header">
            <div class="comment-item__avatar" aria-hidden="true"></div>
            <div class="comment-item__meta">
              <span class="comment-item__name" data-role="name"></span>
              <time class="comment-item__date" data-role="date"></time>
            </div>
          </div>
          <div class="comment-item__actions">
          <button
              type="button"
              data-role="edit"
              disabled
              title="Comment editing is currently under development."
            >
              edit
            </button>

            <button
              type="button"
              data-role="delete"
              disabled
              title="Comment deletion is currently under development."
            >
              del
            </button>
          </div>
        </div>
        <p class="comment-item__body" data-role="body"></p>
      </article>
    `;

    // Shadow DOM에 추가
    this.shadowRoot.append(style, layout);

    // 주요 요소 참조
    this.nameEl = this.shadowRoot.querySelector('[data-role="name"]');
    this.dateEl = this.shadowRoot.querySelector('[data-role="date"]');
    this.bodyEl = this.shadowRoot.querySelector('[data-role="body"]');
    this.deleteButton = this.shadowRoot.querySelector('[data-role="delete"]');

    // 삭제 버튼 클릭 핸들러 바인딩
    this.handleDeleteClick = this.handleDeleteClick.bind(this);
  }

  // 컴포넌트가 DOM에 추가될 때 실행
  connectedCallback() {
    if (this.deleteButton) {
      this.deleteButton.addEventListener('click', this.handleDeleteClick);
    }
  }

  // 컴포넌트가 DOM에서 제거될 때 실행
  disconnectedCallback() {
    if (this.deleteButton) {
      this.deleteButton.removeEventListener('click', this.handleDeleteClick);
    }
  }

  // comment 속성 설정자 (렌더링 트리거)
  set comment(value) {
    this._comment = value;
    this.render();
  }

  // comment 속성 접근자
  get comment() {
    return this._comment;
  }

  // 댓글 내용 렌더링
  render() {
    if (!this._comment) return;

    // 작성자 이름, 내용, 날짜 포맷팅
    const name = this._comment.author || this._comment.author_name || '익명';
    const content = this._comment.content || this._comment.message || '';
    const date = formatDateTime(this._comment.created_at);

    // 화면에 데이터 반영
    this.nameEl.textContent = name;
    this.bodyEl.textContent = content;
    this.dateEl.textContent = date;

    // 버튼 상태 갱신
    this.updateActions();
  }

  // 삭제 권한 설정
  set allowDelete(value) {
    this._allowDelete = Boolean(value);
    this.updateActions();
  }

  // 삭제 중 상태 설정
  set deleting(value) {
    this._deleting = Boolean(value);
    this.updateActions();
  }

  // 삭제 버튼 클릭 시 실행
  handleDeleteClick() {
    // 삭제가 불가능하거나 이미 삭제 중이라면 중단
    if (!this._comment || !this._allowDelete || this._deleting) {
      return;
    }

    // 부모 컴포넌트로 삭제 요청 이벤트 전송
    this.dispatchEvent(
      new CustomEvent('delete-request', {
        detail: { comment: this._comment },
        bubbles: true,
        composed: true,
      })
    );
  }

  // 삭제 버튼 상태 업데이트
  updateActions() {
    if (!this.deleteButton) return;

    const canDelete = Boolean(this._allowDelete);
    const isDeleting = Boolean(this._deleting);

    // 버튼 활성화 및 텍스트 변경
    this.deleteButton.disabled = !canDelete || isDeleting;
    this.deleteButton.textContent = isDeleting ? '삭제 중...' : 'del';
    this.deleteButton.title = canDelete ? '댓글을 삭제합니다.' : '삭제 권한이 없습니다.';
  }
}

// 커스텀 엘리먼트 등록
customElements.define('comment-item', CommentItem);
