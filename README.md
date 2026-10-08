# simpsonm09-personal-ai-plugin

The personal plugin layer for `simpsonm09`. It serves OpenCode and Claude Code from one `skills/` folder.

The original lives in `simpsonm09-org/simpsonm09-personal-ai-plugin`; work happens on the personal fork. See [`repo-standard`](https://github.com/simpsonm09-org/simpsonm09-repo-standard).

It contributes personal preferences and skills, not shared with the organization. It contributes no MCP server; every personal service is reached through a CLI. `maxstack` composes this layer last, so it overrides the org layer on a same-key conflict.

## Contents

- `layer.json` describes the layer, including its config fragment and plugin files.
- `opencode.fragment.jsonc` is the fragment `maxstack` merges into the workspace config.
- `index.ts` and `package.json` are the OpenCode plugin entrypoint.
- `skills/` holds the skills the plugin registers.
- `.claude-plugin/` holds the Claude Code plugin manifest.
- `.github/plugin/` holds the GitHub Copilot CLI plugin manifest. It names no hooks file.
- `scripts/` holds the `discli` setup helpers and the layer contract validator.

## Servers

The layer contributes no MCP server. General services are reached through a CLI, per the org `service-integrations` registry. This layer holds the personal concretes the registry defers to, and the personal services: `himalaya` for email, `ntfy` for phone notifications, `smsgate` for texting, and `discli` for Discord. Discord and Postman reach their secret through the Agent Vault wrappers, `with-vault --role agent` for the agent and `with-secrets` or `with-vault --role human` for the human. The `agent-vault` skill owns the identities, the bundles, and the proxy. If a future job has no CLI, add one server here, keep it off by default, and remove it once a CLI exists.

## Plugin and skills

For OpenCode, the layer is configuration and a plugin at the same time. `maxstack`'s `Install-Workspace.ps1` merges the fragment into `opencode.jsonc` and copies the files named in `layer.json` into `.opencode/plugins/simpsonm09-personal-ai-plugin`, where OpenCode loads the plugin. The plugin registers every `skills/<id>/SKILL.md` through `ctx.skill.transform`.

| Skill | Purpose |
| --- | --- |
| `integrations-personal` | Where each personal value comes from (infer from the tool, Infisical `/secrets`, or Infisical `/pii`), the loader and the Agent Vault wrappers, and the `himalaya`, `ntfy`, and `smsgate` services. |
| `dev-tools` | Where each personal tool's settings live and how to apply them. Installing the tools is owned by `simpsonm09-dev-setup` through `tools.yaml`. |
| `discord` | Discord through the `discli` CLI, including the `with-vault` and `with-secrets` wrappers, permission profiles, the audit log, and live `listen` and `serve` modes. |
| `agent-vault` | The Agent Vault model, its identities, the `with-vault` and `with-secrets` wrappers, and the known gotchas. Discord and Postman go through it. |

Run `just setup-discli` once per machine to install `discli` and run `discli doctor`.

To add a skill, create `skills/<id>/SKILL.md` with `name` and `description` frontmatter. The plugin picks it up on the next install and restart.

## GitHub Copilot CLI plugin

The same skills load into GitHub Copilot CLI from `.github/plugin/plugin.json`, with the same name and version as the Claude manifest and no hooks. Load the folder with `copilot --plugin-dir <folder>`, where the folder is this repository or its installed copy. Copilot finds the shared `skills/` directory at the plugin root.

## Claude Code plugin

The same skills also load into Claude Code as the `simpsonm09-personal-ai-plugin` plugin. `.claude-plugin/plugin.json` is the manifest, and Claude Code finds the shared `skills/` directory at the plugin root, so nothing is copied. The plugin contributes no hooks: the access gate is in the org plugin, and these skills are reference material. The skill text is written for both harnesses. Where a tool name or path differs between them, the skill names both.

## How it gets loaded

This repository is not installed on its own. [`simpsonm09-maxstack`](https://github.com/simpsonm09-org/simpsonm09-maxstack)'s `scripts/Install-Workspace.ps1 -Apply` copies it to `<workspace>/.opencode/plugins/simpsonm09-personal-ai-plugin` and links `<workspace>/.claude/plugins/simpsonm09-personal-ai-plugin` to that copy.

- OpenCode needs no setting. It finds the workspace `.opencode` folder by walking up from the repository.
- Claude Code must be started with `--plugin-dir <workspace>/.claude/plugins`. In T3 Code that goes in the Claude provider instance's "Launch arguments".

maxstack's [`docs/t3-setup.md`](https://github.com/simpsonm09-org/simpsonm09-maxstack/blob/main/docs/t3-setup.md) is the full reference. A new session is needed after each install.

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
