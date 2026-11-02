import React, { useMemo, useRef, useState } from "react";
import { Player } from "@remotion/player";
import { renderMediaOnWeb } from "@remotion/web-renderer";
import { ClipboardCopy, Download, FileArchive, FileJson, Film, FolderOpen, Play, Plus, RefreshCw, Upload, WandSparkles } from "lucide-react";
import { DEFAULT_PROJECT, type VideoProject, type VideoScene } from "./types";
import { importProjectFile, projectToJson, validateProject } from "./lib/project";
import { getDurationInFrames, VideoComposition } from "./VideoComposition";

const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;

export default function App() {
  const [project, setProject] = useState<VideoProject>(DEFAULT_PROJECT);
  const [selectedId, setSelectedId] = useState(DEFAULT_PROJECT.scenes[0].id);
  const [jsonText, setJsonText] = useState(projectToJson(DEFAULT_PROJECT));
  const [message, setMessage] = useState("Ready. Import an AI-generated project or start with the sample.");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [rendering, setRendering] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const duration = useMemo(() => getDurationInFrames(project), [project]);
  const selected = project.scenes.find((scene) => scene.id === selectedId) ?? project.scenes[0];

  const applyProject = (next: VideoProject, success: string) => {
    setProject(next);
    setSelectedId(next.scenes[0].id);
    setJsonText(projectToJson(next));
    setError("");
    setMessage(success);
  };

  const handleImport = async (file?: File) => {
    if (!file) return;
    try {
      const next = await importProjectFile(file);
      applyProject(next, `Imported ${file.name} successfully.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not import this file.");
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const applyJson = () => {
    try {
      applyProject(validateProject(JSON.parse(jsonText)), "JSON validated and applied.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid project JSON.");
    }
  };

  const updateScene = (patch: Partial<VideoScene>) => {
    const next = { ...project, scenes: project.scenes.map((scene) => scene.id === selected.id ? { ...scene, ...patch } : scene) };
    setProject(next);
    setJsonText(projectToJson(next));
  };

  const addScene = () => {
    const scene: VideoScene = { id: `scene-${Date.now()}`, type: "text", duration: 5, title: "New scene", body: "Add your explanation here.", accent: "#60a5fa" };
    const next = { ...project, scenes: [...project.scenes, scene] };
    setProject(next);
    setSelectedId(scene.id);
    setJsonText(projectToJson(next));
    setMessage("New scene added.");
  };

  const exportVideo = async () => {
    setRendering(true);
    setProgress(0);
    setError("");
    setMessage("Preparing browser renderer…");
    try {
      if (!("VideoEncoder" in window)) throw new Error("This browser does not support WebCodecs. Try the latest Chrome or Edge.");
      const result = await renderMediaOnWeb({
        composition: {
          id: "video-maker-export",
          component: VideoComposition,
          durationInFrames: duration,
          fps: project.fps,
          width: project.width,
          height: project.height,
          calculateMetadata: null,
        },
        inputProps: { project },
        container: "mp4",
        videoCodec: "h264",
        videoBitrate: "high",
        onProgress: ({ progress: current }) => setProgress(Math.round(current * 100)),
        pageResponsiveness: "medium",
      });
      const blob = await result.getBlob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${project.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "video"}.mp4`;
      anchor.click();
      URL.revokeObjectURL(url);
      setMessage("MP4 exported successfully. Rendering happened in your browser.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rendering failed. Try a shorter or smaller project.");
    } finally {
      setRendering(false);
      setProgress(0);
    }
  };

  const copyAiPrompt = async () => {
    const prompt = `Create a Video-Maker project as valid JSON only. Do not return markdown fences or executable code.

Use this schema:
{
  "format": "videomaker",
  "version": "1.0",
  "title": "Video title",
  "fps": 30,
  "width": 1920,
  "height": 1080,
  "background": "#0b1220",
  "scenes": [
    {
      "id": "intro",
      "type": "title",
      "duration": 4,
      "title": "Opening title",
      "body": "Short subtitle",
      "accent": "#34d399"
    }
  ]
}

Allowed scene types:
- title: title + optional body
- text: title + body
- stat: title + value + label
- bullets: title + bullets (array of short strings)
- outro: title + optional body

Rules:
- Use 1 to 60 scenes.
- Each duration must be 1 to 120 seconds.
- Use fps 24, 25, 30, 50, or 60.
- Use canvas size 1920x1080, 1280x720, 1080x1920, or 1080x1080.
- Accent and background colors must be six-digit hex colors.
- Keep titles concise and body copy readable on screen.
- Return the complete JSON object, with no comments and no trailing commas.`;
    try {
      await navigator.clipboard.writeText(prompt);
      setMessage("Video-Maker AI prompt copied. Paste it into ChatGPT, Claude, Gemini, or another AI.");
      setError("");
    } catch {
      setError("Clipboard access was blocked. Copy the prompt from AI_PROMPT.md in the repository.");
    }
  };

  const downloadJson = () => {
    const blob = new Blob([projectToJson(project)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "project.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#"><span className="brand-mark"><Film size={19} /></span><span>VIDEO<span className="brand-light">.MAKER</span></span></a>
        <div className="topbar-center"><span className="status-dot" /> LOCAL WORKSPACE <span className="topbar-divider">/</span> {project.title}</div>
        <div className="topbar-actions">
          <button className="button button-ghost" onClick={copyAiPrompt}><ClipboardCopy size={16} /> AI Prompt</button><button className="button button-ghost" onClick={() => fileRef.current?.click()}><FolderOpen size={16} /> Import</button>
          <button className="button button-primary" onClick={exportVideo} disabled={rendering}><Download size={16} /> {rendering ? `Rendering ${progress}%` : "Export MP4"}</button>
        </div>
      </header>

      <input ref={fileRef} type="file" accept=".json,.zip,application/json,application/zip" hidden onChange={(event) => handleImport(event.target.files?.[0])} />

      <main className="workspace">
        <aside className="sidebar">
          <div className="section-heading"><span>PROJECT</span><button className="icon-button" title="Reset sample" onClick={() => applyProject(DEFAULT_PROJECT, "Sample project restored.")}><RefreshCw size={15} /></button></div>
          <div className="project-card"><div className="project-icon"><Film size={18} /></div><div><strong>{project.title}</strong><small>{project.scenes.length} scenes · {formatTime(duration / project.fps)}</small></div></div>
          <div className="section-heading scene-heading"><span>STORYBOARD</span><button className="icon-button" title="Add scene" onClick={addScene}><Plus size={16} /></button></div>
          <div className="scene-list">
            {project.scenes.map((scene, index) => (
              <button key={scene.id} className={`scene-item ${selected.id === scene.id ? "active" : ""}`} onClick={() => setSelectedId(scene.id)}>
                <span className="scene-number">{String(index + 1).padStart(2, "0")}</span>
                <span className="scene-copy"><strong>{scene.title}</strong><small>{scene.type} · {scene.duration}s</small></span>
              </button>
            ))}
          </div>
          <div className="sidebar-footer"><span className="local-indicator" /> All project data stays in this browser</div>
        </aside>

        <section className="editor-area">
          <div className="editor-heading"><div><span className="eyebrow">CANVAS PREVIEW</span><h1>{project.title}</h1></div><span className="resolution-pill">{project.width} × {project.height} · {project.fps} FPS</span></div>
          <div className="preview-stage">
            <div className="preview-frame" style={{ aspectRatio: `${project.width}/${project.height}` }}>
              <Player component={VideoComposition} inputProps={{ project }} durationInFrames={duration} compositionWidth={project.width} compositionHeight={project.height} fps={project.fps} controls style={{ width: "100%" }} />
            </div>
          </div>
          <div className="timeline-header"><span>SCENE TIMELINE</span><span>{formatTime(duration / project.fps)} TOTAL DURATION</span></div>
          <div className="timeline">
            {project.scenes.map((scene, index) => (
              <button key={scene.id} className={`timeline-clip ${selected.id === scene.id ? "selected" : ""}`} style={{ flexGrow: scene.duration, borderColor: scene.accent ?? "#334155" }} onClick={() => setSelectedId(scene.id)}>
                <span>{String(index + 1).padStart(2, "0")}</span><strong>{scene.title}</strong><small>{scene.duration}s</small>
              </button>
            ))}
          </div>
          <div className="notice"><span className="notice-icon"><WandSparkles size={16} /></span><span>{message}</span></div>
          {error && <div className="error-notice">{error}</div>}
          {rendering && <div className="progress-track"><div style={{ width: `${progress}%` }} /></div>}
        </section>

        <aside className="inspector">
          <div className="inspector-tabs"><span className="tab-active">SCENE SETTINGS</span><span>PROJECT</span></div>
          {selected && <div className="inspector-content">
            <div className="selected-label">SELECTED SCENE <span>#{project.scenes.indexOf(selected) + 1}</span></div>
            <label>Scene title<input value={selected.title} onChange={(e) => updateScene({ title: e.target.value })} /></label>
            <label>Scene type<select value={selected.type} onChange={(e) => updateScene({ type: e.target.value as VideoScene["type"] })}><option value="title">Title</option><option value="text">Text</option><option value="stat">Statistic</option><option value="bullets">Bullet list</option><option value="outro">Outro</option></select></label>
            <label>Duration (seconds)<input type="number" min="1" max="120" value={selected.duration} onChange={(e) => updateScene({ duration: Math.max(1, Math.min(120, Number(e.target.value))) })} /></label>
            <label>Body / description<textarea rows={4} value={selected.body ?? ""} onChange={(e) => updateScene({ body: e.target.value })} placeholder="Write the scene description…" /></label>
            {selected.type === "stat" && <><label>Big value<input value={selected.value ?? ""} onChange={(e) => updateScene({ value: e.target.value })} /></label><label>Value label<input value={selected.label ?? ""} onChange={(e) => updateScene({ label: e.target.value })} /></label></>}
            {selected.type === "bullets" && <label>Bullet points<textarea rows={5} value={(selected.bullets ?? []).join("\n")} onChange={(e) => updateScene({ bullets: e.target.value.split("\n").slice(0, 8) })} placeholder="One item per line" /></label>}
            <label>Accent color<input className="color-input" type="color" value={selected.accent ?? "#34d399"} onChange={(e) => updateScene({ accent: e.target.value })} /></label>
            <button className="button button-danger" onClick={() => {
              if (project.scenes.length <= 1) return;
              const nextScenes = project.scenes.filter((scene) => scene.id !== selected.id);
              const next = { ...project, scenes: nextScenes };
              setProject(next); setSelectedId(nextScenes[0].id); setJsonText(projectToJson(next));
            }}>Delete scene</button>
          </div>}
          <div className="json-panel">
            <div className="json-panel-heading"><div><FileJson size={15} /> AI PROJECT JSON</div><button onClick={downloadJson}>Download</button></div>
            <textarea spellCheck={false} value={jsonText} onChange={(e) => setJsonText(e.target.value)} />
            <button className="button button-outline apply-button" onClick={applyJson}>Validate & Apply JSON</button>
            <p>Paste JSON generated by ChatGPT, Claude, Gemini, or any other AI. No API connection required.</p>
          </div>
        </aside>
      </main>
      <footer className="app-footer"><span>VIDEO.MAKER <b>0.1.0</b></span><span><FileArchive size={13} /> JSON + ZIP IMPORT <i /> <Play size={13} /> REMOTION PLAYER <i /> <Upload size={13} /> LOCAL MP4 EXPORT</span></footer>
    </div>
  );
}
