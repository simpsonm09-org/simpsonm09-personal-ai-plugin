---
name: integrations-personal
description: Use when a task needs a personal concrete for a general integration or a personal service, such as the GitHub account, the Jira project, the Kubernetes context, email through himalaya, phone notifications through ntfy, or texting through smsgate. States where each value comes from rather than the value.
---

# Personal integrations

The org layer's `service-integrations` registry names the general owner of each job. This skill states where the personal value comes from. It does not restate a value the tool can report, and it does not hold a secret.

## Where a value comes from

There are three sources. Use the tool's own state first, the bootstrap file second, and the secrets vault for anything sensitive.

| Source | Rule | Examples |
| --- | --- | --- |
| Infer from the tool | The tool already knows the value. Read it at run time; never store it here. | `gh auth status` for the GitHub account, `kubectl config current-context` for the cluster, `git config user.email` for the identity |
| Settings `.env` | A non-secret personal value, including PII and machine configuration. The bootstrap file is gitignored. The loaders export every key that is not prefixed `INFISICAL_`. | `VAULT_ADDR`, `VAULT_NAMESPACE`, `JIRA_SITE`, `JIRA_PROJECT`, `JENKINS_URL`, `JENKINS_USER`, `POSTMAN_WORKSPACE`, `GMAIL_ADDRESS`, `SMS_GATEWAY_HOST` |
| Infisical | A secret. Read it from the environment through the loaders. An Infisical value overrides a same-name value from `.env`. | `VAULT_TOKEN`, `JIRA_API_TOKEN`, `JENKINS_API_TOKEN`, `POSTMAN_API_KEY`, `SMS_GATEWAY_USER`, `SMS_GATEWAY_PASSWORD`, `GMAIL_APP_PASSWORD`, `DISCORD_BOT_TOKEN`, `NTFY_TOPIC`, `NTFY_TOKEN` |

## Per job

| Job | Source | Variable or check |
| --- | --- | --- |
| GitHub account | infer | `gh auth status` |
| Git identity | infer | `git config user.email` |
| Kubernetes context | infer | `kubectl config current-context` |
| Vault address and namespace | settings `.env` | `VAULT_ADDR`, `VAULT_NAMESPACE` |
| Vault token | Infisical | `VAULT_TOKEN` |
| Jira site and project | settings `.env` | `JIRA_SITE`, `JIRA_PROJECT` |
| Jira API token | Infisical | `JIRA_API_TOKEN` |
| Jenkins controller and user | settings `.env` | `JENKINS_URL`, `JENKINS_USER` |
| Jenkins API token | Infisical | `JENKINS_API_TOKEN` |
| Postman workspace | settings `.env` | `POSTMAN_WORKSPACE` |
| Postman API key | Infisical | `POSTMAN_API_KEY` |
| Infisical project | settings `.env` | `INFISICAL_PROJECT_ID` |
| Email address | settings `.env` | `GMAIL_ADDRESS` |
| Email App Password | Infisical | `GMAIL_APP_PASSWORD` |
| SMS gateway host | settings `.env` | `SMS_GATEWAY_HOST` |
| SMS gateway credentials | Infisical | `SMS_GATEWAY_USER`, `SMS_GATEWAY_PASSWORD` |
| ntfy topic and token | Infisical | `NTFY_TOPIC`, `NTFY_TOKEN` |
| Discord bot token | Infisical | `DISCORD_BOT_TOKEN` |

If a value is neither inferable nor present, say so. Do not invent it.

## How the loaders reach the value

WSL loads the workspace `.envrc` through direnv. Windows runs `scripts/Import-Secrets.ps1 -Apply`. Both read `settings/.env`, export every key that is not prefixed `INFISICAL_`, and then overlay the Infisical export. See `dev-setup-starter/docs/secrets.md`.

## Personal services

### Email via `himalaya`

Send from a personal mailbox over IMAP and SMTP. The mailbox address is `GMAIL_ADDRESS` from the settings `.env`. Authenticate with an App Password from `GMAIL_APP_PASSWORD` in Infisical, not OAuth2.

- Config: `%APPDATA%\himalaya\config.toml` on Windows.
- The config points `backend.auth.cmd` and `message.send.backend.auth.cmd` at a command that prints the App Password from the environment.
- Never drive `himalaya account configure`. It is interactive. Write the config and confirm with `himalaya envelope list`.

```bash
himalaya envelope list
himalaya message send < message.eml
```

### Phone notifications via `ntfy`

Push a short message to the phone. This is the first choice for "notify me".

- The topic and token come from `NTFY_TOPIC` and `NTFY_TOKEN` in Infisical.
- Install the CLI with `scoop install ntfy` or the release zip on `%Path%`.

```bash
ntfy publish "$NTFY_TOPIC" "agent finished"
```

### Texting via `smsgate`

Send real SMS through an Android phone. This is for texting other people, not for notifications to yourself.

- **Local Server mode only.** The agent reaches the phone's HTTP server on the home LAN at `http://$SMS_GATEWAY_HOST:8080/message`. The host is a settings `.env` value; it works only while the phone is home on the same network.
- Basic auth comes from `SMS_GATEWAY_USER` and `SMS_GATEWAY_PASSWORD` in Infisical.
- Install the CLI from the SMS Gateway for Android releases.

```bash
smsgate -e "http://$SMS_GATEWAY_HOST:8080/message" -u "$SMS_GATEWAY_USER" -p "$SMS_GATEWAY_PASSWORD" \
  send --phones '+15551234567' 'message'
```

Rules: SMS only, never set the phone's default SMS app, keep volume low, and do not use it for batch sending.

### Discord via `discli`

Discord, including messages, channels, and DMs, is owned by `discli`. The bot token is `DISCORD_BOT_TOKEN` in Infisical. See the `discord` skill for the token resolution order, profiles, and the command set.

## Channel selection

- `ntfy` for "notify me".
- `smsgate` for texts to other people.
- `discli` for Discord.
- `himalaya` for email.

## Rules

- State the source and the variable name, never the value.
- Infer from the tool when the tool already knows. Do not restate the account, the cluster, or the identity.
- Keep PII and non-secret machine configuration in `settings/.env`, which is gitignored.
- Keep secrets in Infisical and read them from the environment.
- The org registry states the general rule; this skill states the source.
