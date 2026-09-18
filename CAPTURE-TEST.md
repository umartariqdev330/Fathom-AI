# Capture test

Status: **hook installed and verified by pipe test; live canaries pending** (see
"Canaries" below — updated as soon as they land).

## 1. Setup

| | |
|---|---|
| Tool | Claude Code (Anthropic), running in the Claude desktop app's Code tab |
| Model | `claude-opus-5` — single model, it both plans and executes. No planner/executor split. |
| Automatic mechanism? | Yes. Claude Code supports lifecycle **hooks** declared in `.claude/settings.json`. |

## 2. Mechanism

Two hook events, both fired by the harness with no action from me:

| Event | Fires | Command |
|---|---|---|
| `UserPromptSubmit` | the moment a prompt is submitted | `node .claude/hooks/capture.mjs prompt` |
| `Stop` | when the assistant finishes a turn | `node .claude/hooks/capture.mjs response` |

**Config file changed:** [`.claude/settings.json`](.claude/settings.json)
**Hook script:** [`.claude/hooks/capture.mjs`](.claude/hooks/capture.mjs)
**Author/project metadata:** [`.claude/capture.config.json`](.claude/capture.config.json)

Both hooks are in project settings, so they apply to every session opened in this
repo — not just the one that created them.

### What it captures, and what it throws away

`UserPromptSubmit` receives the prompt verbatim on stdin and appends it unmodified.

`Stop` receives a path to the session transcript (JSONL). The script walks that
transcript **backwards** and takes the text blocks of the last assistant message,
stopping at the most recent real user prompt. That means:

- thinking blocks — not captured
- tool calls and their results — not captured
- intermediate assistant text emitted before a tool call — not captured
- subagent traffic (`isSidechain`) — skipped
- only the final answer for that turn — captured

A repeated `Stop` for the same turn is a no-op (the script compares `RESPONSE`
count against `PROMPT` count), so nothing is double-logged.

## 3. Log location

`.agent-logs/YYYY-MM-DD_HH-MM-SS_<session-id>.md` — one file per session, named
for the session's first prompt, in the format specified by the setup page.
Committed, never gitignored (`.gitignore` says so explicitly).

## 4. Verification

### Pipe test (passed)

Before relying on the harness, I fed both hook modes the exact stdin payload the
harness sends, against a synthetic transcript containing an interim assistant
message with a tool call plus a final assistant message:

    {"session_id":"aaaaaaaa-…","cwd":"<repo>","transcript_path":"<fake>.jsonl","prompt":"pipe test prompt"}

Result — the log file contained exactly one `PROMPT` entry with the verbatim
prompt, and exactly one `RESPONSE` entry containing only
`"This is the FINAL response for the turn."` The earlier `"Thinking out loud is
not captured."` text and the `tool_use` block were correctly excluded. Running
the `Stop` hook a second time added nothing. The synthetic file was then deleted —
it was not a real session and does not belong in the record.

### Canaries

<!-- Filled in from the real log file once the canary prompts land. -->

_Pending._

## 5. What did not work first time

- Nothing failed outright, but one thing is worth recording: `.claude/` did not
  exist when this session started, and Claude Code's settings watcher only
  watches directories that had a settings file at session start. So the hooks may
  not bind until the session is restarted. That is exactly why step 4 of the setup
  asks for a canary in a **second** session — it is the only thing that proves the
  hook is installed rather than merely written.
