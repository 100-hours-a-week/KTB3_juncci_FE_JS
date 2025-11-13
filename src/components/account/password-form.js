import '../ui/input-box.js';
import '../ui/button.js';
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
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
  }

  // 폼 제출 처리
  handleSubmit = async (event) => {
    event.preventDefault();
    if (!this.isFormValid()) return;

    try {
      const userId = getStoredUserId();
      const { currentPassword, newPassword } = this.state;

      await updatePassword(userId, { currentPassword, newPassword });
      this.showToast('비밀번호가 성공적으로 변경되었습니다.');

      // 1초 후 로그인 페이지로 이동 (약간 토스트메시지를 보이기 위한 의도적인...지연)
      setTimeout(() => {
        routeChange('/login');
      }, 1000); 
    } catch (error) {
      this.showToast(error.message || '비밀번호 변경에 실패했습니다.')

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
    if (!this.toast) return;
    this.toast.textContent = message;
    this.toast.hidden = false;
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    this.toastTimer = setTimeout(() => {
      this.toast.hidden = true;
    }, 2000);
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
          font-size: 32px;
          color: #111;
          margin-bottom: 12px;
          font-weight: 700;
          text-align: center;
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

        .password-form__toast {
          position: fixed;
          bottom: 32px;
          left: 50%;
          transform: translateX(-50%);
          padding: 14px 20px;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.8);
          color: #fff;
          font-size: 14px;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
        }
      </style>
    `;

    const template = html`
      <div>
        <form class="password-form" data-role="password-form">
          <h2 class="password-form__title">비밀번호 수정</h2>
          <div class="password-form__card">
            <div class="password-form__field" data-field="newPassword">
              <input-box
                label="기존 비밀번호"
                type="password"
                placeholder="비밀번호를 입력하세요"
                required
                name="currentPassword"
              ></input-box>
              <p class="password-form__helper-text" data-helper="currentPassword"></p>
            </div>
            <div class="password-form__field" data-field="newPassword">
              <input-box
                label="새 비밀번호"
                type="password"
                placeholder="비밀번호를 입력하세요"
                required
                name="newPassword"
              ></input-box>
              <p class="password-form__helper-text" data-helper="newPassword"></p>
            </div>
          </div>
          <div class="password-form__actions">
            <custom-button label="수정하기" data-role="submit-button" disabled></custom-button>
          </div>
        </form>
        <div class="password-form__toast" data-role="toast" hidden>수정 완료</div>
      </div>
    `;

    // 이전 렌더링된 내용 초기화 후 새로 추가
    this.shadowRoot.innerHTML = '';
    this.shadowRoot.append(style, ...template.children);
  }
}

// 커스텀 엘리먼트 등록
customElements.define('password-form', PasswordForm);
