import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

import { repoRoot } from "../scripts/validate-layer.mjs";

const readJson = (name) =>
  JSON.parse(readFileSync(join(repoRoot, name), "utf8"));

test("the Copilot manifest has the Claude manifest's name and version", () => {
  const copilot = readJson(".github/plugin/plugin.json");
  const claude = readJson(".claude-plugin/plugin.json");
  const pkg = readJson("package.json");

  assert.equal(copilot.name, claude.name);
  assert.equal(copilot.version, claude.version);
  assert.equal(copilot.version, pkg.version);
  assert.ok(
    copilot.description?.length > 0,
    "the manifest needs a description",
  );
  assert.deepEqual(readdirSync(join(repoRoot, ".github", "plugin")), [
    "plugin.json",
  ]);
});

test("the Copilot plugin contributes no hooks", () => {
  const copilot = readJson(".github/plugin/plugin.json");

  assert.equal(copilot.hooks, undefined);
  assert.equal(existsSync(join(repoRoot, "hooks")), false);
});

test("the layer and package publish lists include the Copilot manifest", () => {
  const layer = readJson("layer.json");
  const pkg = readJson("package.json");

  assert.ok(
    layer.files.includes(".github/plugin"),
    "layer.json files lacks .github/plugin",
  );
  assert.ok(
    pkg.files.includes(".github/plugin"),
    "package.json files lacks .github/plugin",
  );
});
