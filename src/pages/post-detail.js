export function PostDetailPage({ postId }) {
  const container = document.createElement('section');
  container.style.padding = '80px 24px';
  container.style.minHeight = '60vh';
  container.innerHTML = `
    <h2>게시글 상세</h2>
    <p>게시글 ID: ${postId}</p>
    <p>상세 페이지는 준비 중입니다.</p>
  `;
  return container;
}
