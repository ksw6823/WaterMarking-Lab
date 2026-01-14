# SynthID

Backend(FastAPI) + Frontend(React + Vite) 모노레포입니다.

## 구성
- `backend/`: FastAPI API 서버 + Alembic 마이그레이션 + PostgreSQL 연동
- `frontend/`: React + Vite 프론트엔드(프론트 개발자가 준비한 프로젝트를 이 폴더에 추가)

## 로컬 개발 포트/규칙
- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- API Prefix: `/api`
- Health: `GET /health` → `{"status":"ok"}`

## 백엔드 실행 방법(최초)

1. 깃 레포지토리 클론 후 백엔드 디렉토리로 이동
깃 클론: git clone https://github.com/ksw6823/WaterMarking-Lab.git
백엔드 이동: cd backend

2. 파이썬 버전 확인 및 3.11버전 설치 
버전 확인: py --version
3.11 버전 설치(powershell): winget install Python.Python.3.11

3. 가상환경 생성 및 활성화 + 의존성 설치
가상환경 생성: py -3.11 -m venv .venv
가상환경 활성화: .\.venv\Scripts\Activate.ps1
가상환경 pip 최신화: python -m pip install -U pip
의존성 설치: pip install -r requirements.txt

4. 환경변수 파일 준비
.env 파일 생성(backend 루트에 생성)
env.example 내용 붙여넣기

5. PosrgreSQL 실행
Docker Desktop 실행(없다면 설치)
DB 서버 실행: docker compose up -d
DB 테이블 만들기: python -m alembic -c alembic.ini upgrade head

6. 백엔드 실행
서버 실행: python run.py


## 백엔드 실행 방법(설정 후)

1. docker desktop 실행

2. 백엔드 폴더로 이동 + 가상환경 활성화
cd backend
.\.venv\Scripts\Activate.ps1

3. DB 실행
docker compose up -d

4. 마이그레이션 반영
python -m alembic -c alembic.ini upgrade head

5. 서버 실행
python run.py