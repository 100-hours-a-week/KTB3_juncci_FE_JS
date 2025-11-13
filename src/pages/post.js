import { html } from '../core/html.js';
import '../components/layout/container.js';
import '../components/post/post-feed.js';

export function PostPage() {
  return html`
    <section class="post-page">
      <style>
        .post-page {
          background-color: #f4f5f7;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          font-family: 'Pretendard', 'Noto Sans KR', sans-serif;
        }
      </style>
      <layout-container>
        <post-feed page-size="10"></post-feed>
      </layout-container>
    </section>
  `;
}
