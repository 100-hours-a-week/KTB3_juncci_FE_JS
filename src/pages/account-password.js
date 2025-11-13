import { html } from '../core/html.js';
import '../components/layout/container.js';
import '../components/account/password-form.js';

export function AccountPasswordPage() {
  return html`
    <section class="account-page">
      <layout-container>
        <password-form></password-form>
      </layout-container>
    </section>
  `;
}
