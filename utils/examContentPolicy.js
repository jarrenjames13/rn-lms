const MEDIA_PATH = /^\/api\/media\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function selectExamContent(formatVersion, richHtml, plainText) {
  if (formatVersion === 1 && typeof richHtml === "string" && richHtml.length > 0) {
    return { kind: "rich", value: richHtml };
  }
  return { kind: "plain", value: plainText };
}

function getEmbeddedMediaHeaders(uri, tagName, apiBaseUrl, authCookie) {
  if (tagName !== "img" || !authCookie || !apiBaseUrl) return null;

  try {
    const mediaUrl = new URL(uri, apiBaseUrl);
    const apiOrigin = new URL(apiBaseUrl).origin;
    if (mediaUrl.origin !== apiOrigin || !MEDIA_PATH.test(mediaUrl.pathname)) {
      return null;
    }
    return { Cookie: authCookie };
  } catch {
    return null;
  }
}

module.exports = { getEmbeddedMediaHeaders, selectExamContent };
