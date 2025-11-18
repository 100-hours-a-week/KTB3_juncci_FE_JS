import { html } from '../core/html.js';
import '../components/layout/container.js';
import '../components/signup-form/signup-form.js';

export function SignupPage() {
  return html`
    <section class="signup-page">
      <style>
        .signup-page {
          min-height: 100vh;
        }
      </style>
      <layout-container>
        <signup-form></signup-form>
      </layout-container>
    </section>
  `;
}
