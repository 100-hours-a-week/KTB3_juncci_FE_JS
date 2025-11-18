import { html } from '../core/html.js';
import './layout/container.js';
import { navigateBack, routeChange } from '../core/router.js';
import { fetchUserById } from '../api/users.js';
import {
  getStoredToken,
  getStoredUserId,
  clearStoredToken,
  clearStoredUserId,
} from '../utils/auth.js';
import { AUTH_CHANGE_EVENT, dispatchAuthChange } from '../core/events.js';

const AUTH_MENU_ITEMS = [
  { key: 'profile', label: 'Edit Profile', route: '/account/profile' },
  { key: 'password', label: 'Change Password', route: '/account/password' },
  { key: 'logout', label: 'Log Out', action: 'logout' },
];

export function Header() {
  const element = html`
    <header class="app-header">
      <layout-container>
        <div class="header__inner">
          <button
            class="header__back"
            type="button"
            data-role="back-button"
            aria-label="뒤로 가기"
          >
            <svg dataSlot="icon" fill="currentColor" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path clipRule="evenodd" fillRule="evenodd" d="M14 8a.75.75 0 0 1-.75.75H4.56l3.22 3.22a.75.75 0 1 1-1.06 1.06l-4.5-4.5a.75.75 0 0 1 0-1.06l4.5-4.5a.75.75 0 0 1 1.06 1.06L4.56 7.25h8.69A.75.75 0 0 1 14 8Z" />
            </svg>
          </button>
          <h1>
            <span class="logo--highlight">log</span>oRism
          </h1>
          <div class="header__profile" data-role="profile">
            <button
              class="profile__trigger"
              type="button"
              data-role="profile-button"
            >
              <span class="profile__avatar" data-role="avatar" ></span>
            </button>
            <div class="profile__dropdown" data-role="dropdown" role="menu" hidden>
              <div class="profile__menu" data-role="menu"></div>
            </div>
          </div>
        </div>
      </layout-container>
    </header>
  `;

  const backButton = element.querySelector('[data-role="back-button"]');
  const profileButton = element.querySelector('[data-role="profile-button"]');
  const avatar = element.querySelector('[data-role="avatar"]');
  const dropdown = element.querySelector('[data-role="dropdown"]');
  const menuContainer = element.querySelector('[data-role="menu"]');
  const profileWrapper = element.querySelector('[data-role="profile"]');

  const state = {
    isDropdownOpen: false,
    user: null,
  };

  function renderMenu(items = AUTH_MENU_ITEMS) {
    if (!menuContainer) return;
    menuContainer.innerHTML = '';
    items.forEach(({ key, label, route, action }) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'profile__menu-item';
      button.textContent = label;
      button.setAttribute('role', 'menuitem');
      button.dataset.key = key;
      if (route) button.dataset.route = route;
      if (action) button.dataset.action = action;
      menuContainer.append(button);
    });
  }

  function setAvatar(
    imageUrl,
    nickname,
    { isGuest = false, fallbackText = '?' } = {}
  ) {
    const shouldShowText = !imageUrl;
    const textContent = shouldShowText
      ? fallbackText || (nickname || '').trim().charAt(0) || '?'
      : '';

    if (avatar) {
      if (imageUrl) {
        avatar.style.backgroundImage = `url("${imageUrl}")`;
        avatar.classList.add('has-photo');
      } else {
        avatar.style.backgroundImage = '';
        avatar.classList.remove('has-photo');
      }
      avatar.textContent = textContent;
      avatar.classList.toggle('is-guest', Boolean(isGuest));
    }

    const label = nickname
      ? `${nickname}님의 프로필`
      : '로그인이 필요합니다';

    if (avatar) {
      avatar.setAttribute('title', label);
    }
    if (profileButton) {
      profileButton.disabled = Boolean(isGuest);
    }
  }

  function toggleDropdown(forceState) {
    if (!dropdown || !profileButton) return;
    const nextState =
      typeof forceState === 'boolean' ? forceState : !state.isDropdownOpen;
    state.isDropdownOpen = nextState;
    dropdown.hidden = !nextState;
  }

  const closeDropdown = () => toggleDropdown(false);

  function setGuestState() {
    state.user = null;
    setAvatar('', '', { isGuest: true, fallbackText: '?' });
    closeDropdown();
  }

  function setAuthenticatedState(user) {
    state.user = user;
    setAvatar(user.profileImage, user.nickname || user.email || '내 프로필');
  }

  async function hydrateProfile() {
    const token = getStoredToken();
    const userId = getStoredUserId();

    if (!token || !userId) {
      setGuestState();
      return;
    }

    try {
      const response = await fetchUserById(userId);
      const user = response?.data ?? response;
      setAuthenticatedState(user);
    } catch (error) {
      console.error('[Header] 사용자 정보를 불러오지 못했습니다:', error);
      if (error.status === 401 || error.status === 403) {
        clearStoredToken();
        clearStoredUserId();
        dispatchAuthChange({ status: 'expired' });
      }
      setGuestState();
    }
  }

  function handleMenuSelection(event) {
    const target = event.target.closest('.profile__menu-item');
    if (!target) return;
    event.stopPropagation();

    if (target.dataset.action === 'logout') {
      clearStoredToken();
      clearStoredUserId();
      dispatchAuthChange({ status: 'logout' });
      setGuestState();
      routeChange('/login');
      return;
    }

    if (target.dataset.route) {
      closeDropdown();
      routeChange(target.dataset.route);
    }
  }

  function handleBackClick() {
    navigateBack('/post');
  }

  renderMenu();
  hydrateProfile();

  profileButton?.addEventListener('click', (event) => {
    event.stopPropagation();
    toggleDropdown();
  });

  dropdown?.addEventListener('click', handleMenuSelection);
  backButton?.addEventListener('click', handleBackClick);

  document.addEventListener('click', (event) => {
    if (!element.contains(event.target)) {
      closeDropdown();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeDropdown();
    }
  });

  window.addEventListener('hashchange', closeDropdown);
  window.addEventListener(AUTH_CHANGE_EVENT, hydrateProfile);

  return element;
}
