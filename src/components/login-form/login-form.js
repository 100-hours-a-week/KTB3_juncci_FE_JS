import { html } from '../../core/html.js';
import { login } from '../../api/auth.js';

export function LoginForm() {
  const form = html`
    <form class="login-form">
      <h2 class="login-form__title">로그인</h2>
      <div class="login-form__body">
        
        <div class="login-form__field">
          <p class="login-form__label">이메일</p>
          <input type="email" class="login-form__input" placeholder="이메일을 입력하세요" required />
        </div>


        <div class="login-form__field">
          <p class="login-form__label">비밀번호</p>
          <input type="password" class="login-form__input" placeholder="비밀번호를 입력하세요" required />
        </div>

        
        <p class="helper-text" id="helper-text"></p>

      
        <button type="submit" class="login-form__button" disabled>로그인</button>

 
        <p class="signup-text" id="signup-text">회원가입</p>
      </div>
    </form>
  `;

  // 엘리먼트 참조
  const emailInput = form.querySelector('input[type="email"]');
  const passwordInput = form.querySelector('input[type="password"]');
  const messageEl = form.querySelector('#helper-text');
  const button = form.querySelector('.login-form__button');

  // 실시간 입력 이벤트
  emailInput.addEventListener('input', handleInput);
  passwordInput.addEventListener('input', handleInput);

  form.addEventListener('submit', handleSubmit);

 
  function handleInput() {
    const isEmailValid = validateEmail(emailInput.value);
    const isPasswordValid = validatePassword(passwordInput.value);

   
    if (!isEmailValid) {
      showMessage('* 올바른 이메일 주소를 입력해주세요. (예: example@example.com)', 'error');
    } else if (!isPasswordValid) {
      showMessage('* 비밀번호는 8~20자, 대소문자+숫자+특수문자를 포함해야 합니다.', 'error');
    } else {
      showMessage('', 'success');
    }

    // 버튼 색상 및 활성화 상태 변경
    const isFormValid = isEmailValid && isPasswordValid;
    button.disabled = !isFormValid;
    button.style.backgroundColor = isFormValid ? '#7F6AEE' : '#ACA0EB';
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    // 최종 검증 (서버 요청 전)
    if (!validateEmail(email) || !validatePassword(password)) {
      showMessage('* 이메일 또는 비밀번호 형식이 올바르지 않습니다.', 'error');
      return;
    }

    try {
      const data = await login({ email, password });
      const token = data.access_token;
      localStorage.setItem('access_token', token);

      showMessage('로그인 성공!', 'success');

    
    } catch (err) {
      showMessage('* 아이디 또는 비밀번호를 확인해주세요.', 'error');
    }
  }

 
  function validateEmail(value) { //이메일 유효성 검사
    if (!value) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  }

  function validatePassword(value) {
    if (!value) return false;

    const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[\W_]).{8,20}$/;
    return passwordRegex.test(value);
  }


  function showMessage(msg, type) {
    if (!messageEl) return;
    messageEl.textContent = msg;
    messageEl.style.color = type === 'error' ? 'red' : 'green';
  }

  return form;
}
