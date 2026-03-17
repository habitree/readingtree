/**
 * Edge TTS & BGM 오디오 설정
 */

export const ttsConfig = {
  voice: "ko-KR-SunHiNeural",
  rate: "+0%",
  pitch: "+0Hz",
  volume: "+0%",
  outputFormat: "audio-24khz-48kbitrate-mono-mp3",
} as const;

export const bgmConfig = {
  volume: 0.15, // BGM 볼륨 (TTS 대비)
  fadeInFrames: 30, // 1초 페이드인
  fadeOutFrames: 60, // 2초 페이드아웃
} as const;

export const ttsVoiceOptions = {
  female: {
    sunhi: "ko-KR-SunHiNeural", // 기본 - 밝고 또렷한 여성
    jiyeon: "ko-KR-JiYeonNeural", // 차분하고 부드러운 여성 (Windows 11+)
  },
  male: {
    inJoon: "ko-KR-InJoonNeural", // 안정적인 남성
    hyunsu: "ko-KR-HyunsuNeural", // 따뜻한 남성 (Windows 11+)
  },
} as const;
