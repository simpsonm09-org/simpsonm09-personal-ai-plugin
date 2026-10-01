#!/usr/bin/env node
// Guards the contract maxstack's Install-Workspace.ps1 depends on. The installer
// reads layer.json for the config fragment and the files to copy, merges the
// fragment with PowerShell's ConvertFrom-Json, and the plugin registers every
// skills/<id>/SKILL.md. Run with no arguments to check this repository.

import { existsSync, readFileSync, readdirSync, realpathSync, statSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

export const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)))

// ConvertFrom-Json accepts JSONC, so the fragment may carry // and /* */ comments
// and trailing commas. Node parses neither, so rewrite the text to strict JSON.
function toStrictJson(text) {
  let out = ""
  let inString = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inString) {
      out += ch
      if (ch === "\\") {
        out += text[++i] ?? ""
        continue
      }
      if (ch === '"') inString = false
      continue
    }
    if (ch === '"') {
      inString = true
      out += ch
      continue
    }
    if (ch === "/" && text[i + 1] === "/") {
      i = text.indexOf("\n", i)
      if (i === -1) return out
      continue
    }
    if (ch === "/" && text[i + 1] === "*") {
      const end = text.indexOf("*/", i + 2)
      i = end === -1 ? text.length : end + 1
      continue
    }
    if (ch === ",") {
      let j = i + 1
      for (;;) {
        while (j < text.length && /\s/.test(text[j])) j++
        if (text[j] === "/" && text[j + 1] === "/") {
          j = text.indexOf("\n", j)
          if (j === -1) break
          continue
        }
        if (text[j] === "/" && text[j + 1] === "*") {
          const end = text.indexOf("*/", j + 2)
          if (end === -1) {
            j = text.length
            break
          }
          j = end + 2
          continue
        }
        break
      }
      if (text[j] === "}" || text[j] === "]") continue
    }
    out += ch
  }
  return out
}

function readJson(path, failures) {
  if (!existsSync(path)) {
    failures.push(`missing file: ${path}`)
    return null
  }
  try {
    return JSON.parse(readFileSync(path, "utf8"))
  } catch (error) {
    failures.push(`invalid JSON in ${path}: ${error.message}`)
    return null
  }
}

function frontmatter(raw) {
  const text = raw.replace(/\r\n/g, "\n")
  if (!text.startsWith("---\n")) return null
  const end = text.indexOf("\n---", 4)
  if (end === -1) return null
  const fields = {}
  for (const line of text.slice(4, end).split("\n")) {
    const match = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line)
    if (match) fields[match[1]] = match[2].trim().replace(/^["'](.*)["']$/, "$1")
  }
  return fields
}

export function validateLayer(root = repoRoot) {
  const failures = []
  const layer = readJson(join(root, "layer.json"), failures)
  const pkg = readJson(join(root, "package.json"), failures)
  const fragmentName = layer?.config ?? "opencode.fragment.jsonc"

  if (layer) {
    if (layer.kind !== "config") failures.push(`layer.json kind is ${JSON.stringify(layer.kind)}, expected "config"`)
    if (typeof layer.config !== "string" || !layer.config) failures.push("layer.json is missing a config fragment name")
    else if (!existsSync(join(root, layer.config))) failures.push(`layer.json config fragment does not exist: ${layer.config}`)
    if (!Array.isArray(layer.files) || layer.files.length === 0) failures.push("layer.json lists no files")
    else for (const file of layer.files) if (!existsSync(join(root, file))) failures.push(`layer.json lists a missing file: ${file}`)
  }

  if (layer && pkg) {
    const listed = [...(layer.files ?? [])].sort()
    const published = [...(pkg.files ?? [])].sort()
    if (JSON.stringify(listed) !== JSON.stringify(published)) {
      failures.push(`package.json files ${JSON.stringify(published)} must match layer.json files ${JSON.stringify(listed)}`)
    }
    if (typeof pkg.name !== "string" || !pkg.name) failures.push("package.json is missing a name")
  }

  if (existsSync(join(root, fragmentName))) {
    try {
      const fragment = JSON.parse(toStrictJson(readFileSync(join(root, fragmentName), "utf8")))
      // The personal layer is CLI-first. It contributes no MCP server, so the
      // fragment must not carry a non-empty mcp.servers map. Add a server only
      // for a job no CLI covers, and remove it once the CLI exists.
      const servers = fragment?.mcp?.servers
      if (servers && typeof servers === "object" && Object.keys(servers).length > 0) {
        failures.push(`${fragmentName} contributes MCP servers (${Object.keys(servers).join(", ")}); the personal layer contributes none`)
      }
    } catch (error) {
      failures.push(`invalid fragment ${fragmentName}: ${error.message}`)
    }
  }

  const skillsDir = join(root, "skills")
  if (!existsSync(skillsDir)) {
    failures.push("missing skills/ directory")
  } else {
    const ids = readdirSync(skillsDir).filter((entry) => statSync(join(skillsDir, entry)).isDirectory())
    if (ids.length === 0) failures.push("skills/ has no skill directories")
    for (const id of ids) {
      const file = join(skillsDir, id, "SKILL.md")
      if (!existsSync(file)) {
        failures.push(`skill ${id} has no SKILL.md`)
        continue
      }
      const fields = frontmatter(readFileSync(file, "utf8"))
      if (!fields) {
        failures.push(`skill ${id} has no frontmatter block`)
        continue
      }
      if (fields.name !== id) failures.push(`skill ${id} frontmatter name is ${JSON.stringify(fields.name)}`)
      if (!fields.description) failures.push(`skill ${id} frontmatter has no description`)
    }
  }

  if (pkg && typeof pkg.name === "string" && existsSync(join(root, "index.ts"))) {
    const source = readFileSync(join(root, "index.ts"), "utf8")
    const match = /Plugin\.define\(\s*\{[\s\S]*?\bid:\s*["']([^"']+)["']/.exec(source)
    if (!match) failures.push("index.ts does not declare a Plugin.define id")
    else if (match[1] !== pkg.name) failures.push(`index.ts plugin id ${JSON.stringify(match[1])} must match package.json name ${JSON.stringify(pkg.name)}`)
  }

  return failures
}

const invoked = process.argv[1] ? realpathSync(process.argv[1]).toLowerCase() : ""
if (invoked && invoked === fileURLToPath(import.meta.url).toLowerCase()) {
  const failures = validateLayer()
  if (failures.length > 0) {
    for (const failure of failures) console.error(`FAIL: ${failure}`)
    process.exit(1)
  }
  console.log("PASS: layer contract holds.")
}
