import { html } from '../core/html.js';
import './layout/container.js';

export function Header() {
  return html`
    <header>
      <layout-container>
        <div class="header__inner">
          <h1>아무 말 대잔치</h1>
          <div class="profile"></div>
        </div>
      </layout-container>
    </header>
  `;
}
