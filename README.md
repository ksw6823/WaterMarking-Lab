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
- 깃 클론: git clone https://github.com/ksw6823/WaterMarking-Lab.git
- 백엔드 이동: cd backend

2. 파이썬 버전 확인 및 3.11버전 설치 
- 버전 확인: py --version
- 3.11 버전 설치(powershell): winget install Python.Python.3.11

3. 가상환경 생성 및 활성화 + 의존성 설치
- 가상환경 생성: py -3.11 -m venv .venv
- 가상환경 활성화: **.\.venv\Scripts\Activate.ps1**
- 가상환경 pip 최신화: python -m pip install -U pip
- 의존성 설치: pip install -r requirements.txt

4. 환경변수 파일 준비
- .env 파일 생성(backend 루트에 생성)
- env.example 내용 붙여넣기

5. PosrgreSQL 실행
- Docker Desktop 실행(없다면 설치)
- DB 서버 실행: docker compose up -d
- DB 테이블 만들기: python -m alembic -c alembic.ini upgrade head

6. 백엔드 실행
- 서버 실행: python run.py


## 백엔드 실행 방법(설정 후)

1. docker desktop 실행

2. 백엔드 폴더로 이동 + 가상환경 활성화
- cd backend
- **.\.venv\Scripts\Activate.ps1**

3. DB 실행
- docker compose up -d

4. 마이그레이션 반영
- python -m alembic -c alembic.ini upgrade head

5. 서버 실행
- python run.py

## 수정사항

1. 생성페이지에서 담길 Sampling Params 슬라이더 좋은데 + 숫자 직접 기입 가능하게

2. 검증(Verify) -> 탐지(Detect)(단어 통일)

3. 탐지화면 현재:ID검색 -> 목록 조회 후 요약된 텍스트 목록 띄우기 (ex. 20개씩 페이지네이션) -> 단일 선택하면 생성페이지처럼 윗칸에 요약된 생성텍스트 들어가고 탐지 버튼

4. 탐지페이지: 대시보드 없애고 생성페이지처럼 위에 입력 아래 결과 나오게 결과도 지금처럼 더미데이터말고 테이블 설계해서 데이터가 가지고 있는대로 TPR, TFR, ROC 등 결과로 반환(수치도 적용 + 어떻게 화면에 표시할지는 자유롭게)

5. 탐지페이지에서 선택시 3분할: 위(사용자가 선택한 요약된 텍스트 목록 카드 그대로) + 중앙(요약된 텍스트의 상세 정보 + 탐지버튼) + 아래(탐지 결과 자세하게 4 참고)

6. 공격페이지: 공격강도도 마찬가지로 슬라이더 + 직접 기입 가능하게

7. 공격페이지 히스토리 더 상세(ID, 생성 일자 상세하게(현재는 시간만)) * 탐지페이지에서도 동일하게 왼쪽에 목록띄우고 탐지해도 좋을듯

8. 조회페이지 리스트 끝없이 늘어날 수 없으니까 페이지네이션

9. 조회페이지 검색기능 실제로 구현 + 정렬 + 필터링까지

10. 조회페이지 단일 선택시 보여주는 모달 상세하게 정리 + 값 받아오기