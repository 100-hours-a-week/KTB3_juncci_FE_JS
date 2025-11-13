import { html } from '../../core/html.js';
import { fetchComments, createComment, deleteComment } from '../../api/comments.js';
import { getStoredToken } from '../../utils/auth.js';
import { getCachedComments, setCachedComments } from '../../utils/comment-cache.js';
import './comment-item.js';
import '../ui/confirm-modal.js';

// 게시글의 댓글 섹션 컴포넌트
export class PostCommentSection extends HTMLElement {
  static get observedAttributes() {
    return ['post-id'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    // 내부 상태 초기화
    this._comments = [];
    this._postId = null;
    this._totalCount = 0;
    this._loading = false;
    this._submitting = false;
    this.commentItemMap = new Map();
    this.serverComments = [];
    this.localComments = [];
    this.pendingDeleteComment = null;

    // this 바인딩
    this.handleInput = this.handleInput.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleDeleteConfirm = this.handleDeleteConfirm.bind(this);
    this.handleDeleteCancel = this.handleDeleteCancel.bind(this);

    // 스타일 정의
    const style = html`
      <style>
        :host {
          display: block;
          width: 100%;
        }

        .comment-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        form {
          width: 100%;
        }

        .comment-form {
          width: 100%;
          box-sizing: border-box;
          padding: 10px;
          border: 1px solid #e0dff0;
          border-radius: 18px;
          background: #fff;
          margin-bottom: 12px;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.04);
        }

        .comment-form textarea {
          width: 100%;
          min-height: 120px;
          border: none;
          padding: 18px;
          font-size: 15px;
          resize: vertical;
          font-family: inherit;
          outline: none;
          box-sizing: border-box;
        }

        .comment-form__helper {
          margin-top: 12px;
          font-size: 13px;
          min-height: 18px;
          color: #7f6aee;
        }

        .comment-form__helper.is-error {
          color: #eb5757;
        }

        .comment-form__actions {
          display: flex;
          justify-content: flex-end;
          padding-top: 8px;
          border-top: 1px solid #ecebf5;
        }

        .comment-submit {
          min-width: 100px;
          padding: 10px 30px;
          border: none;
          border-radius: 16px;
          background: #d6ccff;
          color: #fff;
          font-weight: 600;
          font-size: 12px;
          cursor: not-allowed;
          transition: background 0.2s ease, opacity 0.2s ease;
        }

        .comment-submit:not(:disabled) {
          background: #7f6aee;
          cursor: pointer;
        }

        .comment-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .comments-empty {
          text-align: center;
          color: #9f9f9f;
          font-size: 14px;
        }
      </style>
    `;

    // HTML 레이아웃 정의
    const layout = html`
      <section class="comment-section">
        <form class="comment-form">
          <textarea placeholder="댓글을 남겨주세요!" data-role="input"></textarea>
          <p class="comment-form__helper" data-role="form-message" aria-live="polite"></p>
          <div class="comment-form__actions">
            <button class="comment-submit" type="submit" disabled>댓글 등록</button>
          </div>
        </form>
        <ul class="comment-list" data-role="list"></ul>
        <div class="comments-empty" data-role="empty" hidden>댓글을 불러오는 중입니다.</div>
        <confirm-modal
          data-role="delete-modal"
          title="댓글을 삭제할까요?"
          description="삭제된 댓글은 복구할 수 없습니다."
          confirm-label="삭제"
          cancel-label="취소"
        ></confirm-modal>
      </section>
    `;

    // Shadow DOM 구성
    this.shadowRoot.append(style, layout);

    // 주요 요소 참조
    this.form = this.shadowRoot.querySelector('form');
    this.textarea = this.shadowRoot.querySelector('[data-role="input"]');
    this.submitButton = this.shadowRoot.querySelector('.comment-submit');
    this.formMessageEl = this.shadowRoot.querySelector('[data-role="form-message"]');
    this.listEl = this.shadowRoot.querySelector('[data-role="list"]');
    this.emptyEl = this.shadowRoot.querySelector('[data-role="empty"]');
    this.deleteConfirmModal = this.shadowRoot.querySelector('[data-role="delete-modal"]');
  }

  // 속성(post-id) 변경 감지
  attributeChangedCallback(name, _oldValue, newValue) {
    if (name === 'post-id') {
      this.postId = newValue;
    }
  }

  // postId 설정자
  set postId(value) {
    if (!value || value === this._postId) return;
    this._postId = value;
    this.serverComments = [];
    this.localComments = [];
    if (this.isConnected) {
      this.loadComments();
    }
  }

  // postId 접근자
  get postId() {
    return this._postId;
  }

  // 컴포넌트가 DOM에 추가될 때 실행
  connectedCallback() {
    if (this.textarea) {
      this.textarea.addEventListener('input', this.handleInput);
    }
    if (this.form) {
      this.form.addEventListener('submit', this.handleSubmit);
    }
    if (this.deleteConfirmModal) {
      this.deleteConfirmModal.addEventListener('confirm', this.handleDeleteConfirm);
      this.deleteConfirmModal.addEventListener('cancel', this.handleDeleteCancel);
    }

    const currentPostId = this.getAttribute('post-id') || this._postId;
    if (currentPostId) {
      this._postId = currentPostId;
      this.loadComments();
    } else {
      this.showEmptyState('댓글을 불러올 게시글 정보를 찾을 수 없습니다.');
    }
  }

  // 컴포넌트가 DOM에서 제거될 때 실행
  disconnectedCallback() {
    if (this.textarea) {
      this.textarea.removeEventListener('input', this.handleInput);
    }
    if (this.form) {
      this.form.removeEventListener('submit', this.handleSubmit);
    }
    if (this.deleteConfirmModal) {
      this.deleteConfirmModal.removeEventListener('confirm', this.handleDeleteConfirm);
      this.deleteConfirmModal.removeEventListener('cancel', this.handleDeleteCancel);
    }
  }

  // 입력 이벤트 처리
  handleInput(event) {
    const value = event.target.value.trim();
    this.clearFormMessage();
    this.updateSubmitButton(Boolean(value));
  }

  // 댓글 등록 버튼 활성화/비활성화
  updateSubmitButton(hasContent) {
    if (!this.submitButton) return;
    const disabled = !hasContent || this._submitting;
    this.submitButton.disabled = disabled;
  }

  // 폼 메시지 표시
  showFormMessage(message, isError = false) {
    if (!this.formMessageEl) return;
    this.formMessageEl.textContent = message || '';
    this.formMessageEl.classList.toggle('is-error', Boolean(isError));
  }

  // 폼 메시지 초기화
  clearFormMessage() {
    this.showFormMessage('');
  }

  // 댓글이 없거나 로딩 중일 때 표시
  showEmptyState(message) {
    if (!this.emptyEl) return;
    this.emptyEl.hidden = !message;
    this.emptyEl.textContent = message || '';
  }

  // 댓글 목록 불러오기
  async loadComments() {
    if (!this._postId || this._loading) return;
    this._loading = true;
    this.showEmptyState('댓글을 불러오는 중입니다...');
    this.serverComments = [];
    this.localComments = this.loadLocalComments();
    if (this.localComments.length) {
      this.mergeAndRender();
    }

    try {
      const { comments, message } = await fetchComments(this._postId);
      this.serverComments = Array.isArray(comments) ? comments : [];
      this.localComments = this.loadLocalComments();
      this.mergeAndRender({ emptyMessage: message });
    } catch (error) {
      this.serverComments = [];
      this.localComments = this.loadLocalComments();
      this.mergeAndRender({
        emptyMessage: error.message || '댓글을 불러오지 못했습니다.',
      });
    } finally {
      this._loading = false;
    }
  }

  // 서버 + 로컬 댓글 병합 후 렌더링
  mergeAndRender({ emptyMessage } = {}) {
    this._comments = this.mergeComments(this.serverComments, this.localComments);
    this._totalCount = this._comments.length;
    this.renderComments();

    if (this._comments.length === 0) {
      this.showEmptyState(emptyMessage || '등록된 댓글이 없습니다.');
    } else {
      this.showEmptyState('');
    }

    this.notifyCommentCount();
  }

  // 중복 제거하면서 댓글 병합
  mergeComments(serverList = [], localList = []) {
    const result = [];
    const seen = new Set();

    serverList.forEach((comment) => {
      result.push(comment);
      const id = this.getCommentId(comment);
      if (id) seen.add(String(id));
    });

    localList.forEach((comment) => {
      const id = this.getCommentId(comment);
      const key = id ? String(id) : comment?.local_id || comment?.localId;
      if (key && seen.has(String(key))) return;
      if (key) seen.add(String(key));
      result.push(comment);
    });

    return result;
  }

  // 상위 컴포넌트에 댓글 개수 이벤트 전송
  notifyCommentCount() {
    this.dispatchEvent(
      new CustomEvent('comments-updated', {
        detail: {
          totalCount: this._totalCount,
          comments: [...this._comments],
        },
        bubbles: true,
        composed: true,
      })
    );
  }

  // 댓글 렌더링
  renderComments() {
    if (!this.listEl) return;
    this.commentItemMap.clear();
    this.listEl.innerHTML = '';

    this._comments.forEach((comment) => {
      const item = document.createElement('comment-item');
      item.comment = comment;
      const commentId = this.getCommentId(comment);
      const canDelete = this.canDeleteComment(comment);
      item.allowDelete = canDelete;

      if (canDelete) {
        item.addEventListener('delete-request', (event) => {
          this.handleDeleteRequest(event.detail.comment);
        });
      }

      if (commentId) {
        this.commentItemMap.set(String(commentId), item);
      }

      this.listEl.appendChild(item);
    });
  }

  // 로컬 캐시 불러오기
  loadLocalComments() {
    if (!this._postId) return [];
    return getCachedComments(this._postId) || [];
  }

  // 로컬 캐시 저장
  saveLocalComments(list) {
    if (!this._postId) return;
    this.localComments = list;
    setCachedComments(this._postId, list);
  }

  // 로컬 댓글 추가
  addLocalComment(comment) {
    const updated = [comment, ...this.localComments];
    this.saveLocalComments(updated);
  }

  // 로컬 댓글 삭제
  removeLocalComment(commentId) {
    const key = String(commentId);
    const filtered = this.localComments.filter(
      (comment) => String(this.getCommentId(comment)) !== key
    );
    if (filtered.length !== this.localComments.length) {
      this.saveLocalComments(filtered);
      return true;
    }
    return false;
  }

  // 서버 댓글 삭제
  removeServerComment(commentId) {
    const key = String(commentId);
    this.serverComments = this.serverComments.filter(
      (comment) => String(this.getCommentId(comment)) !== key
    );
  }

  // 새 로컬 댓글 객체 생성
  createLocalComment(commentId, content) {
    const fallbackId = `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const newId = commentId ?? fallbackId;
    return {
      comment_id: newId,
      local_id: fallbackId,
      content,
      created_at: new Date().toISOString(),
      author: '익명',
      is_local: true,
      can_delete: true,
    };
  }

  // 댓글 ID 추출
  getCommentId(comment) {
    return (
      comment?.comment_id ??
      comment?.commentId ??
      comment?.id ??
      comment?.commentID ??
      comment?.local_id ??
      comment?.localId ??
      null
    );
  }

  // 삭제 권한 확인
  canDeleteComment(comment) {
    if (!comment) return false;
    if ('is_local' in comment || 'isLocal' in comment) {
      if (comment.is_local || comment.isLocal) return true;
    }
    if ('can_delete' in comment) return Boolean(comment.can_delete);
    if ('canDelete' in comment) return Boolean(comment.canDelete);
    if ('is_owner' in comment) return Boolean(comment.is_owner);
    if ('isOwner' in comment) return Boolean(comment.isOwner);
    if ('is_mine' in comment) return Boolean(comment.is_mine);
    if ('isMine' in comment) return Boolean(comment.isMine);
    return Boolean(getStoredToken());
  }

  // 댓글 등록 처리
  async handleSubmit(event) {
    event.preventDefault();
    if (this._submitting) return;

    if (!this._postId) {
      this.showFormMessage('게시글 정보를 찾을 수 없습니다.', true);
      return;
    }

    const content = this.textarea?.value?.trim();
    if (!content) {
      this.showFormMessage('댓글 내용을 입력해주세요.', true);
      return;
    }

    const hasToken = Boolean(getStoredToken());
    if (!hasToken) {
      this.showFormMessage('로그인 후 댓글을 작성할 수 있습니다.', true);
      return;
    }

    try {
      this.setSubmitting(true);
      const { commentId } = await createComment(this._postId, content);
      const newComment = this.createLocalComment(commentId, content);
      this.addLocalComment(newComment);
      this.mergeAndRender();
      if (this.textarea) this.textarea.value = '';
      this.updateSubmitButton(false);
      this.showFormMessage('댓글이 등록되었습니다.');
    } catch (error) {
      this.showFormMessage(error.message || '댓글을 등록하지 못했습니다.', true);
    } finally {
      this.setSubmitting(false);
    }
  }

  // 제출 중 상태 설정
  setSubmitting(state) {
    this._submitting = Boolean(state);
    const hasContent = Boolean(this.textarea?.value?.trim());
    this.updateSubmitButton(hasContent);
    if (this.textarea) {
      this.textarea.readOnly = this._submitting;
    }
  }

  // 댓글 삭제 요청 처리
  async handleDeleteRequest(comment) {
    const commentId = this.getCommentId(comment);
    if (!commentId || !this._postId) return;

    const hasToken = Boolean(getStoredToken());
    if (!hasToken) {
      this.showFormMessage('로그인 후 댓글을 삭제할 수 있습니다.', true);
      return;
    }

    this.pendingDeleteComment = comment;

    if (this.deleteConfirmModal) {
      this.deleteConfirmModal.open();
    } else {
      await this.performCommentDeletion(comment);
      this.pendingDeleteComment = null;
    }
  }

  // 삭제 확인
  handleDeleteConfirm() {
    if (!this.pendingDeleteComment) return;
    const comment = this.pendingDeleteComment;
    this.pendingDeleteComment = null;
    this.performCommentDeletion(comment);
  }

  // 삭제 취소
  handleDeleteCancel() {
    this.pendingDeleteComment = null;
  }

  // 실제 댓글 삭제 수행
  async performCommentDeletion(comment) {
    if (!comment) return;

    const commentId = this.getCommentId(comment);
    if (!commentId || !this._postId) return;

    const hasToken = Boolean(getStoredToken());
    if (!hasToken) {
      this.showFormMessage('로그인 후 댓글을 삭제할 수 있습니다.', true);
      return;
    }

    const isLocalComment = Boolean(comment?.is_local || comment?.isLocal);
    const targetItem = this.commentItemMap.get(String(commentId));
    if (targetItem) targetItem.deleting = true;

    if (isLocalComment) {
      this.removeLocalComment(commentId);
      this.mergeAndRender();
      this.showFormMessage('댓글이 삭제되었습니다.');
      if (targetItem) targetItem.deleting = false;
      return;
    }

    try {
      await deleteComment(this._postId, commentId);
      const removedLocal = this.removeLocalComment(commentId);
      if (!removedLocal) {
        this.removeServerComment(commentId);
      }
      this.mergeAndRender();
      this.showFormMessage('댓글이 삭제되었습니다.');
    } catch (error) {
      this.showFormMessage(error.message || '댓글을 삭제하지 못했습니다.', true);
    } finally {
      if (targetItem) targetItem.deleting = false;
    }
  }
}

// 커스텀 엘리먼트 등록
customElements.define('post-comment-section', PostCommentSection);
