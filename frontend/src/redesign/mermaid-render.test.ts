// @vitest-environment happy-dom
import { describe, it, expect, beforeAll } from "vitest"
import mermaid from "mermaid"

/**
 * Proves, in a real DOM, that the shape of diagram our backend emits actually
 * parses through mermaid (the step it runs before rendering) — not just "looks
 * like valid syntax" — and that a malformed diagram rejects, which is what
 * triggers our errorComponent seatbelt (code-text fallback, never a red box).
 */
beforeAll(() => {
  mermaid.initialize({ startOnLoad: false })
})

// The exact output produced by the Python builder for repo 828f7470.
const REAL_828f7470 = `graph LR
  n0["app/controllers"]
  n1["app/config"]
  n2["app/data"]
  n3["app/models"]
  n4["app/services"]
  n5["app/utils"]
  n6["app/views"]
  n7["tests"]
  n0 --> n1
  n0 --> n2
  n0 --> n3
  n0 --> n4
  n0 --> n5
  n4 --> n3
  n4 --> n5
  n5 --> n2
  n6 --> n0
  n6 --> n5
  n7 --> n0
  n7 --> n2`

describe("mermaid rendering of generated diagrams", () => {
  it("parses the real 828f7470 diagram", async () => {
    const result = await mermaid.parse(REAL_828f7470)
    expect(result).toBeTruthy()
  })

  it("parses labels with slashes/dots quoted (the sanitizer's job)", async () => {
    const d = 'graph LR\n  n0["app/services/sub.pkg"] --> n1["app/models"]'
    await expect(mermaid.parse(d)).resolves.toBeTruthy()
  })

  it("rejects a malformed diagram (so the errorComponent seatbelt fires)", async () => {
    await expect(mermaid.parse("graph LR\n  n0[ --> ")).rejects.toBeTruthy()
  })
})
