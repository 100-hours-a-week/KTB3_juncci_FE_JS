class InputBox extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    
    const style = document.createElement('style');
    style.textContent = `

      label {
        font-weight: 600;
        display: block;
        margin-bottom: 6px;
      }

      input {
        width: 100%;
        height: 48px;
        border: 1.5px solid #515251;
        border-radius: 4px;
        font-size: 16px;
        padding: 0 14px;
        box-sizing: border-box;
        outline: none;
        transition: border-color 0.2s;
      }

      input:focus {
        border-color: #7F6AEE;
      }
    `;

    const labelText = this.getAttribute('label') || '';
    const type = this.getAttribute('type') || 'text';
    const placeholder = this.getAttribute('placeholder') || '';

    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <label>${labelText}</label>
      <input type="${type}" placeholder="${placeholder}" />
    `;

    this.shadowRoot.append(style, wrapper);
  }

  connectedCallback() {
    const input = this.shadowRoot.querySelector('input');
    const name = this.getAttribute('type'); // email, password 구분용

    input.addEventListener('input', (e) => {
      this.dispatchEvent(new CustomEvent('input-change', {
        bubbles: true,
        composed: true,
        detail: { name, value: e.target.value }
      }));
    });
  }

  get value() {
    return this.shadowRoot.querySelector('input').value;
  }
}

customElements.define('input-box', InputBox);
