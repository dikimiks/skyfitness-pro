import { afterEach, describe, expect, it, vi } from "vitest";
import { useApi } from "../composables/useApi";

const jsonResponse = (value: unknown) =>
  new Response(JSON.stringify(value), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

describe("useApi", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not send application/json content type with requests", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({}))
      .mockResolvedValueOnce(jsonResponse({ token: "token" }))
      .mockResolvedValueOnce(jsonResponse({}))
      .mockResolvedValueOnce(jsonResponse({}));
    vi.stubGlobal("fetch", fetchMock);

    const api = useApi();
    await api.register("user@example.com", "password");
    await api.login("user@example.com", "password");
    await api.addCourse("course-id", "token");
    await api.updateProgress("course-id", "workout-id", [1], "token");

    for (const [, options] of fetchMock.mock.calls) {
      expect(new Headers(options?.headers).get("Content-Type")).not.toBe(
        "application/json",
      );
    }

    expect(
      new Headers(fetchMock.mock.calls[2][1]?.headers).get("Authorization"),
    ).toBe("Bearer token");
    expect(
      new Headers(fetchMock.mock.calls[3][1]?.headers).get("Authorization"),
    ).toBe("Bearer token");
  });

  it("reports the HTTP status when an API error has an empty body", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response("", { status: 500 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(useApi().getCourses()).rejects.toThrow(
      "Ошибка загрузки курсов (HTTP 500)",
    );
  });

  it("preserves an API error message when the response is JSON", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ message: "Каталог временно недоступен" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(useApi().getCourses()).rejects.toThrow(
      "Каталог временно недоступен",
    );
  });

  it("reads an API error from the error field", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ error: "Неверный запрос" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(useApi().getCourses()).rejects.toThrow("Неверный запрос");
  });
});
