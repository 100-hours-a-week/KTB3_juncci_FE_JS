// src/pages/login.js
import { html } from '../core/html.js';
import { LoginForm } from '../components/login-form/login-form.js';

export function LoginPage() {
  const section = html`
    <section class="login-page"></section>
  `;
  const form = LoginForm();
  section.append(form);     
  return section;
}
