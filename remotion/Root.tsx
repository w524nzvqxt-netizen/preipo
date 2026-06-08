import { Composition } from "remotion";
import { CompanyVideo, type Scene } from "./CompanyVideo";
import { Short, type ShortScene } from "./Short";

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="CompanyVideo"
        component={CompanyVideo}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ scenes: [] as Scene[] }}
        calculateMetadata={({ props }) => ({
          durationInFrames: Math.max(
            1,
            (props.scenes as Scene[]).reduce((a, s) => a + s.durationInFrames, 0)
          ),
        })}
      />
      <Composition
        id="Short"
        component={Short}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ scenes: [] as ShortScene[] }}
        calculateMetadata={({ props }) => ({
          durationInFrames: Math.max(
            1,
            (props.scenes as ShortScene[]).reduce(
              (a, s) => a + s.durationInFrames,
              0
            )
          ),
        })}
      />
    </>
  );
};
