#!/usr/bin/env node
/**
 * Typecheck gate for the app project (tsconfig.json / src/).
 *
 * src/ carries a set of pre-existing type errors that are out of scope to fix
 * right now. Rather than leave src/ with no type gate at all, we record those
 * errors in typecheck-baseline.txt and fail only when an error appears that is
 * NOT in the baseline.
 *
 * Baseline entries are normalised to `file(line,col): TSxxxx` — the message
 * text is dropped so the file does not churn when TypeScript rewords a
 * diagnostic. Entries are compared as a multiset, so a second error at an
 * already-baselined location still fails.
 *
 * Usage:
 *   node scripts/typecheck-baseline.mjs           # gate (default)
 *   node scripts/typecheck-baseline.mjs --update  # rewrite the baseline
 */

import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const require = createRequire(import.meta.url)
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const BASELINE_FILE = path.join(repoRoot, 'typecheck-baseline.txt')
const PROJECT = path.join(repoRoot, 'tsconfig.json')

const update = process.argv.includes('--update')

/**
 * Run `tsc --noEmit -p tsconfig.json` and return its raw output plus exit code.
 * `--pretty false` is forced so the output format does not change depending on
 * whether stdout happens to be a TTY.
 */
function runTsc() {
  const tscBin = require.resolve('typescript/bin/tsc')
  const res = spawnSync(
    process.execPath,
    [tscBin, '--noEmit', '--pretty', 'false', '-p', PROJECT],
    { cwd: repoRoot, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }
  )
  if (res.error) {
    console.error(`[typecheck-baseline] failed to run tsc: ${res.error.message}`)
    process.exit(2)
  }
  return { output: `${res.stdout || ''}${res.stderr || ''}`, status: res.status }
}

/**
 * Normalise tsc output to sorted `file(line,col): TSxxxx` keys.
 * Continuation lines of multi-line diagnostics are indented and are skipped by
 * the leading-non-space requirement in the regexes below.
 */
function normalise(output) {
  const withPos = /^(\S[^(]*)\((\d+),(\d+)\):\s+error\s+(TS\d+):/
  const withoutPos = /^(?:\S.*?\s)?error\s+(TS\d+):/
  const keys = []
  for (const line of output.split(/\r?\n/)) {
    if (!line || /^\s/.test(line)) continue
    const m = withPos.exec(line)
    if (m) {
      const file = m[1].split(path.sep).join('/')
      keys.push(`${file}(${m[2]},${m[3]}): ${m[4]}`)
      continue
    }
    const g = withoutPos.exec(line)
    if (g) keys.push(`<global>: ${g[1]}`)
  }
  return keys.sort()
}

function toCounts(keys) {
  const counts = new Map()
  for (const k of keys) counts.set(k, (counts.get(k) || 0) + 1)
  return counts
}

const { output, status } = runTsc()
const current = normalise(output)

// A gate that cannot run must not report success. If tsc failed but we parsed
// no diagnostics out of it, something is wrong with the invocation itself
// (bad config, crash, changed output format) — fail loudly rather than pass.
if (status !== 0 && current.length === 0) {
  console.error(
    `[typecheck-baseline] tsc exited ${status} but produced no parseable diagnostics.\n` +
      '  Raw output:\n' +
      (output.trim() ? output.replace(/^/gm, '    ') : '    (empty)')
  )
  process.exit(2)
}

if (update) {
  writeFileSync(BASELINE_FILE, current.length ? `${current.join('\n')}\n` : '')
  console.log(
    `[typecheck-baseline] wrote ${current.length} baseline entr${current.length === 1 ? 'y' : 'ies'} to ${path.relative(repoRoot, BASELINE_FILE)}`
  )
  process.exit(0)
}

if (!existsSync(BASELINE_FILE)) {
  console.error(
    `[typecheck-baseline] baseline file missing: ${path.relative(repoRoot, BASELINE_FILE)}\n` +
      '  Run: node scripts/typecheck-baseline.mjs --update'
  )
  process.exit(2)
}

const baseline = readFileSync(BASELINE_FILE, 'utf8')
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith('#'))

const baseCounts = toCounts(baseline)
const currCounts = toCounts(current)

/** Errors present now, beyond what the baseline allows. */
const newErrors = []
for (const [key, count] of currCounts) {
  const allowed = baseCounts.get(key) || 0
  for (let i = allowed; i < count; i++) newErrors.push(key)
}

/** Baseline entries that no longer occur — informational only. */
const fixed = []
for (const [key, count] of baseCounts) {
  const still = currCounts.get(key) || 0
  for (let i = still; i < count; i++) fixed.push(key)
}

/**
 * Full text of the diagnostic behind a normalised key, for the failure report.
 * Matches on location AND error code — two different codes can share a location.
 */
function detailFor(key) {
  const sep = key.lastIndexOf(': ')
  const loc = key.slice(0, sep)
  const code = key.slice(sep + 2)
  for (const line of output.split(/\r?\n/)) {
    if (/^\s/.test(line)) continue
    if (line.startsWith(`${loc}: error ${code}:`)) return line
  }
  return key
}

if (newErrors.length > 0) {
  console.error(
    `\n[typecheck-baseline] FAIL — ${newErrors.length} type error(s) not in the baseline:\n`
  )
  for (const key of newErrors.sort()) console.error(`  ${detailFor(key)}`)
  console.error(
    `\n  Baseline: ${path.relative(repoRoot, BASELINE_FILE)} (${baseline.length} known error(s))` +
      '\n  Fix the error(s) above. Do not add them to the baseline.\n'
  )
  process.exit(1)
}

if (fixed.length > 0) {
  console.log(
    `[typecheck-baseline] ${fixed.length} baseline error(s) no longer occur — ` +
      'consider `node scripts/typecheck-baseline.mjs --update`:'
  )
  for (const key of fixed.sort()) console.log(`  ${key}`)
}

console.log(
  `[typecheck-baseline] OK — ${current.length} known error(s), 0 new. ` +
    `(baseline: ${baseline.length})`
)
process.exit(0)
