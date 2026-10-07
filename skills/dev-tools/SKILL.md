---
name: dev-tools
description: Use when configuring or troubleshooting the personal developer tools in this workspace, such as Zed, Noctty, Sublime Text, OpenCode, or OpenChamber. Says where each tool's settings live and how to apply them.
---

# Personal dev tools

Two concerns stay separate. `simpsonm09-dev-setup` owns installing the tools. Its `tools.yaml` is the single hand-edited list, and its scripts render and apply the machine tool set. This skill owns where each tool keeps its settings and how to apply a change.

| Tool | Role | Settings and apply |
| --- | --- | --- |
| Zed | IDE | `settings/windows/zed/settings.json`, applied with `just apply-settings -Apply` |
| Noctty | Terminal | `settings/windows/noctty/config.ghostty`, applied with `just apply-noctty -Apply` |
| Sublime Text | Text editor | Windows app with no portable settings yet |
| OpenCode CLI | AI CLI in WSL | The workspace config is authoritative; the global config stays empty |
| OpenChamber | OpenCode GUI on Windows | `settings/windows/openchamber/settings.desired.json`, applied with `just apply-openchamber -Apply` |

## Notes

- The paths above are inside the `simpsonm09-dev-setup` repository.
- Restart OpenChamber after a plugin or MCP change. Its server resolves plugins once per process.
- Load secrets in WSL through the workspace `.envrc` with direnv, and on Windows with `just import-secrets -Apply` in `simpsonm09-dev-setup`.
- Run heavy Linux I/O in ext4 under the WSL home. Do not put `node_modules` or a build tree on the `D:` mount.
