import assert from "node:assert/strict";
import test from "node:test";
import { processSteps } from "../lib/site-data.ts";

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

test("each process step has a valid imageVariant", () => {
  for (const step of processSteps) {
    assert.ok(
      step.imageVariant === "photo" || step.imageVariant === "illustration",
      `${step.title} must have imageVariant photo or illustration`
    );
  }
});

test("the contract step uses the illustration variant", () => {
  const contract = processSteps.find((step) => step.title === "Oferta si contract");
  assert.ok(contract, "Oferta si contract step exists");
  assert.equal(contract?.imageVariant, "illustration");
});
