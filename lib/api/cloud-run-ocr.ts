/**
 * Google Cloud Run OCR 서비스 클라이언트
 * extractTextFromImage Cloud Function을 사용한 OCR 처리
 */

import { GoogleAuth } from "google-auth-library";

const CLOUD_RUN_OCR_URL = process.env.CLOUD_RUN_OCR_URL || 
  "https://extracttextfromimage-236647437750.us-central1.run.app";
  
/**
 * 인증 토큰 캐시 (메모리)
 * 토큰은 약 1시간 동안 유효하므로 캐싱하여 성능 최적화
 */
interface TokenCache {
  token: string;
  expiresAt: number; // 만료 시간 (밀리초)
}

let tokenCache: TokenCache | null = null;

/**
 * Cloud Run OCR 인증 토큰 가져오기
 * 동적으로 토큰을 생성하거나 캐시된 토큰을 반환
 * @returns 인증 토큰
 */
async function getAuthToken(): Promise<string | null> {
  console.log("[Cloud Run OCR] getAuthToken 호출");
  
  // 1. 정적 토큰이 환경 변수에 있는 경우 (하위 호환성)
  if (process.env.CLOUD_RUN_OCR_AUTH_TOKEN) {
    console.log("[Cloud Run OCR] 정적 토큰 사용");
    return process.env.CLOUD_RUN_OCR_AUTH_TOKEN;
  }

  // 2. 서비스 계정 키가 환경 변수에 있는 경우 (동적 토큰 생성)
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  console.log("[Cloud Run OCR] 서비스 계정 키 확인:", {
    hasServiceAccountKey: !!serviceAccountKey,
    keyLength: serviceAccountKey?.length || 0,
    keyPreview: serviceAccountKey ? serviceAccountKey.substring(0, 50) + "..." : null,
  });
  
  if (serviceAccountKey) {
    try {
      // 캐시된 토큰이 있고 아직 유효한 경우 재사용 (1분 여유)
      if (tokenCache && tokenCache.expiresAt > Date.now() + 60000) {
        console.log("[Cloud Run OCR] 캐시된 토큰 재사용");
        return tokenCache.token;
      }

      console.log("[Cloud Run OCR] 새 토큰 생성 시작");
      
      // 서비스 계정 키 파싱
      let credentials;
      try {
        credentials = typeof serviceAccountKey === 'string' 
          ? JSON.parse(serviceAccountKey) 
          : serviceAccountKey;
        console.log("[Cloud Run OCR] 서비스 계정 키 파싱 성공:", {
          projectId: credentials.project_id,
          clientEmail: credentials.client_email,
        });
      } catch (parseError) {
        const parseErrorMessage = parseError instanceof Error ? parseError.message : "알 수 없는 오류";
        console.error("[Cloud Run OCR] 서비스 계정 키 파싱 실패:", parseErrorMessage);
        const hint = parseErrorMessage.includes("control character")
          ? " 환경 변수에는 한 줄로 만든 JSON을 넣어야 합니다. 서비스 계정 JSON을 복사할 때 줄바꿈을 제거하고, private_key 값 안의 줄바꿈은 반드시 \\n (역슬래시+n) 두 글자로 넣으세요. Vercel/로컬에서는 한 줄(minified) JSON으로 저장하세요."
          : "";
        throw new Error(`GOOGLE_SERVICE_ACCOUNT_KEY 환경 변수가 유효한 JSON 형식이 아닙니다: ${parseErrorMessage}.${hint}`);
      }

      // Google Auth 클라이언트 생성 및 ID 토큰 생성
      console.log("[Cloud Run OCR] GoogleAuth 클라이언트 생성 중...");
      const auth = new GoogleAuth({ credentials });
      console.log("[Cloud Run OCR] ID 토큰 클라이언트 생성 중, 대상 URL:", CLOUD_RUN_OCR_URL);
      const idTokenClient = await auth.getIdTokenClient(CLOUD_RUN_OCR_URL);
      console.log("[Cloud Run OCR] ID 토큰 가져오기 중...");
      const token = await idTokenClient.idTokenProvider.fetchIdToken(CLOUD_RUN_OCR_URL);
      console.log("[Cloud Run OCR] ID 토큰 생성 성공, 토큰 길이:", token.length);

      // 토큰 캐싱 (55분 유효)
      tokenCache = {
        token,
        expiresAt: Date.now() + 3300000,
      };

      return token;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류";
      const errorStack = error instanceof Error ? error.stack : undefined;
      console.error("[Cloud Run OCR] 동적 토큰 생성 실패:", {
        error: errorMessage,
        stack: errorStack,
      });
      return null;
    }
  }

  // 3. 인증 정보가 없는 경우 (공개 함수 가정)
  console.warn("[Cloud Run OCR] 인증 정보가 없습니다. 공개 함수로 가정합니다.");
  return null;
}

/**
 * 이미지에서 텍스트 추출 (OCR)
 * Google Cloud Run OCR 서비스를 사용
 * @param imageUrl 이미지 URL
 * @returns 추출된 텍스트
 */
