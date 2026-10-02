---
name: integrations-personal
description: Use when a task needs a personal service or a personal concrete for a general integration, such as the GitHub account, the Jira board, the Postman workspace, the Kubernetes context, the Vault address, email through himalaya, phone notifications through ntfy, or texting through smsgate. Holds the specifics the org registry defers to.
---

# Personal integrations

The org layer's `service-integrations` registry names the general owner of each job. This skill holds the personal concrete for those jobs and the personal services that sit below the org boundary. It is the place the org registry defers to.

Values are personal. Machine-bound values stay on the `local` branch, never on `main`, and a secret comes from the environment through the loaders, never from a file in a repository. Where a value is not committed here, the environment variable name is.

## Accounts and sites

| Job | Concrete |
| --- | --- |
| GitHub account | `simpsonm09`, with the `simpsonm09-org` organization |
| Jira site and board | set per machine; the board and project key live on the `local` branch |
| Postman workspace | set per machine; the workspace id lives on the `local` branch |

Run `gh auth status` to confirm the GitHub account. Sign in with `gh auth login`.

## Infrastructure

| Job | Concrete |
| --- | --- |
| Kubernetes context | the current context is on the machine; check with `kubectl config current-context` |
| Vault | `VAULT_ADDR` and `VAULT_NAMESPACE` from the environment; `vault status` confirms |
| Infisical | the project and `dev` environment in `dev-setup-starter`; load with the workspace `.envrc` in WSL or `scripts/Import-Secrets.ps1 -Apply` on Windows |

## Personal services

### Email via `himalaya`

Send from the Gmail mailbox over IMAP and SMTP. Authenticate with a Gmail App Password read from `GMAIL_APP_PASSWORD`, not OAuth2.

- Config: `%APPDATA%\himalaya\config.toml` on Windows.
- The config points `backend.auth.cmd` and `message.send.backend.auth.cmd` at a command that prints the App Password from the environment.
- Never drive `himalaya account configure`. It is interactive. Write the config and confirm with `himalaya envelope list`.

```bash
himalaya envelope list
himalaya message send < message.eml
```

### Phone notifications via `ntfy`

Push a short message to the phone. This is the first choice for "notify me".

- The topic name comes from `NTFY_TOPIC`, and a protected topic uses `NTFY_TOKEN`.
- Install the CLI with `scoop install ntfy` or the release zip on `%Path%`.

```bash
ntfy publish "$NTFY_TOPIC" "agent finished"
```

### Texting via `smsgate`

Send real SMS through an Android phone. This is for texting other people, not for notifications to yourself.

- **Local Server mode only.** The agent reaches the phone's HTTP server on the home LAN at `http://<phone-lan-ip>:8080/message`. It works only while the phone is home on the same network.
- Basic auth comes from `SMS_GATEWAY_USER` and `SMS_GATEWAY_PASSWORD`.
- Install the CLI from the SMS Gateway for Android releases.

```bash
smsgate -e "http://$SMS_GATEWAY_HOST:8080/message" -u "$SMS_GATEWAY_USER" -p "$SMS_GATEWAY_PASSWORD" \
  send --phones '+15551234567' 'message'
```

Rules: SMS only, never set the phone's default SMS app, keep volume low, and do not use it for batch sending.

### Discord via `discli`

Discord, including messages, channels, and DMs, is owned by `discli`. See the `discord` skill for the token, profiles, and the command set.

## Channel selection

- `ntfy` for "notify me".
- `smsgate` for texts to other people.
- `discli` for Discord.
- `himalaya` for email.

## Rules

- Keep secrets in Infisical and read them from the environment. Never commit a value.
- Keep machine-bound values on the `local` branch.
- The org registry states the general rule; this skill states the concrete.
