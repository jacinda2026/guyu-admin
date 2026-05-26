import { spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { createLarkChannel, Domain, LoggerLevel } from '@larksuiteoapi/node-sdk'

const config = {
  appId: process.env.FEISHU_APP_ID,
  appSecret: process.env.FEISHU_APP_SECRET,
  workdir: process.env.CODEX_WORKDIR || process.cwd(),
  allowedOpenIds: splitEnv(process.env.CODEX_ALLOWED_OPEN_IDS),
  allowedChatIds: splitEnv(process.env.CODEX_ALLOWED_CHAT_IDS),
  commandPrefix: process.env.CODEX_COMMAND_PREFIX || '/codex',
  codexBin: process.env.CODEX_BIN || 'codex',
  timeoutMs: Number(process.env.CODEX_TIMEOUT_MS || 10 * 60 * 1000),
  statusIntervalMs: Number(process.env.CODEX_STATUS_INTERVAL_MS || 120 * 1000),
  outputTailBytes: Number(process.env.CODEX_OUTPUT_TAIL_BYTES || 64 * 1024),
}

const seenMessages = new Set()
const tasks = new Map()

if (!config.appId || !config.appSecret) {
  console.error('Missing FEISHU_APP_ID or FEISHU_APP_SECRET.')
  process.exit(1)
}

const channel = createLarkChannel({
  appId: config.appId,
  appSecret: config.appSecret,
  transport: 'websocket',
  domain: Domain.Feishu,
  loggerLevel: LoggerLevel.info,
  source: 'guyu-admin-codex-bridge',
})

channel.on({
  message: async (message) => {
    try {
      await handleMessage(message)
    } catch (error) {
      console.error(error)
      await sendReply(message, `Bridge error:\n${clip(error.stack || error.message || String(error))}`)
    }
  },
  error: (error) => {
    console.error('Feishu channel error:', error)
  },
  reconnecting: () => {
    console.log('Feishu WebSocket reconnecting...')
  },
  reconnected: () => {
    console.log('Feishu WebSocket reconnected.')
  },
})

console.log('Starting Feishu long-connection Codex bridge...')
console.log(`Workdir: ${config.workdir}`)
console.log(`Command prefix: ${config.commandPrefix}`)
console.log('No public callback URL is required. This process only needs outbound internet access.')
await channel.connect()

async function handleMessage(message) {
  if (seenMessages.has(message.messageId)) return
  seenMessages.add(message.messageId)

  const text = (message.content || '').trim()
  if (!text.startsWith(config.commandPrefix)) return

  if (config.allowedOpenIds.length > 0 && !config.allowedOpenIds.includes(message.senderId)) {
    await sendReply(message, `Rejected: sender ${message.senderId || '(unknown)'} is not allowed.`)
    return
  }

  if (config.allowedChatIds.length > 0 && !config.allowedChatIds.includes(message.chatId)) {
    await sendReply(message, `Rejected: chat ${message.chatId || '(unknown)'} is not allowed.`)
    return
  }

  const prompt = text.slice(config.commandPrefix.length).trim()
  if (!prompt) {
    await sendReply(message, `Usage: ${config.commandPrefix} <task>`)
    return
  }

  if (isStatusCommand(prompt)) {
    await sendReply(message, renderStatus())
    return
  }

  const taskId = randomUUID()
  tasks.set(taskId, {
    status: 'running',
    prompt,
    startedAt: Date.now(),
    finishedAt: null,
    exitCode: null,
  })
  console.log(`[task ${taskId}] accepted from sender=${message.senderId} chat=${message.chatId}`)
  await sendReply(message, `Codex task accepted.\nTask ID: ${taskId}\nWorking directory: ${config.workdir}`)

  runCodex(taskId, prompt, async (text) => sendReply(message, text)).catch(async (error) => {
    console.error(`[task ${taskId}] failed`, error)
    await sendReply(message, `Codex task failed before completion:\n${clip(error.stack || error.message || String(error))}`)
  })
}

async function runCodex(taskId, userPrompt, send) {
  const prompt = [
    'You are being invoked from a Feishu chat command.',
    'Work only in the configured project directory.',
    'Keep the final answer concise and include changed files and verification results.',
    '',
    userPrompt,
  ].join('\n')
  const tempDir = await mkdtemp(path.join(tmpdir(), 'feishu-codex-'))
  const finalMessagePath = path.join(tempDir, 'last-message.txt')

  const args = [
    'exec',
    '--cd', config.workdir,
    '--sandbox', 'workspace-write',
    '--skip-git-repo-check',
    '--color', 'never',
    '--output-last-message', finalMessagePath,
    '-',
  ]

  console.log(`[task ${taskId}] starting: ${config.codexBin} ${args.slice(0, -1).join(' ')} -`)
  const child = spawn(config.codexBin, args, {
    cwd: config.workdir,
    windowsHide: true,
    stdio: ['pipe', 'pipe', 'pipe'],
  })

  const stdout = new TailBuffer(config.outputTailBytes)
  const stderr = new TailBuffer(config.outputTailBytes)
  const timer = setTimeout(() => {
    console.error(`[task ${taskId}] timed out after ${config.timeoutMs}ms`)
    child.kill()
  }, config.timeoutMs)
  const statusTimer = config.statusIntervalMs > 0
    ? setInterval(() => {
        const task = tasks.get(taskId)
        const elapsed = task ? Math.round((Date.now() - task.startedAt) / 1000) : 0
        send(`Codex is still working.\nTask ID: ${taskId}\nElapsed: ${elapsed}s`).catch((error) => {
          console.error(`[task ${taskId}] failed to send status update`, error)
        })
      }, config.statusIntervalMs)
    : null

  child.stdin.end(prompt)
  child.stdout.on('data', (data) => {
    stdout.push(data)
  })
  child.stderr.on('data', (data) => {
    stderr.push(data)
  })

  const exitCode = await new Promise((resolve) => {
    child.on('error', (error) => {
      stderr.push(error.stack || error.message || String(error))
      resolve(-1)
    })
    child.on('close', resolve)
  })
  clearTimeout(timer)
  if (statusTimer) clearInterval(statusTimer)
  const stdoutText = stdout.toString()
  const stderrText = stderr.toString()
  let finalMessage = ''
  try {
    finalMessage = await readFile(finalMessagePath, 'utf8')
  } catch {
    finalMessage = stdoutText.trim()
  } finally {
    await rm(tempDir, { recursive: true, force: true })
  }
  const task = tasks.get(taskId)
  if (task) {
    task.status = 'finished'
    task.finishedAt = Date.now()
    task.exitCode = exitCode
    task.stdoutLength = stdout.totalLength
    task.stderrLength = stderr.totalLength
  }
  console.log(`[task ${taskId}] finished exit=${exitCode} stdout=${stdout.totalLength} stderr=${stderr.totalLength}`)

  const stderrSummary = stderrText.trim()
    ? `\nDiagnostics:\n${summarizeDiagnostics(stderrText, exitCode, stderr.truncatedBytes)}`
    : ''
  const output = [
    `Codex task finished with exit code ${exitCode}.`,
    finalMessage.trim() ? `\nOutput:\n${finalMessage.trim()}` : '',
    stderrSummary,
  ].join('')

  await send(clip(output))
}

async function sendReply(message, text) {
  const result = await channel.send(
    message.chatId,
    { text },
    { replyTo: message.messageId },
  )
  console.log(`[reply] chat=${message.chatId} replyTo=${message.messageId} sent=${result.messageId || '(unknown)'}`)
}

function splitEnv(value) {
  return (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function clip(text) {
  const max = 3500
  if (text.length <= max) return text
  return `${text.slice(0, max)}\n\n...output truncated...`
}

function summarizeDiagnostics(stderr, exitCode, truncatedBytes = 0) {
  const lines = stderr
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  const meaningful = lines.filter((line) => {
    if (exitCode === 0 && line.includes('WARN')) return false
    if (line.startsWith('<') || line.includes('<html>')) return false
    if (line.includes('Cloudflare') || line.includes('__cf_chl')) return false
    return true
  })

  const selected = (meaningful.length ? meaningful : lines).slice(-12)
  const omitted = Math.max(0, lines.length - selected.length)
  return clip([
    truncatedBytes > 0 ? `${truncatedBytes} diagnostic bytes omitted before the retained tail.` : '',
    omitted ? `${omitted} diagnostic lines omitted.` : '',
    ...selected,
  ].filter(Boolean).join('\n'))
}

function isStatusCommand(prompt) {
  const normalized = prompt.trim().toLowerCase()
  return new Set(['status', '\u72b6\u6001', '\u72c0\u614b', '\u8fdb\u5ea6', '\u9032\u5ea6']).has(normalized)
}

function renderStatus() {
  const entries = [...tasks.entries()].slice(-5)
  if (entries.length === 0) return 'No Codex tasks have been received since this bridge started.'

  return entries.map(([taskId, task]) => {
    const elapsed = Math.round(((task.finishedAt || Date.now()) - task.startedAt) / 1000)
    const exit = task.exitCode === null || task.exitCode === undefined ? '' : ` exit=${task.exitCode}`
    return `${task.status}${exit} ${elapsed}s\n${taskId}\n${task.prompt}`
  }).join('\n\n')
}

class TailBuffer {
  constructor(limitBytes) {
    this.limitBytes = Math.max(1024, limitBytes)
    this.chunks = []
    this.totalLength = 0
  }

  push(data) {
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(String(data))
    this.chunks.push(buffer)
    this.totalLength += buffer.length

    let retained = this.chunks.reduce((sum, chunk) => sum + chunk.length, 0)
    while (retained > this.limitBytes && this.chunks.length > 1) {
      const removed = this.chunks.shift()
      retained -= removed.length
    }
    if (retained > this.limitBytes && this.chunks.length === 1) {
      this.chunks[0] = this.chunks[0].subarray(retained - this.limitBytes)
    }
  }

  get truncatedBytes() {
    const retained = this.chunks.reduce((sum, chunk) => sum + chunk.length, 0)
    return Math.max(0, this.totalLength - retained)
  }

  toString() {
    return Buffer.concat(this.chunks).toString('utf8')
  }
}
