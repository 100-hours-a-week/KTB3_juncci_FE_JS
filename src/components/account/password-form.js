import '../ui/input-box.js';
import '../ui/button.js';
import '../ui/toast-message.js';
import {
  validatePassword,
  getPasswordError,
  getConfirmPasswordError,
} from '../../utils/validators.js';
import { html } from '../../core/html.js';
import { updatePassword } from '../../api/users.js';
import {
  getStoredUserId
} from '../../utils/auth.js';
import { routeChange } from '../../core/router.js';


const SUCCESS_REDIRECT_DELAY_MS = 1000;
// 비밀번호 변경 폼 컴포넌트
class PasswordForm extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    this.state = {
      newPassword: '',
      confirmPassword: '',
    };

    this.touched = {
      newPassword: false,
      confirmPassword: false,
    };

    this.render();
  }

  // 컴포넌트가 DOM에 연결될 때 실행
  connectedCallback() {
    this.form = this.shadowRoot.querySelector('[data-role="password-form"]');
    this.submitButton = this.shadowRoot.querySelector('[data-role="submit-button"]');
    this.helperCurrent = this.shadowRoot.querySelector('[data-helper="currentPassword"]');
    this.helperNew = this.shadowRoot.querySelector('[data-helper="newPassword"]');
    this.toast = this.shadowRoot.querySelector('[data-role="toast"]');

    // 입력 이벤트 처리
    this.handleInputChange = (event) => {
      const { name, value } = event.detail;
      this.state = { ...this.state, [name]: value };
      this.updateValidation();
    };

     // 포커스 아웃(blur) 이벤트 처리
    this.handleInputBlur = (event) => {
      const { name } = event.detail;
      if (!name) return;
      this.touched = { ...this.touched, [name]: true };
      this.updateValidation();
    };

    // 이벤트 리스너 등록
    this.shadowRoot.addEventListener('input-change', this.handleInputChange);
    this.shadowRoot.addEventListener('input-blur', this.handleInputBlur);
    this.form?.addEventListener('submit', this.handleSubmit);

    this.updateValidation();
  }

  // 컴포넌트가 DOM에서 제거될 때 실행
  disconnectedCallback() {
    this.shadowRoot.removeEventListener('input-change', this.handleInputChange);
    this.shadowRoot.removeEventListener('input-blur', this.handleInputBlur);
    this.form?.removeEventListener('submit', this.handleSubmit);
  }

  // 폼 제출 처리
  handleSubmit = async (event) => {
    event.preventDefault();
    if (!this.isFormValid()) return;
      try {
        const userId = getStoredUserId();
        const { currentPassword, newPassword } = this.state;

        await updatePassword(userId, { currentPassword, newPassword });
        this.showToast('Your password has been successfully changed.');

        // Show toast briefly, then redirect to login page
        setTimeout(() => {
          routeChange('/login');
        }, SUCCESS_REDIRECT_DELAY_MS);
      } catch (error) {
        this.showToast(error.message || 'Failed to change the password.');
      }
  };

  // 폼 전체 유효성 검사
  isFormValid() {
    const { currentPassword, newPassword } = this.state;
    return (
      validatePassword(currentPassword) &&
      validatePassword(newPassword )&&
      currentPassword !== newPassword
    );
  }

  // 각 필드별 에러 메시지 및 버튼 상태 업데이트
  updateValidation() {
    const { currentPassword, newPassword } = this.state;
    const currentError = this.touched.currentPassword
      ? getPasswordError(currentPassword)
      : '';
    const newError = this.touched.newPassword
      ?  getPasswordError(newPassword)
      : '';

    if (this.helperCurrent) this.helperCurrent.textContent = currentError;
    if (this.helperNew) this.helperNew.textContent = newError;

    const canSubmit = this.isFormValid();
    if (this.submitButton) {
      if (canSubmit) {
        this.submitButton.removeAttribute('disabled');
      } else {
        this.submitButton.setAttribute('disabled', '');
      }
    }
  }

  // 토스트 메시지 표시
  showToast(message) {
    this.toast?.show(message);
  }

  // UI 렌더링
  render() {
    const style = html`
      <style>
        :host {
          display: block;
        }

        .password-form {
          width: 100%;
          max-width: 460px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 24px;
          align-items: center;
        }

        .password-form__title {
          font-size: 70px;
          font-weight: 00;
          margin-top: 120px;
          color: #111;
          margin: 0;
          text-align: center;
          font-family: 'Nanum Pen Script', cursive;
        }

        .password-form__card {
          width: 100%;
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.04);
        }

        .password-form__field {
          display: flex;
          flex-direction: column;
        }

        .password-form__helper-text {
          font-size: 13px;
          color: #ff5f5f;
          min-height: 16px;
          margin: 10px;
        }

        .password-form__actions {
          width: 100%;
        }

      </style>
    `;

    const template = html`
      <div>
        <form class="password-form" data-role="password-form">
          <h2 class="password-form__title">Update Password</h2>
          <div class="password-form__card">
            <div class="password-form__field" data-field="newPassword">
              <input-box
                label="Current Password"
                type="password"
                placeholder="Enter your password"
                required
                name="currentPassword"
              ></input-box>
              <p class="password-form__helper-text" data-helper="currentPassword"></p>
              </div>

              <div class="password-form__field" data-field="newPassword">
                <input-box
                  label="New Password"
                  type="password"
                  placeholder="Enter a new password"
                  required
                  name="newPassword"
                ></input-box>

              <p class="password-form__helper-text" data-helper="newPassword"></p>
            </div>
          </div>
          <div class="password-form__actions">
            <custom-button label="update" data-role="submit-button" disabled></custom-button>
          </div>
        </form>
        <toast-message data-role="toast"></toast-message>
      </div>
    `;

    // 이전 렌더링된 내용 초기화 후 새로 추가
    this.shadowRoot.innerHTML = '';
    this.shadowRoot.append(style, ...template.children);
  }
}

// 커스텀 엘리먼트 등록
customElements.define('password-form', PasswordForm);
