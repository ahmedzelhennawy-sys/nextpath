import { describe, expect, it } from "vitest";

import {
  APPLICATION_TRANSITIONS,
  canTransitionApplication,
  APPLICATION_STATUSES
} from "./applications";

// SECTION: State machine tests
describe("applications state machine", () => {
  it("uses the LIVE six-state enum", () => {
    expect(APPLICATION_STATUSES).toEqual([
      "draft",
      "ready",
      "submitted",
      "in_review",
      "accepted",
      "rejected"
    ]);
  });

  it("pinned transition table", () => {
    expect(APPLICATION_TRANSITIONS).toEqual({
      draft: ["ready"],
      ready: ["submitted", "draft"],
      submitted: ["in_review", "ready"],
      in_review: ["accepted", "rejected"],
      accepted: [],
      rejected: []
    });
  });

  it("allows the forward-only happy path", () => {
    expect(canTransitionApplication("draft", "ready")).toBe(true);
    expect(canTransitionApplication("ready", "submitted")).toBe(true);
    expect(canTransitionApplication("submitted", "in_review")).toBe(true);
    expect(canTransitionApplication("in_review", "accepted")).toBe(true);
    expect(canTransitionApplication("in_review", "rejected")).toBe(true);
  });

  it("allows the 'submitted -> ready' fallback when a missing document is found", () => {
    expect(canTransitionApplication("submitted", "ready")).toBe(true);
  });

  it("rejects transitions from terminal states", () => {
    expect(canTransitionApplication("accepted", "rejected")).toBe(false);
    expect(canTransitionApplication("accepted", "draft")).toBe(false);
    expect(canTransitionApplication("rejected", "submitted")).toBe(false);
  });

  it("rejects skipping the queue (e.g. draft -> submitted)", () => {
    expect(canTransitionApplication("draft", "submitted")).toBe(false);
    expect(canTransitionApplication("draft", "accepted")).toBe(false);
    expect(canTransitionApplication("ready", "accepted")).toBe(false);
  });
});
// End of section: every transition the live workflow allows is
// pinned, and every illegal shortcut is rejected.