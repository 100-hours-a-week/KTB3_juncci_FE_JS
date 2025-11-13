import { html } from '../../core/html.js';
import { routeChange } from '../../core/router.js';
import { signup } from '../../api/users.js';
import {
  getEmailError,
  getPasswordError,
  getConfirmPasswordError,
  getNicknameError,
  getProfileImageError,
} from '../../utils/validators.js';
import '../ui/input-box.js';
import '../ui/button.js';

// 기본 프로필 이미지 URL
const DEFAULT_PROFILE_IMAGE =
  'https://mblogthumb-phinf.pstatic.net/MjAyMTA3MjNfMjcy/MDAxNjI3MDAzOTczNjg0.stpnH0psXDcHlFzW9oeDqZRKRjQ2xOS0fZtg9IkEEUcg.g789Ilt1nTHNneXKAqEFKkzq57jSRAq_uzPWBqDxwUsg.JPEG.nicenice133/6.jpg?type=w800';

  // 회원가입 폼 컴포넌트
class SignupForm extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    this.state = {
      email: '',
      password: '',
      confirm: '',
      nickname: '',
      profileImage: '',
    };

    this.errors = {
      email: '',
      password: '',
      confirm: '',
      nickname: '',
      profileImage: '',
    };
    this.touched = { profileImage: true };

    // 스타일 정의
    const style = html`
      <style>
        :host {
          display: flex;
          justify-content: center;
          width: 100%;
          font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        *,
        *::before,
        *::after {
          box-sizing: border-box;
        }

        .signup-wrapper {
          width: min(520px, 100%);
          display: flex;
          flex-direction: column;
        }

        h2 {
          font-size: 32px;
          font-weight: 700;
          text-align: center;
          margin: 0;
          color: #222;
        }

        .profile-area {
          padding: 32px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          width: 100%;
        }

        .profile-area label {
          font-size: 16px;
          font-weight: 600;
          align-self: flex-start;
          color: #222;
        }

        .profile-circle {
          width: 160px;
          height: 160px;
          border-radius: 50%;
          background: #d9d9d9;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 48px;
          color: #7a7a7a;
          cursor: pointer;
          overflow: hidden;
          position: relative;
        }

        .profile-circle img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        form {
          padding: 32px 28px 40px;
          display: flex;
          flex-direction: column;
          width: 100%;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .helper-text {
          font-size: 12px;
          color: #ff5f5f;
          margin-top: 4px;
          min-height: 14px;
          visibility: hidden;
        }

        .helper-text.visible {
          visibility: visible;
        }

        .profile-helper {
          width: 100%;
          text-align: left;
          align-self: flex-start;
        }

        .form-submit {
          margin-top: 12px;
        }

        .secondary-action {
          text-align: center;
        }

        .secondary-action button {
          background: none;
          border: none;
          color: #A3A3A3;
          font-weight: 600;
          cursor: pointer;
        }

        input[type='file'] {
          display: none;
        }
      </style>
    `;

    const layout = html`
      <section class="signup-wrapper">
        <h2>회원가입</h2>
        <section class="profile-area">
          <label>프로필 사진</label>
          <div class="profile-circle" data-role="profile-circle" aria-label="프로필 이미지 업로드" role="button">
            <span data-role="profile-placeholder">+</span>
            <img data-role="profile-preview" alt="" hidden />
          </div>
          <input type="file" accept="image/*" data-role="profile-input" />
          <p class="helper-text profile-helper" data-helper="profileImage"></p>
        </section>
        <form data-role="signup-form"></form>
        <div class="secondary-action">
          <button type="button" data-role="login-link">로그인하러 가기</button>
        </div>
      </section>
    `;

     // Shadow DOM 구성
    this.shadowRoot.append(style, layout);
    // 주요 요소 참조
    this.profileCircle = this.shadowRoot.querySelector('[data-role="profile-circle"]');
    this.profileInput = this.shadowRoot.querySelector('[data-role="profile-input"]');
    this.profilePreview = this.shadowRoot.querySelector('[data-role="profile-preview"]');
    this.profilePlaceholder = this.shadowRoot.querySelector('[data-role="profile-placeholder"]');
    this.form = this.shadowRoot.querySelector('[data-role="signup-form"]');

    // 폼 필드 초기화
    if (this.form) {
      this.initializeFormFields();
    }// 프로필 이미지 기본 검사
    this.validateField('profileImage', true);
  }

   // 폼 필드 구성
  initializeFormFields() {
    if (!this.form) return;

    const fieldConfigs = [
      { label: '이메일', name: 'email', type: 'email', placeholder: '이메일을 입력하세요' },
      { label: '비밀번호', name: 'password', type: 'password', placeholder: '비밀번호를 입력하세요' },
      {
        label: '비밀번호 확인',
        name: 'confirm',
        type: 'password',
        placeholder: '비밀번호를 한번 더 입력하세요',
      },
      { label: '닉네임', name: 'nickname', type: 'text', placeholder: '닉네임을 입력하세요' },
    ];

    fieldConfigs.forEach((config) => {
      const fieldElement = this.renderField(config);
      if (fieldElement) {
        this.form.append(fieldElement);
      }
    });

    const submitWrapper = html`
      <div class="form-submit">
        <custom-button type="submit" label="회원가입" disabled></custom-button>
      </div>
    `;

    this.form.append(submitWrapper);
    this.submitButton = submitWrapper.querySelector('custom-button');
  }

   // 컴포넌트가 DOM에 추가될 때 실행
  connectedCallback() {
    this.shadowRoot.addEventListener('input-change', this.handleInputChange);
    this.shadowRoot.addEventListener('input-blur', this.handleBlur);

    if (this.profileCircle) {
      this.profileCircle.addEventListener('click', this.handleProfileClick);
    }
    if (this.profileInput) {
      this.profileInput.addEventListener('change', this.handleProfileChange);
    }

    if (this.form) {
      this.form.addEventListener('submit', this.handleSubmit);
    }

    const link = this.shadowRoot.querySelector('[data-role="login-link"]');
    if (link) {
      link.addEventListener('click', this.handleLoginClick);
    }
  }
