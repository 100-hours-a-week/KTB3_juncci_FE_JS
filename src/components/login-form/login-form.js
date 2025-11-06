import { html } from '../../core/html.js';
import { login } from '../../api/auth.js';

export function LoginForm() {
  const form = html`
    <form class="login-form">
      <h2 class="login-form__title">로그인</h2>
      <div class="login-form__field">
        <input type="email" class="login-form__input" placeholder="이메일" required />
      </div>

      <div class="login-form__field">
        <input type="password" class="login-form__input" placeholder="비밀번호" required />
      </div>

      <button type="submit" class="login-form__button">로그인</button>
      <p class="login-form__message" id="login-message"></p>
    </form>
  `;

  const messageEl = form.querySelector('#login-message');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const [emailInput, passwordInput] = form.querySelectorAll('input');
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
      showMessage('이메일과 비밀번호를 모두 입력해주세요.', 'error');
      return;
    }

    try {
      const data = await login({ email, password });
      const token = data.access_token;

      localStorage.setItem('access_token', token);
      showMessage('로그인 성공! 젭알', 'success');


    } catch (err) {
      showMessage(err.message, 'error');
    }
  });

  function showMessage(msg, type) {
    messageEl.textContent = msg;
    messageEl.style.color = type === 'error' ? 'red' : 'green';
  }

  return form;
}
