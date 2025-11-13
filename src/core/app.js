import { Header } from '../components/header.js';
import { MainPage } from '../pages/main.js';
import { LoginPage } from '../pages/login.js';
import { PostPage } from '../pages/post.js';
import { PostWritePage } from '../pages/post-write.js';
import { PostEditPage } from '../pages/post-edit.js';
import { PostDetailPage } from '../pages/post-detail.js';
import { SignupPage } from '../pages/signup.js';
import { initRouter, getCurrentPath } from './router.js';
import { AccountProfilePage } from '../pages/account-profile.js';
import { AccountPasswordPage } from '../pages/account-password.js';

export function App() {
  const root = document.getElementById('root');

  // 헤더랑 메인 페이지 세또
  const header = Header();
  const main = document.createElement('main');
  root.append(header, main);

  // 라우트 처리 방식인데 일단 로그인 페이지 연동 해둠 -> 추후에 post 페이지로 수정해서 쿠키 확인 한 다음..뭐시기 할게욥
  const route = () => {
    const path = getCurrentPath();
    main.innerHTML = '';

    if (path === '/' || path === '/login') {
      main.append(LoginPage());
    } else if (path === '/login') {
      main.append(LoginPage());
    } else if (path === '/post') {
      main.append(PostPage());
    } else if (path === '/post/new') {
      main.append(PostWritePage());
    } else if (path.startsWith('/post/')) {
      const editMatch = path.match(/^\/post\/([^/]+)\/edit$/);
      if (editMatch) {
        main.append(PostEditPage({ postId: editMatch[1] }));
      } else {
        const [, , postId = ''] = path.split('/');
        main.append(PostDetailPage({ postId }));
      }
    } else if (path === '/signup') {
      main.append(SignupPage());
    } else if (path === '/account/profile') {
      main.append(AccountProfilePage());
    } else if (path === '/account/password') {
      main.append(AccountPasswordPage());
    } else {
      main.innerHTML = '<p style="text-align:center;">404 Not Found</p>';
    }
  };

  initRouter(route);
  route(); //이거 빼먹지 말자 초기 라우터 방식임.
}

App();
