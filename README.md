# Professional Screen Recorder Pro

A small client-side demo app for screen recording, trimming, merging (conceptual), audio extraction, and simple editing features.

## Features
- Record screen (DisplayMedia) with optional microphone and webcam overlay
- Start / Pause / Stop recording
- Preview and download recordings (WebM)
- Screenshot capture
- Basic trim UI (requires ffmpeg or similar for real trimming)
- Simple video library to import and queue videos
- Audio extraction to WebM (use external tools for MP3/WAV conversion)

## Quick Start
1. Install a small static server (if you don't have one). Example using http-server:

   ```bash
   npm install -g http-server
   # or use npx for one-off: npx http-server -c-1 . -p 8080
   ```

2. Start the server from the project root:

   ```bash
   npx http-server -c-1 . -p 8080
   ```

3. Open your browser and navigate to:

   http://localhost:8080/index.html

Notes:
- `getDisplayMedia` requires a secure context (localhost or HTTPS). Some browsers block screen capture on file://.
- Recording large resolutions (4K/8K) may produce very large files; ensure you have enough disk space.
- Advanced features like video merging, trimming, and GIF export are *placeholders* and may require integration with FFmpeg (ffmpeg.wasm) or server-side tools for production usage.

## Development
- Files of interest:
  - `index.html` — App entry page
  - `assets/css/styles.css` — Styles
  - `assets/js/app.js` — Main application logic (extracted from original single-file app)

## Testing
- Load the page and grant screen and microphone permissions when prompted.
- Use the UI to start/pause/stop and then preview & download the recording.

## License
This project is a conversion/refactor of an existing single-file demo for personal use and experimentation.

---
If you want, I can add a minimal `package.json` with a start script or include instructions for running with VS Code Live Server. Let me know your preference.