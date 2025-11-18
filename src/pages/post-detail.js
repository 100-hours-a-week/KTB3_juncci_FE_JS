import { html } from '../core/html.js';
import '../components/layout/container.js';
import '../components/post/post-detail-view.js';

export function PostDetailPage({ postId }) {
  return html`
    <section class="post-detail-page">
      <style>
        .post-detail-page {
          background: #ffffffff;
          min-height: 90vh;
          padding:10px;
          border-radius: 12px;
          border: 1px solid #d8e7f0;
          max-width: 95%;
          margin: 0 auto;
        }
      </style>
      <layout-container>
        <post-detail-view post-id="${postId}"></post-detail-view>
      </layout-container>
    </section>
  `;
}
