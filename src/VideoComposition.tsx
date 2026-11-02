import React from "react";
import { AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { VideoProject, VideoScene } from "./types";

const SceneVisual: React.FC<{ scene: VideoScene; background: string }> = ({ scene, background }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const entrance = spring({ frame, fps, config: { damping: 18, stiffness: 90 } });
  const opacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  const y = interpolate(entrance, [0, 1], [42, 0]);
  const accent = scene.accent ?? "#34d399";

  return (
    <AbsoluteFill style={{ background, color: "#f8fafc", justifyContent: "center", padding: "8%", fontFamily: "Arial, sans-serif" }}>
      <div style={{ opacity, transform: `translateY(${y}px)`, maxWidth: "84%" }}>
        <div style={{ width: 76, height: 7, borderRadius: 10, background: accent, marginBottom: 34 }} />
        {scene.type === "title" || scene.type === "outro" ? (
          <>
            <div style={{ color: accent, fontSize: 22, letterSpacing: 8, fontWeight: 700, marginBottom: 28 }}>
              {scene.type === "outro" ? "THE END" : "VIDEO-MAKER PRESENTS"}
            </div>
            <div style={{ fontSize: 86, lineHeight: 1.08, fontWeight: 800, letterSpacing: -3 }}>{scene.title}</div>
            {scene.body && <div style={{ fontSize: 32, color: "#cbd5e1", marginTop: 32, lineHeight: 1.45 }}>{scene.body}</div>}
          </>
        ) : scene.type === "stat" ? (
          <>
            <div style={{ fontSize: 34, color: "#cbd5e1", marginBottom: 28 }}>{scene.title}</div>
            <div style={{ fontSize: 150, fontWeight: 800, color: accent, lineHeight: 1 }}>{scene.value}</div>
            <div style={{ fontSize: 34, marginTop: 26, color: "#e2e8f0" }}>{scene.label}</div>
          </>
        ) : scene.type === "bullets" ? (
          <>
            <div style={{ fontSize: 58, fontWeight: 800, marginBottom: 42 }}>{scene.title}</div>
            {(scene.bullets ?? []).map((item, index) => (
              <div key={index} style={{ display: "flex", alignItems: "center", gap: 22, fontSize: 34, marginBottom: 24, color: "#dbeafe" }}>
                <span style={{ color: accent, fontSize: 42 }}>✦</span>{item}
              </div>
            ))}
          </>
        ) : (
          <>
            <div style={{ fontSize: 64, fontWeight: 800, marginBottom: 34 }}>{scene.title}</div>
            <div style={{ fontSize: 36, color: "#cbd5e1", lineHeight: 1.5, maxWidth: 1350 }}>{scene.body}</div>
          </>
        )}
      </div>
      <div style={{ position: "absolute", bottom: 54, left: "8%", right: "8%", display: "flex", justifyContent: "space-between", color: "#64748b", fontSize: 18, letterSpacing: 3 }}>
        <span>VIDEO.MAKER</span><span>{scene.id.toUpperCase()}</span>
      </div>
      <div style={{ position: "absolute", bottom: 0, left: 0, height: 8, width: `${Math.min(100, (frame / Math.max(1, scene.duration * fps)) * 100)}%`, background: accent }} />
    </AbsoluteFill>
  );
};

export const VideoComposition: React.FC<{ project: VideoProject }> = ({ project }) => {
  let from = 0;
  return (
    <AbsoluteFill style={{ background: project.background ?? "#0b1220" }}>
      {project.scenes.map((scene) => {
        const start = from;
        const duration = Math.max(1, Math.round(scene.duration * project.fps));
        from += duration;
        return (
          <Sequence key={scene.id} from={start} durationInFrames={duration}>
            <SceneVisual scene={scene} background={project.background ?? "#0b1220"} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

export function getDurationInFrames(project: VideoProject): number {
  return project.scenes.reduce((total, scene) => total + Math.round(scene.duration * project.fps), 0);
}
