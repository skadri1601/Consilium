# Voice Dictation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users dictate debate topics and follow-ups instead of typing. Adds `consilium --voice` for one-shot dictation, a push-to-talk binding in the REPL, and a streaming transcription pipe for the web app. Targets the user who is whiteboarding or pacing while thinking, where typing is friction.

**Architecture:** Two transcription backends. Default is OpenAI Whisper API for CLI/REPL because it's high-accuracy and works offline-tolerant (record locally, send in one chunk). Web app uses Web Speech API where available, falls back to Whisper for incognito and unsupported browsers. The recording layer is pluggable so we can swap in Deepgram or Distil-Whisper later for cost.

**Tech Stack:** Node.js `node-mic` (cross-platform mic capture via `sox` / `arecord` / `PortAudio`), Whisper API for transcription, Web Speech API for browser surfaces, `key-sender` for push-to-talk capture in REPL.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `packages/cli/src/utils/voice/recorder.ts` | Create | Cross-OS mic capture; resolves to a WAV buffer |
| `packages/cli/src/utils/voice/transcriber.ts` | Create | Whisper API client; pluggable adapter interface |
| `packages/cli/src/utils/voice/index.ts` | Create | Re-exports |
| `packages/cli/src/commands/voice-debate.ts` | Create | Implements `consilium --voice` |
| `packages/cli/src/repl/voice-binding.ts` | Create | Push-to-talk readline key binding |
| `packages/cli/src/repl/index.ts` | Modify | Register voice binding; show indicator |
| `packages/cli/src/index.ts` | Modify | Add `--voice` flag to debate command |
| `apps/web/components/voice/VoiceInput.tsx` | Create | Web Speech API + Whisper fallback button |
| `apps/web/components/voice/use-recorder.ts` | Create | Hook wrapping `MediaRecorder` |
| `apps/api/src/features/transcription/transcription.controller.ts` | Create | `POST /api/v1/transcription` → Whisper |
| `apps/api/src/features/transcription/transcription.service.ts` | Create | Whisper SDK wrapper, file-size + duration guards |
| `apps/api/src/features/transcription/transcription.module.ts` | Create | NestJS module |
| `packages/shared/src/voice/index.ts` | Create | Shared types for transcription requests/responses |

---

### Task 1: CLI Recorder + Transcriber

Pure Node.js path — no native deps beyond `sox`/`arecord` which are universally available or one `brew install` away.

**Files:**
- Create: `packages/cli/src/utils/voice/recorder.ts`
- Create: `packages/cli/src/utils/voice/transcriber.ts`

- [ ] **Step 1: Detect a recorder.** On macOS use `sox`; Linux fall back to `arecord`; Windows use `sox`. Error message tells the user how to install if missing.
- [ ] **Step 2: Recorder API** `start(): Recorder` returns an object with `stop(): Promise<Buffer>` (PCM WAV at 16kHz mono). Spawn the recorder as a child process; capture stdout into a buffer.
- [ ] **Step 3: TranscriberAdapter interface** `transcribe(audio: Buffer): Promise<{ text: string; durationMs: number }>`. Default impl posts to OpenAI Whisper. Reads `OPENAI_API_KEY` from KeyManager.
- [ ] **Step 4: Unit test** with a fixture WAV; asserts the recorder spawns the right binary on each OS.

---

### Task 2: `--voice` Flag for Debate Command

One-shot dictation: user runs `consilium --voice`, sees "Listening...", presses Enter or pauses for 2s, then the transcript becomes the debate topic.

**Files:**
- Create: `packages/cli/src/commands/voice-debate.ts`
- Modify: `packages/cli/src/index.ts` and `packages/cli/src/commands/debate.ts` (add `--voice` flag)

- [ ] **Step 1: Wire the flag** so `voice?: boolean` lives on `DebateCommandOptions`.
- [ ] **Step 2: If `--voice` is set and no topic**, call `voiceDebate.captureTopic()` which runs the recorder, shows a live VU-meter, returns the transcript.
- [ ] **Step 3: Confirm with the user** ("Heard: '<text>' — Enter to debate, e to edit") so misrecognition doesn't waste a debate.
- [ ] **Step 4: Cost line** prints estimated transcription cost (Whisper is $0.006/min) before recording.

