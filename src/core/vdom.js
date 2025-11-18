// 1. Virtual DOM 노드 생성 함수
export function h(type, props, ...children) {
  const flatChildren = children.flat().map(child =>
    typeof child === 'number' ? String(child) : child
  );

  return {
    type,
    props: props || {},
    children: flatChildren,
  };
}

// 2. Virtual DOM -> Real DOM 변환
export function createElement(node) {
  // 텍스트 노드
  if (typeof node === 'string') {
    return document.createTextNode(node);
  }

  const el = document.createElement(node.type);
  const props = node.props || {};

  // props 적용
  setProps(el, props);

  // children 생성
  node.children
    .map(createElement)
    .forEach(child => el.appendChild(child));

  return el;
}

// props 설정 (초기 렌더용)
function setProps(el, props) {
  Object.entries(props).forEach(([name, value]) => {
    applyProp(el, name, value);
  });
}

// 개별 prop 적용 로직
function applyProp(el, name, value, oldValue) {
  // 이벤트 핸들러: onClick, onInput, onSubmit 처리용
  if (name.startsWith('on') && typeof value === 'function') {
    const eventName = name.slice(2).toLowerCase();

    if (typeof oldValue === 'function') {
      el.removeEventListener(eventName, oldValue);
    }
    el.addEventListener(eventName, value);
    return;
  }

  // className -> class
  if (name === 'className') {
    el.className = value || '';
    return;
  }

  // value / checked 는 DOM 프로퍼티로
  if (name === 'value') {
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.value = value ?? '';
    } else {
      if (value == null) el.removeAttribute('value');
      else el.setAttribute('value', value);
    }
    return;
  }

  if (name === 'checked') {
    if ('checked' in el) {
      el.checked = !!value;
    }
    return;
  }

  // disabled 같은 boolean attribute
  if (typeof value === 'boolean') {
    if (value) {
      el.setAttribute(name, '');
    } else {
      el.removeAttribute(name);
    }
    return;
  }

  // 나머지 일반 attribute
  if (value == null) {
    el.removeAttribute(name);
  } else {
    el.setAttribute(name, value);
  }
}

// 3. Virtual DOM Diff + Patch
// parent: 실제 DOM 부모
// newNode: 새로운 VDOM
// oldNode: 이전 VDOM
// index: parent.childNodes 안에서의 순서
export function updateElement(parent, newNode, oldNode, index = 0, path = "root") {
  const el = parent.childNodes[index];
    
  console.log(`%c[PATH] ${path}`, "color: #6f42c1; font-weight:bold");
  // 1. old만 있고 new는 없는 경우: 제거
  if (oldNode != null && newNode == null) {
    console.log(`%cCATCH! REMOVE NODE`, "color:red; font-weight:bold");
    if (el) parent.removeChild(el);
    return;
  }

  // 2. new만 있고 old는 없는 경우: 추가
  if (oldNode == null && newNode != null) {
    console.log(`%cCATCH! ADD NODE: <${newNode.type || 'text'}>`, "color:red;");
    const newEl = createElement(newNode);
    parent.appendChild(newEl);
    return;
  }

  // 3. 둘 다 텍스트 노드
  if (typeof oldNode === 'string' || typeof newNode === 'string') {
    if (oldNode !== newNode) {
        console.log(`%cCATCH! TEXT CHANGE: "${oldNode}" → "${newNode}"`, "color:red; font-weight:bold");
      const newEl = createElement(newNode);
      parent.replaceChild(newEl, el);
    }else {
    console.log(`%cPASS (text unchanged)`, "color:gray");
  }
    return;
  }

  // 4. 타입이 다르면 통째로 교체
  if (oldNode.type !== newNode.type) {
    console.log(`%cCATCH! TYPE CHANGE: <${oldNode.type}> → <${newNode.type}>`, "color:red; font-weight:bold");
    const newEl = createElement(newNode);
    parent.replaceChild(newEl, el);
    return;
  }

  // 5. 타입이 같으면: props / children만 업데이트
  updateProps(el, newNode.props || {}, oldNode.props || {});

  const newChildren = newNode.children || [];
  const oldChildren = oldNode.children || [];
  const max = Math.max(newChildren.length, oldChildren.length);

  for (let i = 0; i < max; i++) {
    const childPath = `${path} -> ${newNode.type}[${i}]`;
    updateElement(el, newChildren[i], oldChildren[i], i, childPath);
  }
}

// props diff
function updateProps(el, newProps, oldProps) {
  // 제거된 prop 처리
  Object.keys(oldProps).forEach(name => {
    if (!(name in newProps)) {
      applyProp(el, name, undefined, oldProps[name]);
    }
  });

  // 변경/추가된 prop 처리
  Object.entries(newProps).forEach(([name, value]) => {
    const oldValue = oldProps[name];
    if (oldValue === value) return;
    applyProp(el, name, value, oldValue);
  });
}
