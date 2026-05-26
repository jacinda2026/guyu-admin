# 手机端 ChatGPT 调试工作流

## 能做到什么

- 电脑作为开发机，运行本地 Vite 服务。
- 手机访问同一局域网地址，直接查看页面效果。
- 你在手机端 ChatGPT 里描述修改点，我在当前项目里继续改代码。

## 启动方式

在项目根目录运行：

```powershell
npm run mobile
```

终端会输出类似：

```text
http://192.168.6.138:5173
```

手机和电脑连接同一个 Wi-Fi 后，在手机浏览器打开这个地址。

## 如果手机打不开

- 确认手机和电脑在同一个 Wi-Fi。
- Windows 防火墙允许 Node.js 使用“专用网络”。
- 如果端口被占用，换端口启动：

```powershell
$env:VITE_PORT=5174; npm run mobile
```

## 手机端怎么让 ChatGPT 修改

在手机端直接发：

```text
当前页面是 /project/proj-shuangyanpi/monitor
我看到 xxx 样式不对，把 xxx 改成 xxx。
不要跑 build，快速改 UI。
```

如果你要我定位具体页面，最好带上：

- 当前 URL
- 哪个模块
- 期望效果
- 截图

## 边界

手机浏览器只能查看和操作页面。本地文件修改仍然由当前这台电脑上的 Codex/ChatGPT 会话完成。
