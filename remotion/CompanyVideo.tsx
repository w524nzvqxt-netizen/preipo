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

// Палитра колоды FinSight (private banking: тёмный фон + золото)
const DARK = "#070710";
const DARK2 = "#0E0E1A";
const GOLD = "#D6B56D";
const GOLD_SOFT = "#EAD8AE";
const INK = "#F5F3EC";
const MUTED = "#8C8578";

export type Visual =
  | { type: "video"; src: string; title?: string; subtitle?: string; caption?: string; accent?: string }
  | { type: "founders" }
  | { type: "metrics"; title: string; rows: [string, string][] }
  | {
      type: "scenarios";
      items: { k: string; val: number; mult: number; irr: string; color: string }[];
    }
  // Слайды колоды (тёмно-золотая тема)
  | { type: "stat"; value: string; label: string; sub?: string; kicker?: string }
  | { type: "timeline"; title: string; note?: string; cols: { k: string; t: string; d: string; hot?: boolean }[] }
  | { type: "list"; title: string; kicker?: string; items: string[]; note?: string }
  | { type: "bars"; title: string; unit?: string; items: { label: string; value: number; display: string; hot?: boolean }[]; note?: string }
  | { type: "grid"; title: string; kicker?: string; rows: [string, string][]; note?: string }
  | { type: "steps"; title: string; kicker?: string; items: { y: string; t: string; d?: string; hot?: boolean }[]; note?: string };

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
  if (v.type === "stat") return <StatScene v={v} />;
  if (v.type === "timeline") return <TimelineScene v={v} />;
  if (v.type === "list") return <ListScene v={v} />;
  if (v.type === "bars") return <BarsScene v={v} />;
  if (v.type === "grid") return <GridScene v={v} />;
  if (v.type === "steps") return <StepsScene v={v} />;
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
              <div style={{ color: v.accent || "#6EE7B7", fontSize: 40, marginTop: 18, ...rise(frame, 14, 16) }}>
                {v.subtitle}
              </div>
            )}
          </div>
        </AbsoluteFill>
      )}
      {v.caption && (
        <AbsoluteFill style={{ justifyContent: "flex-end", padding: "0 0 90px 110px" }}>
          <div style={{ ...rise(frame, 6, 14) }}>
            <div style={{ width: 90, height: 8, background: v.accent || EMER, marginBottom: 22 }} />
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

// ====== Слайды колоды (тёмно-золотая тема) ======

// Фон слайда: тёмный + мягкое золотое свечение у горизонта
const SlideBG: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(120% 80% at 50% -10%, ${DARK2} 0%, ${DARK} 55%)`,
      fontFamily: FONT,
    }}
  >
    <AbsoluteFill
      style={{
        background: `radial-gradient(60% 40% at 50% 8%, rgba(214,181,109,0.10) 0%, rgba(214,181,109,0) 70%)`,
      }}
    />
    {children}
  </AbsoluteFill>
);

// Заголовок слайда: кикер + название + золотая линейка
const SlideHead: React.FC<{ kicker?: string; title: string; frame: number }> = ({ kicker, title, frame }) => (
  <div>
    {kicker && (
      <div style={{ fontSize: 26, letterSpacing: 6, textTransform: "uppercase", color: GOLD, ...rise(frame, 0, 12) }}>
        {kicker}
      </div>
    )}
    <div style={{ fontSize: 62, fontWeight: 800, color: INK, marginTop: kicker ? 14 : 0, lineHeight: 1.08, ...rise(frame, 2, 12) }}>
      {title}
    </div>
    <div style={{ width: 180, height: 6, background: GOLD, marginTop: 22, borderRadius: 3 }} />
  </div>
);

// Строка-вывод внизу слайда — синхронна с ключевой мыслью озвучки
const NoteBar: React.FC<{ text: string; frame: number; delay?: number }> = ({ text, frame, delay = 34 }) => (
  <AbsoluteFill style={{ justifyContent: "flex-end", pointerEvents: "none" }}>
    <div style={{ margin: "0 110px 66px", display: "flex", alignItems: "center", gap: 22, ...rise(frame, delay, 16) }}>
      <div style={{ width: 8, height: 46, background: GOLD, borderRadius: 4, flexShrink: 0 }} />
      <div style={{ fontSize: 36, fontWeight: 600, color: GOLD_SOFT, lineHeight: 1.25 }}>{text}</div>
    </div>
  </AbsoluteFill>
);

// Крупная цифра (демография, рынок, тайминг)
const StatScene: React.FC<{ v: Extract<Visual, { type: "stat" }> }> = ({ v }) => {
  const frame = useCurrentFrame();
  return (
    <SlideBG>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "0 120px", textAlign: "center" }}>
        {v.kicker && (
          <div style={{ fontSize: 28, letterSpacing: 6, textTransform: "uppercase", color: GOLD, marginBottom: 30, ...rise(frame, 2, 12) }}>
            {v.kicker}
          </div>
        )}
        <div
          style={{
            fontSize: 240,
            fontWeight: 800,
            color: GOLD,
            lineHeight: 1,
            textShadow: "0 0 60px rgba(214,181,109,0.35)",
            ...rise(frame, 6, 18),
          }}
        >
          {v.value}
        </div>
        <div style={{ fontSize: 46, fontWeight: 600, color: INK, marginTop: 40, maxWidth: 1500, ...rise(frame, 16, 16) }}>
          {v.label}
        </div>
        {v.sub && (
          <div style={{ fontSize: 30, color: MUTED, marginTop: 26, maxWidth: 1400, ...rise(frame, 26, 16) }}>
            {v.sub}
          </div>
        )}
      </AbsoluteFill>
    </SlideBG>
  );
};

// Три волны ИИ (или любой 3-колоночный таймлайн)
const TimelineScene: React.FC<{ v: Extract<Visual, { type: "timeline" }> }> = ({ v }) => {
  const frame = useCurrentFrame();
  return (
    <SlideBG>
      <div style={{ padding: "80px 110px" }}>
        <SlideHead title={v.title} frame={frame} />
        <div style={{ display: "flex", gap: 36, marginTop: 80, alignItems: "stretch" }}>
          {v.cols.map((c, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                background: c.hot ? "rgba(214,181,109,0.10)" : "rgba(255,255,255,0.03)",
                border: `2px solid ${c.hot ? GOLD : "rgba(214,181,109,0.22)"}`,
                borderRadius: 24,
                padding: "44px 34px",
                ...rise(frame, 16 + i * 12, 18),
              }}
            >
              <div style={{ fontSize: 30, fontWeight: 700, color: c.hot ? GOLD : GOLD_SOFT, letterSpacing: 2 }}>
                {c.k}
              </div>
              <div style={{ fontSize: 52, fontWeight: 800, color: INK, marginTop: 18 }}>{c.t}</div>
              <div style={{ fontSize: 30, color: MUTED, marginTop: 20, lineHeight: 1.35 }}>{c.d}</div>
            </div>
          ))}
        </div>
      </div>
      {v.note && <NoteBar text={v.note} frame={frame} />}
    </SlideBG>
  );
};

// Список (таланты, сегменты)
const ListScene: React.FC<{ v: Extract<Visual, { type: "list" }> }> = ({ v }) => {
  const frame = useCurrentFrame();
  return (
    <SlideBG>
      <div style={{ padding: "80px 110px" }}>
        <SlideHead kicker={v.kicker} title={v.title} frame={frame} />
        <div style={{ marginTop: 60 }}>
          {v.items.map((it, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 28,
                padding: "22px 0",
                borderBottom: "1px solid rgba(214,181,109,0.16)",
                ...rise(frame, 16 + i * 8, 14),
              }}
            >
              <div style={{ width: 14, height: 14, borderRadius: 7, background: GOLD, flexShrink: 0 }} />
              <div style={{ fontSize: 40, fontWeight: 600, color: INK }}>{it}</div>
            </div>
          ))}
        </div>
      </div>
      {v.note && <NoteBar text={v.note} frame={frame} />}
    </SlideBG>
  );
};

// Столбчатая диаграмма (рост доли Physical AI в VC)
const BarsScene: React.FC<{ v: Extract<Visual, { type: "bars" }> }> = ({ v }) => {
  const frame = useCurrentFrame();
  const max = Math.max(...v.items.map((it) => it.value));
  const H = 560; // высота области графика
  return (
    <SlideBG>
      <div style={{ padding: "80px 110px" }}>
        <SlideHead title={v.title} frame={frame} />
        <div style={{ display: "flex", gap: 30, alignItems: "flex-end", height: H, marginTop: 70 }}>
          {v.items.map((it, i) => {
            const grow = interpolate(frame, [14 + i * 4, 40 + i * 4], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const h = (it.value / max) * (H - 90) * grow;
            return (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
                <div style={{ fontSize: 30, fontWeight: 800, color: it.hot ? GOLD : GOLD_SOFT, marginBottom: 12, opacity: grow }}>
                  {it.display}
                </div>
                <div
                  style={{
                    width: "100%",
                    height: Math.max(h, 2),
                    borderRadius: "10px 10px 0 0",
                    background: it.hot
                      ? `linear-gradient(180deg, ${GOLD} 0%, #B8945020 140%)`
                      : "rgba(214,181,109,0.28)",
                    boxShadow: it.hot ? "0 0 40px rgba(214,181,109,0.4)" : "none",
                  }}
                />
                <div style={{ fontSize: 26, color: MUTED, marginTop: 16 }}>{it.label}</div>
              </div>
            );
          })}
        </div>
        {v.unit && <div style={{ fontSize: 26, color: MUTED, marginTop: 24 }}>{v.unit}</div>}
      </div>
    </SlideBG>
  );
};

