import assert from "node:assert/strict";
import test from "node:test";
import { processSteps, processStepThemes } from "../lib/site-data.ts";

test("each process step has an image asset under /portfolio/schite/", () => {
  assert.ok(processSteps.length >= 5);
  for (const step of processSteps) {
    assert.ok(
      typeof step.image === "string" && step.image.startsWith("/portfolio/schite/"),
      `${step.title} must have an image under /portfolio/schite/`
    );
  }
});

test("each process step has non-empty alt text", () => {
  for (const step of processSteps) {
    assert.ok(
      typeof step.imageAlt === "string" && step.imageAlt.trim().length > 0,
      `${step.title} must have non-empty imageAlt`
    );
  }
});

test("processStepThemes has the same length as processSteps", () => {
  assert.equal(processStepThemes.length, processSteps.length);
});

test("every theme defines background, foreground, and accent strings", () => {
  for (const [index, theme] of processStepThemes.entries()) {
    assert.equal(typeof theme.background, "string", `theme ${index} background`);
    assert.equal(typeof theme.foreground, "string", `theme ${index} foreground`);
    assert.equal(typeof theme.accent, "string", `theme ${index} accent`);
    assert.ok(theme.background.length > 0);
    assert.ok(theme.foreground.length > 0);
    assert.ok(theme.accent.length > 0);
  }
});
