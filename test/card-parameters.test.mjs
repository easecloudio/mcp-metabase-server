import { test } from "node:test";
import assert from "node:assert/strict";

import { normalizeCardParameters } from "../build/utils/parameters.js";
import { CardToolHandlers } from "../build/handlers/card-tools.js";

const filter = {
  type: "category",
  target: ["dimension", ["field", 45, null]],
  value: "foo",
};

const CARD_PARAM_ID = "11111111-2222-3333-4444-555555555555";

// Stub client: GET /api/card/:id returns a card with one parameter, POSTs are recorded.
function recordingClient() {
  const calls = [];
  return {
    calls,
    posts: () => calls.filter((c) => c.method === "POST"),
    async apiCall(method, endpoint, data) {
      calls.push({ method, endpoint, data });
      if (method === "GET") {
        return { id: 1, parameters: [{ id: CARD_PARAM_ID, slug: "st", target: filter.target }] };
      }
      return { ok: true };
    },
  };
}

test("normalizeCardParameters adds a non-blank id when it is missing", () => {
  const [out] = normalizeCardParameters([filter]);
  assert.equal(typeof out.id, "string");
  assert.notEqual(out.id.trim(), "");
  assert.deepEqual({ ...out, id: undefined }, { ...filter, id: undefined });
});

test("normalizeCardParameters replaces blank or non-string ids", () => {
  const out = normalizeCardParameters([
    { ...filter, id: "" },
    { ...filter, id: "   " },
    { ...filter, id: undefined },
    { ...filter, id: 7 },
  ]);
  for (const item of out) {
    assert.equal(typeof item.id, "string");
    assert.notEqual(item.id.trim(), "");
  }
  assert.equal(new Set(out.map((p) => p.id)).size, out.length);
});

test("normalizeCardParameters keeps an existing id and does not mutate input", () => {
  const input = [{ ...filter, id: "abc-123" }, { ...filter }];
  const out = normalizeCardParameters(input);
  assert.equal(out[0].id, "abc-123");
  assert.equal("id" in input[1], false);
});

test("normalizeCardParameters reuses the card parameter id matched by target or slug", () => {
  const card = [
    { id: "id-a", slug: "a", target: ["variable", ["template-tag", "a"]] },
    { id: "id-b", slug: "b", target: ["variable", ["template-tag", "b"]] },
  ];
  const out = normalizeCardParameters(
    [
      { target: ["variable", ["template-tag", "b"]], value: 1 },
      { slug: "a", value: 2 },
      { slug: "unknown", value: 3 },
    ],
    card
  );
  assert.equal(out[0].id, "id-b");
  assert.equal(out[1].id, "id-a");
  assert.notEqual(out[2].id.trim(), "");
  assert.ok(!card.some((c) => c.id === out[2].id));
});

test("export_card_result falls back to generated ids when the card cannot be read", async () => {
  const client = recordingClient();
  const original = client.apiCall;
  client.apiCall = async (method, ...rest) => {
    if (method === "GET") throw new Error("403");
    return original(method, ...rest);
  };
  await new CardToolHandlers(client).handleTool("export_card_result", { card_id: 5, parameters: [filter] });
  const [call] = client.posts();
  assert.equal(typeof call.data.parameters[0].id, "string");
  assert.notEqual(call.data.parameters[0].id.trim(), "");
});

test("normalizeCardParameters returns [] for non-array input", () => {
  assert.deepEqual(normalizeCardParameters(undefined), []);
  assert.deepEqual(normalizeCardParameters({ a: 1 }), []);
  assert.deepEqual(normalizeCardParameters([]), []);
});

test("export_card_result sends an id on every parameter", async () => {
  const client = recordingClient();
  await new CardToolHandlers(client).handleTool("export_card_result", {
    card_id: 123,
    format: "csv",
    parameters: [filter, { ...filter, id: "keep-me" }],
  });
  assert.equal(client.posts().length, 1);
  const [call] = client.posts();
  assert.equal(call.method, "POST");
  assert.equal(call.endpoint, "/api/card/123/query/csv");
  assert.equal(call.data.parameters.length, 2);
  // Matched to the card's own parameter by target.
  assert.equal(call.data.parameters[0].id, CARD_PARAM_ID);
  assert.equal(call.data.parameters[1].id, "keep-me");
});

test("execute_pivot_card_query sends an id on every parameter", async () => {
  const client = recordingClient();
  await new CardToolHandlers(client).handleTool("execute_pivot_card_query", {
    card_id: 9,
    parameters: [filter],
  });
  const [call] = client.posts();
  assert.equal(call.endpoint, "/api/card/pivot/9/query");
  assert.equal(call.data.parameters[0].id, CARD_PARAM_ID);
});

test("unparameterized export and pivot calls still send an empty array", async () => {
  const client = recordingClient();
  const handlers = new CardToolHandlers(client);
  await handlers.handleTool("export_card_result", { card_id: 1 });
  await handlers.handleTool("execute_pivot_card_query", { card_id: 1 });
  // No parameters to fix, so the card is not fetched.
  assert.equal(client.calls.length, 2);
  assert.deepEqual(client.posts()[0].data, { parameters: [] });
  assert.deepEqual(client.posts()[1].data, { parameters: [] });
});

test("tool schemas document the parameter id", () => {
  const tools = new CardToolHandlers(recordingClient()).getToolSchemas();
  for (const name of ["export_card_result", "execute_pivot_card_query"]) {
    const tool = tools.find((t) => t.name === name);
    assert.ok(tool, name);
    assert.equal(tool.inputSchema.properties.parameters.items.properties.id.type, "string");
  }
});
