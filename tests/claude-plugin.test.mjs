import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

import { repoRoot } from "../scripts/validate-layer.mjs";

const readJson = (name) =>
  JSON.parse(readFileSync(join(repoRoot, name), "utf8"));

// The skill's frontmatter block, read the way the Claude plugin loader reads it:
// a leading --- block of "key: value" lines, with an optional quoted value.
function frontmatter(raw) {
  const text = raw.replace(/\r\n/g, "\n");
  if (!text.startsWith("---\n")) return null;
  const end = text.indexOf("\n---", 4);
  if (end === -1) return null;
  const fields = {};
  for (const line of text.slice(4, end).split("\n")) {
    const match = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (match)
      fields[match[1]] = match[2].trim().replace(/^["'](.*)["']$/, "$1");
  }
  return fields;
}

test("the Claude manifest is valid and matches the package", () => {
  const manifest = readJson(".claude-plugin/plugin.json");
  const pkg = readJson("package.json");

  assert.equal(manifest.name, "simpsonm09-personal");
  assert.equal(manifest.version, pkg.version);
  assert.ok(
    manifest.description?.length > 0,
    "the manifest needs a description",
  );
  assert.deepEqual(readdirSync(join(repoRoot, ".claude-plugin")), [
    "plugin.json",
  ]);
});

test("the personal Claude plugin contributes no hooks", () => {
  const manifest = readJson(".claude-plugin/plugin.json");

  assert.equal(manifest.hooks, undefined);
  assert.equal(existsSync(join(repoRoot, "hooks")), false);
});

test("every skill directory has a SKILL.md whose name matches and whose description is set", () => {
  const skillsDir = join(repoRoot, "skills");
  const ids = readdirSync(skillsDir).filter((entry) =>
    statSync(join(skillsDir, entry)).isDirectory(),
  );
  assert.ok(ids.length > 0, "skills/ has no skill directories");

  for (const id of ids) {
    const file = join(skillsDir, id, "SKILL.md");
    assert.ok(existsSync(file), `skill ${id} has no SKILL.md`);
    const fields = frontmatter(readFileSync(file, "utf8"));
    assert.ok(fields, `skill ${id} has no frontmatter block`);
    assert.equal(fields.name, id, `skill ${id} frontmatter name`);
    assert.ok(
      fields.description?.length > 0,
      `skill ${id} frontmatter has no description`,
    );
  }
});

test("the layer and package publish lists include the Claude manifest", () => {
  const layer = readJson("layer.json");
  const pkg = readJson("package.json");

  assert.ok(
    layer.files.includes(".claude-plugin"),
    "layer.json files lacks .claude-plugin",
  );
  assert.ok(
    pkg.files.includes(".claude-plugin"),
    "package.json files lacks .claude-plugin",
  );
});
