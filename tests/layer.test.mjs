import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { test } from "node:test"

import { repoRoot, validateLayer } from "../scripts/validate-layer.mjs"

const LAYER = {
  name: "simpsonm09-personal-opencode",
  kind: "config",
  config: "opencode.fragment.jsonc",
  files: ["index.ts", "package.json", "skills", "README.md"],
}
const PKG = { name: "simpsonm09-personal-opencode", files: ["index.ts", "package.json", "skills", "README.md"] }
const INDEX = 'export default Plugin.define({ id: "simpsonm09-personal-opencode", async setup() {} })'
const SKILL = '---\nname: demo\ndescription: Use when running the demo.\n---\n\n# Demo\n'

function makeFixture() {
  const root = mkdtempSync(join(tmpdir(), "layer-"))
  mkdirSync(join(root, "skills", "demo"), { recursive: true })
  writeFileSync(join(root, "layer.json"), JSON.stringify(LAYER))
  writeFileSync(join(root, "package.json"), JSON.stringify(PKG))
  writeFileSync(join(root, "index.ts"), INDEX)
  writeFileSync(join(root, "README.md"), "# demo\n")
  writeFileSync(join(root, "opencode.fragment.jsonc"), "{}\n")
  writeFileSync(join(root, "skills", "demo", "SKILL.md"), SKILL)
  return root
}

function withFixture(mutate, assert_failures) {
  const root = makeFixture()
  try {
    mutate(root)
    assert_failures(validateLayer(root))
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

test("the repository satisfies the layer contract", () => {
  assert.deepEqual(validateLayer(repoRoot), [])
})

test("accepts a JSONC fragment with comments and trailing commas", () => {
  withFixture(
    (root) =>
      writeFileSync(
        join(root, "opencode.fragment.jsonc"),
        '{\n  // no personal MCP servers\n  "permissions": [],\n}\n',
      ),
    (failures) => assert.deepEqual(failures, []),
  )
})

test("detects package.json files drifting from layer.json", () => {
  withFixture(
    (root) => writeFileSync(join(root, "package.json"), JSON.stringify({ ...PKG, files: ["index.ts"] })),
    (failures) => assert.ok(failures.some((f) => f.includes("must match layer.json files"))),
  )
})

test("detects a file layer.json lists but does not exist", () => {
  withFixture(
    (root) => rmSync(join(root, "README.md")),
    (failures) => assert.ok(failures.some((f) => f.includes("lists a missing file: README.md"))),
  )
})

test("detects an unparseable fragment", () => {
  withFixture(
    (root) => writeFileSync(join(root, "opencode.fragment.jsonc"), '{ "mcp": { "servers": {'),
    (failures) => assert.ok(failures.some((f) => f.includes("invalid fragment"))),
  )
})

test("detects an MCP server the personal layer should not contribute", () => {
  withFixture(
    (root) => writeFileSync(join(root, "opencode.fragment.jsonc"), JSON.stringify({ mcp: { servers: { demo: { type: "local", command: ["x"], disabled: true } } } })),
    (failures) => assert.ok(failures.some((f) => f.includes("contributes MCP servers (demo)"))),
  )
})

test("detects a skill whose frontmatter name does not match its directory", () => {
  withFixture(
    (root) => writeFileSync(join(root, "skills", "demo", "SKILL.md"), '---\nname: other\ndescription: Use when running the demo.\n---\n\n# Demo\n'),
    (failures) => assert.ok(failures.some((f) => f.includes('skill demo frontmatter name is "other"'))),
  )
})

test("detects a plugin id that does not match the package name", () => {
  withFixture(
    (root) => writeFileSync(join(root, "package.json"), JSON.stringify({ ...PKG, name: "renamed" })),
    (failures) => assert.ok(failures.some((f) => f.includes('plugin id "simpsonm09-personal-opencode" must match package.json name "renamed"'))),
  )
})
