---
name: dev-tools
description: Use when configuring or troubleshooting the personal developer tools in this workspace, such as Zed, Noctty, Sublime Text, OpenCode, or OpenChamber. Says where each tool's settings live and how to apply them.
---

# Personal dev tools

Each tool in the workstation has one home for its settings. This skill says where that is and how to apply a change.

| Tool | Role | Settings and apply |
| --- | --- | --- |
| Zed | IDE | `settings/windows/zed/settings.json`, applied with `windows/Apply-Settings.ps1 -Apply` |
| Noctty | Terminal | `settings/windows/noctty/config.ghostty`, applied with `scripts/Apply-NocttySettings.ps1 -Apply` |
| Sublime Text | Text editor | Windows app with no portable settings yet |
| OpenCode CLI | AI CLI in WSL | The workspace config is authoritative; the global config stays empty |
| OpenChamber | OpenCode GUI on Windows | `settings/windows/openchamber/settings.desired.json`, applied with `scripts/Apply-OpenChamberSettings.ps1 -Apply` |

## Notes

- The paths above are inside the `dev-setup-starter` repository.
- Restart OpenChamber after a plugin or MCP change. Its server resolves plugins once per process.
- Load secrets in WSL with `. wsl/load-secrets.sh`, and on Windows with `scripts/Import-Secrets.ps1 -Apply`.
- Run heavy Linux I/O in ext4 under the WSL home. Do not put `node_modules` or a build tree on the `D:` mount.
