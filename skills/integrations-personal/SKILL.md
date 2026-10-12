---
name: integrations-personal
description: Use when a task needs a personal concrete for a general integration or a personal service, such as the GitHub account, the Kubernetes context, email through himalaya, phone notifications through ntfy, texting through smsgate, or the Agent Vault for Discord and Postman. States where each value comes from rather than the value.
---

# Personal integrations

The org layer's `service-integrations` registry names the general owner of each job. This skill states where the personal value comes from. It does not restate a value the tool can report, and it does not hold a secret.

## Where a value comes from

Four tiers hold a value. A committed file records only a variable name and the general rule. The gitignored `settings/.env` holds the machine identity and a small offline fallback. Infisical holds the rest, with credentials in `/secrets` and PII or person config in `/pii`. The tool's own state wins when it already knows the answer.

Two wrappers deliver an Infisical value. `with-secrets` loads it into one command with the loader identity. `with-vault` mints a per-run session and the proxy attaches the credential, so the value never enters the environment.

| Source | Rule | Examples |
| --- | --- | --- |
| Infer from the tool | The tool already knows the value. Read it at run time; never store it here. | `gh auth status` for the GitHub account, `kubectl config current-context` for the cluster, `git config user.email` for the identity |
| Infisical `/secrets` | A credential. Read it through `with-secrets --require <names>`, or through `with-vault` where the tool is brokered. | `POSTMAN_API_KEY`, `SMS_GATEWAY_USER`, `SMS_GATEWAY_PASSWORD`, `GMAIL_APP_PASSWORD`, `DISCORD_BOT_TOKEN`, `NTFY_TOPIC`, `NTFY_TOKEN` |
| Infisical `/pii` | PII and person or machine config. Read it through `with-secrets --require <names>`. | `POSTMAN_WORKSPACE`, `GMAIL_ADDRESS`, `SMS_GATEWAY_HOST` |
| Gitignored `settings/.env` | The Infisical machine identity (secret-zero) and a small offline fallback, used only by `with-secrets --offline`. Nothing else when the fallback is avoidable. | `INFISICAL_DOMAIN`, `INFISICAL_ENV`, `INFISICAL_PROJECT_ID`, `INFISICAL_UNIVERSAL_AUTH_CLIENT_ID`, `INFISICAL_UNIVERSAL_AUTH_CLIENT_SECRET` |

Online `with-secrets` reads only the store and fails closed. It never merges `.env` in, so a `.env` value stands in for an Infisical value only when the command runs with `--offline`.

## Per job

| Job | Source | Variable or check |
| --- | --- | --- |
| GitHub account | infer | `gh auth status` |
| Git identity | infer | `git config user.email` |
| Kubernetes context | infer | `kubectl config current-context` |
| Infisical machine identity and project | gitignored `settings/.env` | `INFISICAL_DOMAIN`, `INFISICAL_ENV`, `INFISICAL_PROJECT_ID`, `INFISICAL_UNIVERSAL_AUTH_CLIENT_ID`, `INFISICAL_UNIVERSAL_AUTH_CLIENT_SECRET` |
| Postman workspace | Infisical `/pii` | `POSTMAN_WORKSPACE` |
| Postman API key | Infisical `/secrets` | `POSTMAN_API_KEY` |
| Email address | Infisical `/pii` | `GMAIL_ADDRESS` |
| Email App Password | Infisical `/secrets` | `GMAIL_APP_PASSWORD` |
| SMS gateway host | Infisical `/pii` | `SMS_GATEWAY_HOST` |
| SMS gateway credentials | Infisical `/secrets` | `SMS_GATEWAY_USER`, `SMS_GATEWAY_PASSWORD` |
| ntfy topic and token | Infisical `/secrets` | `NTFY_TOPIC`, `NTFY_TOKEN` |
| Discord bot token | Infisical `/secrets` | `DISCORD_BOT_TOKEN` |

If a value is neither inferable nor present, say so. Do not invent it.

## `with-secrets` and the vault

`with-secrets --require <names> <tool>` loads `/secrets` and `/pii` with the loader identity and puts the values in that command's environment. Put the keys the tool needs in `--require`. `with-vault --role human <tool>` and `with-vault --role agent <tool>` mint a per-run session and the proxy attaches the credential, so the value never enters the environment. `--role` is required, so a run is never silently misattributed.

| Tool | Wrapper | Why |
| --- | --- | --- |
| `discli` | `with-vault --role agent discli` for the agent, `with-secrets --require DISCORD_BOT_TOKEN discli` or `with-vault --role human discli` for the human | The agent's Discord bot token is brokered and never exported. |
| `postman` | `with-vault --role agent postman` for the agent, `with-secrets --require POSTMAN_API_KEY postman` or `with-vault --role human postman` for the human | The agent's Postman API key is brokered and never exported. |
| `himalaya` | `with-secrets --require GMAIL_ADDRESS,GMAIL_APP_PASSWORD himalaya` for the human. No agent form is defined here. | Its auth command reads the App Password from the environment. |
| `ntfy` | `with-secrets --require NTFY_TOPIC,NTFY_TOKEN ntfy` for the human. No agent form is defined here. | It reads the topic and token from the environment. |
| `smsgate` | `with-secrets --require SMS_GATEWAY_HOST,SMS_GATEWAY_USER,SMS_GATEWAY_PASSWORD smsgate` for the human. No agent form is defined here. | It reads the gateway host and credentials from the environment. |

