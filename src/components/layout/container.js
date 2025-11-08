const styles = /* html */ `
:host {
  display: block;
  width: 100%;
}

.layout-container__inner {
  width: 100%;
  max-width: var(--content-width, 600px);
  margin: 0 auto;
  padding: 0 24px;
  box-sizing: border-box;
}
`;

export class LayoutContainer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = styles;

    const slotWrapper = document.createElement('div');
    slotWrapper.className = 'layout-container__inner';
    const slot = document.createElement('slot');
    slotWrapper.append(slot);

    this.shadowRoot.append(style, slotWrapper);
  }
}

customElements.define('layout-container', LayoutContainer);
