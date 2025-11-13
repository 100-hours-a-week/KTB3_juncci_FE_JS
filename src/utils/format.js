
// 숫자 포맷터: 게시글의 좋아요, 조회수, 댓글 수 등을 짧게 표시
export function formatCount(value = 0) {
  // 전달된 값을 숫자로 변환 (NaN 방지)
  const numeric = Number(value) || 0;

  // 큰 수를 축약 표기로 표시
  if (numeric >= 100000) return '100k'; 
  if (numeric >= 10000) return '10k';   
  if (numeric >= 1000) return '1k';    

  // 그 이하의 수는 그대로 문자열로 반환
  return String(numeric);
}


// 날짜·시간 포맷터: ISO 문자열을 "YYYY-MM-DD HH:mm:ss" 형태로 변환
export function formatDateTime(dateString) {
  // 값이 없으면 대시(-) 반환
  if (!dateString) return '-';

  // 문자열을 Date 객체로 변환
  const date = new Date(dateString);

  // 유효하지 않은 날짜면 원본 문자열 그대로 반환
  if (Number.isNaN(date.getTime())) return dateString;

  // 날짜 구성요소 추출
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0'); 
  const dd = String(date.getDate()).padStart(2, '0');       
  const hh = String(date.getHours()).padStart(2, '0');      
  const min = String(date.getMinutes()).padStart(2, '0');   
  const ss = String(date.getSeconds()).padStart(2, '0');   

  // 최종 포맷 반환
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}
