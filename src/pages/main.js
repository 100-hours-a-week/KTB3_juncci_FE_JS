import { html } from '../core/html.js';
import { routeChange } from '../core/router.js';

export function MainPage() {
  const el = html`
    <section style="text-align:center;">
      <h2>메인 페이지</h2>
      <button id="goLogin">로그인 페이지로 이동</button>
    </section>
  `;

  el.querySelector('#goLogin').addEventListener('click', () => {
    routeChange('/login');
  });

  return el;
}
