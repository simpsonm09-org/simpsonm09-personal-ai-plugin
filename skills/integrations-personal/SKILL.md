---
name: integrations-personal
description: Use when a task needs a personal concrete for a general integration or a personal service, such as the GitHub account, the Jira project, the Kubernetes context, email through himalaya, phone notifications through ntfy, or texting through smsgate. States where each value comes from rather than the value.
---

# Personal integrations

The org layer's `service-integrations` registry names the general owner of each job. This skill states where the personal value comes from. It does not restate a value the tool can report, and it does not hold a secret.

## Where a value comes from

Four tiers hold a value. A committed file records only a variable name and the general rule. The gitignored `settings/.env` holds the machine identity and a small offline fallback. Infisical holds the rest, with credentials in `/secrets` and PII or person config in `/pii`. The tool's own state wins when it already knows the answer.

| Source | Rule | Examples |
| --- | --- | --- |
| Infer from the tool | The tool already knows the value. Read it at run time; never store it here. | `gh auth status` for the GitHub account, `kubectl config current-context` for the cluster, `git config user.email` for the identity |
| Infisical `/secrets` | A credential. Read it from the environment through the loaders. | `VAULT_TOKEN`, `JIRA_API_TOKEN`, `JENKINS_API_TOKEN`, `POSTMAN_API_KEY`, `SMS_GATEWAY_USER`, `SMS_GATEWAY_PASSWORD`, `GMAIL_APP_PASSWORD`, `DISCORD_BOT_TOKEN`, `NTFY_TOPIC`, `NTFY_TOKEN` |
| Infisical `/pii` | PII and person or machine config. Read it from the environment through the loaders. | `VAULT_ADDR`, `VAULT_NAMESPACE`, `JIRA_SITE`, `JIRA_PROJECT`, `JENKINS_URL`, `JENKINS_USER`, `POSTMAN_WORKSPACE`, `GMAIL_ADDRESS`, `SMS_GATEWAY_HOST` |
| Gitignored `settings/.env` | The Infisical machine identity (secret-zero) and a small offline fallback for when Infisical is unreachable. Nothing else when the fallback is avoidable. | `INFISICAL_DOMAIN`, `INFISICAL_ENV`, `INFISICAL_PROJECT_ID`, `INFISICAL_UNIVERSAL_AUTH_CLIENT_ID`, `INFISICAL_UNIVERSAL_AUTH_CLIENT_SECRET` |

The loaders overlay the Infisical export on `.env`, so an Infisical value overrides a same-name `.env` value, and the `.env` copy stays as the offline fallback.

## Per job

| Job | Source | Variable or check |
| --- | --- | --- |
| GitHub account | infer | `gh auth status` |
| Git identity | infer | `git config user.email` |
| Kubernetes context | infer | `kubectl config current-context` |
| Infisical machine identity and project | gitignored `settings/.env` | `INFISICAL_DOMAIN`, `INFISICAL_ENV`, `INFISICAL_PROJECT_ID`, `INFISICAL_UNIVERSAL_AUTH_CLIENT_ID`, `INFISICAL_UNIVERSAL_AUTH_CLIENT_SECRET` |
| Vault address and namespace | Infisical `/pii` | `VAULT_ADDR`, `VAULT_NAMESPACE` |
| Vault token | Infisical `/secrets` | `VAULT_TOKEN` |
| Jira site and project | Infisical `/pii` | `JIRA_SITE`, `JIRA_PROJECT` |
| Jira API token | Infisical `/secrets` | `JIRA_API_TOKEN` |
| Jenkins controller and user | Infisical `/pii` | `JENKINS_URL`, `JENKINS_USER` |
| Jenkins API token | Infisical `/secrets` | `JENKINS_API_TOKEN` |
| Postman workspace | Infisical `/pii` | `POSTMAN_WORKSPACE` |
| Postman API key | Infisical `/secrets` | `POSTMAN_API_KEY` |
| Email address | Infisical `/pii` | `GMAIL_ADDRESS` |
| Email App Password | Infisical `/secrets` | `GMAIL_APP_PASSWORD` |
| SMS gateway host | Infisical `/pii` | `SMS_GATEWAY_HOST` |
| SMS gateway credentials | Infisical `/secrets` | `SMS_GATEWAY_USER`, `SMS_GATEWAY_PASSWORD` |
| ntfy topic and token | Infisical `/secrets` | `NTFY_TOPIC`, `NTFY_TOKEN` |
| Discord bot token | Infisical `/secrets` | `DISCORD_BOT_TOKEN` |

