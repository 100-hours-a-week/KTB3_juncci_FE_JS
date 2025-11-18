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
  if (!value) return '*Plz enter your email.';
  if (!validateEmail(value)) {
    return '*Plz enter a valid email address. (ex: example@example.com)';
  }
  return '';
}

export function getPasswordError(value) {
  if (!value) return '*Plz enter your password.';
  if (!validatePassword(value)) {
    return '*Password must be 8–20 characters with uppercase, lowercase, a number, and a symbol.';
  }
  return '';
}

export function getConfirmPasswordError(password, confirm) {
  if (!confirm) return '*Plz re-enter your password.';
  if (password !== confirm) {
    return '*Passwords do not match.';
  }
  return '';
}

export function getNicknameError(value) {
  if (!value) return '*Plz enter your nickname.';
  if (/\s/.test(value)) {
    return '*Plz remove spaces.';
  }
  if (value.length > 10) {
    return '*Nickname can be up to 10 characters.';
  }
  return '';
}

export function getProfileImageError(value) {
  if (!value) return '*Plz add a profile photo.';
  return '';
}
