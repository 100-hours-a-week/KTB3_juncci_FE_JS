class InputBox extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = `
      :host {
        display: block;
        width: 100%;
      }

      label {
        font-weight: 600;
        display: block;
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

      :host([error]) input {
        border-color: #FF5F5F;
      }

      :host([required]) label::after {
        content: '*';
        color: #d96060;
        margin-left: 4px;
      }
    `;

    const labelText = this.getAttribute('label') || '';
    const type = this.getAttribute('type') || 'text';
    const placeholder = this.getAttribute('placeholder') || '';
    const name = this.getAttribute('name') || type;
    this.fieldName = name;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <label>${labelText}</label>
      <input type="${type}" name="${name}" placeholder="${placeholder}" />
    `;

    this.shadowRoot.append(style, wrapper);
  }

  connectedCallback() {
    this.inputElement = this.shadowRoot.querySelector('input');
    if (!this.inputElement) return;

    const name = this.fieldName || this.getAttribute('type') || '';

    this.handleInput = (e) => {
      this.dispatchEvent(new CustomEvent('input-change', {
        bubbles: true,
        composed: true,
        detail: { name, value: e.target.value }
      }));
    };

    this.handleBlur = (e) => {
      this.dispatchEvent(new CustomEvent('input-blur', {
        bubbles: true,
        composed: true,
        detail: { name, value: e.target.value }
      }));
    };

    this.inputElement.addEventListener('input', this.handleInput);
    this.inputElement.addEventListener('blur', this.handleBlur);
  }

  get value() {
    return this.inputElement?.value || '';
  }

  set value(newValue) {
    if (this.inputElement) {
      this.inputElement.value = newValue ?? '';
    }
  }

  disconnectedCallback() {
    if (this.inputElement && this.handleInput) {
      this.inputElement.removeEventListener('input', this.handleInput);
    }
    if (this.inputElement && this.handleBlur) {
      this.inputElement.removeEventListener('blur', this.handleBlur);
    }
  }
}

customElements.define('input-box', InputBox);
