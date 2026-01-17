# Frontend (React + Vite)

이 폴더는 **React + Vite** 프론트엔드입니다. 백엔드(FastAPI)와 **동시에 실행**하면, 프론트가 `/api/**` 요청을 백엔드로 프록시해서 API 테스트를 할 수 있습니다.

## 로컬 개발 포트/규칙
- Frontend: `http://localhost:5173` (Vite 기본)
- Backend: `http://localhost:8000`
- API Prefix: `/api`

## 실행 방법 (Windows / PowerShell 기준)

### 1) 백엔드 실행 (먼저)
백엔드는 `backend/README.md`를 따르는 게 정석입니다. 최소 흐름은 아래입니다.

```powershell
cd ..\backend

# (최초 1회) .env 준비: backend\env.example -> backend\.env
# DB 실행
docker compose up -d

# (최초/변경 시) 마이그레이션
python -m alembic -c alembic.ini upgrade head

# API 서버 실행 (8000)
python run.py
```

- Health: `GET http://localhost:8000/health` → `{"status":"ok"}`
- Swagger: `http://localhost:8000/docs`

### 2) 프론트 실행

```powershell
cd ..\frontend
npm install
npm run dev
```

브라우저에서 `http://localhost:5173` 접속합니다.

## 백엔드 연동 방식 (중요)

### Vite Proxy
`frontend/vite.config.js`에서 아래 규칙으로 프록시합니다.
- `/api/**` → `http://localhost:8000/api/**`

따라서 프론트 코드는 **절대 URL을 쓰지 않고** `/api/...` 형태로 호출합니다.

### CORS
백엔드는 기본적으로 아래 Origin을 허용하도록 설정되어 있습니다.
- `http://localhost:5173`
- `http://127.0.0.1:5173`

포트/도메인이 달라지면 백엔드 `.env`의 `CORS_ORIGINS`를 수정하세요. (`backend/env.example` 참고)

## 프론트 화면별 호출 API (요약)

### 생성 (Generate)
- `POST /api/generations`

요청 바디에 `input_text`, `model`, (옵션) `watermark_*` 설정을 포함해 보냅니다.

### 공격 (Attack)
- `POST /api/generations/{generation_id}/attacks`

요청 바디:
- `attack_type`: `"deletion" | "substitution" | "summarization"`
- `attack_intensity`: `0 ~ 100`

### 탐지 (Verify)
- `POST /api/generations/{generation_id}/detections`

### 이력 조회 (History)
- `GET /api/generations?page=1&page_size=50`
- `GET /api/detections?page=1&page_size=50`

## 트러블슈팅

### 프론트에서 404가 나는 경우
- 백엔드가 `http://localhost:8000`에서 실행 중인지 확인
- 프론트 요청이 `/api/...`로 나가는지 확인 (절대 URL 사용 X)
- Swagger(`http://localhost:8000/docs`)에서 실제 제공되는 경로 확인

### CORS 에러가 나는 경우
- 백엔드 `.env`의 `CORS_ORIGINS`에 프론트 주소(포트 포함)가 들어있는지 확인

## 수정 내역 (Backend 연동/화면 동작 정상화)

### 1) 프론트 API 엔드포인트를 백엔드 라우트에 맞춤 (404 해결)
백엔드가 제공하는 실제 경로는 `/api/generations...` 계열입니다. 프론트에서 아래 3개를 맞춰서 **Generate/Attack/Verify 탭이 404 없이 동작**하게 했습니다.

- Generate: `POST /api/generations`
- Attack: `POST /api/generations/{generation_id}/attacks`
- Verify: `POST /api/generations/{generation_id}/detections`

### 2) 버튼이 전반적으로 검정색으로 보이던 문제 해결
`src/index.css`에 남아있던 Vite 기본 템플릿 전역 스타일(특히 `button { background-color: #1a1a1a; }`, `:root { color-scheme: light dark; ... }`)이 Tailwind UI를 덮어써서 버튼이 검정으로 보였습니다.

- 해결: 전역 템플릿 스타일을 제거하고, 레이아웃에 필요한 `body`, `#root`만 유지했습니다.

# Frontend (React + Vite)

이 폴더는 **React + Vite** 프론트엔드입니다. 백엔드(FastAPI)와 **동시에 실행**하면, 프론트가 `/api/**` 요청을 백엔드로 프록시하여 API를 테스트할 수 있습니다.

## 사전 요구사항 (Prerequisites)
- **Node.js**: v18 이상 권장
- **Backend 실행**: 프론트엔드 실행 전, 백엔드 서버가 `http://localhost:8000`에서 실행 중이어야 합니다.

## 실행 방법 (Windows / PowerShell 기준)

### 1. 패키지 설치
최초 실행 시 의존성 패키지를 설치해야 합니다.

```powershell
cd frontend
npm install
```

### 2. 개발 서버 실행
```powershell
npm run dev
```