// 컴포넌트가 DOM에서 제거될 때 실행
  disconnectedCallback() {
    this.shadowRoot.removeEventListener('input-change', this.handleInputChange);
    this.shadowRoot.removeEventListener('input-blur', this.handleBlur);

    if (this.profileCircle) {
      this.profileCircle.removeEventListener('click', this.handleProfileClick);
    }
    if (this.profileInput) {
      this.profileInput.removeEventListener('change', this.handleProfileChange);
    }

    if (this.form) {
      this.form.removeEventListener('submit', this.handleSubmit);
    }

    const link = this.shadowRoot.querySelector('[data-role="login-link"]');
    if (link) {
      link.removeEventListener('click', this.handleLoginClick);
    }
  }

  // 로그인 페이지 이동
  handleLoginClick = () => {
    routeChange('/login');
  };

  // 프로필 클릭 시 파일 선택 열기
  handleProfileClick = () => {
    this.profileInput?.click();
  };

  // 프로필 이미지 변경
  handleProfileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      this.setProfileImage('');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.setProfileImage(reader.result?.toString() || '');
    };
    reader.readAsDataURL(file);
  };

  // 프로필 이미지 설정
  setProfileImage(value) {
    this.state.profileImage = value;
    if (value && this.profilePreview && this.profilePlaceholder) {
      this.profilePreview.src = value;
      this.profilePreview.hidden = false;
      this.profilePlaceholder.hidden = true;
    } else if (this.profilePreview && this.profilePlaceholder) {
      this.profilePreview.hidden = true;
      this.profilePreview.removeAttribute('src');
      this.profilePlaceholder.hidden = false;
    }
    if (this.profileInput) {
      this.profileInput.value = '';
    }
    this.validateField('profileImage', this.touched.profileImage);
    this.updateSubmitState();
  }

  // 인풋 입력 처리
  handleInputChange = (event) => {
    const detail = event.detail;
    if (!detail || !detail.name) return;
    const { name, value = '' } = detail;
    const sanitizedValue = name === 'password' || name === 'confirm' ? value : value.trim();
    this.state = { ...this.state, [name]: sanitizedValue };
    this.validateField(name, this.touched[name]);
    this.updateSubmitState();
  };

  // 인풋 블러 처리
  handleBlur = (event) => {
    const detail = event.detail;
    if (!detail || !detail.name) return;
    const { name } = detail;
    this.touched[name] = true;
    this.validateField(name, true);
    this.updateSubmitState();
  };

  // 필드 유효성 검사
  validateField(name, showError = false) {
    const message = this.getValidationMessage(name);
    this.errors[name] = message;

    if (message) {
      if (showError) {
        this.updateHelper(name, message);
      }
    } else {
      this.updateHelper(name, '');
    }
  }

  // 각 필드의 검증 메시지 반환
  getValidationMessage(name) {
    const value = this.state[name] || '';
    switch (name) {
      case 'email':
        return getEmailError(value);
      case 'password':
        return getPasswordError(value);
      case 'confirm':
        return getConfirmPasswordError(this.state.password, value);
      case 'nickname':
        return getNicknameError(value);
      case 'profileImage':
        return getProfileImageError(this.state.profileImage);
      default:
        return '';
    }
  }

   // 헬퍼 텍스트 업데이트
  updateHelper(name, message) {
    const helper = this.shadowRoot.querySelector(`[data-helper="${name}"]`);
    const inputBox = this.shadowRoot.querySelector(`input-box[name="${name}"]`);
    if (!helper) return;

    if (message) {
      helper.textContent = message;
      helper.classList.add('visible');
      if (inputBox) {
        inputBox.setAttribute('error', '');
      }
    } else {
      helper.textContent = '';
      helper.classList.remove('visible');
      if (inputBox) {
        inputBox.removeAttribute('error');
      }
    }
  }

  // 폼 전체 유효성 검사
  isFormValid(showErrors = false) {
    const validations = ['email', 'password', 'confirm', 'nickname', 'profileImage'];
    const hasErrors = validations.some((field) => {
      const message = this.getValidationMessage(field);
      this.errors[field] = message;
      if (showErrors) {
        this.touched[field] = true;
        this.validateField(field, true);
      }
      return Boolean(message);
    });
    return !hasErrors;
  }

  // 제출 버튼 상태 갱신
  updateSubmitState() {
    if (this.submitButton) {
      const validations = ['email', 'password', 'confirm', 'nickname', 'profileImage'];
      const hasErrors = validations.some((field) => Boolean(this.getValidationMessage(field)));
      this.submitButton.disabled = hasErrors;
    }
  }

  // 회원가입 제출 처리
  handleSubmit = async (event) => {
    event.preventDefault();
    if (!this.isFormValid(true)) {
      this.updateSubmitState();
      return;
    }

    const payload = {
      email: this.state.email,
      password: this.state.password,
      nickname: this.state.nickname,
      profile_image: DEFAULT_PROFILE_IMAGE,
    };

    const submitButton = this.submitButton;
    const originalLabel = submitButton?.getAttribute('label') || '회원가입';
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.setAttribute('label', '처리 중...');
    }

    try {
      await signup(payload);
      alert('회원가입이 완료되었습니다. 로그인 화면으로 이동합니다.');
      routeChange('/login');
    } catch (error) {
      alert(error.message || '회원가입에 실패했습니다.');
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.setAttribute('label', originalLabel);
      }
    }
  };

   // 필드 렌더링
  renderField({ label, name, type, placeholder }) {
    return html`
      <div class="field">
        <input-box
          label="${label}"
          name="${name}"
          type="${type}"
          placeholder="${placeholder}"
          required
        ></input-box>
        <p class="helper-text" data-helper="${name}"></p>
      </div>
    `;
  }
}

// 커스텀 엘리먼트 등록
customElements.define('signup-form', SignupForm);
