import '../ui/button.js';
import '../ui/input-box.js';
import '../ui/confirm-modal.js';
import { html } from '../../core/html.js';
import { fetchUserById, updateProfile, deleteUser } from '../../api/users.js';
import {
  clearStoredToken,
  clearStoredUserId,
  getStoredUserId,
} from '../../utils/auth.js';
import { getNicknameError } from '../../utils/validators.js';
import { routeChange } from '../../core/router.js';
import { dispatchAuthChange } from '../../core/events.js';

const DEFAULT_PROFILE = '';

// 프로필 수정 폼 컴포넌트
class ProfileForm extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    this.state = {
      email: this.getAttribute('email') || '',
      nickname: this.getAttribute('nickname') || '',
      profileImage: DEFAULT_PROFILE,
    };

    this.touched = { nickname: false };
    this.serverErrors = { nickname: '' };
    this.isSaving = false;
    this.isDeleting = false;

    this.render();
  }

  // 컴포넌트가 DOM에 추가될 때 실행
  connectedCallback() {
     // 주요 요소 참조
    this.form = this.shadowRoot.querySelector('[data-role="profile-form"]');
    this.nicknameField = this.shadowRoot.querySelector('input-box[name="nickname"]');
    this.profileCircle = this.shadowRoot.querySelector('[data-role="profile-circle"]');
    this.profileChangeButton = this.shadowRoot.querySelector('[data-role="profile-change"]');
    this.profileInput = this.shadowRoot.querySelector('[data-role="profile-input"]');
    this.helperNickname = this.shadowRoot.querySelector('[data-helper="nickname"]');
    this.primaryButton = this.shadowRoot.querySelector('custom-button');
    this.withdrawButton = this.shadowRoot.querySelector('[data-role="withdraw"]');
    this.toast = this.shadowRoot.querySelector('[data-role="toast"]');
    this.emailDisplay = this.shadowRoot.querySelector('[data-role="email"]');
    this.withdrawModal = this.shadowRoot.querySelector('[data-role="withdraw-modal"]');

    this.updateAvatar();
    this.updateValidation();

    // 닉네임 입력/블러 이벤트 처리
    this.handleNicknameInput = (event) => {
      const { name, value } = event.detail || {};
      if (name !== 'nickname') return;
      this.state.nickname = value;
      this.touched.nickname = true;
      this.serverErrors.nickname = '';
      this.updateValidation();
    };

    this.handleNicknameBlur = (event) => {
      const { name } = event.detail || {};
      if (name !== 'nickname') return;
      this.touched.nickname = true;
      this.updateValidation();
    };

    // 폼 제출 처리
    this.handleSubmit = async (event) => {
      event.preventDefault();
      this.touched.nickname = true;
      this.updateValidation();
      if (!this.isFormValid() || this.isSaving) return;
      await this.saveProfile();
    };

    // 프로필 이미지 변경 관련 이벤트
    this.handleImageClick = () => {
      this.profileInput?.click();
    };

    this.handleAvatarKeydown = (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        this.handleImageClick();
      }
    };

    this.handleImageChange = (event) => {
      const file = event.target.files?.[0];
      this.processSelectedFile(file);
      event.target.value = '';
    };

    // 드래그 앤 드롭 이벤트 처리
    this.handleAvatarDragOver = (event) => {
      event.preventDefault();
      this.profileCircle?.classList.add('is-dragover');
    };

    this.handleAvatarDragLeave = (event) => {
      if (!this.profileCircle) return;
      if (event.relatedTarget && this.profileCircle.contains(event.relatedTarget)) {
        return;
      }
      this.profileCircle.classList.remove('is-dragover');
    };

    this.handleAvatarDrop = (event) => {
      event.preventDefault();
      this.profileCircle?.classList.remove('is-dragover');
      const file = event.dataTransfer?.files?.[0];
      this.processSelectedFile(file);
    };

    // 회원 탈퇴 모달 이벤트 처리
    this.handleWithdraw = () => {
      this.withdrawModal?.open();
    };

    this.handleModalCancel = () => {
      this.withdrawModal?.close();
    };

    this.handleModalConfirm = () => {
      this.deleteAccount();
    };

     // 벤트 리스너 등록
    this.shadowRoot.addEventListener('input-change', this.handleNicknameInput);
    this.shadowRoot.addEventListener('input-blur', this.handleNicknameBlur);
    this.form?.addEventListener('submit', this.handleSubmit);
    this.profileCircle?.addEventListener('click', this.handleImageClick);
    this.profileCircle?.addEventListener('keydown', this.handleAvatarKeydown);
    this.profileCircle?.addEventListener('dragenter', this.handleAvatarDragOver);
    this.profileCircle?.addEventListener('dragover', this.handleAvatarDragOver);
    this.profileCircle?.addEventListener('dragleave', this.handleAvatarDragLeave);
    this.profileCircle?.addEventListener('drop', this.handleAvatarDrop);
    this.profileChangeButton?.addEventListener('click', this.handleImageClick);
    this.profileInput?.addEventListener('change', this.handleImageChange);
    this.withdrawButton?.addEventListener('click', this.handleWithdraw);
    this.withdrawModal?.addEventListener('cancel', this.handleModalCancel);
    this.withdrawModal?.addEventListener('confirm', this.handleModalConfirm);

    this.updateFormFields();
    this.loadProfile();
  }

    // 컴포넌트가 DOM에서 제거될 때 실행
  disconnectedCallback() {
    this.shadowRoot.removeEventListener('input-change', this.handleNicknameInput);
    this.shadowRoot.removeEventListener('input-blur', this.handleNicknameBlur);
    this.form?.removeEventListener('submit', this.handleSubmit);
    this.profileCircle?.removeEventListener('click', this.handleImageClick);
    this.profileCircle?.removeEventListener('keydown', this.handleAvatarKeydown);
    this.profileCircle?.removeEventListener('dragenter', this.handleAvatarDragOver);
    this.profileCircle?.removeEventListener('dragover', this.handleAvatarDragOver);
    this.profileCircle?.removeEventListener('dragleave', this.handleAvatarDragLeave);
    this.profileCircle?.removeEventListener('drop', this.handleAvatarDrop);
    this.profileChangeButton?.removeEventListener('click', this.handleImageClick);
    this.profileInput?.removeEventListener('change', this.handleImageChange);
    this.withdrawButton?.removeEventListener('click', this.handleWithdraw);
    this.withdrawModal?.removeEventListener('cancel', this.handleModalCancel);
    this.withdrawModal?.removeEventListener('confirm', this.handleModalConfirm);
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
  }

  // 닉네임 유효성 검사
  isFormValid() {
    return !getNicknameError(this.state.nickname);
  }

   // 닉네임 에러 및 버튼 상태 갱신
  updateValidation() {
    let nicknameError = this.touched.nickname
      ? getNicknameError(this.state.nickname)
      : '';

    if (!nicknameError && this.serverErrors.nickname) {
      nicknameError = this.serverErrors.nickname;
    }

    if (this.helperNickname) {
      this.helperNickname.textContent = nicknameError;
    }

    if (this.primaryButton) {
      const canSubmit = this.isFormValid() && !this.isSaving;
      if (canSubmit) {
        this.primaryButton.removeAttribute('disabled');
      } else {
        this.primaryButton.setAttribute('disabled', '');
      }
    }
  }

   // 프로필 이미지 파일 선택 처리
  processSelectedFile(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.showToast('이미지 파일을 선택해주세요.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      this.state.profileImage = reader.result;
      this.updateAvatar();
    };
    reader.readAsDataURL(file);
  }

  // 프로필 저장
  async saveProfile() {
    const userId = getStoredUserId();
    if (!userId) {
      this.showToast('로그인이 필요합니다.');
      return;
    }

    this.isSaving = true;
    this.updateValidation();

    try {
      const payload = {
        nickname: this.state.nickname.trim(),
        profileImage: this.state.profileImage || '',
      };
      await updateProfile(userId, payload);
      this.serverErrors.nickname = '';
      this.showToast('수정 완료');
      dispatchAuthChange({ status: 'profile-updated' });
      await this.loadProfile();
    } catch (error) {
      if (error.status === 409) {
        this.serverErrors.nickname = '*중복된 닉네임 입니다.';
        this.updateValidation();
      } else if (error.message) {
        this.showToast(error.message);
      }
      console.error('[ProfileForm] updateProfile error:', error);
    } finally {
      this.isSaving = false;
      this.updateValidation();
    }
  }

  // 회원 탈퇴 처리
  async deleteAccount() {
    if (this.isDeleting) return;
    const userId = getStoredUserId();
    if (!userId) {
      this.showToast('로그인이 필요합니다.');
      return;
    }

    this.withdrawModal?.close();
    if (this.withdrawButton) {
      this.withdrawButton.disabled = true;
    }
    this.isDeleting = true;
    try {
      await deleteUser(userId);
      clearStoredToken();
      clearStoredUserId();
      dispatchAuthChange({ status: 'logout' });
      this.showToast('회원 탈퇴가 완료되었습니다.');
      setTimeout(() => {
        routeChange('/login');
      }, 400);
    } catch (error) {
      console.error('[ProfileForm] deleteUser error:', error);
      this.showToast(error.message || '회원 탈퇴를 실패했습니다.');
    } finally {
      this.isDeleting = false;
      if (this.withdrawButton) {
        this.withdrawButton.disabled = false;
      }
    }
  }

  // 프로필 아바타(이미지) 갱신
  updateAvatar() {
    if (!this.profileCircle) return;
    const image = this.state.profileImage;
    if (image) {
      this.profileCircle.style.backgroundImage = `url("${image}")`;
      this.profileCircle.classList.add('has-image');
    } else {
      this.profileCircle.style.backgroundImage = '';
      this.profileCircle.classList.remove('has-image');
    }
  }

  // 토스트 메시지 표시
  showToast(message) {
    if (!this.toast) return;
    this.toast.textContent = message;
    this.toast.hidden = false;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toast.hidden = true;
    }, 2000);
  }

   // 사용자 프로필 로드
  async loadProfile() {
    const userId = getStoredUserId();
    if (!userId) {
      this.showToast('로그인이 필요합니다.');
      return;
    }

    try {
      const response = await fetchUserById(userId);
      const user= response?.data ?? response;
     
      this.state.email = user.email;
      this.state.nickname = user.nickname;
      this.state.profileImage = user.profileImage || DEFAULT_PROFILE;
      this.serverErrors.nickname = '';
      this.touched.nickname = false;
      this.updateAvatar();
      this.updateFormFields();
      this.updateValidation();
    } catch (error) {
      console.error('[ProfileForm] 사용자 정보를 불러오지 못했습니다:', error);
      this.showToast(error.message || '사용자 정보를 불러오지 못했습니다.');
    }
  }

    // 폼 필드 값 갱신
  updateFormFields() {
    if (this.emailDisplay) {
      this.emailDisplay.textContent = this.state.email || '';
    }
    if (this.nicknameField) {
      this.nicknameField.value = this.state.nickname || '';
    }
  }

   // 🔹 렌더링 함수
  render() {
    const style = html`
      <style>
        :host {
          display: block;
        }

        .profile-form {
          width: 100%;
          max-width: 520px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .profile-form__title {
          font-size: 32px;
          font-weight: 700;
          color: #111;
          margin: 0;
          text-align: center;
        }

        .profile-form__section {
          display: flex;
          flex-direction: column;
          width: 100%;
          gap: 16px;
          align-items: center;
          box-sizing: border-box;
        }

        .profile-form__section-label {
          font-size: 16px;
          font-weight: 600;
          align-self: flex-start;
          color: #333;
        }

        .profile-form__avatar {
          width: 150px;
          height: 150px;
          border-radius: 50%;
          background: #ffbabaff;
          position: relative;
          overflow: hidden;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          background-size: cover;
          background-position: center;
          transition: background-color 0.2s ease, border-color 0.2s ease;
        }

        .profile-form__avatar:hover,
        .profile-form__avatar.is-dragover {
          background: #e9e9e9;
        }

        .profile-form__avatar.is-dragover {
          border-color: #7f6aee;
        }

        .profile-form__avatar-button {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          border-radius: 999px;
          padding: 8px 18px;
          border: none;
          background: rgba(0, 0, 0, 0.72);
          color: #fff;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
        }

        .profile-form__avatar-text {
          font-size: 14px;
          font-weight: 600;
          color: #515251;
          text-align: center;
          padding: 0 12px;
        }

        .profile-form__avatar.has-image .profile-form__avatar-text {
          display: none;
        }

        .profile-form__details {
          width: 100%;
          box-sizing: border-box;
          padding: 32px 28px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .profile-form__field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .profile-form__email-label {
          font-weight: 600;
          font-size: 15px;
          color: #222;
        }

        .profile-form__email {
          font-size: 16px;
          color: #111;
          line-height: 1.6;
          word-break: break-word;
          padding: 12px 0px;
        }

        .profile-form__helper {
          font-size: 13px;
          color: #ff5f5f;
          min-height: 16px;
        }

        .profile-form__actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 100%;
        }

       .profile-form__withdraw {
          background: none;     
          border: none;       
          padding: 0;              
          color: #949494ff;        
          font-size: 15px;        
          font-weight: 600;
          cursor: pointer;
        }



        .profile-form__toast {
          position: fixed;
          bottom: 32px;
          left: 50%;
          transform: translateX(-50%);
          padding: 12px 20px;
          border-radius: 999px;
          background: #ACA0EB;
          color: #fff;
          font-size: 14px;
          z-index: 1000;
        }
      </style>
    `;

    const template = html`
      <div data-role="profile-form-root">
        <form class="profile-form" data-role="profile-form">
          <h2 class="profile-form__title">회원정보수정</h2>
          <div class="profile-form__section">
            <label class="profile-form__section-label">프로필 사진*</label>
            <div
              class="profile-form__avatar"
              data-role="profile-circle"
              tabindex="0"
              role="button"
              aria-label="프로필 이미지를 변경하려면 클릭 또는 드래그하세요"
            >
              <span class="profile-form__avatar-text" data-role="profile-placeholder">
                클릭하거나 이미지를 끌어다 놓으세요
              </span>
              <button
                type="button"
                class="profile-form__avatar-button"
                data-role="profile-change"
              >
                변경
              </button>
              <input type="file" accept="image/*" data-role="profile-input" hidden />
            </div>
          </div>
          <div class="profile-form__details">
            <div class="profile-form__field">
              <span class="profile-form__email-label">이메일</span>
              <div class="profile-form__email" data-role="email"></div>
            </div>
            <div class="profile-form__field">
              <input-box
                class="profile-form__nickname"
                label="닉네임"
                name="nickname"
                type="text"
                placeholder="닉네임을 입력하세요"
              ></input-box>
              <span class="profile-form__helper" data-helper="nickname"></span>
            </div>
            <div class="profile-form__actions">
            <custom-button label="수정하기" disabled></custom-button>
            <button type="button" class="profile-form__withdraw" data-role="withdraw">회원 탈퇴</button>
          </div>
        </form>
        <div class="profile-form__toast" data-role="toast" hidden>수정 완료</div>
        <confirm-modal
          data-role="withdraw-modal"
          title="회원탈퇴 하시겠습니까?"
          description="작성된 게시글과 댓글은 삭제됩니다."
          cancel-label="취소"
          confirm-label="확인"
        ></confirm-modal>
          </div>
          
      </div>
    `;
// 이전 렌더링 내용 초기화 후 새로 삽입
    this.shadowRoot.innerHTML = '';
    this.shadowRoot.append(style, template);
  }
}

// 커스텀 엘리먼트 등록
customElements.define('profile-form', ProfileForm);
