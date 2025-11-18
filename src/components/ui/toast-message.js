import { html } from '../../core/html.js';

const DEFAULT_DURATION = 2000;

class ToastMessage extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.render();
  }

  connectedCallback() {
    this.toast = this.shadowRoot.querySelector('.toast-message__container');
    if (!this.toast) return;
    this.setLiveRegion();
  }

  disconnectedCallback() {
    if (this.timer) {
      clearTimeout(this.timer);
    }
  }

  static get observedAttributes() {
    return ['duration'];
  }

  attributeChangedCallback(name, _oldValue, newValue) {
    if (name === 'duration') {
      this.duration = Number(newValue) || DEFAULT_DURATION;
    }
  }

  getDuration() {
    if (typeof this.duration === 'number') return this.duration;
    return Number(this.getAttribute('duration')) || DEFAULT_DURATION;
  }

  setLiveRegion() {
    if (!this.toast.getAttribute('role')) {
      this.toast.setAttribute('role', 'status');
    }
    if (!this.toast.getAttribute('aria-live')) {
      this.toast.setAttribute('aria-live', 'polite');
    }
  }

  show(message, options = {}) {
    if (!this.toast) return;
    const { duration = this.getDuration() } = options;
    this.toast.textContent = message;
    this.toast.hidden = false;
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(() => {
      this.hide();
    }, duration);
  }

  hide() {
    if (!this.toast) return;
    this.toast.hidden = true;
  }

  render() {
    const style = html`
      <style>
        :host {
          position: fixed;
          left: 50%;
          bottom: 32px;
          transform: translateX(-50%);
          z-index: 1000;
        }

        .toast-message__container {
          padding: 12px 20px;
          border-radius: 999px;
          background: #111;
          color: #fff;
          font-size: 14px;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.18);
        }

        :host([variant='primary']) .toast-message__container {
          background: #aca0eb;
        }
      </style>
    `;

    const template = html`
      <div class="toast-message__container" hidden></div>
    `;

    this.shadowRoot.innerHTML = '';
    this.shadowRoot.append(style, template);
  }
}

customElements.define('toast-message', ToastMessage);
