import { h, createElement, updateElement } from '../../core/vdom.js';
import { store } from '../../core/store.js';
import { login } from '../../api/users.js';
import { routeChange } from '../../core/router.js';
import { getEmailError, getPasswordError } from '../../utils/validators.js';

class LoginForm extends HTMLElement {
  constructor() {
    super();

    // 스타일은 고정
    const style = document.createElement('style');
    style.textContent = `
      :host {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
      }
      form {
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      h2 {
        font-size: 80px;
        margin-top: 120px;
        margin-bottom: 0;
        color: #222;
        text-align: center;
        font-family: 'Nanum Pen Script', cursive;
      }
      .login-form__body {
        width: 390px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-top: 40px;
        background-color:#ffffff;
        padding:20px;
        border-radius: 12px;
        border: 1px solid #d8e7f0;
      }
      .field {
        display: flex;
        flex-direction: column;
      }
      label {
        font-weight: 600;
        margin-bottom: 6px;
      }
      input {
        width: 100%;
        height: 48px;
        border: 1.5px solid #d8e7f0 ;
        border-radius: 4px;
        font-size: 16px;
        padding: 0 14px;
        box-sizing: border-box;
        outline: none;
        transition: border-color 0.2s;
      }
      input:focus {
        border-color: #6292f9ff;
      }
      button.submit {
        width: 100%;
        height: 48px;
        background-color: #d8e7f0;
        color: #fff;
        border: none;
        border-radius: 4px;
        font-size: 16px;
        font-weight: 700;
        cursor: pointer;
        transition: background 0.2s;
      }
      button.submit:enabled {
        background-color: #d96060;
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
        color: #6f6f6fff;
        font-weight: 600;
        cursor: pointer;
        text-decoration: underline;
      }
    `;
    this.append(style);

    // VDOM이 들어갈 컨테이너
    this.container = document.createElement('div');
    this.append(this.container);

    this.loginFailed = false;
    this.vdom = null; // 이전 VDOM 저장용

    this.render();
  }

  //DOM의 형태를 본따 만든 객체 덩어리
  template(state, loginFailed) {
    const email = state.email || '';
    const password = state.password || '';

    const message =
      getEmailError(email.trim()) ||
      getPasswordError(password) ||
      (loginFailed ? '*Please check your e-mail or password.' : '');

    return h(
      'form',
      {
        onSubmit: (e) => this.onSubmit(e),
      },
      h('h2', null, 'Log in'),
      h(
        'div',
        { className: 'login-form__body' },

        // email 덩어리
        h(
          'div',
          { className: 'field' },
          h('label', null, 'e-mail'),
          h('input', {
            type: 'email',
            name: 'email',
            value: state.email,
            placeholder: 'Please enter your email.',
            value: email,
            onInput: (e) => this.onInput(e),
          })
        ),

        // password 덩어리
        h(
          'div',
          { className: 'field' },
          h('label', null, 'password'),
          h('input', {
            type: 'password',
            name: 'password',
            value: state.password,
            placeholder: 'Please enter your password.',
            value: password,
            onInput: (e) => this.onInput(e),
          }),
          h('p', { className: 'helper-text' }, message)
        ),

        // submit button 덩어리
        h(
          'button',
          {
            type: 'submit',
            className: 'submit',
            disabled: Boolean(message),
          },
          'submit'
        ),

        // sign up 버튼
        h(
          'p',
          { className: 'signup-link' },
          h(
            'button',
            {
              type: 'button',
              onClick: () => routeChange('/signup'),
            },
            'sign up'
          )
        )
      )
    );
  }

  render() {
  console.log("%c==========[VDOM] render() 호출 시작==========", "color: black; font-weight: bold");

  const state = store.getState();
  const newVdom = this.template(state, this.loginFailed);



  // 첫 렌더 시작
  if (!this.vdom) {
    const dom = createElement(newVdom);
    this.container.appendChild(dom);
    this.vdom = newVdom;



    return;
  }



  // diff + patch 역할 수행
  updateElement(this.container, newVdom, this.vdom);



  // VDOM 갱신
  this.vdom = newVdom;
}


  onInput(e) {
    const { name, value } = e.target;
    store.setState({ [name]: value });
    this.loginFailed = false;
    this.render();
  }

  async onSubmit(e) {
    e.preventDefault();
    const { email, password } = store.getState();

    try {
      await login({ email: email.trim(), password });
      this.loginFailed = false;
      routeChange('/post');
    } catch (err) {
      console.error('[Login Error]', err);
      this.loginFailed = true;
      this.render();
    }
  }
}

customElements.define('login-form', LoginForm);
