// 로컬스토리지에 저장할 때 사용할 키(임시)
const KEY_PREFIX = 'vpost_comments_'; 

// 현재 환경에서 localStorage를 안전하게 반환
function getStorage() {
  if (typeof localStorage === 'undefined') return null; 
  return localStorage;
}

// 게시글 ID 기반으로 고유 캐시 키 생성
function buildKey(postId) {
  return `${KEY_PREFIX}${postId}`;
}

// JSON 문자열을 안전하게 배열 형태로 파싱하는 함수
function safeParse(raw) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    // 파싱된 값이 배열이면 그대로 반환, 아니면 빈 배열
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('[COMMENT CACHE] parse failed:', error);
    return [];
  }
}


// 캐시된 댓글 가져오기

export function getCachedComments(postId) {
  if (!postId) return []; // postId 없으면 빈 배열 반환
  const storage = getStorage();
  if (!storage) return [];

  // "vpost_comments_{postId}" 형태의 키에서 데이터 읽기
  const raw = storage.getItem(buildKey(postId));
  // 문자열을 배열 형태로 안전하게 파싱
  return safeParse(raw);
}

// 댓글 배열을 캐시에 저장

export function setCachedComments(postId, comments) {
  if (!postId) return;
  const storage = getStorage();
  if (!storage) return;
  try {
    // JSON.stringify로 직렬화하여 저장
    storage.setItem(buildKey(postId), JSON.stringify(comments));
  } catch (error) {
    console.warn('[COMMENT CACHE] set failed:', error);
  }
}


// 새로운 댓글 1개를 캐시에 추가

export function addCachedComment(postId, comment) {
  // 기존 댓글 목록을 불러옴
  const current = getCachedComments(postId);
  // 새 댓글을 맨 앞에 추가 (최신순)
  const updated = [comment, ...current];
  // 갱신된 배열을 다시 캐시에 저장
  setCachedComments(postId, updated);
  return updated;
}


// 특정 댓글 ID를 기준으로 캐시에서 제거

export function removeCachedComment(postId, commentId) {
  const current = getCachedComments(postId);
  const key = String(commentId);

  // 댓글 객체에서 id 속성명은 다양할 수 있어 모두 고려함
  const updated = current.filter((item) => {
    const id =
      item?.comment_id ??  // snake_case
      item?.commentId ??   // camelCase
      item?.id ??          // 일반 id
      item?.commentID ??   // 대문자 ID
      item?.local_id ??    // 로컬 전용 ID (임시 댓글)
      item?.localId;       // camelCase 버전
    return String(id) !== key;
  });

  // 필터링된 댓글 목록을 다시 저장
  setCachedComments(postId, updated);
  return updated;
}

// 정 게시글의 댓글 캐시 전체 비우기
export function clearCachedComments(postId) {
  setCachedComments(postId, []); // 빈 배열로 덮어쓰기
}
