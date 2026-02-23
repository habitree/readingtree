# Habitree Reading Hub - Press Kit

Habitree Reading Hub의 공식 Press Kit 및 랜딩 페이지입니다.

## GitHub Pages 배포 확인

이 저장소는 GitHub Pages를 통해 배포됩니다.

### 배포 URL
- **프로덕션 사이트**: https://habitree.github.io/habitree_pr/

### 배포 상태 확인

1. GitHub 저장소의 **Settings** → **Pages** 메뉴로 이동
2. 다음 설정 확인:
   - **Source**: `Deploy from a branch`
   - **Branch**: `main` / `/ (root)`
   - **Save** 클릭

3. 배포 완료까지 몇 분 소요될 수 있습니다.

### 파일 구조

```
habitree_pr/
├── index.html          # 메인 랜딩 페이지 (GitHub Pages가 자동 인식)
├── RP_FAQ.html         # 원본 HTML 파일
├── .nojekyll           # Jekyll 비활성화 (정적 HTML 서빙)
└── README.md           # 이 파일
```

### 로컬에서 테스트

```bash
# Python 3가 설치되어 있다면
python -m http.server 8000

# 브라우저에서 http://localhost:8000 접속
```

## 문의

미디어 문의: cdhrich@naver.com

