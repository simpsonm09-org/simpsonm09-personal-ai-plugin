import assert from "node:assert/strict";
import { test } from "node:test";

import plugin from "../index.ts";

test("the entrypoint registers the package id", () => {
  assert.equal(plugin.id, "simpsonm09-personal-ai-plugin");
});
