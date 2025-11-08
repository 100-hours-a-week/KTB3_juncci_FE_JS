import '../components/login-form/login-form.js';
 
export function LoginPage() {
  const container = document.createElement('div');
  const loginForm = document.createElement('login-form');
  container.append(loginForm);
  return container;
}
