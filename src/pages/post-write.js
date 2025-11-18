import { html } from '../core/html.js';
import '../components/layout/container.js';
import '../components/post/post-editor.js';

export function PostWritePage() {
  return html`
    <section class="post-editor-page">
      <style>
        .post-editor-page {
          min-height: 100vh;
        }
      </style>
      <layout-container>
        <post-editor mode="write"></post-editor>
      </layout-container>
    </section>
  `;
}
