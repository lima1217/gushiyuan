import { describe, expect, it } from "vitest";
import { createSiteAppIcon } from "@/lib/site-app-icon";

describe("createSiteAppIcon", () => {
  it("returns a PNG ImageResponse", async () => {
    const response = await createSiteAppIcon(192);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");
    const bytes = Buffer.from(await response.arrayBuffer());
    expect(bytes.subarray(0, 8)).toEqual(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    );
    expect(bytes.byteLength).toBeGreaterThan(1000);
  }, 15000);
});
