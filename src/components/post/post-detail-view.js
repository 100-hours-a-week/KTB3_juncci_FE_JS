import { html } from '../../core/html.js';
import { fetchPostById, deletePost, likePost, unlikePost } from '../../api/posts.js';
import { formatCount, formatDateTime } from '../../utils/format.js';
import { routeChange } from '../../core/router.js';
import { getStoredUserId, getStoredToken } from '../../utils/auth.js';
import './post-comment-section.js';
import '../ui/confirm-modal.js';

// 기본 이미지 (게시글 이미지 없을 때 사용)
const PLACEHOLDER_IMAGE =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="480"><rect width="100%" height="100%" fill="%23d9d9d9"/></svg>';

// 게시글 상세 보기 컴포넌트
export class PostDetailView extends HTMLElement {
  static get observedAttributes() {
    return ['post-id'];
  }

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

        .post-detail {
          max-width: var(--layout-width, 600px);
          margin: 0 auto;
          font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;
          color: #222;
        }

        .post-detail__state {
          text-align: center;
          padding: 80px 0;
          color: #7a7a7a;
          font-size: 16px;
        }

        .post-detail__content {
          display: none;
        }

        .post-detail__content.is-visible {
          display: block;
        }

        .post-detail__header {
          position: relative;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 32px;
          border-bottom: 1px solid #bbbabaff;
          padding: 0 0 20px;
        }

        .post-detail__title {
          font-size: 24px;
          font-weight: 700;
          margin: 0 0 16px;
        }

        .post-detail__meta {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #515251;
          font-size: 14px;
        }