If a value is neither inferable nor present, say so. Do not invent it.

## How the loaders reach the value

WSL loads the workspace `.envrc` through direnv. Windows runs `just import-secrets -Apply` in `simpsonm09-dev-setup`. Both read `settings/.env` for the Infisical machine identity and the offline fallback, pull the project's `/secrets` and `/pii` values, and overlay them, so an Infisical value overrides a same-name `.env` value. When Infisical is unreachable the `.env` values remain. See `simpsonm09-dev-setup/docs/secrets.md`.

## Personal services

### Email via `himalaya`

Send from a personal mailbox over IMAP and SMTP. The mailbox address is `GMAIL_ADDRESS` from Infisical `/pii`. Authenticate with an App Password from `GMAIL_APP_PASSWORD` in Infisical `/secrets`, not OAuth2.

- Config: `%APPDATA%\himalaya\config.toml` on Windows.
- The config points `backend.auth.cmd` and `message.send.backend.auth.cmd` at a command that prints the App Password from the environment.
- Never drive `himalaya account configure`. It is interactive. Write the config and confirm with `himalaya envelope list`.

```bash
himalaya envelope list
himalaya message send < message.eml
```

### Phone notifications via `ntfy`

Push a short message to the phone. This is the first choice for "notify me".

- The topic and token come from `NTFY_TOPIC` and `NTFY_TOKEN` in Infisical `/secrets`.
- Install the CLI with `scoop install ntfy` or the release zip on `%Path%`.

```bash
ntfy publish "$NTFY_TOPIC" "agent finished"
```

### Texting via `smsgate`

Send real SMS through an Android phone. This is for texting other people, not for notifications to yourself.

- **Local Server mode only.** The agent reaches the phone's HTTP server on the home LAN at `http://$SMS_GATEWAY_HOST:8080/message`. The host is an Infisical `/pii` value; it works only while the phone is home on the same network.
- Basic auth comes from `SMS_GATEWAY_USER` and `SMS_GATEWAY_PASSWORD` in Infisical `/secrets`.
- Install the CLI from the SMS Gateway for Android releases.

```bash
smsgate -e "http://$SMS_GATEWAY_HOST:8080/message" -u "$SMS_GATEWAY_USER" -p "$SMS_GATEWAY_PASSWORD" \
  send --phones '+15551234567' 'message'
```

Rules: SMS only, never set the phone's default SMS app, keep volume low, and do not use it for batch sending.

### Discord via `discli`

Discord, including messages, channels, and DMs, is owned by `discli`. The bot token is `DISCORD_BOT_TOKEN` in Infisical `/secrets`. See the `discord` skill for the token resolution order, profiles, and the command set.

## Channel selection

- `ntfy` for "notify me".
- `smsgate` for texts to other people.
- `discli` for Discord.
- `himalaya` for email.

## Rules

- State the source and the variable name, never the value.
- Infer from the tool when the tool already knows. Do not restate the account, the cluster, or the identity.
- Keep a credential in Infisical `/secrets` and PII, person, or machine config in Infisical `/pii`.
- Keep `settings/.env` to the Infisical machine identity and a small offline fallback. The loaders overlay Infisical on `.env`, and the `.env` copy remains the fallback when Infisical is unreachable.
- Confirm a CLI exists before you cite it or one of its commands. Run `command -v <cli>` in WSL or `Get-Command <cli>` on Windows. Do not claim a job moved from MCP to a CLI the runtime does not have.
- State how a service is reached only as it really is. Name the owner the runtime has, an MCP server or a CLI, and do not present one as the other.
- The org registry states the general rule; this skill states the source.
