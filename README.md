# Renova & Delve — 프론트엔드

AI 스토리텔링 기반 로그라이크 웹게임 [Renova & Delve](https://github.com/vcg258/RenovaNDelve)의 화면입니다.

**현재 버전: v0.5.0 (베타)** · 프로젝트 소개, 이력, 버전별 변경 내역은 백엔드 저장소의 [README](https://github.com/vcg258/RenovaNDelve#readme)와 [CHANGELOG](https://github.com/vcg258/RenovaNDelve/blob/dev/CHANGELOG.md)에 있습니다. 백엔드와 같은 버전 번호를 씁니다.

> 이 저장소는 팀 프로젝트 시절 폐기되어 남아 있지 않았고, v0.2.0부터 LLM에게 지시·검토하는 방식으로 처음부터 다시 만들었습니다.

## 실행

```bash
npm install
npm run dev     # http://localhost:5173, /api 요청은 백엔드(8080)로 프록시
npm test        # vitest
npm run build
```

백엔드 주소를 바꾸려면 `API_TARGET=http://localhost:8081 npm run dev`.

## 환경 변수 (`.env`, 선택)

| 이름 | 용도 |
|---|---|
| `VITE_OPERATOR_NAME` | 약관·개인정보 처리방침의 운영자명 |
| `VITE_OPERATOR_CONTACT` | 처리방침의 문의처, 화면 아래 "문의 · 피드백" 링크. 비우면 링크가 보이지 않는다 |

## 구성

- React 19 + Vite + TypeScript, 상태 관리 라이브러리 없음
- 도트 테마: 16x16 스프라이트 60종(`tools/make_sprites.py` → `src/sprites/sprites.json`), 픽셀 글꼴 Galmuri(번들 포함)
- 게임 상태는 서버가 소유한다. 화면은 행동만 보내고, 요청이 실패하면 서버 상태로 다시 맞춘다(`resync`)
