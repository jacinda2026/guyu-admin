import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const skillsFile = path.join(rootDir, 'config', 'coze-skills.json')

const port = Number(process.env.COZE_PROXY_PORT || 8787)
const cozeApiBase = (process.env.COZE_API_BASE || 'https://api.coze.cn').replace(/\/$/, '')

const json = (res, statusCode, payload) => {
  const body = JSON.stringify(payload)
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Content-Length': Buffer.byteLength(body)
  })
  res.end(body)
}

const readJsonBody = async (req) => {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  if (!chunks.length) return {}
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

const loadSkills = async () => {
  const content = await readFile(skillsFile, 'utf8')
  return JSON.parse(content)
}

const publicSkill = (skill) => {
  const {
    cozeBotId,
    cozeWorkflowId,
    cozeEndpoint,
    ...rest
  } = skill

  return {
    ...rest,
    cozeReady: Boolean(cozeBotId || cozeWorkflowId || cozeEndpoint)
  }
}

const callCozeWorkflow = async (skill, inputs) => {
  const token = process.env.COZE_API_TOKEN
  if (!token) {
    return {
      statusCode: 500,
      body: { code: 'missing_token', message: '服务端未配置 COZE_API_TOKEN' }
    }
  }
  if (!skill.cozeWorkflowId && !skill.cozeEndpoint) {
    return {
      statusCode: 400,
      body: { code: 'missing_workflow_id', message: '该技能未配置 cozeWorkflowId' }
    }
  }

  const endpoint = skill.cozeEndpoint || `${cozeApiBase}/v1/workflow/run`
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      workflow_id: skill.cozeWorkflowId,
      parameters: inputs
    })
  })

  const text = await response.text()
  let data
  try {
    data = JSON.parse(text)
  } catch {
    data = { raw: text }
  }

  return {
    statusCode: response.status,
    body: {
      provider: 'coze',
      mode: 'workflow',
      ok: response.ok,
      data
    }
  }
}

const callCozeBot = async (skill, inputs) => {
  const token = process.env.COZE_API_TOKEN
  if (!token) {
    return {
      statusCode: 500,
      body: { code: 'missing_token', message: '服务端未配置 COZE_API_TOKEN' }
    }
  }
  if (!skill.cozeBotId && !skill.cozeEndpoint) {
    return {
      statusCode: 400,
      body: { code: 'missing_bot_id', message: '该技能未配置 cozeBotId' }
    }
  }

  const message = inputs.message || inputs.prompt || JSON.stringify(inputs)
  const endpoint = skill.cozeEndpoint || `${cozeApiBase}/v3/chat`
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      bot_id: skill.cozeBotId,
      user_id: inputs.userId || 'guyu-client-user',
      stream: false,
      additional_messages: [
        {
          role: 'user',
          content: message,
          content_type: 'text'
        }
      ]
    })
  })

  const text = await response.text()
  let data
  try {
    data = JSON.parse(text)
  } catch {
    data = { raw: text }
  }

  return {
    statusCode: response.status,
    body: {
      provider: 'coze',
      mode: 'bot',
      ok: response.ok,
      data
    }
  }
}

const server = createServer(async (req, res) => {
  try {
    if (req.method === 'OPTIONS') {
      json(res, 204, {})
      return
    }

    const url = new URL(req.url, `http://${req.headers.host}`)

    if (req.method === 'GET' && url.pathname === '/api/client/skills') {
      const skills = await loadSkills()
      json(res, 200, { data: skills.map(publicSkill) })
      return
    }

    const runMatch = url.pathname.match(/^\/api\/client\/skills\/([^/]+)\/run$/)
    if (req.method === 'POST' && runMatch) {
      const skillId = decodeURIComponent(runMatch[1])
      const skills = await loadSkills()
      const skill = skills.find(item => item.id === skillId)
      if (!skill) {
        json(res, 404, { code: 'skill_not_found', message: '技能不存在' })
        return
      }
      if (skill.unavailable) {
        json(res, 400, { code: 'skill_unavailable', message: skill.unavailableReason || '该技能暂不可用' })
        return
      }

      const body = await readJsonBody(req)
      const inputs = body.inputs || body
      let result
      if (skill.runMode === 'workflow') {
        result = await callCozeWorkflow(skill, inputs)
      } else if (skill.runMode === 'bot') {
        result = await callCozeBot(skill, inputs)
      } else {
        result = {
          statusCode: 400,
          body: { code: 'unsupported_run_mode', message: `当前运行模式 ${skill.runMode} 不需要 API 调用` }
        }
      }
      json(res, result.statusCode, result.body)
      return
    }

    json(res, 404, { code: 'not_found', message: '接口不存在' })
  } catch (error) {
    json(res, 500, {
      code: 'proxy_error',
      message: error instanceof Error ? error.message : String(error)
    })
  }
})

server.listen(port, () => {
  console.log(`Coze proxy listening on http://127.0.0.1:${port}`)
})
