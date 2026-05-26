import http from 'node:http'
import { spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

const config = {
  appId: process.env.FEISHU_APP_ID,
  appSecret: process.env.FEISHU_APP_SECRET,
  verificationToken: process.env.FEISHU_VERIFICATION_TOKEN || '',
  port: Number(process.env.CODEX_BRIDGE_PORT || 8787),
  workdir: process.env.CODEX_WORKDIR || process.cwd(),
  allowedOpenIds: splitEnv(process.env.CODEX_ALLOWED_OPEN_IDS),
  commandPrefix: process.env.CODEX_COMMAND_PREFIX || '/codex',
  codexBin: process.env.CODEX_BIN || 'codex',
  timeoutMs: Number(process.env.CODEX_TIMEOUT_MS || 10 * 60 * 1000),
  outputTailBytes: Number(process.env.CODEX_OUTPUT_TAIL_BYTES || 64 * 1024),
}

let cachedToken = null
let tokenExpiresAt = 0
const seenMessages = new Set()

if (!config.appId || !config.appSecret) {
  console.error('Missing FEISHU_APP_ID or FEISHU_APP_SECRET.')
  process.exit(1)
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && req.url === '/health') {
      return sendJson(res, 200, { ok: true })
    }

    if (req.method !== 'POST' || req.url !== '/feishu/events') {
      return sendJson(res, 404, { error: 'not found' })
    }

    const payload = await readJson(req)

    if (config.verificationToken && payload.token && payload.token !== config.verificationToken) {
      return sendJson(res, 403, { error: 'invalid verification token' })
    }

    if (payload.challenge) {
      return sendJson(res, 200, { challenge: payload.challenge })
    }

    const event = payload.event
    const header = payload.header || {}
    if (header.event_type !== 'im.message.receive_v1' || !event?.message) {
      return sendJson(res, 200, { ok: true, ignored: 'unsupported event' })
    }

    const message = event.message
    const senderOpenId = event.sender?.sender_id?.open_id
    const messageId = message.message_id
    const text = extractText(message)

    if (!text.startsWith(config.commandPrefix)) {
      return sendJson(res, 200, { ok: true, ignored: 'missing command prefix' })
    }

    if (messageId && seenMessages.has(messageId)) {
      return sendJson(res, 200, { ok: true, ignored: 'duplicate message' })
    }
    if (messageId) seenMessages.add(messageId)

    if (config.allowedOpenIds.length > 0 && !config.allowedOpenIds.includes(senderOpenId)) {
      await reply(messageId, `Rejected: open_id ${senderOpenId || '(unknown)'} is not allowed.`)
      return sendJson(res, 200, { ok: true, rejected: 'sender not allowed' })
    }

    const prompt = text.slice(config.commandPrefix.length).trim()
    if (!prompt) {
      await reply(messageId, `Usage: ${config.commandPrefix} <task>`)
      return sendJson(res, 200, { ok: true, ignored: 'empty prompt' })
    }

    await reply(messageId, `Codex task accepted.\nTask ID: ${randomUUID()}\nWorking directory: ${config.workdir}`)
    runCodex(prompt, messageId).catch(async (error) => {
      await reply(messageId, `Codex task failed before completion:\n${clip(error.stack || error.message || String(error))}`)
    })

    return sendJson(res, 200, { ok: true, accepted: true })
  } catch (error) {
    console.error(error)
    return sendJson(res, 500, { error: error.message || String(error) })
  }
})

server.listen(config.port, () => {
  console.log(`Feishu Codex bridge listening on http://127.0.0.1:${config.port}`)
  console.log(`Event endpoint: POST /feishu/events`)
  console.log(`Workdir: ${config.workdir}`)
})

async function runCodex(userPrompt, messageId) {
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

  const child = spawn(config.codexBin, args, {
    cwd: config.workdir,
    windowsHide: true,
    stdio: ['pipe', 'pipe', 'pipe'],
  })

  const stdout = new TailBuffer(config.outputTailBytes)
  const stderr = new TailBuffer(config.outputTailBytes)
  const timer = setTimeout(() => {
    child.kill()
  }, config.timeoutMs)

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

  const output = [
    `Codex task finished with exit code ${exitCode}.`,
    finalMessage.trim() ? `\nOutput:\n${finalMessage.trim()}` : '',
    stderrText.trim() ? `\nDiagnostics:\n${summarizeDiagnostics(stderrText, stderr.truncatedBytes)}` : '',
  ].join('')

  await reply(messageId, clip(output))
}

async function getTenantAccessToken() {
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken

  const response = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ app_id: config.appId, app_secret: config.appSecret }),
  })
  const data = await response.json()
  if (data.code !== 0) {
    throw new Error(`Failed to get tenant_access_token: ${data.code} ${data.msg}`)
  }

  cachedToken = data.tenant_access_token
  tokenExpiresAt = Date.now() + Math.max(60, data.expire - 120) * 1000
  return cachedToken
}

async function reply(messageId, text) {
  if (!messageId) return

  const token = await getTenantAccessToken()
  const response = await fetch(`https://open.feishu.cn/open-apis/im/v1/messages/${messageId}/reply`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({
      msg_type: 'text',
      content: JSON.stringify({ text }),
    }),
  })
  const data = await response.json()
  if (data.code !== 0) {
    console.error(`Failed to reply to Feishu: ${data.code} ${data.msg}`)
  }
}

function extractText(message) {
  if (message.message_type !== 'text') return ''
  try {
    return JSON.parse(message.content || '{}').text?.trim() || ''
  } catch {
    return ''
  }
}

function splitEnv(value) {
  return (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => {
      body += chunk
      if (body.length > 1024 * 1024) {
        req.destroy()
        reject(new Error('request body too large'))
      }
    })
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'))
      } catch (error) {
        reject(error)
      }
    })
    req.on('error', reject)
  })
}

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(payload))
}

function clip(text) {
  const max = 3500
  if (text.length <= max) return text
  return `${text.slice(0, max)}\n\n...output truncated...`
}

function summarizeDiagnostics(stderr, truncatedBytes = 0) {
  const lines = stderr
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
  const selected = lines.slice(-12)
  const omitted = Math.max(0, lines.length - selected.length)

  return clip([
    truncatedBytes > 0 ? `${truncatedBytes} diagnostic bytes omitted before the retained tail.` : '',
    omitted ? `${omitted} diagnostic lines omitted.` : '',
    ...selected,
  ].filter(Boolean).join('\n'))
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
