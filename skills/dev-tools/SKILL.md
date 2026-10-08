---
name: dev-tools
description: Use when configuring or troubleshooting the personal developer tools in this workspace, such as Zed, Noctty, Sublime Text, OpenCode, T3 Code, or Claude Code. Says where each tool's settings live and how to apply them.
---

# Personal dev tools

Two concerns stay separate. `simpsonm09-dev-setup` owns installing the tools. Its `tools.yaml` is the single hand-edited list, and its scripts render and apply the machine tool set. This skill owns where each tool keeps its settings and how to apply a change.

| Tool | Role | Settings and apply |
| --- | --- | --- |
| Zed | IDE | `settings/windows/zed/settings.json`, applied with `just apply-settings -Apply` |
| Noctty | Terminal | `settings/windows/noctty/config.ghostty`, applied with `just apply-noctty -Apply` |
| Sublime Text | Text editor | Windows app with no portable settings yet |
| OpenCode CLI | AI CLI in WSL; T3 Code also starts an OpenCode server on Windows | The workspace config is authoritative; the global config must not set a model |
| T3 Code | Desktop GUI for coding agents (Claude Code and OpenCode providers) | Set in the app's Settings screen, not in a file the repository applies. Installed with winget `T3Tools.T3Code` |
| Claude Code | AI CLI (Claude provider for T3 Code) | No settings file in the repository. Installed separately as the npm global `@anthropic-ai/claude-code`. The Claude plugin composition belongs to `maxstack` |

## Notes

- The paths above are inside the `simpsonm09-dev-setup` repository.
- After a plugin, skill, or MCP change, use "Restart agent session" in T3 Code.
- Load secrets in WSL through the workspace `.envrc` with direnv, and on Windows with `just import-secrets -Apply` in `simpsonm09-dev-setup`.
- Run heavy Linux I/O in ext4 under the WSL home. Do not put `node_modules` or a build tree on the `D:` mount.
