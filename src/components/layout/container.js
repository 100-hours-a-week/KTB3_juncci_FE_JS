// 레이아웃 컨테이너 스타일 정의
// 내부 콘텐츠의 최대 너비와 패딩을 지정하여 중앙 정렬 레이아웃을 만듦
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
// <layout-container> 커스텀 엘리먼트 정의
// 공통 레이아웃 구조를 제공하기 위한 래퍼 컴포넌트
export class LayoutContainer extends HTMLElement {
  constructor() {
    super();
     // Shadow DOM 생성 (캡슐화)
    this.attachShadow({ mode: 'open' });

    // 스타일 요소 추가
    const style = document.createElement('style');
    style.textContent = styles;

     // 콘텐츠 슬롯을 감싸는 래퍼 생성
    const slotWrapper = document.createElement('div');
    slotWrapper.className = 'layout-container__inner';

    // 슬롯 생성 (자식 콘텐츠를 이 위치에 렌더링)
    const slot = document.createElement('slot');
    slotWrapper.append(slot);

    // shadowRoot에 스타일 + 슬롯 구조 추가
    this.shadowRoot.append(style, slotWrapper);
  }
}

// 커스텀 엘리먼트 등록
// <layout-container> 태그로 사용할 수 있게 브라우저에 등록
customElements.define('layout-container', LayoutContainer);