---

### Task 3: Push-to-Talk in REPL

Hold a chosen key (default: F2) to dictate, release to stop. Transcript drops into the readline input buffer so the user can edit before submitting.

**Files:**
- Create: `packages/cli/src/repl/voice-binding.ts`
- Modify: `packages/cli/src/repl/index.ts`

- [ ] **Step 1: Bind F2** using readline's `process.stdin.on('keypress', ...)` (works in TTY mode; we already use raw mode for the REPL).
- [ ] **Step 2: While held**, start the recorder. On release, transcribe and insert the text at the cursor.
- [ ] **Step 3: Visual indicator** in the prompt: a microphone glyph when recording.
- [ ] **Step 4: Config option** `consilium config set voiceKey "f3"` to remap.

---

### Task 4: Web App Voice Input

Modern Chrome + Edge support Web Speech API for free; everywhere else we record and send to the API.

**Files:**
- Create: `apps/web/components/voice/VoiceInput.tsx`
- Create: `apps/web/components/voice/use-recorder.ts`

- [ ] **Step 1: `useRecorder()` hook** wraps `MediaRecorder` for browsers. Resolves a Blob (Opus/webm) on stop.
- [ ] **Step 2: Detect Web Speech** with `'webkitSpeechRecognition' in window`. If yes, stream transcription locally and show a live partial preview.
- [ ] **Step 3: Fallback** posts the Blob to `/api/v1/transcription` and shows a spinner.
- [ ] **Step 4: Mic button** in the debate composer; respects browser permissions; shows clear error if denied.

---

### Task 5: Backend Transcription Endpoint

**Files:**
- Create: `apps/api/src/features/transcription/transcription.controller.ts`
- Create: `apps/api/src/features/transcription/transcription.service.ts`
- Create: `apps/api/src/features/transcription/transcription.module.ts`

- [ ] **Step 1: `POST /api/v1/transcription`** accepts `multipart/form-data` with `audio` (max 25MB) and optional `language`. Auth via existing middleware.
- [ ] **Step 2: Service** calls OpenAI Whisper (`openai.audio.transcriptions.create`). Validates duration via ffprobe.
- [ ] **Step 3: Rate-limit** 60 transcriptions / hour / user via Redis token bucket.
- [ ] **Step 4: Audit log** seconds transcribed for billing reconciliation; we charge users a pass-through Whisper price.

---

### Task 6: Privacy + Consent

- [ ] **Step 1: First-run prompt** "Voice input sends audio to OpenAI Whisper. Accept? [y/N]". Stored in `~/.consilium/config.json`.
- [ ] **Step 2: Local-only mode** if user has `whisper.cpp` installed (`which whisper-cli`), prefer it — no audio leaves the machine. Document in README.
- [ ] **Step 3: Don't log raw audio** server-side; only seconds + bytes for metrics.

---

## Acceptance criteria

1. `consilium --voice` records a 5s clip and produces a debate from the transcript on macOS, Linux (Ubuntu 24.04), and Windows (with `sox` installed).
2. REPL push-to-talk works without breaking the existing readline keybindings.
3. Web mic button completes a round-trip transcription on Chrome (Web Speech) and Firefox (Whisper fallback) within 3s for a 10s clip.
4. Permission prompt is shown exactly once per machine, not per session.
5. Backend rejects audio over 25MB or 10 minutes with a clear error.
6. Local whisper.cpp path is documented and tested.

## Out of scope

- Real-time streaming transcription with partial results in the CLI (defer; Whisper API doesn't support it well).
- Voice-driven slash commands (`/voice mode council`); we just dictate topics.
- Speaker diarization for multi-person dictation.
- TTS for synthesizing the debate result back as audio (separate plan if there's demand).
- Custom wake-words.

## Estimated effort

2.5 engineer-weeks: 1 week CLI recorder + transcriber + flag, 0.5 weeks REPL push-to-talk, 1 week web component + API endpoint + rate-limiting + privacy plumbing.
