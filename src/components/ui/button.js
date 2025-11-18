class CustomButton extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = `
      :host {
        display: block;
        width: 100%;
      }

      button {
        width: 100%;
        height: 48px;
        background-color: #eb9999;
        color: #fff;
        border: none;
        border-radius: 4px;
        font-size: 16px;
        font-weight: 700;
        cursor: pointer;
        transition: background 0.2s;
      }

      button:enabled {
        background-color: #d96060;
      }
    `;

    const button = document.createElement('button');
    button.type = this.getAttribute('type') || 'submit'; // 기본을 submit로 두어 폼에서 바로 사용
    button.textContent = this.getAttribute('label') || '버튼';
    button.disabled = this.hasAttribute('disabled');

    button.addEventListener('click', (event) => {
      if (button.type !== 'submit' || button.disabled) return;

      const form = this.closest('form');
      if (!form) return;

      // Shadow DOM 안에 있는 버튼은 기본 제출 동작이 동작하지 않으므로 수동으로 처리
      event.preventDefault();
      if (typeof form.requestSubmit === 'function') {
        form.requestSubmit();
      } else {
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      }
    });

    this.shadowRoot.append(style, button);
  }

  static get observedAttributes() {
    return ['disabled', 'label'];
  }

  get disabled() {
    return this.hasAttribute('disabled');
  }

  set disabled(value) {
    if (value) {
      this.setAttribute('disabled', '');
    } else {
      this.removeAttribute('disabled');
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    const button = this.shadowRoot.querySelector('button');
    if (name === 'disabled') {
      button.disabled = this.hasAttribute('disabled');
    }
    if (name === 'label') {
      button.textContent = newValue;
    }
  }
}

customElements.define('custom-button', CustomButton);
