import { buildAuthHeaders } from '../utils/auth.js';
import { BASE_URL } from '../core/config.js';


//[GET] - 댓글 불러오기
export async function fetchComments(postId) {
  if (!postId) {
    throw new Error('게시글 ID가 필요합니다.');
  }

  try {
    const response = await fetch(`${BASE_URL}/posts/${postId}/comments`, {
      method: 'GET',
      headers: buildAuthHeaders({ includeContentType: true, requireAuth: false }),
    });

    const raw = await response.text();
    const result = raw ? JSON.parse(raw) : {};

    if (!response.ok) {
      const message =
        result.error?.detail ||
        result.error?.message ||
        result.message ||
        '댓글을 불러오지 못했습니다.';
      throw new Error(message);
    }

    const payload = result.data || {};
    const comments = payload.comments || payload.data?.comments || [];
    const totalCount = payload.total_count ?? payload.totalCount ?? comments.length;
    const infoMessage = payload.message;

    return { comments, totalCount, message: infoMessage };
  } catch (error) {
    console.error('[API ERROR] fetchComments:', error.message);
    throw error;
  }
}

//[POST] - 댓글 등록
export async function createComment(postId, content) {
  if (!postId) {
    throw new Error('게시글 ID가 필요합니다.');
  }
  if (!content || !content.trim()) {
    throw new Error('댓글 내용을 입력해주세요.');
  }

  try {
    const response = await fetch(`${BASE_URL}/posts/${postId}/comments`, {
      method: 'POST',
      headers: buildAuthHeaders({ includeContentType: true }),
      body: JSON.stringify({ content: content.trim() }),
    });

    const result = await response.json();

    if (!response.ok) {
      const message =
        result.error?.detail ||
        result.error?.message ||
        result.message ||
        '댓글을 등록하지 못했습니다.';
      throw new Error(message);
    }

    const payload = result.data || {};
    return { commentId: payload.comment_id ?? payload.commentId };
  } catch (error) {
    console.error('[API ERROR] createComment:', error.message);
    throw error;
  }
}

//[DELET] - 댓글 삭제
export async function deleteComment(postId, commentId) {
  if (!postId || !commentId) {
    throw new Error('Post ID and Comment ID are required.');
  }

  try {
    const response = await fetch(
      `${BASE_URL}/posts/${postId}/comments/${commentId}`,
      {
        method: 'DELETE',
        headers: buildAuthHeaders({ includeContentType: true }),
      }
    );

  
    if (!response.ok) {
      throw new Error('Failed to delete the comment.');
    }

    return true; 
  } catch (error) {
    console.error('[API ERROR] deleteComment:', error.message);
    throw error;
  }
}

