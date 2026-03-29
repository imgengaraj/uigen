// @vitest-environment node
import { describe, test, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const mockCookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

import { createSession, getSession, deleteSession, verifySession } from "@/lib/auth";
import { NextRequest } from "next/server";
import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = Buffer.from("development-secret-key");

async function makeToken(payload: object, expiredInPast = false) {
  const exp = expiredInPast
    ? Math.floor(Date.now() / 1000) - 10
    : Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(exp)
    .setIssuedAt()
    .sign(JWT_SECRET);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createSession", () => {
  test("sets auth-token cookie with correct options", async () => {
    await createSession("user-1", "a@b.com");

    expect(mockCookieStore.set).toHaveBeenCalledOnce();
    const [name, , options] = mockCookieStore.set.mock.calls[0];
    expect(name).toBe("auth-token");
    expect(options.httpOnly).toBe(true);
    expect(options.sameSite).toBe("lax");
    expect(options.path).toBe("/");
  });

  test("cookie expires approximately 7 days from now", async () => {
    const before = Date.now();
    await createSession("user-1", "a@b.com");
    const after = Date.now();

    const { expires } = mockCookieStore.set.mock.calls[0][2];
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    expect(expires.getTime()).toBeGreaterThanOrEqual(before + sevenDays - 1000);
    expect(expires.getTime()).toBeLessThanOrEqual(after + sevenDays + 1000);
  });

  test("token contains correct userId and email", async () => {
    await createSession("user-1", "a@b.com");

    const token = mockCookieStore.set.mock.calls[0][1];
    const { payload } = await jwtVerify(token, JWT_SECRET);
    expect(payload.userId).toBe("user-1");
    expect(payload.email).toBe("a@b.com");
  });
});

describe("getSession", () => {
  test("returns null when no cookie is present", async () => {
    mockCookieStore.get.mockReturnValue(undefined);
    expect(await getSession()).toBeNull();
  });

  test("returns null for an invalid token", async () => {
    mockCookieStore.get.mockReturnValue({ value: "not-a-jwt" });
    expect(await getSession()).toBeNull();
  });

  test("returns session payload for a valid token", async () => {
    const token = await makeToken({ userId: "user-1", email: "a@b.com", expiresAt: new Date() });
    mockCookieStore.get.mockReturnValue({ value: token });

    const session = await getSession();
    expect(session?.userId).toBe("user-1");
    expect(session?.email).toBe("a@b.com");
  });

  test("returns null for an expired token", async () => {
    const token = await makeToken({ userId: "user-1", email: "a@b.com", expiresAt: new Date() }, true);
    await new Promise((r) => setTimeout(r, 5));
    mockCookieStore.get.mockReturnValue({ value: token });

    expect(await getSession()).toBeNull();
  });
});

describe("deleteSession", () => {
  test("deletes the auth-token cookie", async () => {
    await deleteSession();

    expect(mockCookieStore.delete).toHaveBeenCalledOnce();
    expect(mockCookieStore.delete).toHaveBeenCalledWith("auth-token");
  });
});

describe("verifySession", () => {
  function makeRequest(cookieValue?: string): NextRequest {
    const req = new NextRequest("http://localhost/");
    if (cookieValue) {
      Object.defineProperty(req, "cookies", {
        value: { get: () => ({ value: cookieValue }) },
      });
    } else {
      Object.defineProperty(req, "cookies", {
        value: { get: () => undefined },
      });
    }
    return req;
  }

  test("returns null when no cookie is present", async () => {
    expect(await verifySession(makeRequest())).toBeNull();
  });

  test("returns null for an invalid token", async () => {
    expect(await verifySession(makeRequest("not-a-jwt"))).toBeNull();
  });

  test("returns session payload for a valid token", async () => {
    const token = await makeToken({ userId: "user-1", email: "a@b.com", expiresAt: new Date() });
    const session = await verifySession(makeRequest(token));
    expect(session?.userId).toBe("user-1");
    expect(session?.email).toBe("a@b.com");
  });

  test("returns null for an expired token", async () => {
    const token = await makeToken({ userId: "user-1", email: "a@b.com", expiresAt: new Date() }, true);
    await new Promise((r) => setTimeout(r, 5));
    expect(await verifySession(makeRequest(token))).toBeNull();
  });
});
