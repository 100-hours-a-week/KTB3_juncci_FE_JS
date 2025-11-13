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
    return () => listeners.delete(listener);
  };

  return { getState, setState, subscribe };
})();
