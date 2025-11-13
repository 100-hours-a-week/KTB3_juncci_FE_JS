export function validateEmail(value) {
  if (!value) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
}

export function validatePassword(value) {
  if (!value) return false;
  const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[\W_]).{8,20}$/;
  return passwordRegex.test(value);
}

export function getEmailError(value) {
  if (!value) return '*이메일을 입력해주세요.';
  if (!validateEmail(value)) {
    return '*올바른 이메일 주소 형식을 입력해주세요. (예: example@example.com)';
  }
  return '';
}

export function getPasswordError(value) {
  if (!value) return '*비밀번호를 입력해주세요.';
  if (!validatePassword(value)) {
    return '*비밀번호는 8자 이상, 20자 이하이며, 대문자, 소문자, 숫자, 특수문자를 각각 최소 1개 포함해야 합니다.';
  }
  return '';
}

export function getConfirmPasswordError(password, confirm) {
  if (!confirm) return '*비밀번호를 한번 더 입력해주세요.';
  if (password !== confirm) {
    return '*비밀번호가 다릅니다.';
  }
  return '';
}

export function getNicknameError(value) {
  if (!value) return '*닉네임을 입력해주세요.';
  if (/\s/.test(value)) {
    return '*띄어쓰기를 없애주세요.';
  }
  if (value.length > 10) {
    return '*닉네임은 최대 10자 까지 작성 가능합니다.';
  }
  return '';
}

export function getProfileImageError(value) {
  if (!value) return '*프로필 사진을 추가해주세요.';
  return '';
}
