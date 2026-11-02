import JSZip from "jszip";
import type { SceneType, VideoProject, VideoScene } from "../types";

const SCENE_TYPES: SceneType[] = ["title", "text", "stat", "bullets", "outro"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeScene(input: unknown, index: number): VideoScene {
  if (!isRecord(input)) throw new Error(`Scene ${index + 1} must be an object.`);
  const type = input.type;
  if (typeof type !== "string" || !SCENE_TYPES.includes(type as SceneType)) {
    throw new Error(`Scene ${index + 1} has an unsupported type. Use: ${SCENE_TYPES.join(", ")}.`);
  }
  const title = typeof input.title === "string" ? input.title : `Scene ${index + 1}`;
  const duration = Number(input.duration ?? 5);
  if (!Number.isFinite(duration) || duration < 1 || duration > 120) {
    throw new Error(`Scene ${index + 1} duration must be between 1 and 120 seconds.`);
  }
  const bullets = Array.isArray(input.bullets)
    ? input.bullets.filter((item): item is string => typeof item === "string").slice(0, 8)
    : undefined;

  return {
    id: typeof input.id === "string" ? input.id : `scene-${index + 1}`,
    type: type as SceneType,
    duration,
    title: title.slice(0, 180),
    body: typeof input.body === "string" ? input.body.slice(0, 1200) : undefined,
    value: typeof input.value === "string" ? input.value.slice(0, 80) : undefined,
    label: typeof input.label === "string" ? input.label.slice(0, 180) : undefined,
    bullets,
    accent: typeof input.accent === "string" && /^#[0-9a-fA-F]{6}$/.test(input.accent) ? input.accent : undefined,
  };
}

export function validateProject(input: unknown): VideoProject {
  if (!isRecord(input)) throw new Error("Project must be a JSON object.");
  if (input.format !== "videomaker") throw new Error('Missing or invalid format. Expected "videomaker".');
  if (!Array.isArray(input.scenes) || input.scenes.length === 0 || input.scenes.length > 60) {
    throw new Error("Project must contain between 1 and 60 scenes.");
  }

  const fps = Number(input.fps ?? 30);
  const width = Number(input.width ?? 1920);
  const height = Number(input.height ?? 1080);
  if (![24, 25, 30, 50, 60].includes(fps)) throw new Error("FPS must be 24, 25, 30, 50, or 60.");
  const supportedSizes = ["1920x1080", "1280x720", "1080x1920", "1080x1080"];
  if (!supportedSizes.includes(`${width}x${height}`)) {
    throw new Error("Use a supported canvas size: 1920×1080, 1280×720, 1080×1920, or 1080×1080.");
  }

  return {
    format: "videomaker",
    version: "1.0",
    title: typeof input.title === "string" ? input.title.slice(0, 120) : "Untitled video",
    fps,
    width,
    height,
    background: typeof input.background === "string" && /^#[0-9a-fA-F]{6}$/.test(input.background) ? input.background : "#0b1220",
    scenes: input.scenes.map(normalizeScene),
  };
}

export async function importProjectFile(file: File): Promise<VideoProject> {
  if (file.size > 100 * 1024 * 1024) throw new Error("Import is limited to 100 MB per file.");
  if (file.name.toLowerCase().endsWith(".json")) {
    return validateProject(JSON.parse(await file.text()));
  }
  if (!file.name.toLowerCase().endsWith(".zip")) {
    throw new Error("Choose a .json project or a .zip archive.");
  }

  const zip = await JSZip.loadAsync(file);
  const projectEntry = zip.file("project.json");
  if (!projectEntry) throw new Error('ZIP archive must contain "project.json" at its root.');

  const raw = JSON.parse(await projectEntry.async("text")) as Record<string, unknown>;
  if (Array.isArray(raw.scenes) && raw.scenes.every((scene) => typeof scene === "string")) {
    const sceneFiles = await Promise.all(
      (raw.scenes as string[]).map(async (path) => {
        if (!path.startsWith("scenes/") || path.includes("..")) throw new Error("Scene paths must stay inside scenes/.");
        const entry = zip.file(path);
        if (!entry) throw new Error(`Missing scene file: ${path}`);
        return JSON.parse(await entry.async("text"));
      }),
    );
    raw.scenes = sceneFiles;
  }
  return validateProject(raw);
}

export function projectToJson(project: VideoProject): string {
  return JSON.stringify(project, null, 2);
}
