# ReadTree v4.0.0 백업 절차

> **최종 업데이트**: 2026-01-29
> **목적**: 프로젝트 백업 및 복구 절차 문서화

---

## 목차

1. [백업 개요](#1-백업-개요)
2. [Git 백업](#2-git-백업)
3. [Supabase 백업](#3-supabase-백업)
4. [환경 변수 백업](#4-환경-변수-백업)
5. [복구 절차](#5-복구-절차)

---

## 1. 백업 개요

### 1.1 백업 대상

| 대상 | 위치 | 백업 방법 |
|------|------|----------|
| 소스 코드 | GitHub | Git 브랜치/태그 |
| 데이터베이스 | Supabase | pg_dump / Supabase 백업 |
| Storage 파일 | Supabase Storage | Supabase 백업 |
| 환경 변수 | Vercel / .env.local | 수동 백업 |

### 1.2 백업 주기

| 유형 | 주기 | 담당 |
|------|------|------|
| 소스 코드 | 매 커밋 | 자동 (Git) |
| 데이터베이스 | 일일 | Supabase 자동 / 수동 |
| 릴리즈 백업 | 릴리즈 시 | 수동 |

---

## 2. Git 백업

### 2.1 백업 브랜치 생성

릴리즈 또는 중요 작업 전에 백업 브랜치를 생성합니다.

```bash
# 백업 브랜치 생성
git checkout -b backup/v4.0.0-$(date +%Y%m%d)

# 원격 저장소에 푸시
git push origin backup/v4.0.0-$(date +%Y%m%d)
```

### 2.2 태그 생성

릴리즈 시 태그를 생성합니다.

```bash
# 태그 생성
git tag -a v4.0.0 -m "Release v4.0.0"

# 원격 저장소에 푸시
git push origin v4.0.0
```

### 2.3 전체 저장소 백업

```bash
# 전체 저장소 클론 (모든 브랜치 포함)
git clone --mirror https://github.com/username/readingtree.git readingtree-backup.git

# 압축
tar -czvf readingtree-backup-$(date +%Y%m%d).tar.gz readingtree-backup.git
```

---

## 3. Supabase 백업

### 3.1 Supabase 대시보드 백업

1. Supabase 대시보드 접속: https://app.supabase.com
2. 프로젝트 선택
3. Settings → Backups
4. "Create backup" 클릭

### 3.2 pg_dump를 통한 수동 백업

```bash
# 환경 변수 설정
export SUPABASE_DB_URL="postgresql://postgres:[PASSWORD]@[PROJECT_REF].supabase.co:5432/postgres"

# 전체 데이터베이스 백업
pg_dump $SUPABASE_DB_URL > backup-$(date +%Y%m%d).sql

# 스키마만 백업
pg_dump --schema-only $SUPABASE_DB_URL > schema-$(date +%Y%m%d).sql

# 데이터만 백업
pg_dump --data-only $SUPABASE_DB_URL > data-$(date +%Y%m%d).sql
```

### 3.3 테이블별 백업

```bash
# 특정 테이블 백업
pg_dump $SUPABASE_DB_URL -t users -t books -t notes > partial-backup.sql
```

### 3.4 Storage 백업

Supabase Storage의 파일을 로컬로 다운로드합니다.

```bash
# Supabase CLI 설치
npm install -g supabase

# 로그인
supabase login

# 프로젝트 연결
supabase link --project-ref [PROJECT_REF]

# Storage 버킷 목록 확인
supabase storage ls

# 버킷 내용 다운로드 (수동)
# Supabase 대시보드에서 다운로드
```

---

## 4. 환경 변수 백업

### 4.1 로컬 환경 변수

`.env.local` 파일을 안전한 위치에 백업합니다.

```bash
# 암호화하여 백업 (권장)
gpg -c .env.local
mv .env.local.gpg ~/secure-backup/

# 또는 안전한 위치에 복사
cp .env.local ~/secure-backup/env-backup-$(date +%Y%m%d)
```

### 4.2 Vercel 환경 변수

1. Vercel 대시보드 접속
2. 프로젝트 Settings → Environment Variables
3. 각 변수를 수동으로 기록하거나 Vercel CLI 사용

```bash
# Vercel CLI로 환경 변수 확인
vercel env ls
```

### 4.3 환경 변수 목록

| 변수명 | 용도 | 보안 수준 |
|--------|------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL | 공개 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 익명 키 | 공개 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 서비스 키 | 비밀 |
| `NAVER_CLIENT_ID` | Naver API 클라이언트 ID | 비밀 |
| `NAVER_CLIENT_SECRET` | Naver API 시크릿 | 비밀 |
| `GEMINI_API_KEY` | Gemini API 키 | 비밀 |
| `GOOGLE_CLOUD_VISION_API_KEY` | Google Vision 키 | 비밀 |
| `KAKAO_CLIENT_ID` | Kakao OAuth ID | 비밀 |
| `KAKAO_CLIENT_SECRET` | Kakao OAuth 시크릿 | 비밀 |

---

## 5. 복구 절차

### 5.1 Git 복구

```bash
# 백업 브랜치에서 복구
git checkout backup/v4.0.0-20260129
git checkout -b recovery/from-backup

# 또는 태그에서 복구
git checkout v4.0.0
git checkout -b recovery/from-tag
```

### 5.2 데이터베이스 복구

```bash
# 백업 파일에서 복구
psql $SUPABASE_DB_URL < backup-20260129.sql

# 또는 Supabase 대시보드에서 복구
# Settings → Backups → Restore
```

### 5.3 환경 변수 복구

1. `.env.local` 파일 복원
2. Vercel 대시보드에서 환경 변수 재설정

### 5.4 전체 복구 체크리스트

- [ ] Git 저장소 복구 또는 클론
- [ ] 의존성 설치: `npm install`
- [ ] 환경 변수 설정: `.env.local`
- [ ] 데이터베이스 복구 (필요시)
- [ ] 로컬 테스트: `npm run dev`
- [ ] 빌드 테스트: `npm run build`
- [ ] 배포: `vercel --prod`

---

## 백업 자동화 스크립트

### daily-backup.sh

```bash
#!/bin/bash
# 일일 백업 스크립트

DATE=$(date +%Y%m%d)
BACKUP_DIR=~/backups/readingtree

# 디렉토리 생성
mkdir -p $BACKUP_DIR/$DATE

# Git 상태 저장
cd /path/to/readingtree
git log --oneline -20 > $BACKUP_DIR/$DATE/git-log.txt
git status > $BACKUP_DIR/$DATE/git-status.txt

# 환경 변수 백업 (암호화)
cp .env.local $BACKUP_DIR/$DATE/
gpg -c $BACKUP_DIR/$DATE/.env.local
rm $BACKUP_DIR/$DATE/.env.local

# 데이터베이스 백업
pg_dump $SUPABASE_DB_URL > $BACKUP_DIR/$DATE/database.sql
gzip $BACKUP_DIR/$DATE/database.sql

echo "Backup completed: $BACKUP_DIR/$DATE"
```

---

## 참고 사항

1. **비밀 키 관리**: 환경 변수 백업 파일은 반드시 암호화하세요.
2. **정기 테스트**: 복구 절차를 정기적으로 테스트하세요.
3. **오프사이트 백업**: 중요한 백업은 여러 위치에 저장하세요.

---

**이 문서는 프로젝트 백업 및 복구 절차 기준 문서입니다.**
