import { buildAuthHeaders } from '../utils/auth.js';

const BASE_URL = 'http://localhost:8080';

//[GET] 게시글 조회
export async function fetchPosts({ page = 1, size = 10, sort = 'desc' } = {}) {
  const params = new URLSearchParams({ page, size, sort });

  try {
    const response = await fetch(`${BASE_URL}/posts?${params.toString()}`, {
      method: 'GET',
    });

    const result = await response.json();

    if (!response.ok) {
      const message = result.error?.detail || '게시글을 불러오지 못했습니다.';
      throw new Error(message);
    }

    const payload =
      result.data?.data ||
      result.data ||
      result?.message?.data ||
      {};
    const nestedData = payload.data || {};

    return {
      posts: payload.posts || nestedData.posts || [],
      page: payload.page ?? nestedData.page ?? page,
      size: payload.size ?? nestedData.size ?? size,
      total: payload.total ?? nestedData.total ?? 0,
    };
  } catch (error) {
    console.error('[API ERROR] fetchPosts:', error.message);
    throw error;
  }
}

//[GET]게시글 단일 조회
export async function fetchPostById(postId) {
  if (!postId) {
    throw new Error('게시글 ID가 필요합니다.');
  }

  try {
    const response = await fetch(`${BASE_URL}/posts/${postId}`, {
      method: 'GET',
    });

    const result = await response.json();

    if (!response.ok) {
      const message =
        result.error?.detail ||
        result.error?.message ||
        result.message ||
        '게시글을 불러오지 못했습니다.';
      throw new Error(message);
    }

    const payload =
      result.data?.data ||
      result.data ||
      result?.message?.data ||
      {};

    return payload.post || payload;
  } catch (error) {
    console.error('[API ERROR] fetchPostById:', error.message);
    throw error;
  }
}

//[POST] - 게시글작성
export async function createPost({ title, content, images = [] } = {}) {
  if (!title || !title.trim()) {
    throw new Error('제목을 입력해주세요.');
  }
  if (!content || !content.trim()) {
    throw new Error('내용을 입력해주세요.');
  }

  try {
    const response = await fetch(`${BASE_URL}/posts`, {
      method: 'POST',
      headers: buildAuthHeaders(),
      body: JSON.stringify({
        title: title.trim(),
        content: content.trim(),
        images,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      const message =
        result.error?.detail ||
        result.error?.message ||
        result.message ||
        '게시글을 등록하지 못했습니다.';
      throw new Error(message);
    }

    return result.data || result;
  } catch (error) {
    console.error('[API ERROR] createPost:', error.message);
    throw error;
  }
}

//[PATCH] - 게시글 업데이트
export async function updatePost(postId, payload = {}) {
  const { title, content, images } = payload;
  if (!postId) {
    throw new Error('게시글 ID가 필요합니다.');
  }
  if (!title || !title.trim()) {
    throw new Error('제목을 입력해주세요.');
  }
  if (!content || !content.trim()) {
    throw new Error('내용을 입력해주세요.');
  }

  try {
    const response = await fetch(`${BASE_URL}/posts/${postId}`, {
      method: 'PATCH',
      headers: buildAuthHeaders(),
      body: JSON.stringify({
        title: title.trim(),
        content: content.trim(),
        ...(Array.isArray(images) && images.length ? { images } : {}),
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      const message =
        result.error?.detail ||
        result.error?.message ||
        result.message ||
        '게시글을 수정하지 못했습니다.';
      throw new Error(message);
    }

    return result.data || result;
  } catch (error) {
    console.error('[API ERROR] updatePost:', error.message);
    throw error;
  }
}

//[DELET] - 게시글삭제
export async function deletePost(postId) {
  if (!postId) {
    throw new Error('게시글 ID가 필요합니다.');
  }

  try {
    const response = await fetch(`${BASE_URL}/posts/${postId}`, {
      method: 'DELETE',
      headers: buildAuthHeaders(),
    });

    const raw = await response.text();
    const result = raw ? JSON.parse(raw) : {};

    if (!response.ok) {
      const message =
        result.error?.detail ||
        result.error?.message ||
        result.message ||
        '게시글을 삭제하지 못했습니다.';
      throw new Error(message);
    }

    return true;
  } catch (error) {
    console.error('[API ERROR] deletePost:', error.message);
    throw error;
  }
}

//[POST,DELETE] - 좋아요 토글
async function mutatePostLike(postId, method) {
  if (!postId) {
    throw new Error('게시글 ID가 필요합니다.');
  }

  try {
    const response = await fetch(`${BASE_URL}/posts/${postId}/likes`, {
      method,
      headers: buildAuthHeaders(),
    });

    const raw = await response.text();
    const result = raw ? JSON.parse(raw) : {};

    if (!response.ok) {
      const message =
        result.error?.detail ||
        result.error?.message ||
        result.message ||
        (method === 'POST'
          ? '좋아요를 추가하지 못했습니다.'
          : '좋아요를 취소하지 못했습니다.');
      throw new Error(message);
    }

    return result.data || result || { success: true };
  } catch (error) {
    console.error('[API ERROR] mutatePostLike:', error.message);
    throw error;
  }
}

export function likePost(postId) {
  return mutatePostLike(postId, 'POST');
}

export function unlikePost(postId) {
  return mutatePostLike(postId, 'DELETE');
}
