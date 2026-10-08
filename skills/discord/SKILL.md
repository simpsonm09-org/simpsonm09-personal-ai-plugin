---
name: discord
description: Use when a task needs Discord in this workspace, such as sending or reading messages, reacting, running polls, or managing channels, roles, members, threads, DMs, and webhooks. Points at the discli CLI, the with-vault and with-secrets wrappers, permission profiles, the audit log, and live listen and serve modes.
---

# Discord

Discord is owned by the `discli` CLI from the `discord-cli-agent` package. This layer contributes no Discord MCP server. Reach Discord through `discli`.

## Install

`discli` needs Python 3.10 or newer. Voice is an optional extra and is not needed here.

```bash
pip install discord-cli-agent
```

One command installs it and checks the machine.

```bash
just setup-discli
```

`discli doctor` verifies the install and token. It exits 0 when nothing fails and 1 otherwise. Add `--server NAME` to also check the bot's real permissions in that server.

## Token and the wrappers

The bot token is a secret. It lives in Infisical as `DISCORD_BOT_TOKEN`, in the `discord` bundle, and a wrapper attaches it to one command. Never commit it to this repository.

Run every `discli` command through a wrapper.

| Who runs it | Command | Identity |
| --- | --- | --- |
| Agent | `with-vault --role agent discli <args>` | `Agent-Vault-Runner` |
| Human | `with-secrets discli <args>` | `Ugallu-Desktop` |
| Human | `with-vault --role human discli <args>` | `Human-Vault-Runner` |

The agent path never reads `DISCORD_BOT_TOKEN`. `with-vault` opens a per-run session and the proxy attaches the token, so the token never enters the agent's environment or its `~/.discli/config.json`. A raw `discli` with no wrapper fails with no token, which is the intended state.

`discli` still resolves a token in this order when the environment holds one.

1. The `--token` flag
2. The `DISCORD_BOT_TOKEN` environment variable
3. The `~/.discli/config.json` file
4. The `DISCORD_TOKEN` environment variable

That order is superseded for the agent path. The agent does not set `DISCORD_BOT_TOKEN`, does not run `discli config set token`, and does not pass `--token`. The wrapper is the only route. The human may still use the loader, which puts `DISCORD_BOT_TOKEN` in the environment of that one command.

```bash
with-vault --role agent discli --json server list
with-secrets discli --json server list
```

The `agent-vault` skill (`simpsonm09-personal-ai-plugin:agent-vault` in Claude Code) owns the identities, the bundles, and the proxy.

## Never drive the wizard

`discli setup` is interactive. It refuses piped stdin and `--json`, so an agent cannot drive it. Run the individual commands through a wrapper, then confirm with `discli doctor`. The agent never runs `discli config set token`.

## Commands

Identifiers accept a name or an ID, as in `#general` or the channel snowflake.

| Group | Example |
| --- | --- |
| Messages | `discli message send "#general" "deploy finished"` |
| Edit and delete | `discli message edit "#general" 12345 "fixed"` |
| History | `discli message history "#general" --days 7` |
| Embeds | `discli message send "#general" "status" --embed-title Status --embed-field "Online::42::true"` |
| Replies | `discli message reply "#general" 12345 "on it"` |
| Search | `discli message search "#general" "timeout"` |
| Reactions | `discli reaction add "#general" 12345 "👍"` |
| Polls | `discli poll create "#general" "Ship it?" Yes No --duration 24` |
| Channels | `discli channel list --server MyServer` |
| Threads | `discli thread create "#general" 12345 "triage"` |
| DMs | `discli dm send alice "hello"` |
| Roles | `discli role assign MyServer alice "on-call"` |
| Members | `discli member list MyServer --limit 50` |
| Webhooks | `discli webhook list "#general"` |
| Events | `discli event list MyServer` |
| Server as code | `discli server export > server.json`, then `discli server diff server.json` and `discli server apply server.json` |
| Scheduling | `discli schedule` runs a `discli` command daily or on an interval |

Message commands also cover attachments and pins. Server admin covers the server name, icon, banner, invites, custom emoji, AutoMod rules, and Discord's audit log.

Every command takes `--json` for scripts. It is a global option, so it goes before the subcommand.

```bash
discli --json message history "#general" --days 1
discli --json listen --events messages | jq -r '.channel_id'
```

## Permission profiles

A profile caps what an invocation can do. Set it per call with `--profile` or for the session with `DISCLI_PROFILE`.

| Profile | Allows |
| --- | --- |
| `full` | Everything, the default |
| `moderation` | Bans, kicks, timeouts, and role management |
| `chat` | Messages, reactions, threads, and interactions |
| `readonly` | List, info, get, and search only |

Destructive actions are denied to `chat` and `readonly`.

```bash
discli --profile readonly channel list
```

## Audit and rate limits

Every destructive action is appended to `~/.discli/audit.log`. Read it with `discli audit show`. Destructive calls are rate-limited to 5 per 5 seconds.

## Live work

`discli listen` streams events as JSONL on stdout. `discli serve` keeps one bot open, reads JSONL commands on stdin, and writes events on stdout. Both open a Gateway connection. One-shot commands use Discord's HTTP API and do not.

```bash
discli --json listen --events messages,reactions --ignore-bots
discli serve --status online
```

## Rules

- Prefer `discli` over any second path to Discord. There is no Discord MCP server in this workspace.
- Run `discli` through a wrapper. The agent runs `with-vault --role agent discli` and never reads the token. The human runs `with-secrets discli` or `with-vault --role human discli`.
- An agent never drives `discli setup` and never runs `discli config set token`. Use the wrapper and the individual commands.
- Use `--profile readonly` or `--profile chat` unless the task needs a destructive action.
- Run `discli doctor` before blaming a command.
