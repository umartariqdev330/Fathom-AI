# Capture test

Status: **green.** The hook is installed, fires automatically, and has captured a
real turn in a live session without any action from me.

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

### Live capture (passed)

The real proof is the log the harness produced on its own. Session
`0fc92f66-6d2e-4495-b8f6-9cf16f0c97a0` wrote
`.agent-logs/2026-09-18_18-12-41_0fc92f66-6d2e-4495-b8f6-9cf16f0c97a0.md`, opening
with:

    ---
    session_id: 0fc92f66-6d2e-4495-b8f6-9cf16f0c97a0
    date: 2026-09-18
    author: Umar-Tariq
    model: claude-opus-5
    tool: claude-code
    project: meetly-ai
    total_exchanges: 1
    first_prompt_time: 2026-09-18T18:12:41.369Z
    last_prompt_time: 2026-09-18T18:19:49.153Z
    ---

    [LOG_ENTRY type=PROMPT num=1 session=0fc92f66]
    timestamp: 2026-09-18T18:19:49.153Z
    model: claude-opus-5

    Role
    You are a senior full-stack engineer and product designer. Build a complete,
    polished, production-ready clone of Fathom AI, an AI meeting notetaker, for a
    24-hour software engineering assignment.
    [... full prompt, verbatim, in the log file ...]

The matching `RESPONSE` entry was appended by the `Stop` hook when that turn
ended. Every turn from here on is recorded the same way.

### An honest note on what the record does and does not contain

The hooks were installed *during* the first session in this repo, which has two
visible consequences in the log, both left in deliberately:

1. The session file's creation timestamp (`18:12:41`) is earlier than its first
   prompt (`18:19:49`) — the `Stop` hook ran at the end of the turn that installed
   it, created the file, found no prompt to answer, and correctly wrote nothing.
2. The two turns before installation — the product teardown of fathom.video and
   the capture setup itself — are not in `.agent-logs/`. They happened before the
   hook existed. I am not going to back-fill them by hand; a reconstructed entry
   would be exactly the kind of tidied record the setup page says not to produce.

Because the hooks live in **project** settings rather than session state, they
apply to every session opened in this repo, not only the one that created them.

## 5. What did not work first time

- I expected to need a session restart. `.claude/` did not exist when this session
  started, and Claude Code's settings watcher only watches directories that had a
  settings file at startup, so I assumed the hooks would not bind until a restart.
  They bound immediately — the live capture above is from the same session that
  installed them. Recording the wrong prediction rather than quietly deleting it.
- First version of the `Stop` handler took the last assistant message in the
  transcript unconditionally. That is wrong on any turn ending in a tool call with
  no trailing text: it would reach back and re-log the *previous* turn's answer. It
  now walks backwards and stops at the most recent real user prompt, so a turn with
  no final text logs nothing rather than something false.
