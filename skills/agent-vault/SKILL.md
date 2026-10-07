---
name: agent-vault
description: Use when reaching Discord or Postman through the Agent Vault, choosing a vault identity, or debugging a brokered session. Names the access bundles, the identities, the with-vault and with-secrets wrappers, and the known gotchas.
---

# Agent Vault

The Agent Vault brokers a credential to one command without putting it in the environment. A wrapper opens a short-lived session, and the proxy attaches the secret to the matching host. Discord and Postman are the services it covers today.

## The model

Four parts.

- **Service.** A host the proxy forwards to, such as `discord.com` or `api.getpostman.com`.
- **Access bundle.** A named set of services, a bearer header, and a prefix. Bundle `discord` covers `discord.com` with the `Authorization` header and the `Bot` prefix. Bundle `postman` covers `api.getpostman.com` and `gateway.postman.com` with the `X-Api-Key` header and an empty prefix.
- **Proxy.** The `workstation` proxy listens on port 17323, enrolled once, and attaches a bundle's credential to a request that matches the bundle's hosts. Its traffic policy is `bundle-hosts`, so it forwards the bundle hosts and refuses any other host, with `ndbc.noaa.gov` allowed as an exception so the Postman collection run can reach its target.
- **Session.** A per-run grant that ties a call to an identity. The wrapper mints it, the call runs under it, and the wrapper revokes it on exit.

## Identities

| Identity | Membership | Capability | Used by |
| --- | --- | --- | --- |
| `Ugallu-Desktop` | `dev-workspace` project, Viewer | Read all of `/secrets` and `/pii` | `with-secrets` |
| `Agent-Vault-Runner` | Agent Vault, no project | Mint sessions for `discord` and `postman` | `with-vault --role agent` |
| `Human-Vault-Runner` | Agent Vault, no project | Mint sessions for `discord` and `postman` | `with-vault --role human` |

Three identities keep access and attribution separate. The loader identity reads secrets, so it must be a project member. Agent Vault rejects an identity that belongs to another project, so the loader identity cannot also be a vault identity. The two vault identities split the audit between human runs and agent runs. Drop `Human-Vault-Runner` only if that attribution does not matter, and let the human use `with-secrets` alone.

## Wrappers and roles

`--role` is required, so a run is never silently misattributed.

| Command | Who | Identity | Secret path |
| --- | --- | --- | --- |
| `with-secrets <tool> [args]` | Human | `Ugallu-Desktop` | Loaded into that command's environment |
| `with-vault --role human <tool> [args]` | Human | `Human-Vault-Runner` | Attached by the proxy |
| `with-vault --role agent <tool> [args]` | Agent | `Agent-Vault-Runner` | Attached by the proxy |

`with-vault` maps a tool to its bundle.

| Tool | Bundle |
| --- | --- |
| `discli` | `discord` |
| `postman` | `postman` |
| other | `--bundle <name>` required |

The Windows wrappers are `with-secrets.ps1` and `with-vault.ps1` in `%USERPROFILE%\.config\agent-vault`. The WSL wrappers live in `~/.config/agent-vault`.

```bash
with-vault --role agent discli --json server list
with-vault --role human postman collection list
with-secrets ntfy publish "$NTFY_TOPIC" "done"
```

## Gotchas

- `infisical secrets delete` defaults to `--type personal`. To move a secret, pass `--type shared`, or the delete misses the shared copy.
- The Postman CLI reaches `gateway.postman.com` for workspace and collection calls, not only `api.getpostman.com`. The `postman` bundle must list both hosts.
- discord.py on aiohttp ignores `HTTPS_PROXY`, so a brokered Discord call needs the `sitecustomize.py` shim at `~/.config/agent-vault/shim/` to feed the proxy address to the client.
- `127.0.0.1` is not forwarded from Windows to WSL. Windows wrappers use `localhost:17323` and WSL wrappers use `127.0.0.1`.
- Agent Vault rejects an identity that already belongs to another project. Create a vault identity with no project membership.
- Sessions are per-run and revoked on exit, so the session list fills with expired rows over time. Keep TTLs short and revoke on a schedule.
- `infisical user get token` prints a multi-line block. Parse the `Token:` line, not the whole output.
- Once the proxy is enrolled it restarts without `--enrollment-token`. Keep the spent token off the process arguments.
- `pkill -f` can match the calling shell. Match the proxy by process name instead.

## Rules

- Run Discord and Postman through a wrapper. A raw call has no credential.
- Pass `--role` explicitly. Do not default it.
- Keep the vault config at mode 0600 and outside the repositories.
- Rotate a vault identity's client secret on a schedule.
- State the identity and the bundle, never a secret value.
