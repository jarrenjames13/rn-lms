import { buildUrlWithParams } from "../utils/fetcher";

describe("buildUrlWithParams", () => {
  it("returns the url unchanged when no params are provided", () => {
    expect(buildUrlWithParams("/courses")).toBe("/courses");
  });

  it("appends query string when params are provided", () => {
    const result = buildUrlWithParams("/courses", { page: 1, limit: 10 });
    expect(result).toBe("/courses?page=1&limit=10");
  });

  it("handles boolean params", () => {
    const result = buildUrlWithParams("/courses", { active: true });
    expect(result).toBe("/courses?active=true");
  });

  it("handles string params", () => {
    const result = buildUrlWithParams("/courses", { search: "math" });
    expect(result).toBe("/courses?search=math");
  });
});
