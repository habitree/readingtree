import { TipStep } from "../../src/types/reading-tip";

/**
 * 독서 꿀팁 콘텐츠 선별
 * 사전 정의된 팁 목록에서 순환 선택
 */

interface TipTemplate {
  tipTitle: string;
  category: string;
  tipSteps: TipStep[];
}

const TIP_TEMPLATES: TipTemplate[] = [
  {
    tipTitle: "독서 습관 만들기 3단계",
    category: "독서 습관",
    tipSteps: [
      { title: "시간 고정", description: "매일 같은 시간에 10분만 읽기", icon: "clock" },
      { title: "장소 지정", description: "독서 전용 공간을 정하세요", icon: "location" },
      { title: "기록하기", description: "인상 깊은 문장을 바로 저장", icon: "pen" },
    ],
  },
  {
    tipTitle: "효과적인 독서 기록법",
    category: "독서 기록",
    tipSteps: [
      { title: "밑줄 긋기", description: "마음에 드는 문장에 표시하기", icon: "highlight" },
      { title: "내 생각 쓰기", description: "왜 이 문장이 좋았는지 메모", icon: "thought" },
      { title: "연결하기", description: "다른 책의 문장과 연결해보기", icon: "link" },
    ],
  },
  {
    tipTitle: "읽고 싶은 책 고르는 법",
    category: "책 선택",
    tipSteps: [
      { title: "관심사 따라가기", description: "지금 궁금한 주제부터 시작", icon: "star" },
      { title: "첫 10페이지", description: "서점에서 첫 10페이지 읽어보기", icon: "book" },
      { title: "추천 활용", description: "비슷한 취향의 독서가 추천 확인", icon: "people" },
    ],
  },
];

export function selectTip(index?: number): TipTemplate {
  const idx = index ?? Math.floor(Math.random() * TIP_TEMPLATES.length);
  return TIP_TEMPLATES[idx % TIP_TEMPLATES.length];
}
