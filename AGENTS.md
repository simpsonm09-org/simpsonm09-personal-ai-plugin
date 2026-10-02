# simpsonm09-personal-opencode working agreements

The personal OpenCode layer for `simpsonm09`.

## Ground rules

- The layer contributes no MCP server. Reach a personal service through its CLI. The org `service-integrations` registry names the general owner; this layer holds the personal concrete.
- Keep `layer.json`, `package.json`, and `opencode.fragment.jsonc` in sync. The contract test checks them.
- Machine-specific and personal values stay out of `main`: non-secrets, including PII, in the gitignored `settings/.env`; secrets in Infisical. Use the `local` branch only for a value that must be versioned per machine.
- No personal secret or credential is committed.

## Commands

- `just install`, `just lint`, `just test`, `just verify`.
- `just setup-discli` installs the `discli` Discord CLI once per machine.

## Repo facts

- Language and toolchain: TypeScript, Node, and `@opencode/plugin`.
- `maxstack` composes this layer last, so it overrides the org layer on a same-key conflict.
- Skills: `integrations-personal`, `dev-tools`, `discord`.
- The README covers the contents, the layering, and the layer contract.

## Skills

The plugin registers the skills under `skills/`.
