import {
  buildAuthHeaders,
  setStoredToken,
  setStoredUserId,
} from '../utils/auth.js';
import { BASE_URL } from '../core/config.js';
import { dispatchAuthChange } from '../core/events.js';

const hasValue = (value) =>
  value !== undefined && value !== null && value !== '';

const extractAuthToken = (payload, response) => {
  const candidates = [
    payload?.access_token,
    payload?.accessToken,
    payload?.token,
    payload?.jwt,
    payload?.authorization,
    payload?.Authorization,
    payload?.data?.access_token,
    payload?.data?.token,
  ];

  for (const token of candidates) {
    if (hasValue(token)) return token;
  }

  const headerToken =
    response?.headers?.get('authorization') ||
    response?.headers?.get('Authorization');
  return headerToken || null;
};

const extractUserId = (payload) => {
  const candidates = [
    payload?.user_id,
    payload?.userId,
    payload?.id,
    payload?.user?.id,
    payload?.user?.userId,
    payload?.data?.user_id,
    payload?.data?.userId,
    payload?.data?.id,
  ];

  for (const userId of candidates) {
    if (hasValue(userId)) return userId;
  }

  return null;
};




//[POST]- 회원가입
export async function signup({ email, password, nickname, profile_image }) {
  try {
    const response = await fetch(`${BASE_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, nickname, profile_image }),
    });

    const result = await response.json();

    if (!response.ok) {
      const message =
        result.error?.detail ||
        result.message ||
        '회원가입에 실패했습니다.';
      throw new Error(message);
    }

    return result.data || result;
  } catch (error) {
    console.error('[API ERROR] signup:', error.message);
    throw error;
  }
}

//[POST]- 로그인
export async function login({ email, password }) {
  try {
    const response = await fetch(`${BASE_URL}/users/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const raw = await response.text();
    const result = raw ? JSON.parse(raw) : {};

    if (!response.ok) {
      const message =
        result.error?.detail ||
        result.error?.message ||
        result.message ||
        '로그인 실패';
      throw new Error(message);
    }

    const payload = result.data || result;
    const token = extractAuthToken(payload, response);
    const userId = extractUserId(payload);

    if (token) {
      setStoredToken(token);
    }
    if (hasValue(userId)) {
      setStoredUserId(userId);
    }

    if (token || hasValue(userId)) {
      dispatchAuthChange({ status: 'login', token: Boolean(token), userId });
    }

    return { ...payload, token, userId };
  } catch (error) {
    console.error('[API ERROR] login:', error.message);
    throw error;
  }
}


//[GET]- 개인 정보 조회
export async function fetchUserById(userId) {
  if (userId === undefined || userId === null || userId === '') {
    throw new Error('사용자 ID가 필요합니다.');
  }

  try {
    const response = await fetch(`${BASE_URL}/users/${userId}`, {
      method: 'GET',
      headers: buildAuthHeaders(),
    });

    const result = await response.json();

    if (!response.ok) {
      const message =
        result.error?.detail ||
        result.error?.message ||
        result.message ||
        '회원 정보를 불러오지 못했습니다.';
      const error = new Error(message);
      error.status = response.status;
      throw error;
    }

    return result.data || result;
  } catch (error) {
    console.error('[API ERROR] fetchUserById:', error.message);
    throw error;
  }
}

//[PUT]- 비밀번호 수정
export async function updatePassword(userId, { currentPassword, newPassword }) {

  if (userId === undefined || userId === null || userId === '') {
    throw new Error('사용자 ID가 필요합니다.');
  }

  try {
    const response = await fetch(`${BASE_URL}/users/${userId}/password`, {
      method: 'PUT',
      headers: {
        ...buildAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const result = await response.json();

    if (!response.ok) {
      const message =
        result.error?.detail ||
        result.error?.message ||
        result.message ||
        '비밀번호를 업데이트 하지 못했습니다.';
      const error = new Error(message);
      error.status = response.status;
      throw error;
    }
    return result.data || result;

  } catch (error) {
    console.error('[API ERROR] updatePassword:', error.message);
    throw error;
  }
}

//[PUT]- 회원정보 수정
export async function updateProfile(userId, { nickname, profileImage } = {}) {

  if (userId === undefined || userId === null || userId === '') {
    throw new Error('사용자 ID가 필요합니다.');
  }

  try {
    const response = await fetch(`${BASE_URL}/users/${userId}`, {
      method: 'PUT',
      headers: buildAuthHeaders({ includeContentType: true }),
      body: JSON.stringify({
        nickname,
        profileImage,
        profile_image: profileImage,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      const message =
        result.error?.detail ||
        result.error?.message ||
        result.message ||
        '사용자 정보를 업데이트 하지 못했습니다.';
      const error = new Error(message);
      error.status = response.status;
      throw error;
    }
    return result.data || result;

  } catch (error) {
    console.error('[API ERROR] updateProfile:', error.message);
    throw error;
  }
}

//[DELETE]- 회원탈퇴
export async function deleteUser(userId) {

  if (userId === undefined || userId === null || userId === '') {
    throw new Error('사용자 ID가 필요합니다.');
  }

  try {
    const response = await fetch(`${BASE_URL}/users/${userId}`, {
      method: 'DELETE',
      headers: buildAuthHeaders(),
    });

    const result = await response.json();

    if (!response.ok) {
      const message =
        result.error?.detail ||
        result.error?.message ||
        result.message ||
        '회원 탈퇴를 실패하셨습니다.';
      const error = new Error(message);
      error.status = response.status;
      throw error;
    }
    return result.data || result;

  } catch (error) {
    console.error('[API ERROR] deleteUser:', error.message);
    throw error;
  }
}
