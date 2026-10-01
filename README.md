# personal-opencode-plugin

The personal OpenCode layer for `simpsonm09`.

The original lives in `simpsonm09-org/simpsonm09-personal-opencode-plugin`; work happens on the personal fork. See [`repo-standard`](https://github.com/simpsonm09-org/simpsonm09-repo-standard).

It contributes personal preferences and skills, not shared with the organization. It contributes no MCP server; every personal service is reached through a CLI. `maxstack` composes this layer last, so it overrides the org layer on a same-key conflict.

## Contents

- `layer.json` describes the layer, including its config fragment and plugin files.
- `opencode.fragment.jsonc` is the fragment `maxstack` merges into the workspace config.
- `index.ts` and `package.json` are the OpenCode plugin entrypoint.
- `skills/` holds the skills the plugin registers.
- `scripts/` holds the local setup helper for the `discli` Discord CLI.

## Servers

The layer contributes no MCP server. Every personal service is reached through a CLI, per the `service-integrations` registry: Playwright is `@playwright/cli` (`playwright-cli`), Chrome DevTools is the `chrome-devtools` CLI, Postman is the `postman` CLI, and Discord is `discli`. If a future job has no CLI, add one server here, keep it off by default, and remove it once a CLI exists.

## Plugin and skills

The layer is configuration and a plugin at the same time. `maxstack`'s `Install-Workspace.ps1` merges the fragment into `opencode.jsonc` and copies the files named in `layer.json` into `.opencode/plugins/personal-opencode`, where OpenCode loads the plugin. The plugin registers every `skills/<id>/SKILL.md` through `ctx.skill.transform`.

| Skill | Purpose |
| --- | --- |
| `dev-tools` | Where each personal tool's settings live and how to apply them. |
| `discord` | Discord through the `discli` CLI, including its token, permission profiles, audit log, and live `listen` and `serve` modes. |

Run `just setup-discli` once per machine to install `discli` and run `discli doctor`.

To add a skill, create `skills/<id>/SKILL.md` with `name` and `description` frontmatter. The plugin picks it up on the next install and restart.

## Layering

Precedence is personal over org over the PStack base. A layer overrides a same-key server from a lower layer. `maxstack` records the repo and commit of every layer in `stack.lock.json`.

Keep machine-specific values on the `local` branch of the fork, never on `main`.

## Layer contract

`maxstack`'s `Install-Workspace.ps1` consumes this layer through three files, and the plugin registers its skills. Keep the parts in sync.

| Part | Contract |
| --- | --- |
| `layer.json` | Names the config fragment and the files copied into `.opencode/plugins/personal-opencode`. |
| `package.json` | Its `files` array lists the same files as `layer.json`, and its `name` matches the plugin id in `index.ts`. |
| `opencode.fragment.jsonc` | Parses as JSONC and contributes no MCP server. A non-empty `mcp.servers` map fails the validator. |
| `skills/<id>/SKILL.md` | Carries `name` equal to the directory id and a non-empty `description`. The plugin registers the body. |

The workspace `stack.lock.json` records the commit this layer is pinned to.

Run `just test` (or `mise run test`, or `npm test`) to check the contract. The validator also runs on its own with `node scripts/validate-layer.mjs`.

## License

MIT. See [`LICENSE`](LICENSE).
