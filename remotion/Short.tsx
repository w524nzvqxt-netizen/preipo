import React from "react";
import {
  AbsoluteFill,
  Audio,
  OffthreadVideo,
  Series,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";

const FONT = "Helvetica, Arial, sans-serif";
const EMER = "#34D399";

export type ShortScene = {
  durationInFrames: number;
  audio: string;
  clip: string;
  caption: string;
  hook?: boolean;
};

export const Short: React.FC<{ scenes: ShortScene[] }> = ({ scenes }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000", fontFamily: FONT }}>
      <Series>
        {scenes.map((s, i) => (
          <Series.Sequence key={i} durationInFrames={s.durationInFrames}>
            <SceneView scene={s} />
            <Audio src={staticFile(s.audio)} />
          </Series.Sequence>
        ))}
      </Series>
    </AbsoluteFill>
  );
};

const SceneView: React.FC<{ scene: ShortScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const words = scene.caption.split(" ");
  return (
    <AbsoluteFill>
      <OffthreadVideo
        src={staticFile(scene.clip)}
        muted
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.1) 30%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0.85) 100%)",
        }}
      />
      <AbsoluteFill
        style={{
          justifyContent: scene.hook ? "center" : "flex-end",
          alignItems: "center",
          padding: scene.hook ? "0 90px" : "0 80px 320px 80px",
        }}
      >
        <div style={{ textAlign: "center", lineHeight: 1.18 }}>
          {words.map((w, i) => {
            const start = i * 4;
            const o = interpolate(frame, [start, start + 10], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const y = interpolate(frame, [start, start + 10], [30, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            return (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  opacity: o,
                  transform: `translateY(${y}px)`,
                  color: "#fff",
                  fontSize: scene.hook ? 92 : 72,
                  fontWeight: 800,
                  marginRight: 18,
                  textShadow: "0 4px 24px rgba(0,0,0,0.6)",
                }}
              >
                {w}
              </span>
            );
          })}
        </div>
      </AbsoluteFill>
      {/* акцентная полоса снизу */}
      <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", padding: "0 0 220px 0" }}>
        <div style={{ width: 120, height: 8, background: EMER, borderRadius: 4, opacity: interpolate(frame, [4, 16], [0, 1], { extrapolateRight: "clamp" }) }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
