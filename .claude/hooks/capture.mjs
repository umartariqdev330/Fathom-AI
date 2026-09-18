#!/usr/bin/env node
/**
 * 8x assignment — agent capture hook.
 *
 * Wired to two Claude Code lifecycle events in .claude/settings.json:
 *   UserPromptSubmit -> `node .claude/hooks/capture.mjs prompt`
 *   Stop             -> `node .claude/hooks/capture.mjs response`
 *
 * Both fire automatically. Nothing here is invoked by hand.
 *
 * Captures ONLY the verbatim prompt and the final assistant response per turn.
 * No thinking, no tool calls, no intermediate steps. Output lands in
 * .agent-logs/YYYY-MM-DD_HH-MM-SS_<session-id>.md, one file per session.
 */
import fs from 'node:fs';
import path from 'node:path';

const MODE = process.argv[2];
const FALLBACK_MODEL = 'claude-opus-5';
const TOOL = 'claude-code';

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

function parseInput() {
  try {
    return JSON.parse(readStdin() || '{}');
  } catch {
    return {};
  }
}

function loadConfig(projectDir) {
  const p = path.join(projectDir, '.claude', 'capture.config.json');
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return {};
  }
}

/**
 * Walk the session transcript backwards for the last assistant text block.
 * Stops at the most recent real user prompt so we never bleed a previous
 * turn's answer into this one.
 */
function finalAssistantText(transcriptPath) {
  if (!transcriptPath || !fs.existsSync(transcriptPath)) return null;
  let lines;
  try {
    lines = fs.readFileSync(transcriptPath, 'utf8').split(/\r?\n/).filter(Boolean);
  } catch {
    return null;
  }
  for (let i = lines.length - 1; i >= 0; i--) {
    let o;
    try {
      o = JSON.parse(lines[i]);
    } catch {
      continue;
    }
    if (o.isSidechain) continue; // subagent traffic is not this turn's answer
    if (o.type === 'user') {
      const c = o.message?.content;
      const isToolResult = Array.isArray(c) && c.some((b) => b.type === 'tool_result');
      if (!isToolResult) break;
      continue;
    }
    if (o.type !== 'assistant') continue;
    const c = o.message?.content;
    if (!Array.isArray(c)) continue;
    const text = c
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();
    if (text) return { text, model: o.message?.model };
  }
  return null;
}

function lastKnownModel(transcriptPath) {
  if (!transcriptPath || !fs.existsSync(transcriptPath)) return null;
  try {
    const lines = fs.readFileSync(transcriptPath, 'utf8').split(/\r?\n/).filter(Boolean);
    for (let i = lines.length - 1; i >= 0; i--) {
      const o = JSON.parse(lines[i]);
      if (o.type === 'assistant' && o.message?.model) return o.message.model;
    }
  } catch {
    /* fall through */
  }
  return null;
}

function stamp(d) {
  return d.toISOString().replace(/\.(\d{3})Z$/, '.$1Z');
}

function fileStamp(d) {
  const p = (n) => String(n).padStart(2, '0');
  return (
    `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}` +
    `_${p(d.getUTCHours())}-${p(d.getUTCMinutes())}-${p(d.getUTCSeconds())}`
  );
}

function findSessionFile(logDir, sessionId) {
  try {
    const hit = fs.readdirSync(logDir).find((f) => f.endsWith(`_${sessionId}.md`));
    return hit ? path.join(logDir, hit) : null;
  } catch {
    return null;
  }
}

function createSessionFile(logDir, sessionId, now, model, cfg) {
  const file = path.join(logDir, `${fileStamp(now)}_${sessionId}.md`);
  const short = sessionId.slice(0, 8);
  const head = [
    '---',
    `session_id: ${sessionId}`,
    `date: ${now.toISOString().slice(0, 10)}`,
    `author: ${cfg.author || 'unknown'}`,
    `model: ${model}`,
    `tool: ${TOOL}`,
    `project: ${cfg.project || path.basename(path.dirname(logDir))}`,
    'total_exchanges: 0',
    `first_prompt_time: ${stamp(now)}`,
    `last_prompt_time: ${stamp(now)}`,
    '---',
    '',
    `# Session Log - ${now.toISOString().slice(0, 10)}`,
    '',
    `Session: \`${short}\` | Project: \`${cfg.project || path.basename(path.dirname(logDir))}\` | Author: \`${cfg.author || 'unknown'}\``,
    '',
    '---',
    '',
    '',
  ].join('\n');
  fs.writeFileSync(file, head, 'utf8');
  return file;
}

function setFrontmatter(body, key, value) {
  const re = new RegExp(`^${key}: .*$`, 'm');
  return re.test(body) ? body.replace(re, `${key}: ${value}`) : body;
}

function appendEntry(file, { type, num, sessionShort, timestamp, model, text }) {
  let body = fs.readFileSync(file, 'utf8');
  const promptCount = (body.match(/\[LOG_ENTRY type=PROMPT /g) || []).length;
  body +=
    `[LOG_ENTRY type=${type} num=${num} session=${sessionShort}]\n` +
    `timestamp: ${timestamp}\n` +
    `model: ${model}\n\n` +
    `${text}\n\n\n`;
  body = setFrontmatter(body, 'total_exchanges', type === 'PROMPT' ? promptCount + 1 : promptCount);
  if (type === 'PROMPT') body = setFrontmatter(body, 'last_prompt_time', timestamp);
  body = setFrontmatter(body, 'model', model);
  fs.writeFileSync(file, body, 'utf8');
}

function main() {
  const input = parseInput();
  const projectDir = input.cwd || process.cwd();
  const logDir = path.join(projectDir, '.agent-logs');
  fs.mkdirSync(logDir, { recursive: true });

  const cfg = loadConfig(projectDir);
  const sessionId = input.session_id || 'unknown-session';
  const short = sessionId.slice(0, 8);
  const now = new Date();
  const model = lastKnownModel(input.transcript_path) || cfg.model || FALLBACK_MODEL;

  let file = findSessionFile(logDir, sessionId);
  if (!file) file = createSessionFile(logDir, sessionId, now, model, cfg);

  const body = fs.readFileSync(file, 'utf8');
  const promptCount = (body.match(/\[LOG_ENTRY type=PROMPT /g) || []).length;
  const responseCount = (body.match(/\[LOG_ENTRY type=RESPONSE /g) || []).length;

  if (MODE === 'prompt') {
    const prompt = input.prompt;
    if (typeof prompt !== 'string' || !prompt.length) return;
    appendEntry(file, {
      type: 'PROMPT',
      num: promptCount + 1,
      sessionShort: short,
      timestamp: stamp(now),
      model,
      text: prompt,
    });
    return;
  }

  if (MODE === 'response') {
    if (promptCount === 0) return; // nothing to answer yet
    if (responseCount >= promptCount) return; // Stop fired twice for one turn
    const found = finalAssistantText(input.transcript_path);
    if (!found) return;
    appendEntry(file, {
      type: 'RESPONSE',
      num: promptCount,
      sessionShort: short,
      timestamp: stamp(now),
      model: found.model || model,
      text: found.text,
    });
  }
}

try {
  main();
} catch {
  // A capture failure must never break the session.
}
