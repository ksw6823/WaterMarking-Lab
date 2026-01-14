# Frontend (React + Vite)

이 폴더는 프론트엔드(React + Vite) 프로젝트가 위치하는 자리입니다.
프론트 개발자가 별도 레포/로컬에 준비해둔 프론트 코드를 이 디렉터리에 추가합니다.

## 로컬 개발 가정
- Frontend: http://localhost:5173 (Vite 기본)
- Backend: http://localhost:8000
- API Prefix: /api

## CORS
백엔드는 기본적으로 아래 Origin을 허용하도록 설정되어 있습니다.
- http://localhost:5173
- http://127.0.0.1:5173

만약 프론트 포트/도메인이 달라지면 백엔드 `.env`의 `CORS_ORIGINS`를 수정하세요.

## 백엔드 실행(요약)
- backend/README.md 참고
- DB: `docker compose up -d` (backend/docker-compose.yml)
- Migration: `python -m alembic -c alembic.ini upgrade head`
- Run: `python run.py`

## API Health Check
- GET /health → {"status":"ok"}