export async function extractTextFromImage(imageUrl: string): Promise<string> {
  try {
    console.log("[Cloud Run OCR] OCR 처리 시작");

    // 1. 이미지 다운로드
    console.log("[Cloud Run OCR] 이미지 다운로드 시작:", {
      imageUrl: imageUrl.substring(0, 100) + "...",
    });

    let imageResponse: Response;
    try {
      imageResponse = await fetch(imageUrl, {
        signal: AbortSignal.timeout(30000), // 30초 타임아웃
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; ReadingTree/1.0)",
        },
      });
    } catch (fetchError) {
      const errorMessage = fetchError instanceof Error ? fetchError.message : "알 수 없는 오류";
      console.error("[Cloud Run OCR] 이미지 다운로드 요청 실패:", {
        error: errorMessage,
        imageUrl: imageUrl.substring(0, 100) + "...",
      });
      
      // 네트워크 오류인 경우
      if (errorMessage.includes("timeout") || errorMessage.includes("aborted")) {
        throw new Error(`이미지 다운로드 타임아웃: 이미지 서버에 연결할 수 없습니다.`);
      }
      throw new Error(`이미지 다운로드 실패: ${errorMessage}`);
    }

    if (!imageResponse.ok) {
      const status = imageResponse.status;
      const statusText = imageResponse.statusText;
      
      // 404 오류인 경우 더 명확한 메시지
      if (status === 404) {
        console.error("[Cloud Run OCR] 이미지 404 오류:", {
          status,
          statusText,
          imageUrl: imageUrl.substring(0, 100) + "...",
        });
        
        throw new Error(`이미지 파일을 찾을 수 없습니다 (404). 이미지 URL이 만료되었거나 삭제되었을 수 있습니다.`);
      }
      
      // 403/401 오류인 경우
      if (status === 403 || status === 401) {
        console.error("[Cloud Run OCR] 이미지 접근 거부:", {
          status,
          statusText,
          imageUrl: imageUrl.substring(0, 100) + "...",
        });
        
        throw new Error(`이미지 접근이 거부되었습니다 (${status}). 권한이 없거나 파일이 삭제되었을 수 있습니다.`);
      }
      
      // 기타 오류
      console.error("[Cloud Run OCR] 이미지 다운로드 실패:", {
        status,
        statusText,
        imageUrl: imageUrl.substring(0, 100) + "...",
      });
      
      throw new Error(
        `이미지 다운로드 실패: ${status} ${statusText}`
      );
    }

    const buffer = await imageResponse.arrayBuffer();

    // 파일 크기 확인 (최대 10MB)
    const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
    if (buffer.byteLength > MAX_IMAGE_SIZE) {
      throw new Error("이미지 크기가 너무 큽니다. (최대 10MB)");
    }

    // 2. Base64 인코딩
    const base64Image = Buffer.from(buffer).toString("base64");
    
    // MIME 타입 확인
    const contentType = imageResponse.headers.get("content-type") || "image/jpeg";
    const mimeType = contentType.startsWith("image/")
      ? contentType
      : "image/jpeg";

    // 3. 요청 본문 준비
    const requestBody: { image: string; mimeType: string } = {
      image: base64Image,
      mimeType,
    };
    
    // 4. 인증 토큰 가져오기
    console.log("[Cloud Run OCR] 인증 토큰 가져오기 시작");
    const authToken = await getAuthToken();
    
    if (authToken) {
      console.log("[Cloud Run OCR] 인증 토큰 생성 성공, 토큰 길이:", authToken.length);
    } else {
      console.warn("[Cloud Run OCR] 인증 토큰이 없습니다. 공개 함수로 시도합니다.");
      console.log("[Cloud Run OCR] 환경 변수 확인:", {
        hasStaticToken: !!process.env.CLOUD_RUN_OCR_AUTH_TOKEN,
        hasServiceAccountKey: !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
        serviceAccountKeyLength: process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.length || 0,
      });
    }
    
    // 5. 요청 헤더 준비
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    
    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
      console.log("[Cloud Run OCR] Authorization 헤더 추가됨");
    } else {
      console.warn("[Cloud Run OCR] Authorization 헤더 없이 요청 전송");
    }
    
    // 6. Cloud Run OCR API 호출
    console.log("[Cloud Run OCR] API 호출 시작:", {
      url: CLOUD_RUN_OCR_URL,
      hasAuthToken: !!authToken,
      requestBodySize: JSON.stringify(requestBody).length,
    });
    
    const response = await fetch(CLOUD_RUN_OCR_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(60000), // 60초 타임아웃
    });
    
    console.log("[Cloud Run OCR] API 응답 수신:", {
      status: response.status,
      statusText: response.statusText,
      hasAuthHeader: !!headers["Authorization"],
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      let errorData: any = null;
      
      try {
        errorData = JSON.parse(errorText);
      } catch {
        // JSON 파싱 실패 시 원본 텍스트 사용
      }
      
      const errorMessage = errorData?.error?.message || errorData?.message || errorText || "알 수 없는 오류";
      
      console.error("[Cloud Run OCR] API 호출 실패:", {
        status: response.status,
        statusText: response.statusText,
        error: errorMessage,
        requestSize: JSON.stringify(requestBody).length,
      });
      
      throw new Error(
        `Cloud Run OCR API 호출 실패 (${response.status}): ${errorMessage}`
      );
    }

    // 7. 응답 파싱
    const data = await response.json();
    const extractedText = data.text || data.extractedText || data.result || "";
    
    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error("Cloud Run OCR에서 텍스트를 추출하지 못했습니다.");
    }

    console.log("[Cloud Run OCR] OCR 처리 성공, 텍스트 길이:", extractedText.length);

    return extractedText.trim();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류";
    console.error("[Cloud Run OCR] OCR 처리 실패:", errorMessage);
    throw new Error(`Cloud Run OCR 처리 실패: ${errorMessage}`);
  }
}
