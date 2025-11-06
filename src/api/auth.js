const BASE_URL = 'http://localhost:8080';

export async function login({ email, password }) {
  try {
    const response = await fetch(`${BASE_URL}/users/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.detail || '로그인 실패');
    }

    return result.data; // { user_id, access_token }
  } catch (error) {
    console.error('[API ERROR] login:', error.message);
    throw error;
  }
}
