# SynthID Text Watermarking - Backend

## 준비

### 1) 의존성 설치

```powershell
pip install -r requirements.txt
```

### 2) 환경 변수

- `env.example`을 복사해서 `.env`로 사용하세요.

### 3) PostgreSQL(Docker) 실행

```powershell
docker compose up -d
```

처음 실행이면 `POSTGRES_DB=synthid` 설정에 의해 DB가 자동 생성됩니다.

### 4) 마이그레이션(테이블 생성)

```powershell
.\.venv\Scripts\python.exe -m alembic -c alembic.ini upgrade head
```

### 3) 실행

```powershell
python run.py
```

## 개발 메모

- API prefix: `/api`
- 프론트 개발(CORS): 기본 `http://localhost:5173`(Vite)

