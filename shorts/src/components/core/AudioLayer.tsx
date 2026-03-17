import React from "react";
import { Audio, interpolate, useCurrentFrame } from "remotion";
import { bgmConfig } from "../../config/audio";

interface AudioLayerProps {
  bgmSrc?: string;
  ttsSrc?: string;
  bgmVolume?: number;
  ttsVolume?: number;
  totalFrames: number;
}

export const AudioLayer: React.FC<AudioLayerProps> = ({
  bgmSrc,
  ttsSrc,
  bgmVolume = bgmConfig.volume,
  ttsVolume = 1.0,
  totalFrames,
}) => {
  const frame = useCurrentFrame();

  const bgmFadeIn = bgmConfig.fadeInFrames;
  const bgmFadeOut = bgmConfig.fadeOutFrames;

  const bgmVol = bgmSrc
    ? interpolate(
        frame,
        [0, bgmFadeIn, totalFrames - bgmFadeOut, totalFrames],
        [0, bgmVolume, bgmVolume, 0],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
      )
    : 0;

  const ttsVol = ttsSrc
    ? interpolate(frame, [0, 15], [0, ttsVolume], {
        extrapolateRight: "clamp",
      })
    : 0;

  return (
    <>
      {bgmSrc && <Audio src={bgmSrc} loop volume={bgmVol} />}
      {ttsSrc && <Audio src={ttsSrc} volume={ttsVol} />}
    </>
  );
};
