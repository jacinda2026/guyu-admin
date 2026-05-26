# Feishu Codex Bridge

This project can be controlled from a Feishu bot by running a local bridge service.

Use `feishu:ws` for local/LAN-only development. It uses Feishu long connection mode, so no public callback URL is required.

Flow:

1. Feishu chat receives a message like `/codex 修改手机端项目中心标题`.
2. Feishu sends the message event to this bridge.
3. The bridge runs `codex exec` in this project directory.
4. The bridge replies to the Feishu message with the Codex result.

## Start Locally: Long Connection Mode

Use PowerShell:

```powershell
$env:FEISHU_APP_ID="cli_xxx"
$env:FEISHU_APP_SECRET="xxx"
$env:CODEX_ALLOWED_OPEN_IDS="ou_xxx"
$env:CODEX_WORKDIR="C:\Users\22245\Documents\New project\guyu-GEO-management-platform\guyu-admin"
npm run feishu:ws
```

In Feishu Open Platform:

1. Enable the bot capability for the app.
2. Add the bot to the target chat.
3. Open event subscription.
4. Select long connection mode.
5. Subscribe to `im.message.receive_v1`.
6. Grant message reply permissions required by the bot.

The local machine only needs outbound internet access. Feishu sends events through the SDK WebSocket connection.

## Optional: HTTP Webhook Mode

Use this only when you have a public HTTPS callback URL.

```powershell
$env:FEISHU_APP_ID="cli_xxx"
$env:FEISHU_APP_SECRET="xxx"
$env:FEISHU_VERIFICATION_TOKEN="your_event_verification_token"
$env:CODEX_ALLOWED_OPEN_IDS="ou_xxx"
$env:CODEX_WORKDIR="C:\Users\22245\Documents\New project\guyu-GEO-management-platform\guyu-admin"
npm run feishu:bridge
```

Health check for webhook mode:

```text
http://127.0.0.1:8787/health
```

Feishu event endpoint:

```text
POST http://127.0.0.1:8787/feishu/events
```

For HTTP webhook mode, Feishu requires a public HTTPS callback URL for event subscriptions. Use a controlled tunnel such as Cloudflare Tunnel, ngrok, or a small public server, then point Feishu to:

```text
https://your-public-domain/feishu/events
```

## Command Format

Only text messages starting with `/codex` are accepted.

Examples:

```text
/codex 扫描当前项目中心页面，找出移动端布局问题，不要修改
/codex 修改客户端项目中心页面，让卡片在手机端单列展示
/codex 运行 npm run build，修复阻塞构建的问题
```

## Safety Controls

- `CODEX_ALLOWED_OPEN_IDS` is a comma-separated allowlist. Set it before using this outside local testing.
- `CODEX_ALLOWED_CHAT_IDS` is an optional comma-separated chat allowlist.
- The bridge runs Codex with `--sandbox workspace-write`.
- The bridge runs non-interactively with `codex exec --sandbox workspace-write --skip-git-repo-check`.
- Do not expose webhook mode without a tunnel/provider access policy and a Feishu sender allowlist.
- Rotate `FEISHU_APP_SECRET` if it has been shared in chat or logs.
