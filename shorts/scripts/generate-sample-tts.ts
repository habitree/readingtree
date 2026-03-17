/**
 * 모든 시리즈 샘플의 TTS 나레이션을 일괄 생성
 * → public/audio/tts/ 에 저장
 * → Root.tsx defaultProps의 audioUrl로 사용 가능
 *
 * Usage: npx tsx scripts/generate-sample-tts.ts
 */

import path from "path";
import fs from "fs";
import { generateTTS } from "../pipeline/utils/edge-tts";

const PUBLIC_TTS_DIR = path.resolve(__dirname, "../public/audio/tts");

// 시리즈별 샘플 나레이션 텍스트 (Root.tsx defaultProps 기반)
const SAMPLE_SCRIPTS: Record<string, string> = {
  "daily-quote":
    "새로운 길을 찾는 사람은 외로워야 하고, 고독한 시간을 보내야 한다. 헤르만 헤세의 데미안에서 만난 이 문장은, 나만의 길을 걷는 모든 사람에게 용기를 건넵니다. 마음에 남는 문장, ReadTree에 기록해보세요.",

  "service-intro":
    "독서 기록, 어디에 하고 계세요? 메모장에 흩어진 기록들, 다시 찾을 수 없는 인상 깊은 문장들. ReadTree는 이 문제를 해결합니다. 사진 한 장으로 문장을 기록하고, 책별로 자동 정리하고, 언제든 다시 찾을 수 있어요. 카드뉴스로 공유까지. 지금 무료로 시작하세요.",

  "feature-demo-library":
    "나만의 독서나무를 소개합니다. 읽은 만큼 자라나는 독서 기록 대시보드예요. 독서나무가 레벨에 따라 성장하고, 이번 주 독서 현황을 한눈에 확인할 수 있습니다. 읽고 있는 책의 진행률도 표시되고, 독서 달력으로 기록을 확인하세요. 무료로 시작하기.",

  "feature-demo-login":
    "간편한 시작. 카카오톡 한 번이면 바로 시작할 수 있어요. 카카오톡 또는 구글 계정으로 3초 만에 가입하고 바로 기록을 시작하세요. 별도 회원가입 절차 없이, 로그인 없이도 둘러볼 수 있습니다. 지금 시작하기.",

  "feature-demo-pricing":
    "합리적인 포인트 시스템을 소개합니다. 기본 기능은 완전 무료예요. AI 채팅과 OCR 필사 같은 프리미엄 기능은 포인트로 이용하세요. 첫 충전 시 포인트 2배 혜택까지. 무료로 시작하기.",

  "service-showcase":
    "독서 기록, 어디에 하고 계세요? 독서의 모든 순간을 ReadTree와 함께하세요. 나만의 서재에서 독서나무와 함께 성장하고, 카카오톡으로 3초 만에 시작하세요. 기본 무료, AI 기능은 포인트로 부담 없이. 지금 시작하기.",

  "user-story":
    "3개월 전의 서연은 메모장에 흩어진 독서 기록, 다시 찾을 수 없는 문장들, 읽었는데 기억나지 않는 책에 지쳐있었습니다. 그런데 ReadTree를 만나고 모든 게 달라졌어요. 책별로 정리된 나만의 서재, 언제든 다시 찾는 인상 깊은 문장, 독서나무와 함께 성장하는 기록. 0권에서 23권으로. 무료로 시작하기.",

  "booktok-style":
    "이 책 읽고 한참을 멍하니 앉아 있었습니다. 우리가 빛의 속도로 갈 수 없다면, 그 이유를 알고 싶었다. SF를 넘어 인간 존엄에 대한 묵직한 질문을 던지는 이 책. 김초엽 작가의 우리가 빛의 속도로 갈 수 없다면. 별점 다섯 개. 감동을 기록으로 남기세요.",

  "reading-challenge":
    "이번 달 당신의 독서량은? 7권을 읽어 목표의 70퍼센트를 달성했습니다. 총 2,340페이지. 소설 3권, 자기계발 2권, 에세이 1권, 과학 1권. 한국인 상위 12퍼센트의 독서량이에요. 나도 챌린지 참여하기.",

  "pain-point":
    "독서 기록 메모장에 하는 사람? 메모장에 흩어진 기록, 어떤 책이었는지 기억 안 남, 인상 깊은 문장 다시 못 찾음, 읽은 책 수도 모름. 이 앱 하나면 독서 기록 끝. 무료로 시작하기.",

  "community-highlight":
    "이번 주 가장 활발한 독서모임을 소개합니다. 철학하는 독서인, 인문 철학 모임 28명. 지금 읽고 있는 책은 차라투스트라는 이렇게 말했다. 초인의 개념이 현대에도 유효한가에 대한 열띤 토론이 이어지고 있어요. 독서모임 둘러보기.",

  "creator-collab":
    "BookTok 크리에이터 책읽는민지가 추천하는 책, 아몬드. 손원평 작가의 이 소설에 대해 이렇게 말합니다. 감정을 느끼지 못하는 소년의 이야기인데 읽고 나면 오히려 감정이 무엇인지 다시 생각하게 돼요. 서재에 156권을 기록 중인 민지와 함께 읽으러 가기.",
};

async function main() {
  fs.mkdirSync(PUBLIC_TTS_DIR, { recursive: true });

  console.log("=== 샘플 TTS 일괄 생성 ===\n");

  const entries = Object.entries(SAMPLE_SCRIPTS);
  let success = 0;
  let failed = 0;

  for (const [series, script] of entries) {
    const outputPath = path.join(PUBLIC_TTS_DIR, `${series}.mp3`);
    process.stdout.write(`[${success + failed + 1}/${entries.length}] ${series}...`);

    try {
      await generateTTS(script, outputPath);
      const size = fs.statSync(outputPath).size;
      console.log(` OK (${(size / 1024).toFixed(0)}KB)`);
      success++;
    } catch (err) {
      console.log(` FAILED: ${err instanceof Error ? err.message : err}`);
      failed++;
    }
  }

  console.log(`\n=== 완료: ${success}/${entries.length} 성공, ${failed} 실패 ===`);
  console.log(`출력: ${PUBLIC_TTS_DIR}/`);

  if (success > 0) {
    console.log("\n다음 단계:");
    console.log("1. Root.tsx defaultProps에 audioUrl 추가");
    console.log("   예: audioUrl: \"audio/tts/daily-quote.mp3\"");
    console.log("2. npx remotion render 로 재렌더링");
  }
}

main().catch((err) => {
  console.error("실패:", err);
  process.exit(1);
});
