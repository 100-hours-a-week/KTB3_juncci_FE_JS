import { html } from '../core/html.js';
import '../components/layout/container.js';
import '../components/login-form/login-form.js';

export function LoginPage() {
  return html`
    <section class="login-page">
      <layout-container>
        <login-form></login-form>
      </layout-container>
    </section>
  `;
}
