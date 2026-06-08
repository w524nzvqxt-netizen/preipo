import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  Loop,
  OffthreadVideo,
  Series,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const FONT = "Helvetica, Arial, sans-serif";
const EMER = "#059669";
const GREEN = "#0B3D2E";

export type Visual =
  | { type: "video"; src: string; title?: string; subtitle?: string; caption?: string }
  | { type: "founders" }
  | { type: "metrics"; title: string; rows: [string, string][] }
  | {
      type: "scenarios";
      items: { k: string; val: number; mult: number; irr: string; color: string }[];
    };

export type Scene = { durationInFrames: number; audio: string; visual: Visual };

// Появление: opacity + сдвиг вверх
function rise(frame: number, start = 0, dur = 14) {
  const o = interpolate(frame, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const y = interpolate(frame, [start, start + dur], [40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return { opacity: o, transform: `translateY(${y}px)` };
}

export const CompanyVideo: React.FC<{ scenes: Scene[] }> = ({ scenes }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a0a", fontFamily: FONT }}>
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

const SceneView: React.FC<{ scene: Scene }> = ({ scene }) => {
  const v = scene.visual;
  if (v.type === "video") return <VideoScene v={v} />;
  if (v.type === "founders") return <FoundersScene />;
  if (v.type === "metrics") return <MetricsScene v={v} />;
  return <ScenariosScene v={v} />;
};

const VideoScene: React.FC<{ v: Extract<Visual, { type: "video" }> }> = ({ v }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <OffthreadVideo
        src={staticFile(v.src)}
        muted
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.15) 45%, rgba(0,0,0,0) 75%)",
        }}
      />
      {v.title && (
        <AbsoluteFill
          style={{ justifyContent: "center", alignItems: "flex-start", padding: "0 110px" }}
        >
          <div style={{ ...rise(frame, 4, 16) }}>
            <div style={{ color: "#fff", fontSize: 96, fontWeight: 800, lineHeight: 1.05 }}>
              {v.title}
            </div>
            {v.subtitle && (
              <div style={{ color: "#6EE7B7", fontSize: 40, marginTop: 18, ...rise(frame, 14, 16) }}>
                {v.subtitle}
              </div>
            )}
          </div>
        </AbsoluteFill>
      )}
      {v.caption && (
        <AbsoluteFill style={{ justifyContent: "flex-end", padding: "0 0 90px 110px" }}>
          <div style={{ ...rise(frame, 6, 14) }}>
            <div style={{ width: 90, height: 8, background: EMER, marginBottom: 22 }} />
            <div style={{ color: "#fff", fontSize: 52, fontWeight: 700, maxWidth: 1400 }}>
              {v.caption}
            </div>
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

const FoundersScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const photoX = spring({ frame, fps, from: -120, to: 0, durationInFrames: 22 });
  const photoO = interpolate(frame, [0, 16], [0, 1], { extrapolateRight: "clamp" });
  const people = [
    { n: "Jeff Bezos", r: "Основатель · впервые с 2021 в операционной роли" },
    { n: "Vik Bajaj", r: "Co-CEO · ex-глава Google X · Verily, Grail" },
  ];
  return (
    <AbsoluteFill style={{ backgroundColor: "#fff" }}>
      <div style={{ padding: "70px 110px" }}>
        <div style={{ fontSize: 64, fontWeight: 800, color: "#171717", ...rise(frame, 0, 12) }}>
          Основатели и команда
        </div>
        <div style={{ width: 200, height: 8, background: EMER, marginTop: 14 }} />
      </div>
      <div style={{ display: "flex", gap: 70, padding: "0 110px", alignItems: "center" }}>
        <Img
          src={staticFile("uploads/v2/bezos.jpg")}
          style={{
            width: 560,
            height: 640,
            objectFit: "cover",
            borderRadius: 24,
            opacity: photoO,
            transform: `translateX(${photoX}px)`,
          }}
        />
        <div style={{ flex: 1 }}>
          {people.map((p, i) => (
            <div key={i} style={{ marginBottom: 56, ...rise(frame, 16 + i * 12, 16) }}>
              <div style={{ fontSize: 56, fontWeight: 800, color: "#171717" }}>{p.n}</div>
              <div style={{ fontSize: 30, color: "#525252", marginTop: 10 }}>{p.r}</div>
            </div>
          ))}
          <div style={{ fontSize: 28, color: "#94A3B8", ...rise(frame, 44, 16) }}>
            120+ исследователей из OpenAI, xAI, DeepMind, Meta, Anthropic, Nvidia
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const MetricsScene: React.FC<{ v: Extract<Visual, { type: "metrics" }> }> = ({ v }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: GREEN, padding: "80px 110px" }}>
      <div style={{ fontSize: 64, fontWeight: 800, color: "#fff", ...rise(frame, 0, 12) }}>
        {v.title}
      </div>
      <div style={{ width: 200, height: 8, background: "#34D399", marginTop: 14 }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 50, marginTop: 70 }}>
        {v.rows.map((r, i) => (
          <div key={i} style={{ ...rise(frame, 14 + i * 10, 16) }}>
            <div style={{ fontSize: 30, color: "#A7F3D0" }}>{r[0]}</div>
            <div style={{ fontSize: 72, fontWeight: 800, color: "#fff", marginTop: 8 }}>{r[1]}</div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

const ScenariosScene: React.FC<{ v: Extract<Visual, { type: "scenarios" }> }> = ({ v }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: GREEN, padding: "80px 110px" }}>
      <div style={{ fontSize: 64, fontWeight: 800, color: "#fff", ...rise(frame, 0, 12) }}>
        Вложили $100 000
      </div>
      <div style={{ width: 200, height: 8, background: "#34D399", marginTop: 14 }} />
      <div style={{ display: "flex", gap: 40, marginTop: 70 }}>
        {v.items.map((s, i) => {
          const val = Math.round(
            interpolate(frame, [12 + i * 6, 46 + i * 6], [0, s.val], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })
          );
          return (
            <div
              key={i}
              style={{
                flex: 1,
                background: "#0F2E22",
                border: `3px solid ${s.color}`,
                borderRadius: 24,
                padding: "40px 24px",
                textAlign: "center",
                ...rise(frame, 10 + i * 8, 16),
              }}
            >
              <div style={{ fontSize: 34, fontWeight: 800, color: s.color }}>{s.k}</div>
              <div style={{ fontSize: 58, fontWeight: 800, color: "#fff", marginTop: 20 }}>
                ${val.toLocaleString("ru-RU")}
              </div>
              <div style={{ fontSize: 28, color: "#94A3B8", marginTop: 14 }}>
                ×{s.mult.toFixed(2).replace(".", ",")}
              </div>
              <div style={{ fontSize: 26, color: "#94A3B8", marginTop: 8 }}>IRR {s.irr}</div>
            </div>
          );
        })}
      </div>
      <div style={{ fontSize: 22, color: "#6EE7B7", marginTop: 50 }}>
        Горизонт ~3,6 года. Нетто: разводнение 35%, carry 20%, fee 5%. Не гарантия доходности.
      </div>
    </AbsoluteFill>
  );
};