        .post-detail__avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #d9d9d9;
          flex-shrink: 0;
        }

        .post-detail__author {
          display: flex;
          gap: 30px;
        }

        .post-detail__actions {
          display: flex;
          gap: 12px;
          position: absolute;
          bottom: 20px;
          right: 0;
        }

        .action-btn {
          min-width: 78px;
          padding: 8px 4px;
          border-radius: 12px;
          border: 1px solid #cfc2ff;
          background-color: #F4F5F7;
          font-size: 14px;
          cursor: pointer;
          transition: 0.2s;
        }

        .action-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .post-detail__image img {
          width: 100%;
          display: block;
          object-fit: cover;
          max-height: 300px;
        }

        .post-detail__body {
          font-size: 16px;
          line-height: 1.8;
          color: #333;
          margin-bottom: 10px;
          white-space: pre-line;
        }

        .post-detail__stats {
          padding: 20px 70px;
          display: flex;
          gap: 16px;
          margin-bottom: 40px;
          border-bottom: 1px solid #bbbabaff;
        }

        .stat-chip {
          flex: 1;
          background: #dad9d9ff;
          border-radius: 18px;
          padding: 20px 16px;
          text-align: center;
        }

        .stat-chip--like {
          border: none;
          cursor: pointer;
          background: #d9d9d9;
          transition: 0.2s;
        }

        .stat-chip--like.is-liked {
          background: #aca0eb;
          color: #fff;
        }
      </style>
    `;

    // HTML 레이아웃 정의
    const layout = html`
      <section class="post-detail">
        <div class="post-detail__panel">
          <div class="post-detail__state" data-role="state">게시글을 불러오는 중입니다...</div>
          <div class="post-detail__content" data-role="content">
            <header class="post-detail__header">
              <div>
                <h1 class="post-detail__title"></h1>
                <div class="post-detail__meta">
                  <div class="post-detail__avatar" aria-hidden="true"></div>
                  <div class="post-detail__author">
                    <strong class="post-detail__author-name"></strong>
                    <time class="post-detail__date"></time>
                  </div>
                </div>
              </div>
              <div class="post-detail__actions">
                <button class="action-btn" data-role="edit" type="button">수정</button>
                <button class="action-btn" data-role="delete" type="button">삭제</button>
              </div>
            </header>

            <div class="post-detail__image">
              <img src="${PLACEHOLDER_IMAGE}" alt="" data-role="image" />
            </div>

            <article class="post-detail__body" data-role="content-body"></article>

            <div class="post-detail__stats">
              <button class="stat-chip stat-chip--like" data-role="like-button" aria-pressed="false">
                <strong class="stat-chip__value" data-role="like-count">0</strong>
                <span class="stat-chip__label">좋아요수</span>
              </button>
              <div class="stat-chip">
                <strong class="stat-chip__value" data-role="view-count">0</strong>
                <span class="stat-chip__label">조회수</span>
              </div>
              <div class="stat-chip">
                <strong class="stat-chip__value" data-role="comment-count">0</strong>
                <span class="stat-chip__label">댓글</span>
              </div>
            </div>

            <post-comment-section data-role="comment-section"></post-comment-section>
            <confirm-modal
              data-role="post-delete-modal"
              title="게시글을 삭제할까요?"
              description="삭제된 게시글은 복구할 수 없습니다."
              confirm-label="삭제"
              cancel-label="취소"
            ></confirm-modal>
          </div>
        </div>
      </section>
    `;

    this.shadowRoot.append(style, layout);

    // 주요 요소 참조
    this.stateEl = this.shadowRoot.querySelector('[data-role="state"]');
    this.contentEl = this.shadowRoot.querySelector('[data-role="content"]');
    this.titleEl = this.shadowRoot.querySelector('.post-detail__title');
    this.authorEl = this.shadowRoot.querySelector('.post-detail__author-name');
    this.dateEl = this.shadowRoot.querySelector('.post-detail__date');
    this.bodyEl = this.shadowRoot.querySelector('[data-role="content-body"]');
    this.imageEl = this.shadowRoot.querySelector('[data-role="image"]');
    this.likeEl = this.shadowRoot.querySelector('[data-role="like-count"]');
    this.likeButton = this.shadowRoot.querySelector('[data-role="like-button"]');
    this.viewEl = this.shadowRoot.querySelector('[data-role="view-count"]');
    this.commentEl = this.shadowRoot.querySelector('[data-role="comment-count"]');
    this.commentSection = this.shadowRoot.querySelector('[data-role="comment-section"]');
    this.editButton = this.shadowRoot.querySelector('[data-role="edit"]');
    this.deleteButton = this.shadowRoot.querySelector('[data-role="delete"]');
    this.deleteConfirmModal = this.shadowRoot.querySelector('[data-role="post-delete-modal"]');

    // 이벤트 핸들러 바인딩
    this.handleCommentsUpdated = this.handleCommentsUpdated.bind(this);
    this.handleEditClick = this.handleEditClick.bind(this);
    this.handleDeleteClick = this.handleDeleteClick.bind(this);
    this.handleDeleteConfirm = this.handleDeleteConfirm.bind(this);
    this.handleDeleteCancel = this.handleDeleteCancel.bind(this);
    this.handleLikeClick = this.handleLikeClick.bind(this);

    // 내부 상태 초기화
    this.currentPost = null;
    this.currentPostId = null;
    this.canModifyPost = false;
    this.isDeletingPost = false;
    this.isPostLiked = false;
    this.isLikingPost = false;
    this.likeCount = 0;
    this.updateActionButtons();
  }

  // post-id 속성 변경 시 게시글 로드
  attributeChangedCallback(name, _oldValue, newValue) {
    if (name === 'post-id' && newValue) {
      this.loadPost(newValue);
    }
  }

  // 컴포넌트가 DOM에 추가될 때 이벤트 등록
  connectedCallback() {
    if (this.commentSection) {
      this.commentSection.addEventListener('comments-updated', this.handleCommentsUpdated);
    }
    if (this.editButton) this.editButton.addEventListener('click', this.handleEditClick);
    if (this.deleteButton) this.deleteButton.addEventListener('click', this.handleDeleteClick);
    if (this.likeButton) this.likeButton.addEventListener('click', this.handleLikeClick);
    if (this.deleteConfirmModal) {
      this.deleteConfirmModal.addEventListener('confirm', this.handleDeleteConfirm);
      this.deleteConfirmModal.addEventListener('cancel', this.handleDeleteCancel);
    }

    const postId = this.getAttribute('post-id');
    if (postId) this.loadPost(postId);
  }

  // 컴포넌트가 DOM에서 제거될 때 이벤트 해제
  disconnectedCallback() {
    if (this.commentSection)
      this.commentSection.removeEventListener('comments-updated', this.handleCommentsUpdated);
    if (this.editButton)
      this.editButton.removeEventListener('click', this.handleEditClick);
    if (this.deleteButton)
      this.deleteButton.removeEventListener('click', this.handleDeleteClick);
    if (this.likeButton)
      this.likeButton.removeEventListener('click', this.handleLikeClick);
    if (this.deleteConfirmModal) {
      this.deleteConfirmModal.removeEventListener('confirm', this.handleDeleteConfirm);
      this.deleteConfirmModal.removeEventListener('cancel', this.handleDeleteCancel);
    }
  }

  // 게시글 데이터 불러오기
  async loadPost(postId) {
    if (!postId) return;
    this.setLoadingState('게시글을 불러오는 중입니다...');

    try {
      const data = await fetchPostById(postId);
      if (!data) {
        this.setErrorState('게시글을 찾을 수 없습니다.');
        return;
      }
      this.renderPost(data);
    } catch (error) {
      this.setErrorState(error.message || '게시글을 불러오지 못했습니다.');
    }
  }

  // 로딩 상태 표시
  setLoadingState(message) {
    if (this.stateEl) {
      this.stateEl.textContent = message;
      this.stateEl.style.display = 'block';
    }
    if (this.contentEl) {
      this.contentEl.classList.remove('is-visible');
    }
  }

  // 에러 상태 표시
  setErrorState(message) {
    this.setLoadingState(message);
  }

  // 게시글 데이터 렌더링
  renderPost(post) {
    const title = post.title || '제목 없음';
    const author = post.author_name || post.author || '익명';
    const content = post.content || post.message || '';
    const imageSrc =
      Array.isArray(post.images) && post.images.length > 0 ? post.images[0] : PLACEHOLDER_IMAGE;

    // 텍스트 및 이미지 렌더링
    this.titleEl.textContent = title;
    this.authorEl.textContent = author;
    this.dateEl.textContent = formatDateTime(post.created_at);
    this.bodyEl.textContent = content;

    const imageElement =
      this.imageEl && this.imageEl.isConnected
        ? this.imageEl
        : this.shadowRoot.querySelector('[data-role="image"]');
    if (imageElement) {
      imageElement.src = imageSrc || PLACEHOLDER_IMAGE;
      imageElement.alt = title;
      this.imageEl = imageElement;
    }

    // 좋아요 / 댓글 / 조회수 표시
    const initialLikeCount = post.like_count ?? post.likeCount ?? post.likes ?? 0;
    this.likeCount = Number(initialLikeCount) || 0;
    this.isPostLiked = this.evaluateLikedState(post);
    this.updateLikeDisplay();

    this.viewEl.textContent = formatCount(post.view_count);
    const commentCount =
      post.comment_count ?? post.commentCount ?? (Array.isArray(post.comments) ? post.comments.length : 0);
    this.commentEl.textContent = formatCount(commentCount);

    const postIdValue = this.getPostIdFromData(post) || this.getAttribute('post-id');
    this.currentPost = post;
    this.currentPostId = postIdValue;

    // 댓글 컴포넌트 연결
    if (this.commentSection && postIdValue) {
      this.commentSection.setAttribute('post-id', postIdValue);
    }

    // 권한 및 버튼 상태 갱신
    this.canModifyPost = this.evaluateModifyPermission(post);
    this.isDeletingPost = false;
    this.updateActionButtons();

    if (this.stateEl) this.stateEl.style.display = 'none';
    if (this.contentEl) this.contentEl.classList.add('is-visible');
  }

  // post 객체에서 postId 추출
  getPostIdFromData(post) {
    return post?.id ?? post?.post_id ?? post?.postId ?? null;
  }

  // 수정 버튼 클릭
  handleEditClick() {
    if (!this.currentPostId) return;
    if (!this.canModifyPost) {
      window.alert('게시글을 수정할 권한이 없습니다.');
      return;
    }
    if (this.isDeletingPost) return;
    routeChange(`/post/${this.currentPostId}/edit`);
  }

  // 댓글 수 갱신 이벤트 처리
  handleCommentsUpdated(event) {
    const totalCount = event?.detail?.totalCount;
    if (typeof totalCount === 'number' && this.commentEl) {
      this.commentEl.textContent = formatCount(totalCount);
    }
  }

  // 좋아요 버튼 클릭 처리
  handleLikeClick() {
    if (!this.currentPostId || this.isLikingPost) return;
    if (!getStoredToken()) {
      window.alert('로그인 후 좋아요를 누를 수 있습니다.');
      return;
    }
    this.togglePostLike();
  }

  // 삭제 버튼 클릭 처리
  handleDeleteClick() {
    if (!this.canModifyPost || this.isDeletingPost || !this.currentPostId) return;

    if (this.deleteConfirmModal) {
      this.deleteConfirmModal.open();
    } else {
      this.performPostDeletion();
    }
  }

  // 삭제 확인 모달 처리
  handleDeleteConfirm() {
    if (!this.canModifyPost || !this.currentPostId) return;
    this.performPostDeletion();
  }

  // 삭제 취소 (no-op)
  handleDeleteCancel() {
    // 아무 동작 안 함
  }

  // 게시글 실제 삭제 처리
  async performPostDeletion() {
    if (this.isDeletingPost || !this.currentPostId) return;
    this.isDeletingPost = true;
    this.updateActionButtons();

    try {
      await deletePost(this.currentPostId);
      routeChange('/post');
    } catch (error) {
      console.error('[PostDetailView] 게시글 삭제 실패:', error);
      window.alert(error.message || '게시글을 삭제하지 못했습니다.');
      this.isDeletingPost = false;
      this.updateActionButtons();
    }
  }

  // 수정/삭제 권한 판단
  evaluateModifyPermission(post) {
    const token = getStoredToken();
    if (!token || !post) return false;
    if ('can_edit' in post) return Boolean(post.can_edit);
    if ('canEdit' in post) return Boolean(post.canEdit);
    if ('is_owner' in post) return Boolean(post.is_owner);
    if ('isOwner' in post) return Boolean(post.isOwner);
    if ('is_mine' in post) return Boolean(post.is_mine);
    if ('isMine' in post) return Boolean(post.isMine);

    const ownerId = this.getPostOwnerId(post);
    const currentUserId = getStoredUserId();
    if (!ownerId || !currentUserId) return true;
    return String(ownerId) === String(currentUserId);
  }

  // 작성자 ID 가져오기
  getPostOwnerId(post) {
    return (
      post?.user_id ??
      post?.userId ??
      post?.author_id ??
      post?.authorId ??
      post?.author?.id ??
      null
    );
  }

  // 좋아요 상태 판단
  evaluateLikedState(post) {
    if (!post) return false;
    if ('is_liked' in post) return Boolean(post.is_liked);
    if ('isLiked' in post) return Boolean(post.isLiked);
    if ('liked' in post) return Boolean(post.liked);
    if ('has_liked' in post) return Boolean(post.has_liked);
    if ('hasLiked' in post) return Boolean(post.hasLiked);
    return false;
  }

  // 버튼 상태 업데이트
  updateActionButtons() {
    const canModify = Boolean(this.canModifyPost) && !this.isDeletingPost;
    if (this.editButton) {
      this.editButton.disabled = !canModify;
      this.editButton.title = canModify ? '게시글을 수정합니다.' : '수정 권한이 없습니다.';
    }
    if (this.deleteButton) {
      this.deleteButton.disabled = !canModify;
      this.deleteButton.textContent = this.isDeletingPost ? '삭제 중...' : '삭제';
      this.deleteButton.title = canModify ? '게시글을 삭제합니다.' : '삭제 권한이 없습니다.';
    }
    this.updateLikeButtonState(this.isLikingPost);
  }

  // 좋아요 표시 갱신
  updateLikeDisplay() {
    if (this.likeEl) this.likeEl.textContent = formatCount(this.likeCount);
    if (this.likeButton) {
      const isLiked = Boolean(this.isPostLiked);
      this.likeButton.classList.toggle('is-liked', isLiked);
      this.likeButton.setAttribute('aria-pressed', String(isLiked));
      this.likeButton.dataset.state = isLiked ? 'enabled' : 'disabled';
    }
  }

  // 좋아요 버튼 비활성화/활성화
  updateLikeButtonState(disabled) {
    if (this.likeButton) {
      if (disabled) this.likeButton.setAttribute('disabled', '');
      else this.likeButton.removeAttribute('disabled');
    }
  }

  // 좋아요 토글 처리 (API 연동)
  async togglePostLike() {
    if (!this.currentPostId || this.isLikingPost) return;

    // 이전 상태 저장
    const previousState = Boolean(this.isPostLiked);
    const previousCount = this.likeCount;
    const nextState = !previousState;
    const countDelta = nextState ? 1 : -1;

    // UI 즉시 반영 (Optimistic UI)
    this.isPostLiked = nextState;
    this.likeCount = Math.max(0, previousCount + countDelta);
    this.updateLikeDisplay();

    // API 요청 중
    this.isLikingPost = true;
    this.updateLikeButtonState(true);

    try {
      if (nextState) await likePost(this.currentPostId);
      else await unlikePost(this.currentPostId);
    } catch (error) {
      console.error('[PostDetailView] 좋아요 처리 실패:', error);
      this.isPostLiked = previousState;
      this.likeCount = previousCount;
      this.updateLikeDisplay();
      window.alert(error.message || '좋아요 요청을 처리하지 못했습니다.');
    } finally {
      this.isLikingPost = false;
      this.updateLikeButtonState(false);
    }
  }
}

// 커스텀 엘리먼트 등록
customElements.define('post-detail-view', PostDetailView);
