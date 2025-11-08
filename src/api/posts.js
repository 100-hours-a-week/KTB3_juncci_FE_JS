const BASE_URL = 'http://localhost:8080';

//게
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
