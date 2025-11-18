import { html } from '../core/html.js';
import '../components/layout/container.js';
import '../components/post/post-editor.js';

export function PostEditPage({ postId }) {
  return html`
    <section class="post-editor-page">
      <style>
        .post-editor-page {
          min-height: 100vh;
        }
      </style>
      <layout-container>
        <post-editor mode="edit" post-id="${postId ?? ''}"></post-editor>
      </layout-container>
    </section>
  `;
}
