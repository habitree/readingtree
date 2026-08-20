# Favicon PNG 생성 가이드

## 개요

Next.js App Router에서 `app/icon.png` 파일을 자동으로 인식하여 favicon으로 사용합니다.

## 현재 상태

- ✅ `app/icon.svg` 생성 완료
- ✅ `app/layout.tsx` metadata에 `icon.png` 추가 완료
- ⏳ `app/icon.png` 파일 생성 필요

## PNG 생성 방법

### 방법 1: 온라인 변환 도구 사용 (가장 간단)

1. **SVG to PNG 변환 사이트 방문**
   - https://svgtopng.com/
   - https://convertio.co/kr/svg-png/
   - https://cloudconvert.com/svg-to-png

2. **`app/icon.svg` 파일 업로드**

3. **설정**
   - 크기: 512x512 픽셀 (권장)
   - 또는 32x32, 64x64, 180x180 등 다양한 크기

4. **변환 후 다운로드**

5. **파일 저장**
   - 다운로드한 파일을 `app/icon.png`로 저장

### 방법 2: 이미지 편집 프로그램 사용

1. **프로그램 열기**
   - Adobe Illustrator
   - Inkscape (무료)
   - GIMP (무료)
   - Figma

2. **`app/icon.svg` 파일 열기**

3. **PNG로 내보내기**
   - 크기: 512x512 픽셀
   - 파일명: `icon.png`
   - 저장 위치: `app/` 디렉토리

### 방법 3: Node.js 스크립트 사용 (개발자용)

```bash
# sharp 패키지 설치
npm install --save-dev sharp

# 변환 스크립트 실행
node scripts/convert-svg-to-png.js
```

## Next.js App Router 자동 인식

Next.js는 다음 파일들을 자동으로 인식합니다:

- `app/icon.png` → `/icon.png` (favicon)
- `app/icon.svg` → `/icon.svg` (SVG favicon)
- `app/apple-icon.png` → `/apple-icon.png` (Apple Touch Icon)

## 권장 크기

- **icon.png**: 512x512 픽셀 (다양한 크기 자동 생성)
- **apple-icon.png**: 180x180 픽셀 (iOS 홈 화면 아이콘)

## 확인 방법

1. 개발 서버 실행: `npm run dev`
2. 브라우저에서 `http://localhost:3000` 접속
3. 브라우저 탭에서 favicon 확인
4. 개발자 도구 → Network 탭에서 `/icon.png` 요청 확인

## 참고

- Next.js는 `app/icon.png`를 자동으로 최적화하여 다양한 크기로 제공합니다
- Vercel 배포 시 자동으로 favicon이 적용됩니다

