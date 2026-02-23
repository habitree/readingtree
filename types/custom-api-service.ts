/**
 * DB 조회 결과 타입 (api_key_encrypted 제외, api_key_preview만 포함)
 */
export interface CustomApiService {
  id: string;
  name: string;
  description: string;
  endpoint_url: string;
  api_key_preview: string;
  category: string;
  is_active: boolean;
  icon: string;
  external_doc_url: string;
  features: string[];
  notes: string;
  created_at: string;
  updated_at: string;
}

/**
 * 생성/수정 폼 입력값 (api_key 포함)
 */
export interface CustomApiServiceInput {
  name: string;
  description?: string;
  endpoint_url?: string;
  api_key?: string;
  category?: string;
  is_active?: boolean;
  icon?: string;
  external_doc_url?: string;
  features?: string[];
  notes?: string;
}
