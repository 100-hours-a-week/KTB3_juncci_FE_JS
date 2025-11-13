import { html } from '../core/html.js';
import '../components/layout/container.js';
import '../components/account/profile-form.js';

export function AccountProfilePage() {
  return html`
    <section class="account-page">
      <layout-container>
        <profile-form></profile-form>
      </layout-container>
    </section>
  `;
}
