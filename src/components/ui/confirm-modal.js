class ConfirmModal extends HTMLElement {
  static get observedAttributes() {
    return ['open', 'title', 'description', 'confirm-label', 'cancel-label'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.handleKeydown = this.handleKeydown.bind(this);
    this.render();
  }

  connectedCallback() {
    this.backdrop = this.shadowRoot.querySelector('[data-role="overlay"]');
    this.cancelButton = this.shadowRoot.querySelector('[data-role="cancel"]');
    this.confirmButton = this.shadowRoot.querySelector('[data-role="confirm"]');
    this.titleEl = this.shadowRoot.querySelector('[data-role="title"]');
    this.descriptionEl = this.shadowRoot.querySelector('[data-role="description"]');

    this.backdrop?.addEventListener('click', this.handleBackdropClick);
    this.cancelButton?.addEventListener('click', this.handleCancel);
    this.confirmButton?.addEventListener('click', this.handleConfirm);
  }

  disconnectedCallback() {
    this.backdrop?.removeEventListener('click', this.handleBackdropClick);
    this.cancelButton?.removeEventListener('click', this.handleCancel);
    this.confirmButton?.removeEventListener('click', this.handleConfirm);
    document.removeEventListener('keydown', this.handleKeydown);
  }

  attributeChangedCallback(name, _oldValue, newValue) {
    if (!this.shadowRoot) return;
    if (name === 'open') {
      const isOpen = this.hasAttribute('open');
      this.updateOpenState(isOpen);
    } else if (name === 'title' && this.titleEl) {
      this.titleEl.textContent = newValue || '';
    } else if (name === 'description' && this.descriptionEl) {
      this.descriptionEl.textContent = newValue || '';
    } else if (name === 'confirm-label' && this.confirmButton) {
      this.confirmButton.textContent = newValue || '확인';
    } else if (name === 'cancel-label' && this.cancelButton) {
      this.cancelButton.textContent = newValue || '취소';
    }
  }

  open() {
    this.setAttribute('open', '');
  }

  close() {
    this.removeAttribute('open');
  }

  updateOpenState(isOpen) {
    const modal = this.shadowRoot.querySelector('.modal');
    if (!modal) return;
    modal.setAttribute('aria-hidden', String(!isOpen));

    if (isOpen) {
      document.addEventListener('keydown', this.handleKeydown);
    } else {
      document.removeEventListener('keydown', this.handleKeydown);
    }
  }

  handleBackdropClick = (event) => {
    if (event.target !== this.backdrop) return;
    this.handleCancel();
  };

  handleCancel = () => {
    this.close();
    this.dispatchEvent(
      new CustomEvent('cancel', { bubbles: true, composed: true })
    );
  };

  handleConfirm = () => {
    this.close();
    this.dispatchEvent(
      new CustomEvent('confirm', { bubbles: true, composed: true })
    );
  };

  handleKeydown(event) {
    if (event.key === 'Escape') {
      this.handleCancel();
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          position: fixed;
          inset: 0;
          display: none;
          pointer-events: none;
          z-index: 999;
        }

        :host([open]) {
          display: block;
          pointer-events: auto;
        }

        .modal {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.45);
          padding: 20px;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s ease;
        }

        :host([open]) .modal {
          opacity: 1;
          pointer-events: auto;
        }

        .modal__panel {
          width: min(410px, 240px);
          border-radius: 14px;
          background: #fff;
          padding: 40px 24px 40px;
          text-align: center;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.18);
        }

        h3 {
          margin: 0;
          font-size: 16px;
          color: #111;
        }

        p {
          margin: 10px 0 20px;
          font-size: 14px;
          color: #666;
        }

        .modal__actions {
          display: flex;
          justify-content: center;
          gap: 10px;
        }

        .modal__button {
          min-width: 82px;
          height: 30px;
          border-radius: 8px;
          border: none;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }

        .modal__button--secondary {
          background: #111;
          color: #fff;
          font-weight:400;
        }

        .modal__button--primary {
          background: #aca0eb;
          color: #000000ff;
          font-weight:400;
        }
      </style>

      <div class="modal" aria-hidden="true" data-role="overlay">
        <div class="modal__panel" role="dialog" aria-modal="true">
          <h3 data-role="title">${this.getAttribute('title') || ''}</h3>
          <p data-role="description">${this.getAttribute('description') || ''}</p>
          <div class="modal__actions">
            <button
              type="button"
              class="modal__button modal__button--secondary"
              data-role="cancel"
            >
              ${this.getAttribute('cancel-label') || '취소'}
            </button>
            <button
              type="button"
              class="modal__button modal__button--primary"
              data-role="confirm"
            >
              ${this.getAttribute('confirm-label') || '확인'}
            </button>
          </div>
        </div>
      </div>
    `;
    this.updateOpenState(this.hasAttribute('open'));
  }
}

customElements.define('confirm-modal', ConfirmModal);
