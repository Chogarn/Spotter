import { describe, expect, it } from "vitest";

import { tituloDia } from "./format";

describe("tituloDia", () => {
  it("saca la letra suelta del final", () => {
    expect(tituloDia("Cardio A")).toBe("Cardio");
    expect(tituloDia("Torso B")).toBe("Torso");
  });

  it("deja igual un título sin letra al final", () => {
    expect(tituloDia("Torso")).toBe("Torso");
    expect(tituloDia("Empuje")).toBe("Empuje");
  });

  it("no toca una letra que forma parte de una palabra", () => {
    expect(tituloDia("Pierna completa")).toBe("Pierna completa");
  });
});
