# simpsonm09-personal-ai-plugin

The personal plugin layer for `simpsonm09`. It serves OpenCode and Claude Code from one `skills/` folder.

The original lives in `simpsonm09-org/simpsonm09-personal-ai-plugin`; work happens on the personal fork. See [`repo-standard`](https://github.com/simpsonm09-org/simpsonm09-repo-standard).

It contributes personal preferences and skills, not shared with the organization. It contributes no MCP server; every personal service is reached through a CLI. `maxstack` composes this layer last, so it overrides the org layer on a same-key conflict.

## Contents

- `layer.json` describes the layer, including its config fragment and plugin files.
- `opencode.fragment.jsonc` is the fragment `maxstack` merges into the workspace config.
- `index.ts` and `package.json` are the OpenCode plugin entrypoint.
- `skills/` holds the skills the plugin registers.
- `scripts/` holds the local setup helper for the `discli` Discord CLI.

## Servers

The layer contributes no MCP server. General services are reached through a CLI, per the org `service-integrations` registry. This layer holds the personal concretes the registry defers to, and the personal services: `himalaya` for email, `ntfy` for phone notifications, `smsgate` for texting, and `discli` for Discord. Discord and Postman reach their secret through the Agent Vault wrappers, `with-vault --role agent` for the agent and `with-secrets` or `with-vault --role human` for the human. The `agent-vault` skill owns the identities, the bundles, and the proxy. If a future job has no CLI, add one server here, keep it off by default, and remove it once a CLI exists.

## Plugin and skills

The layer is configuration and a plugin at the same time. `maxstack`'s `Install-Workspace.ps1` merges the fragment into `opencode.jsonc` and copies the files named in `layer.json` into `.opencode/plugins/simpsonm09-personal-ai-plugin`, where OpenCode loads the plugin. The plugin registers every `skills/<id>/SKILL.md` through `ctx.skill.transform`.

| Skill | Purpose |
| --- | --- |
| `integrations-personal` | Where each personal value comes from (infer from the tool, Infisical `/secrets`, or Infisical `/pii`), the loader and the Agent Vault wrappers, and the `himalaya`, `ntfy`, and `smsgate` services. |
| `dev-tools` | Where each personal tool's settings live and how to apply them. Installing the tools is owned by `dev-setup-starter` through `tools.yaml`. |
| `discord` | Discord through the `discli` CLI, including the `with-vault` and `with-secrets` wrappers, permission profiles, the audit log, and live `listen` and `serve` modes. |
| `agent-vault` | The Agent Vault model, its identities, the `with-vault` and `with-secrets` wrappers, and the known gotchas. Discord and Postman go through it. |

Run `just setup-discli` once per machine to install `discli` and run `discli doctor`.

To add a skill, create `skills/<id>/SKILL.md` with `name` and `description` frontmatter. The plugin picks it up on the next install and restart.

## Claude Code plugin

The same skills also load into Claude Code as the `simpsonm09-personal-ai-plugin` plugin. `.claude-plugin/plugin.json` is the manifest, and Claude Code finds the shared `skills/` directory at the plugin root, so nothing is copied. The plugin contributes no hooks: the access gate is in the org plugin, and these skills are reference material. Some skill text names OpenCode-only paths and tools, so read it as OpenCode guidance where it says so.

## Layering

Precedence is personal over org over the PStack base. A layer overrides a same-key server from a lower layer. `maxstack` records the repo and commit of every layer in `stack.lock.json`.

Values follow the four-tier store model. A committed file names a variable but never a value. The gitignored `settings/.env` holds the Infisical machine identity (secret-zero) and a small offline fallback. Infisical `/secrets` holds credentials, and Infisical `/pii` holds PII and person or machine config. The loaders overlay Infisical on `.env` and keep the documented offline fallback.

## Layer contract

`maxstack`'s `Install-Workspace.ps1` consumes this layer through three files, and the plugin registers its skills. Keep the parts in sync.

| Part | Contract |
| --- | --- |
| `layer.json` | Names the config fragment and the files copied into `.opencode/plugins/simpsonm09-personal-ai-plugin`. |
| `package.json` | Its `files` array lists the same files as `layer.json`, and its `name` matches the plugin id in `index.ts`. |
| `opencode.fragment.jsonc` | Parses as JSONC and contributes no MCP server. A non-empty `mcp.servers` map fails the validator. |
| `skills/<id>/SKILL.md` | Carries `name` equal to the directory id and a non-empty `description`. The plugin registers the body. |

The workspace `stack.lock.json` records the commit this layer is pinned to.

Run `just test` (or `mise run test`, or `npm test`) to check the contract. The validator also runs on its own with `node scripts/validate-layer.mjs`.

## License

MIT. See [`LICENSE`](LICENSE).
