import '../ui/input-box.js';
import '../ui/button.js';
import { html } from '../../core/html.js';
import { routeChange } from '../../core/router.js';
import { store } from '../../core/store.js';
import { validateEmail, validatePassword } from '../../utils/validators.js';
import { login } from '../../api/auth.js';

class LoginForm extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    const style = html`
      <style>
        :host {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
        }

        h2 {
          font-size: 32px;
          font-weight: 700;
          margin-top: 180px;
          color: #222;
          text-align: center;
        }

        .login-form__body {
          width: 390px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-top: 40px;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .helper-text {
          font-size: 12px;
          color: red;
          min-height: 14px;
        }

        .signup-link {
          text-align: center;
          font-size: 14px;
          color: #515251;
        }

        .signup-link button {
          border: none;
          background: none;
          color: #7F6AEE;
          font-weight: 600;
          cursor: pointer;
        }
      </style>
    `;

    const wrapper = html`
      <form>
        <h2>로그인</h2>
        <div class="login-form__body">
          <div class="field">
            <input-box label="이메일" type="email" placeholder="이메일을 입력하세요"></input-box>
          </div>
          <div class="field">
            <input-box label="비밀번호" type="password" placeholder="비밀번호를 입력하세요"></input-box>
            <p class="helper-text" id="helper-text"></p>
          </div>
          <custom-button label="로그인" disabled></custom-button>
          <p class="signup-link">
            <button type="button" id="signup-button">회원가입</button>
          </p>
        </div>
      </form>
    `;

    this.shadowRoot.append(style, wrapper);
  }

  connectedCallback() {
    const button = this.shadowRoot.querySelector('custom-button');
    const helperText = this.shadowRoot.querySelector('#helper-text');
    const signupButton = this.shadowRoot.querySelector('#signup-button');
    this.loginFailed = false;

    const renderValidation = (state) => {
      const emailValue = state.email.trim();
      const passwordValue = state.password;

      const isEmailValid = validateEmail(emailValue);
      const isPasswordValid = validatePassword(passwordValue);

      let message = '';
      if (!emailValue || !isEmailValid) {
        message = '*올바른 이메일 주소 형식을 입력해주세요. (예: example@example.com)';
      } else if (!passwordValue) {
        message = '*비밀번호를 입력해주세요';
      } else if (!isPasswordValid) {
        message =
          '*비밀번호는 8자 이상, 20자 이하이며, 대문자, 소문자, 숫자, 특수문자를 각각 최소 1개 포함해야 합니다.';
      } else if (this.loginFailed) {
        message = '*아이디 또는 비밀번호를 확인해주세요';
      }

      helperText.textContent = message;

      button.disabled = !(isEmailValid && isPasswordValid);
    };

    const unsubscribe = store.subscribe(renderValidation);
    this.unsubscribe = unsubscribe;
    renderValidation(store.getState());

    signupButton.addEventListener('click', () => {
      routeChange('/signup');
    });

    // input-box의 커스텀 이벤트 수신
    this.shadowRoot.addEventListener('input-change', (e) => {
      const { name, value } = e.detail;
      this.loginFailed = false;
      store.setState({ [name]: value });
    });

    // form submit (API 연동 추가)
    const form = this.shadowRoot.querySelector('form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const { email, password } = store.getState();
      const payload = { email: email.trim(), password };
      try {
        const result = await login(payload);
        const token = result.access_token;
        if (token) {
          localStorage.setItem('access_token', token);
        }
        this.loginFailed = false;
        renderValidation(store.getState());
        console.log('로그인 성공:', token);
        routeChange('/post');
      } catch (err) {
        this.loginFailed = true;
        renderValidation(store.getState());
        console.error('[Login Error]', err);
      }
    });
  }

  disconnectedCallback() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
}

customElements.define('login-form', LoginForm);
