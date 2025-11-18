import { html } from '../../core/html.js';
import { createPost, fetchPostById, updatePost } from '../../api/posts.js';
import { routeChange } from '../../core/router.js';
import '../ui/button.js';

// 게시글 작성/수정 폼 컴포넌트
export class PostEditor extends HTMLElement {
  // mode와 post-id 속성 변화를 감지
  static get observedAttributes() {
    return ['mode', 'post-id'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    // 기본 상태 설정
    this.mode = 'write'; // 'write' | 'edit'
    this.postId = null;
    this.isMounted = false;

    // 폼 데이터 상태
    this.state = {
      title: '',
      content: '',
      image: '',
    };

    // 유효성 검사 에러 메시지 저장
    this.errors = {
      title: '',
      content: '',
    };

    // 사용자가 입력한 필드 추적 (touched)
    this.touched = {};

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

        .post-editor {
          width: min(640px, 100%);
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        h2 {
          font-size: 40px;
          font-weight: 700;
          text-align: center;
          margin: 0;
          color: #222;
          font-family: 'Nanum Pen Script', cursive;
        }

        form {
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .field-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        label {
          font-size: 16px;
          font-weight: 600;
          color: #222;
        }

        .required {
          color: #d96060;
          margin-left: 4px;
        }

        .input-box {
          width: 100%;
          border: 1px solid #dcdcdc;
          border-radius: 4px;
          padding: 18px 20px;
          font-size: 16px;
          background: #F4F5F7;
          transition: border-color 0.2s;
        }

        .input-box:focus {
          outline: none;
          border-color: ##d96060;
        }

        .input-box.error {
          border-color: #ff5f5f;
        }

        textarea.input-box {
          min-height: 260px;
          resize: vertical;
          line-height: 1.6;
        }

        .helper-text {
          font-size: 13px;
          color: #ff5f5f;
          margin-top: -4px;
          visibility: hidden;
          min-height: 1em; 
        }

        .char-count {
          font-size: 13px;
          color: #9d9d9d;
        }

        .image-field {
          gap: 10px;
        }

        .image-upload {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .image-input {
          font-size: 0;
          border: none;
          background: none;
          padding: 0;
          margin: 0;
        }

        .image-input::file-selector-button,
        .image-input::-webkit-file-upload-button {
          font-size: 14px;
          padding: 8px 16px;
          border-radius: 4px;
          border: 1px solid #333;
          background-color: #c7c7c7;
          cursor: pointer;
          transition: background-color 0.2s, border-color 0.2s;
        }

        .image-input::file-selector-button:hover,
        .image-input::-webkit-file-upload-button:hover {
          background-color: #ececec;
          border-color: #b3b3b3;
        }

        .image-filename {
          font-size: 14px;
          color: #515251;
        }

        .form-actions {
          display: flex;
          flex-direction: column;
        }

        .form-helper {
          font-size: 13px;
          color: #ff5f5f;
        }

        custom-button[data-role='submit'] {
          padding: 0px 100px;
        }
      </style>
    `;

    // HTML 레이아웃 정의
    const layout = html`
      <section class="post-editor">
        <h2 data-role="heading">Just write!</h2>
        <form novalidate>
          <!-- 제목 입력 -->
          <div class="field">
            <div class="field-header">
              <label>Title<span class="required">*</span></label>
              <span class="char-count" data-role="title-count">0/26</span>
            </div>
            <input
              class="input-box"
              name="title"
              type="text"
              maxlength="26"
              data-role="title"
              placeholder="Please enter a title. (Up to 26 characters)"
            />
          </div>

          <!-- 내용 입력 -->
          <div class="field">
            <label>Content<span class="required">*</span></label>
            <textarea
              class="input-box"
              name="content"
              data-role="content"
              placeholder="Please enter the content."
            ></textarea>
            <p class="helper-text" data-helper="content"></p>
          </div>

          <!-- 
          <div class="field image-field">
            <label>img</label>
            <div class="image-upload">
              <input type="file" accept="image/*" class="image-input" data-role="image-input" />
              <span class="image-filename" data-role="image-filename">Plz select img</span>
            </div>
          </div>
이미지 업로드 -->
          <!-- 제출 버튼 -->
          <div class="form-actions">
            <custom-button type="submit" label="submit" data-role="submit" disabled></custom-button>
          </div>
        </form>
      </section>
    `;

    this.shadowRoot.append(style, layout);

    // 요소 참조
    this.headingEl = this.shadowRoot.querySelector('[data-role="heading"]');
    this.titleInput = this.shadowRoot.querySelector('[data-role="title"]');
    this.titleCountEl = this.shadowRoot.querySelector('[data-role="title-count"]');
    this.contentInput = this.shadowRoot.querySelector('[data-role="content"]');
    this.imageInput = this.shadowRoot.querySelector('[data-role="image-input"]');
    this.imageFilenameEl = this.shadowRoot.querySelector('[data-role="image-filename"]');
    this.submitButton = this.shadowRoot.querySelector('[data-role="submit"]');
    this.helperTextEl = this.shadowRoot.querySelector('[data-helper="content"]');
    this.formMessageEl = this.shadowRoot.querySelector('[data-role="form-message"]');
    this.formEl = this.shadowRoot.querySelector('form');

    // 이벤트 핸들러 바인딩
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleImageChange = this.handleImageChange.bind(this);
    this.syncAttributes = this.syncAttributes.bind(this);
  }

  // mode / post-id 속성을 내부 상태와 동기화
  syncAttributes() {
    const modeAttr = (this.getAttribute('mode') || '').toLowerCase();
    this.mode = modeAttr === 'edit' ? 'edit' : 'write';
    const postIdAttr = this.getAttribute('post-id');
    if (postIdAttr) {
      this.postId = postIdAttr;
    }
  }

  // DOM에 추가될 때
  connectedCallback() {
    this.syncAttributes();
    this.shadowRoot.addEventListener('input', this.handleInputChange);
    if (this.formEl) this.formEl.addEventListener('submit', this.handleSubmit);
    if (this.imageInput) this.imageInput.addEventListener('change', this.handleImageChange);
    this.isMounted = true;

    // 수정 모드인 경우 게시글 불러오기
    const postId = this.getAttribute('post-id');
    if (postId) {
      this.postId = postId;
      this.loadPost(postId);
    } else {
      this.applyInitialValues();
      this.updateSubmitState();
    }
  }

  // DOM에서 제거될 때
  disconnectedCallback() {
    this.shadowRoot.removeEventListener('input', this.handleInputChange);
    if (this.formEl) this.formEl.removeEventListener('submit', this.handleSubmit);
    if (this.imageInput) this.imageInput.removeEventListener('change', this.handleImageChange);
  }

  // 속성 변경 시 처리
  attributeChangedCallback(name, _old, value) {
    if (!this.isMounted) {
      // 연결 전에는 상태만 저장
      if (name === 'mode') {
        this.mode = value === 'edit' ? 'edit' : 'write';
      } else if (name === 'post-id') {
        this.postId = value;
      }
      return;
    }

    if (name === 'mode') {
      this.mode = value === 'edit' ? 'edit' : 'write';
      this.applyInitialValues();
      if (this.mode === 'edit' && this.postId) {
        this.loadPost(this.postId);
      }
    } else if (name === 'post-id') {
      this.postId = value;
      if (this.postId && this.mode === 'edit') {
        this.loadPost(this.postId);
      }
    }
  }

  // 게시글 불러오기 (수정 모드일 때만)
  async loadPost(postId) {
    if (this.mode !== 'edit' || !postId) {
      this.applyInitialValues();
      return;
    }

    this.showFormMessage('게시글을 불러오는 중입니다...');
    this.disableForm(true);

    try {
      const data = await fetchPostById(postId);
      this.state.title = data.title || '';
      this.state.content = data.content || '';
      this.state.image = Array.isArray(data.images) ? data.images[0] || '' : data.image || '';
      this.applyInitialValues();
      this.showFormMessage('');
    } catch (error) {
      this.showFormMessage(error.message || '게시글을 불러오지 못했습니다.');
    } finally {
      this.disableForm(false);
    }
  }

  // 초기값 적용
  applyInitialValues() {
    if (
      !this.titleInput ||
      !this.contentInput ||
      !this.submitButton ||
      !this.headingEl
    ) {
      return;
    }
    this.titleInput.value = this.state.title || '';
    this.contentInput.value = this.state.content || '';
    if (this.imageInput) this.imageInput.value = '';
    this.updateImageFilename(this.state.image ? '기존 파일 명' : undefined);
    this.headingEl.textContent = this.mode === 'edit' ? 'Edit Post' : 'Just write!';
    this.submitButton.setAttribute('label', this.mode === 'edit' ? 'edit' : 'submit');
    this.updateTitleCount();
    this.updateSubmitState();
  }

  // 입력 이벤트 처리
  handleInputChange(event) {
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return;

    if (target === this.titleInput) {
      this.state.title = target.value.trimStart();
      this.updateTitleCount();
      this.validateField('title', this.touched.title);
    }

    if (target === this.contentInput) {
      this.state.content = target.value.trimStart();
      this.validateField('content', this.touched.content);
    }

    if (target.name) this.touched[target.name] = true;
    this.updateSubmitState();
  }

  // 필드 유효성 검사
  validateField(name, _showError = false) {
    const message = this.getValidationMessage(name);
    this.errors[name] = message;
    const input = name === 'title' ? this.titleInput : this.contentInput;
    if (input) {
      if (message) input.classList.add('error');
      else input.classList.remove('error');
    }
    this.updateHelper();
  }

  // 각 필드별 에러 메시지
  getValidationMessage(name) {
    if (name === 'title') {
      const value = this.state.title || '';
      if (!value.trim()) return '* 제목을 입력해주세요.';
      if (value.trim().length > 26) return '제목은 26자를 넘을 수 없습니다.';
      return '';
    }
    if (name === 'content') {
      const value = this.state.content || '';
      if (!value.trim()) return '* 내용을 입력해주세요.';
      return '';
    }
    return '';
  }

  // 하단 헬퍼 메시지 업데이트
  updateHelper() {
    if (!this.helperTextEl) return;
    const msg = this.getCombinedHelperMessage();
    this.helperTextEl.textContent = msg || '';
    this.helperTextEl.style.visibility = msg ? 'visible' : 'hidden';
  }

  // 제목 + 내용 에러 메시지 통합
  getCombinedHelperMessage() {
    const titleErr = this.errors.title?.trim();
    const contentErr = this.errors.content?.trim();
    if (titleErr && contentErr) return '* 제목, 내용을 모두 작성해주세요.';
    return titleErr || contentErr || '';
  }

  // 제목 글자 수 표시
  updateTitleCount() {
    const len = this.titleInput?.value.length || 0;
    this.titleCountEl.textContent = `${len}/26`;
  }

  // 폼 전체 유효성 검사
  isFormValid(showErrors = false) {
    const title = this.state.title?.trim();
    const content = this.state.content?.trim();
    const valid = Boolean(title) && Boolean(content);

    if (showErrors) {
      this.titleInput.classList.toggle('error', !title);
      this.contentInput.classList.toggle('error', !content);
    }

    return valid;
  }

  // 제출 버튼 활성화 여부 업데이트
  updateSubmitState() {
    if (!this.submitButton) return;
    const ready = this.isFormValid();
    ready
      ? this.submitButton.removeAttribute('disabled')
      : this.submitButton.setAttribute('disabled', '');
  }

  // 이미지 파일 선택 시 처리
  handleImageChange(event) {
    const file = event.target.files?.[0];
    if (!file) {
      this.state.image = '';
      this.updateImageFilename();
      return;
    }

    this.updateImageFilename(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      this.state.image = reader.result?.toString() || '';
    };
    reader.readAsDataURL(file);
  }

  // 파일 이름 표시
  updateImageFilename(name) {
    if (this.imageFilenameEl) {
      this.imageFilenameEl.textContent = name || 'Plz select file.';
    }
  }

  // 폼 제출 처리
  async handleSubmit(event) {
    event.preventDefault();

    // 유효성 검사
    this.validateField('title', true);
    this.validateField('content', true);
    if (!this.isFormValid(true)) {
      this.updateSubmitState();
      return;
    }

    // API 전송 데이터 구성
    const images = (this.state.image ? [this.state.image] : []).filter(Boolean);
    const payload = {
      title: this.state.title.trim(),
      content: this.state.content.trim(),
      ...(images.length ? { images } : {}),
    };

    // 버튼 비활성화
    this.submitButton.setAttribute('disabled', '');
    this.submitButton.setAttribute('label', this.mode === 'edit' ? 'edit...' : 'loading...');

    try {
      if (this.mode === 'edit' && this.postId) {
        await updatePost(this.postId, payload);
        alert('Edit Post!');
        routeChange(`/post/${this.postId}`);
      } else {
        await createPost(payload);
        alert('Upload Post');
        routeChange('/post');
      }
    } catch (error) {
      const msg = error?.message || '요청을 처리하지 못했습니다.';
      this.showFormMessage(msg);
      if (this.mode === 'edit') alert(msg);
    } finally {
      this.submitButton.removeAttribute('disabled');
      this.submitButton.setAttribute('label', this.mode === 'edit' ? 'Edit Post' : 'submit');
      this.updateSubmitState();
    }
  }

  // 폼 메시지 표시
  showFormMessage(message) {
    if (this.formMessageEl) this.formMessageEl.textContent = message || '';
  }

  // 입력 폼 활성화/비활성화
  disableForm(state) {
    const disabled = Boolean(state);
    if (this.titleInput) this.titleInput.disabled = disabled;
    if (this.contentInput) this.contentInput.disabled = disabled;
    if (this.imageInput) this.imageInput.disabled = disabled;
    if (this.submitButton) {
      if (disabled) this.submitButton.setAttribute('disabled', '');
      else this.updateSubmitState();
    }
  }
}

// 커스텀 엘리먼트 등록
customElements.define('post-editor', PostEditor);
