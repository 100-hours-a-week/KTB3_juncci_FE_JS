import '../ui/input-box.js';
import '../ui/button.js';
import { html } from '../../core/html.js';
import { routeChange } from '../../core/router.js';
import { store } from '../../core/store.js';
import { dispatchAuthChange } from '../../core/events.js';
import { getEmailError, getPasswordError } from '../../utils/validators.js';
import { login } from '../../api/users.js';
import { setStoredToken, setStoredUserId } from '../../utils/auth.js';

// 로그인 폼 컴포넌트
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
          gap: 10px;
          margin-top: 40px;
        }

        .field {
          display: flex;
          flex-direction: column;
        }

        .helper-text {
          font-size: 12px;
          color: red;
          min-height: 14px;
        }

        .signup-link {
          text-align: center;
          font-size: 12px;
          color: #515251;
        }

        .signup-link button {
          border: none;
          background: none;
          color: #a3a3a3ff;
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
 // Shadow DOM에 스타일 및 구조 삽입
    this.shadowRoot.append(style, wrapper);
  }

  // 컴포넌트가 DOM에 연결될 때 실행
  connectedCallback() {
    // 요소 참조
    const button = this.shadowRoot.querySelector('custom-button');
    const helperText = this.shadowRoot.querySelector('#helper-text');
    const signupButton = this.shadowRoot.querySelector('#signup-button');
    this.loginFailed = false;

      // 유효성 검증 및 에러 메시지 렌더링
    const renderValidation = (state) => {
      const emailValue = state.email.trim();
      const passwordValue = state.password;

      const emailError = getEmailError(emailValue);
      const passwordError = getPasswordError(passwordValue);

      // 로그인 실패 시 메시지 표시
      let message = emailError || passwordError;

      if (!message && this.loginFailed) {
        message = '*아이디 또는 비밀번호를 확인해주세요';
      }

      helperText.textContent = message;

      button.disabled = Boolean(message);
    };


    // 상태 변경 시 자동 리렌더링 구독
    const unsubscribe = store.subscribe(renderValidation);
    this.unsubscribe = unsubscribe;
    renderValidation(store.getState());

    // 회원가입 페이지로 이동
    signupButton.addEventListener('click', () => {
      routeChange('/signup');
    });

    // input-box 값 변경 이벤트 처리
    this.shadowRoot.addEventListener('input-change', (e) => {
      const { name, value } = e.detail;
      this.loginFailed = false;
      store.setState({ [name]: value });
    });

    // 로그인 폼 제출 처리
    const form = this.shadowRoot.querySelector('form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const { email, password } = store.getState();
      const payload = { email: email.trim(), password };
      try {
        const result = await login(payload);
        const token = result.access_token;
        if (token) {
          setStoredToken(token);
        } else {
          setStoredToken('');
        }
        const userId = result?.userId ?? result?.user_id ?? null;
        if (userId !== null) {
          setStoredUserId(userId);
        } else {
          setStoredUserId('');
        }
        dispatchAuthChange({ status: 'login' });
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

    // 컴포넌트가 DOM에서 제거될 때 실행
  disconnectedCallback() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
}

// 커스텀 엘리먼트 등록
customElements.define('login-form', LoginForm);
