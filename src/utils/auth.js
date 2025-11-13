// 인증 관련 키 정의
const TOKEN_KEY = 'access_token';  
const USER_ID_KEY = 'user_id';     

// 값이 유효한지 검사하는 헬퍼 
function hasValue(value) {
  return value !== undefined && value !== null && value !== '';
}

// 안전하게 storage.getItem()을 수행
function safeGet(storage, key = TOKEN_KEY) {
  if (!storage) return null;
  try {
    return storage.getItem(key);
  } catch (error) {
    console.warn('[AUTH] storage getItem failed:', error);
    return null;
  }
}

// 안전하게 storage.setItem() 수행 (값이 없으면 removeItem으로 대체)
function safeSet(storage, value, key = TOKEN_KEY) {
  if (!storage) return;
  try {
    if (hasValue(value)) {
      storage.setItem(key, value);
    } else {
      storage.removeItem(key);
    }
  } catch (error) {
    console.warn('[AUTH] storage setItem failed:', error);
  }
}

// 안전하게 storage.removeItem() 수행
function safeRemove(storage, key = TOKEN_KEY) {
  if (!storage) return;
  try {
    storage.removeItem(key);
  } catch (error) {
    console.warn('[AUTH] storage removeItem failed:', error);
  }
}

// sessionStorage 객체 반환 (SSR이나 Node 환경에서는 null)
function getSessionStorage() {
  return typeof sessionStorage === 'undefined' ? null : sessionStorage;
}

// localStorage 객체 반환 (SSR이나 Node 환경에서는 null)
function getLocalStorage() {
  return typeof localStorage === 'undefined' ? null : localStorage;
}

// 토큰 관련 함수

// 저장된 토큰을 가져옴 (세션스토리지 → 없으면 로컬스토리지에서 이전)
export function getStoredToken() {
  // 1. sessionStorage에서 먼저 찾기
  const sessionToken = safeGet(getSessionStorage());
  if (sessionToken) return sessionToken;

  // 2. 과거 localStorage에 저장된 토큰이 있다면 세션스토리지로 옮기기 
  const legacyToken = safeGet(getLocalStorage());
  if (legacyToken) {
    safeSet(getSessionStorage(), legacyToken);
    safeRemove(getLocalStorage());
    return legacyToken;
  }

  // 3. 아무것도 없으면 null 반환
  return null;
}

// 토큰 저장 
export function setStoredToken(token) {
  if (token) {
    safeSet(getSessionStorage(), token);
    safeRemove(getLocalStorage()); // 혹시 남아있을지 모르는 이전 데이터 제거
  } else {
    clearStoredToken();
  }
}

// 토큰 완전 삭제 
export function clearStoredToken() {
  safeRemove(getSessionStorage());
  safeRemove(getLocalStorage());
}

// 토큰 키 상수 
export const TOKEN_STORAGE_KEY = TOKEN_KEY;


// 세션스토리지에서 저장된 user_id를 가져옴
export function getStoredUserId() {
  return safeGet(getSessionStorage(), USER_ID_KEY);
}

// 세션스토리지에 user_id를 저장
export function setStoredUserId(userId) {
  if (hasValue(userId)) {
    safeSet(getSessionStorage(), String(userId), USER_ID_KEY);
  } else {
    clearStoredUserId();
  }
}

// 세션스토리지에서 user_id 제거
export function clearStoredUserId() {
  safeRemove(getSessionStorage(), USER_ID_KEY);
}


/**
 * buildAuthHeaders()
 *  - API 요청 시 필요한 헤더를 생성
 *  - 토큰이 없는데 인증이 필요한 요청이면 에러를 던짐
 *
 * @param {Object} options
 * @param {boolean} options.requireAuth - 인증 필수 여부 (기본값 true)
 * @param {boolean} options.includeContentType - Content-Type 헤더 포함 여부
 * @param {string} options.contentType - Content-Type 값 (기본 application/json)
 * @param {string} options.authErrorMessage - 인증 누락 시 에러 메시지
 */
export function buildAuthHeaders({
  requireAuth = true,
  includeContentType = false,
  contentType = 'application/json',
  authErrorMessage = '로그인이 필요합니다.',
} = {}) {
  // Content-Type 포함 여부에 따라 기본 헤더 구성
  const headers = includeContentType ? { 'Content-Type': contentType } : {};

  // 저장된 토큰 가져오기
  const token = getStoredToken();

  // 토큰이 없을 때 인증이 필수라면 에러 발생
  if (!token) {
    if (requireAuth) {
      throw new Error(authErrorMessage);
    }
    return headers; // 인증 불필요한 요청은 Content-Type만 반환
  }

  // 'Bearer ' 접두사가 없으면 붙여줌
  const formattedToken =
    typeof token === 'string' && token.toLowerCase().startsWith('bearer ')
      ? token
      : `Bearer ${token}`;

  // Authorization 헤더와 Content-Type 통합 반환
  return {
    ...headers,
    Authorization: formattedToken,
  };
}
