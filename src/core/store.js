// src/core/store.js
export const store = (() => {
  let state = {
    email: '',
    password: ''
  };

  const listeners = new Set();

  const getState = () => state;

  const setState = (newState) => {
    state = { ...state, ...newState };
    listeners.forEach((listener) => listener(state));
  };

  const subscribe = (listener) => {
    listeners.add(listener);
    // 구독 취소 가능하도록 unsubscribe 반환
    return () => listeners.delete(listener);
  };

  return { getState, setState, subscribe };
})();
