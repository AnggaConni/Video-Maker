export type SceneType = "title" | "text" | "stat" | "bullets" | "outro";

export type VideoScene = {
  id: string;
  type: SceneType;
  duration: number;
  title: string;
  body?: string;
  value?: string;
  label?: string;
  bullets?: string[];
  accent?: string;
};

export type VideoProject = {
  format: "videomaker";
  version: "1.0";
  title: string;
  fps: number;
  width: number;
  height: number;
  background?: string;
  scenes: VideoScene[];
};

export const DEFAULT_PROJECT: VideoProject = {
  format: "videomaker",
  version: "1.0",
  title: "Mangrove Ecosystems",
  fps: 30,
  width: 1920,
  height: 1080,
  background: "#0b1220",
  scenes: [
    {
      id: "intro",
      type: "title",
      duration: 4,
      title: "MANGROVE ECOSYSTEMS",
      body: "A visual introduction to our coastal guardians",
      accent: "#34d399",
    },
    {
      id: "why",
      type: "text",
      duration: 5,
      title: "Why mangroves matter",
      body: "Mangrove forests protect coastlines, store carbon, and provide vital habitats for marine life.",
      accent: "#60a5fa",
    },
    {
      id: "impact",
      type: "stat",
      duration: 4,
      title: "Nature's coastal shield",
      value: "3-in-1",
      label: "Protection · Biodiversity · Blue Carbon",
      accent: "#34d399",
    },
    {
      id: "action",
      type: "bullets",
      duration: 5,
      title: "What can we do?",
      bullets: ["Map and monitor coastal habitats", "Restore degraded mangrove areas", "Support local stewardship"],
      accent: "#fbbf24",
    },
    {
      id: "outro",
      type: "outro",
      duration: 4,
      title: "PROTECT OUR COASTLINES",
      body: "Small actions. Lasting impact.",
      accent: "#34d399",
    },
  ],
};