// Сетка «условия / метрики» (тёмно-золотая, в отличие от зелёной MetricsScene)
const GridScene: React.FC<{ v: Extract<Visual, { type: "grid" }> }> = ({ v }) => {
  const frame = useCurrentFrame();
  return (
    <SlideBG>
      <div style={{ padding: "80px 110px" }}>
        <SlideHead kicker={v.kicker} title={v.title} frame={frame} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, marginTop: 70 }}>
          {v.rows.map((r, i) => (
            <div
              key={i}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(214,181,109,0.2)",
                borderRadius: 20,
                padding: "36px 40px",
                ...rise(frame, 14 + i * 10, 16),
              }}
            >
              <div style={{ fontSize: 30, color: GOLD_SOFT }}>{r[0]}</div>
              <div style={{ fontSize: 68, fontWeight: 800, color: INK, marginTop: 10 }}>{r[1]}</div>
            </div>
          ))}
        </div>
      </div>
      {v.note && <NoteBar text={v.note} frame={frame} />}
    </SlideBG>
  );
};

// Вертикальный таймлайн (история/этапы): год + событие вдоль золотой линии
const StepsScene: React.FC<{ v: Extract<Visual, { type: "steps" }> }> = ({ v }) => {
  const frame = useCurrentFrame();
  return (
    <SlideBG>
      <div style={{ padding: "70px 110px" }}>
        <SlideHead kicker={v.kicker} title={v.title} frame={frame} />
        <div style={{ position: "relative", marginTop: 54, paddingLeft: 60 }}>
          {/* вертикальная линия */}
          <div style={{ position: "absolute", left: 17, top: 6, bottom: 6, width: 3, background: "rgba(214,181,109,0.3)" }} />
          {v.items.map((it, i) => (
            <div key={i} style={{ position: "relative", marginBottom: v.items.length > 5 ? 26 : 38, ...rise(frame, 14 + i * 8, 14) }}>
              {/* точка */}
              <div
                style={{
                  position: "absolute",
                  left: -51,
                  top: 8,
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  background: it.hot ? GOLD : DARK,
                  border: `3px solid ${GOLD}`,
                  boxShadow: it.hot ? "0 0 24px rgba(214,181,109,0.6)" : "none",
                }}
              />
              <div style={{ display: "flex", alignItems: "baseline", gap: 22 }}>
                <div style={{ fontSize: 40, fontWeight: 800, color: GOLD, minWidth: 200 }}>{it.y}</div>
                <div style={{ fontSize: 40, fontWeight: 700, color: INK }}>{it.t}</div>
              </div>
              {it.d && <div style={{ fontSize: 28, color: MUTED, marginTop: 6, marginLeft: 222 }}>{it.d}</div>}
            </div>
          ))}
        </div>
      </div>
      {v.note && <NoteBar text={v.note} frame={frame} />}
    </SlideBG>
  );
};
