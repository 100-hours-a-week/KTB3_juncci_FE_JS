import { fetchPosts } from '../api/posts.js';
import { routeChange } from '../core/router.js';
import { formatCount, formatDateTime } from '../utils/format.js';
import '../components/layout/container.js';

const PAGE_SIZE = 10;

export function PostPage() {
  const section = document.createElement('section');
  section.className = 'post-page';
  section.innerHTML = `
    <style>
      .post-page {
        padding: 80px 0 120px;
        background-color: #f4f5f7;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        font-family: 'Pretendard', 'Noto Sans KR', sans-serif;
      }

      .post-page__header {
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 32px;
      }

      .post-page__title {
        font-size: 28px;
        font-weight: 600;
        color: #222;
        line-height: 1.4;
      }

      .post-page__title strong {
        color: #7f6aee;
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

      .post-card {
        background-color: #fff;
        border-radius: 16px;
        padding: 24px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05);
        cursor: pointer;
        transition: transform 0.15s, box-shadow 0.15s;
        max-width: var(--content-width, 600px);
        margin: 0 auto;
        width: 100%;
      }

      .post-card:hover {
        transform: translateY(-3px);
        box-shadow: 0 12px 28px rgba(0, 0, 0, 0.1);
      }

      .post-card__title {
        font-size: 20px;
        font-weight: 700;
        margin-bottom: 12px;
        color: #222;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
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

      .post-page__status {
        width: 100%;
        text-align: center;
        margin-top: 24px;
        color: #7a7a7a;
        font-size: 14px;
      }
    </style>
    <layout-container>
      <div class=\"post-page__content\">
        <div class="post-page__header">
          <p class="post-page__title">
            안녕하세요,<br />
            아무 말 대잔치 <strong>게시판</strong> 입니다.
          </p>
          <button class="post-page__write-btn" type="button">게시글 작성</button>
        </div>
        <div class="post-page__list" id="post-list"></div>
        <p class="post-page__status" id="post-status">게시글을 불러오는 중입니다...</p>
      </div>
    </layout-container>
    <div id="post-sentinel"></div>
  `;

  const listEl = section.querySelector('#post-list');
  const statusEl = section.querySelector('#post-status');
  const sentinel = section.querySelector('#post-sentinel');
  const writeButton = section.querySelector('.post-page__write-btn');

  let page = 1;
  let isLoading = false;
  let hasMore = true;
  let observer;

  writeButton.addEventListener('click', () => {
    routeChange('/post/new');
  });

  function createPostCard(post) {
    const title = post.title || '제목 없음';
    const displayTitle = title.length > 26 ? `${title.slice(0, 26)}…` : title;
    const authorName = post.author_name || post.author || '익명';

    const card = document.createElement('article');
    card.className = 'post-card';
    card.innerHTML = `
      <h3 class="post-card__title" title="${title}">${displayTitle}</h3>
      <div class="post-card__meta">
        <div class="post-card__counts">
          <span>좋아요 ${formatCount(post.like_count)}</span>
          <span>댓글 ${formatCount(post.comment_count)}</span>
          <span>조회수 ${formatCount(post.view_count)}</span>
        </div>
        <time>${formatDateTime(post.created_at)}</time>
      </div>
      <div class="post-card__author">
        <div class="post-card__avatar"></div>
        <span>${authorName}</span>
      </div>
    `;

    card.addEventListener('click', () => {
      routeChange(`/post/${post.post_id}`);
    });

    return card;
  }

  async function loadPosts() {
    if (isLoading || !hasMore) return;
    isLoading = true;
    statusEl.textContent = '게시글을 불러오는 중입니다...';

    try {
      const { posts, total } = await fetchPosts({ page, size: PAGE_SIZE, sort: 'desc' });

      if (!posts.length && page === 1) {
        statusEl.textContent = '게시글이 없습니다.';
        listEl.innerHTML = '';
        hasMore = false;
        return;
      }

      posts.forEach((post) => {
        listEl.appendChild(createPostCard(post));
      });

      const loaded = page * PAGE_SIZE;
      const totalCount = typeof total === 'number' && total > 0 ? total : loaded + posts.length;
      if (loaded >= totalCount || !posts.length) {
        hasMore = false;
        statusEl.textContent = '모든 게시글을 확인했습니다.';
      } else {
        statusEl.textContent = '스크롤을 내려 더 많은 게시글을 확인하세요.';
      }

      page += 1;
    } catch (error) {
      statusEl.textContent = `게시글을 불러오지 못했습니다: ${error.message}`;
      hasMore = false;
    } finally {
      isLoading = false;
    }
  }

  function setupObserver() {
    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          loadPosts();
        }
      });
    }, { rootMargin: '200px' });

    observer.observe(sentinel);
  }

  setupObserver();
  loadPosts();

  section.cleanup = () => {
    if (observer) {
      observer.disconnect();
    }
  };

  return section;
}
