const ROUTE_CHANGE_EVENT = 'ROUTE_CHANGE';
const navigationHistory = [];
let lastRecordedPath = null;

export function getCurrentPath() {
  return location.hash.replace(/^#/, '') || '/';
}

function ensureHistoryInitialized() {
  if (navigationHistory.length === 0) {
    const path = getCurrentPath();
    navigationHistory.push(path);
    lastRecordedPath = path;
  }
}

function updateHistory() {
  ensureHistoryInitialized();
  const path = getCurrentPath();

  if (path === lastRecordedPath) {
    return;
  }

  const existingIndex = navigationHistory.lastIndexOf(path);
  if (existingIndex !== -1) {
    navigationHistory.splice(existingIndex + 1);
  } else {
    navigationHistory.push(path);
  }

  lastRecordedPath = path;
}

export function initRouter(onRouteChange) {
  ensureHistoryInitialized();

  const handleRouteChange = () => {
    updateHistory();
    onRouteChange();
  };

  window.addEventListener(ROUTE_CHANGE_EVENT, handleRouteChange);
  window.addEventListener('hashchange', handleRouteChange);
}

export function routeChange(url) {
  ensureHistoryInitialized();
  location.hash = url.startsWith('#') ? url : `#${url}`;
  window.dispatchEvent(new CustomEvent(ROUTE_CHANGE_EVENT));
}

export function hasNavigationHistory() {
  ensureHistoryInitialized();
  return navigationHistory.length > 1;
}

export function navigateBack(fallbackRoute) {
  if (hasNavigationHistory()) {
    navigationHistory.pop();
    lastRecordedPath = navigationHistory[navigationHistory.length - 1] || null;
    window.history.back();
    return true;
  }

  if (fallbackRoute) {
    routeChange(fallbackRoute);
  }

  return false;
}
