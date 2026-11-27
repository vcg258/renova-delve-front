import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import RecoveryPage from './RecoveryPage';
import ResetPasswordPage from './ResetPasswordPage';

/**
 * 아이디 찾기 / 비밀번호 찾기 / 비밀번호 재설정 화면의 첫 렌더링 (브라우저 없이 문자열로 렌더링한다).
 * 서버 호출은 effect에서만 일어나므로 이 테스트에서는 나가지 않는다.
 */

const renderAt = (path: string, page: ReactElement) => renderToStaticMarkup(
  <MemoryRouter initialEntries={[path]}>{page}</MemoryRouter>,
);

describe('찾기 화면', () => {
  it('기본은 아이디 찾기: 이름과 이메일을 받는다', () => {
    const html = renderAt('/recover', <RecoveryPage />);
    expect(html).toContain('아이디 찾기');
    expect(html).toContain('placeholder="이름"');
    expect(html).toContain('placeholder="이메일"');
    expect(html).not.toContain('placeholder="아이디"');
  });

  it('kind=password면 비밀번호 찾기: 아이디와 이메일을 받는다', () => {
    const html = renderAt('/recover?kind=password', <RecoveryPage />);
    expect(html).toContain('비밀번호 찾기');
    expect(html).toContain('placeholder="아이디"');
    expect(html).toContain('placeholder="이메일"');
  });
});

describe('비밀번호 재설정 화면', () => {
  afterEach(() => vi.unstubAllGlobals());

  const stubLocation = (hash: string) => vi.stubGlobal('window', {
    location: { hash, pathname: '/reset-password' },
    history: { replaceState: () => {} },
  });

  it('주소에 토큰이 없으면 만료 안내와 다시 찾기 링크를 보여 준다', () => {
    stubLocation('');
    const html = renderAt('/reset-password', <ResetPasswordPage />);
    expect(html).toContain('만료되었거나 이미 사용');
    expect(html).toContain('href="/recover?kind=password"');
  });

  it('토큰이 있으면 먼저 링크를 확인하는 중이라고 보여 준다 (입력 칸은 확인 뒤에)', () => {
    stubLocation('#token=abc123');
    const html = renderAt('/reset-password', <ResetPasswordPage />);
    expect(html).toContain('링크를 확인하는 중');
    expect(html).not.toContain('새 비밀번호 확인');
  });
});
