import { html } from '../core/html.js';
import '../components/layout/container.js';
import '../components/post/post-detail-view.js';

export function PostDetailPage({ postId }) {
  return html`
    <section class="post-detail-page">
      <style>
        .post-detail-page {
          background: #f4f5f7;
          min-height: 100vh;
        }
      </style>
      <layout-container>
        <post-detail-view post-id="${postId}"></post-detail-view>
      </layout-container>
    </section>
  `;
}