The `agent-vault` skill (`simpsonm09-personal-ai-plugin:agent-vault` in Claude Code) owns the identities, the bundles, and the proxy.

## How `with-secrets` reaches the value

The human runs `with-secrets [--offline] [--require <names>] <tool>` in WSL or `with-secrets.ps1` on Windows. Online is the default. The wrapper reads `settings/.env` for the Infisical machine identity, exports the project's `/secrets` and `/pii`, and fails without starting the tool if the store, either export, or a required name is unavailable. `--offline` uses only the `.env` fallback. Run `just secrets-init` once to create `settings/.env`. The old `.envrc` loader and `just import-secrets` are retired; a leftover `.envrc` import gets a warning. See `simpsonm09-dev-setup/docs/secrets.md`.

## Personal services

### Email via `himalaya`

Send from a personal mailbox over IMAP and SMTP. The mailbox address is `GMAIL_ADDRESS` from Infisical `/pii`. Authenticate with an App Password from `GMAIL_APP_PASSWORD` in Infisical `/secrets`, not OAuth2.

- Config: `%APPDATA%\himalaya\config.toml` on Windows.
- The config points `backend.auth.cmd` and `message.send.backend.auth.cmd` at a command that prints the App Password from the environment.
- Never drive `himalaya account configure`. It is interactive. Write the config and confirm with `with-secrets --require GMAIL_ADDRESS,GMAIL_APP_PASSWORD himalaya envelope list`.

```bash
with-secrets --require GMAIL_ADDRESS,GMAIL_APP_PASSWORD himalaya envelope list
with-secrets --require GMAIL_ADDRESS,GMAIL_APP_PASSWORD himalaya message send < message.eml
```

### Phone notifications via `ntfy`

Push a short message to the phone. This is the first choice for "notify me".

- The topic and token come from `NTFY_TOPIC` and `NTFY_TOKEN` in Infisical `/secrets`.
- Install the CLI with `scoop install ntfy` or the release zip on `%Path%`.

```bash
with-secrets --require NTFY_TOPIC,NTFY_TOKEN sh -c 'ntfy publish "$NTFY_TOPIC" "agent finished"'
```

The caller's shell does not hold `$NTFY_TOPIC`, so the quoted command expands it in the `sh` that `with-secrets` starts.

### Texting via `smsgate`

Send real SMS through an Android phone. This is for texting other people, not for notifications to yourself.

- **Local Server mode only.** The agent reaches the phone's HTTP server on the home LAN at `http://$SMS_GATEWAY_HOST:8080/message`. The host is an Infisical `/pii` value; it works only while the phone is home on the same network.
- Basic auth comes from `SMS_GATEWAY_USER` and `SMS_GATEWAY_PASSWORD` in Infisical `/secrets`.
- Install the CLI from the SMS Gateway for Android releases.

```bash
with-secrets --require SMS_GATEWAY_HOST,SMS_GATEWAY_USER,SMS_GATEWAY_PASSWORD sh -c \
  'smsgate -e "http://$SMS_GATEWAY_HOST:8080/message" -u "$SMS_GATEWAY_USER" -p "$SMS_GATEWAY_PASSWORD" send --phones "<recipient phone number>" "message"'
```

Rules: SMS only, never set the phone's default SMS app, keep volume low, and do not use it for batch sending.

### Discord via `discli`

Discord, including messages, channels, and DMs, is owned by `discli`. The bot token is `DISCORD_BOT_TOKEN` in Infisical `/secrets`, reached through `with-vault` or `with-secrets`. See the `discord` skill (`simpsonm09-personal-ai-plugin:discord` in Claude Code) for the wrappers, profiles, and the command set.

## Channel selection

- `ntfy` for "notify me".
- `smsgate` for texts to other people.
- `discli` for Discord.
- `himalaya` for email.

## Rules

- State the source and the variable name, never the value.
- Infer from the tool when the tool already knows. Do not restate the account, the cluster, or the identity.
- Keep a credential in Infisical `/secrets` and PII, person, or machine config in Infisical `/pii`.
- Keep `settings/.env` to the Infisical machine identity and a small offline fallback. Online `with-secrets` never merges it in; it is used only with `--offline`.
- Reach a value through a wrapper. The agent reaches Discord and Postman through `with-vault --role agent`; the human can use `with-secrets` or `with-vault --role human` for them, and `with-secrets` for the other services. Name the wrapper rather than a raw environment variable on the agent path.
- Confirm a CLI exists before you cite it or one of its commands. Run `command -v <cli>` in a Bash shell (WSL, or Git Bash on Windows) or `Get-Command <cli>` in PowerShell. Do not claim a job moved from MCP to a CLI the runtime does not have.
- State how a service is reached only as it really is. Name the owner the runtime has, an MCP server or a CLI, and do not present one as the other.
- The org registry states the general rule; this skill states the source.
