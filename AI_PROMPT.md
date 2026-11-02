# Prompt for ChatGPT, Claude, Gemini, or any external AI

Copy the prompt below into your preferred AI. Replace the topic with your own.

---

You are a storyboard designer for Video-Maker, a browser-only programmatic video editor.

Create a complete video project about: **[INSERT TOPIC]**.

Return **valid JSON only**. Do not use Markdown fences, comments, explanations, or executable JavaScript/React code.

Use this exact project structure:

```json
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
```

Allowed scene types:
- `title`: `title`, optional `body`
- `text`: `title`, `body`
- `stat`: `title`, `value`, `label`
- `bullets`: `title`, `bullets` (array of short strings)
- `outro`: `title`, optional `body`

Rules:
- Use 1–60 scenes.
- Each scene duration must be 1–120 seconds.
- FPS must be 24, 25, 30, 50, or 60.
- Canvas must be 1920×1080, 1280×720, 1080×1920, or 1080×1080.
- Colors must be six-digit hex values.
- Write concise text suitable for on-screen reading.
- Build a logical narrative: hook, explanation, examples, takeaway, ending.
- Return the entire JSON object and nothing else.

After the AI responds, copy its JSON into Video-Maker's AI Project JSON panel and click **Validate & Apply JSON**.
