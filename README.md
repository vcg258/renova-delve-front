# Renova & Delve — 프론트엔드

AI 스토리텔링 기반 로그라이크 웹게임 [Renova & Delve](https://github.com/vcg258/RenovaNDelve)의 화면입니다.

- **플레이**: https://renovandelve.duckdns.org
- **현재 버전**: v0.11.0 (베타). 백엔드와 같은 버전 번호를 씁니다.
- 프로젝트 소개와 이력은 백엔드 [README](https://github.com/vcg258/RenovaNDelve#readme), 버전별 변경 내역은 [CHANGELOG](https://github.com/vcg258/RenovaNDelve/blob/main/CHANGELOG.md)에 있습니다.

> 팀 프로젝트(2026-05, 약 한 달) 때도 프론트엔드는 구현돼 있었지만, 프로젝트가 중단되며 저장소째 폐기되어 코드가 남아 있지 않습니다. 이 저장소는 v0.2.0부터 LLM에게 지시하고 검토하는 방식으로 처음부터 다시 만든 것입니다.

## 화면이 맡는 일

게임 상태와 규칙은 전부 서버가 갖습니다. 화면은 플레이어의 행동(스킬 선택, 대상, 선택지 번호)만 보내고, 서버가 돌려준 결과를 그립니다.

- **계산하지 않는다.** 피해량, 보상, 강공 예고 수치, 다음 레벨 경험치, 슬롯 상한 같은 숫자는 서버 응답의 값을 그대로 씁니다. 화면 코드에 게임 규칙 숫자를 두지 않습니다.
- **미리 막을 뿐 판정하지 않는다.** 골드가 모자란 구매 버튼, 고를 수 없는 원정 준비 카드는 화면에서 먼저 막지만, 최종 판정은 서버가 다시 합니다.
- **어긋나면 서버에 맞춘다.** 요청이 실패하거나 화면 단계와 서버 단계가 다르면 `GET /api/game/current`로 다시 받아 화면을 복원합니다(`resync`). 렌더링 오류는 `ErrorBoundary`가 받습니다.

## 실행

```bash
npm install
npm run dev     # http://localhost:5173, /api 요청은 백엔드(8080)로 프록시
npm test        # vitest
npm run build   # 타입 검사(tsc -b) + 번들
```

백엔드를 다른 포트에 띄웠다면 `API_TARGET=http://localhost:8081 npm run dev`.

### 환경 변수 (`.env`, 빌드할 때 값이 박힘)

| 이름 | 용도 |
|---|---|
| `VITE_OPERATOR_NAME` | 약관과 문의 안내의 운영자명 (닉네임 가능) |
| `VITE_OPERATOR_CONTACT` | 문의 이메일. 처리방침과 화면 아래 문의 링크에 쓴다. 비우면 링크가 보이지 않는다 |
| `VITE_PRIVACY_OFFICER_NAME` | 처리방침의 개인정보 보호책임자 성명 (실명). 비우면 운영자명 |

`.env.example`을 복사해 채웁니다. 값은 저장소에 커밋하지 않습니다.

## 배포

이 저장소는 따로 배포하지 않습니다. 화면은 백엔드 이미지 안에 함께 들어가, Spring Boot가 화면과 API를 같은 주소에서 내보냅니다(쿠키와 보안 설정이 같은 출처를 전제로 합니다).

| 워크플로 | 언제 | 하는 일 |
|---|---|---|
| `CI` | `dev`·`main`으로 가는 PR, `dev` 푸시 | `npm test`, `npm run build` |
| `Trigger backend deploy` | `main` 푸시 | 백엔드 저장소의 `Deploy`를 실행. 백엔드가 이 저장소의 `main`을 받아 함께 빌드해 서버에 배포한다 |

배포 절차와 필요한 시크릿은 백엔드의 [docs/deploy.md](https://github.com/vcg258/RenovaNDelve/blob/main/docs/deploy.md)에 있습니다.

## 구성

| 항목 | 내용 |
|---|---|
| 기술 | React 19, Vite 6, TypeScript, React Router 7, axios. 상태 관리 라이브러리 없음 |
| 인증 | AccessToken은 메모리에만 두고, 만료되면 httpOnly 쿠키의 RefreshToken으로 재발급 (`api/client.ts`) |
| 화면 | 로그인·가입, 아이디·비밀번호 찾기, 홈, 원정 준비, 게임, 결과, 랭킹, 연대기, 도감, 내 정보, 관리자, 약관·처리방침 |
| 테스트 | vitest. 컴포넌트는 문자열 렌더링으로 구조를 확인하고, 계산이 있는 유틸은 단위 테스트 |

```
src/
├── api/          서버 호출(axios)과 응답 타입
├── context/      로그인 상태
├── pages/        라우트별 화면
├── components/   상태 바, 몬스터 카드, 말풍선, 대화창, 배경 등
├── utils/        스프라이트 매칭, 배경 장면, 칩 문구, 인벤토리 묶음
└── sprites/      도트 스프라이트 데이터 (tools/make_sprites.py로 생성)
```

## 디자인

- **도트 제단화**: 배경(`AtmosphereFX`)은 160x100 격자의 SVG 사각형입니다. 위는 천상의 빛, 가운데는 레노바 왕궁, 아래는 지평선에 거꾸로 비친 붉은 왕궁과 마계의 문입니다. 스테이지 깊이, 가호 세력, 보스전, 모닥불에 따라 장면이 바뀝니다(`utils/scene.ts`).
- **스프라이트**: 몬스터, 스킬, 장비, 유물, 소모품, UI 아이콘 60종을 16x16으로 직접 찍었습니다. 원본은 `tools/make_sprites.py`이고, 실행하면 `src/sprites/sprites.json`과 미리보기 PNG가 만들어집니다. 이름과 스프라이트의 매칭은 `utils/sprites.ts`.
- **글꼴**: 게임 화면은 Galmuri, AI가 쓴 서사(노드 이야기, 조우, 회고, 연대기)는 Neo둥근모입니다. 둘 다 OFL이고 npm 패키지로 번들에 포함합니다. 외부 CDN을 쓰지 않습니다(CSP가 같은 출처만 허용).
- 패널은 둥근 모서리, 흐림, 그라데이션 없이 2px 테두리와 딱 떨어지는 그림자를 씁니다. 테마 규칙은 `styles.css` 끝의 "도트 테마", "디자인 점검" 블록에 있습니다.
