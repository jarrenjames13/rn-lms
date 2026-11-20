const test = require("node:test");
const assert = require("node:assert/strict");
const {
  getEmbeddedMediaHeaders,
  isApprovedActivityEmbed,
  selectExamContent,
} = require("./utils/examContentPolicy.js");

const API_URL = "https://lms.example.test/api";
const ASSET_ID = "12345678-1234-4234-8234-123456789abc";
const COOKIE = "access_token_cookie=secret-session-cookie";

test("mobile rich assessment smoke path", async (t) => {
  await t.test("only approved HTTPS activity embeds are presented as open links", () => {
    assert.equal(isApprovedActivityEmbed("https://ce47.github.io/activities/demo"), true);
    assert.equal(isApprovedActivityEmbed("https://CE47.GITHUB.IO/activities/demo"), true);
    assert.equal(isApprovedActivityEmbed("http://ce47.github.io/activities/demo"), false);
    assert.equal(isApprovedActivityEmbed("https://other.example/activities/demo"), false);
    assert.equal(isApprovedActivityEmbed("https://user@ce47.github.io/activities/demo"), false);
    assert.equal(isApprovedActivityEmbed("https://ce47.github.io:444/activities/demo"), false);
    assert.equal(isApprovedActivityEmbed("not a URL"), false);
  });

  await t.test("selects version-1 HTML for question and choice content", () => {
    const question = selectExamContent(
      1,
      `<p>Evaluate <img src="/api/media/${ASSET_ID}" alt="x squared"></p>`,
      "Plain question fallback",
    );
    const choice = selectExamContent(
      1,
      `<p><img src="/api/media/${ASSET_ID}" alt="integral formula"></p>`,
      "Plain choice fallback",
    );

    assert.equal(question.kind, "rich");
    assert.match(question.value, /alt="x squared"/);
    assert.equal(choice.kind, "rich");
    assert.match(choice.value, /alt="integral formula"/);
  });

  await t.test("keeps legacy and unsupported versions on the literal plain-text path", () => {
    const literalText = "Literal <strong>legacy</strong> content";
    for (const version of [0, undefined, 2, "1"]) {
      assert.deepEqual(
        selectExamContent(version, "<p>This rich field must be ignored.</p>", literalText),
        { kind: "plain", value: literalText },
      );
    }
  });

  await t.test("attaches the SecureStore cookie only to the same-origin media image request", () => {
    const headers = getEmbeddedMediaHeaders(
      `/api/media/${ASSET_ID}`,
      "img",
      API_URL,
      COOKIE,
    );

    assert.deepEqual(headers, { Cookie: COOKIE });
    assert.equal(headers["X-Embedded-Proof"], undefined);
    assert.equal(
      getEmbeddedMediaHeaders(`https://attacker.test/api/media/${ASSET_ID}`, "img", API_URL, COOKIE),
      null,
    );
    assert.equal(
      getEmbeddedMediaHeaders(`/api/media/${ASSET_ID}/extra`, "img", API_URL, COOKIE),
      null,
    );
    assert.equal(
      getEmbeddedMediaHeaders(`/api/media/${ASSET_ID}`, "img", API_URL, null),
      null,
    );
    assert.equal(
      getEmbeddedMediaHeaders(`/api/media/${ASSET_ID}`, "a", API_URL, COOKIE),
      null,
    );
  });
});
