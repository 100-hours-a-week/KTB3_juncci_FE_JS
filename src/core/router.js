const ROUTE_CHANGE_EVENT = 'ROUTE_CHANGE';


export function initRouter(onRouteChange) {
  window.addEventListener(ROUTE_CHANGE_EVENT, () => onRouteChange());
  window.addEventListener('hashchange', () => onRouteChange());
}

export function routeChange(url) {
  location.hash = url.startsWith('#') ? url : `#${url}`;
  window.dispatchEvent(new CustomEvent(ROUTE_CHANGE_EVENT));
}

export function getCurrentPath() {
  return location.hash.replace(/^#/, '') || '/';
}
