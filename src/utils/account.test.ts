import { describe, expect, it } from 'vitest';
import { isValidEmail, isValidLoginId, isValidName, isValidPassword, maskEmail, readResetToken } from './account';

describe('isValidEmail', () => {
  it.each(['hero@naver.com', ' Hero@Example.co.kr ', 'a.b+c@sub.domain.io'])('%s 허용', (email) => {
    expect(isValidEmail(email)).toBe(true);
  });

  it.each(['', 'hero', 'hero@', '@naver.com', 'hero@naver', 'he ro@naver.com', 'hero@@naver.com'])('%s 거부', (email) => {
    expect(isValidEmail(email)).toBe(false);
  });

  it('254자를 넘으면 거부', () => {
    expect(isValidEmail(`${'a'.repeat(250)}@b.co`)).toBe(false);
  });
});

describe('isValidName', () => {
  it.each(['김용사', 'Kim Yongsa', ' 김용사 '])('%s 허용', (name) => {
    expect(isValidName(name)).toBe(true);
  });

  it.each(['', '김', '김용사1', '<b>김</b>', '김  용사', 'a'.repeat(31)])('%s 거부', (name) => {
    expect(isValidName(name)).toBe(false);
  });
});

describe('isValidPassword / isValidLoginId', () => {
  it('비밀번호는 영문과 숫자를 포함해 8자 이상', () => {
    expect(isValidPassword('abcd1234')).toBe(true);
    expect(isValidPassword('abcdefgh')).toBe(false);
    expect(isValidPassword('12345678')).toBe(false);
    expect(isValidPassword('abc123')).toBe(false);
    expect(isValidPassword(`a1${'x'.repeat(63)}`)).toBe(false);
  });

  it('아이디는 영문·숫자·밑줄 4~20자', () => {
    expect(isValidLoginId('hero_01')).toBe(true);
    expect(isValidLoginId('abc')).toBe(false);
    expect(isValidLoginId('한글아이디')).toBe(false);
  });
});

describe('readResetToken', () => {
  it('# 뒤의 token 값을 꺼낸다', () => {
    expect(readResetToken('#token=abc_DEF-123')).toBe('abc_DEF-123');
    expect(readResetToken('token=abc')).toBe('abc');
  });

  it('토큰이 없거나 형식이 이상하면 null', () => {
    expect(readResetToken('')).toBeNull();
    expect(readResetToken('#other=1')).toBeNull();
    expect(readResetToken('#token=')).toBeNull();
    expect(readResetToken('#token=<script>')).toBeNull();
    expect(readResetToken(`#token=${'a'.repeat(200)}`)).toBeNull();
  });
});

describe('maskEmail', () => {
  it('앞 두 글자만 남기고 가린다', () => {
    expect(maskEmail('hero@naver.com')).toBe('he***@naver.com');
    expect(maskEmail('a@b.co')).toBe('a***@b.co');
    expect(maskEmail('invalid')).toBe('***');
  });
});
