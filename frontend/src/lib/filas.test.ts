import { describe, expect, it } from "vitest";

import { repartirEnFilas } from "./filas";

const lista = (n: number) => Array.from({ length: n }, (_, i) => i + 1);
const tamanos = (filas: number[][]) => filas.map((f) => f.length);

describe("repartirEnFilas", () => {
  it("no devuelve filas si no hay elementos", () => {
    expect(repartirEnFilas([])).toEqual([]);
  });

  it("hasta 7 elementos van en una sola fila", () => {
    expect(tamanos(repartirEnFilas(lista(1)))).toEqual([1]);
    expect(tamanos(repartirEnFilas(lista(7)))).toEqual([7]);
  });

  // El caso que vio el profesor: 8 discos dejaban 7 arriba y 1 solo abajo.
  it("8 elementos se reparten 4 y 4, no 7 y 1", () => {
    expect(tamanos(repartirEnFilas(lista(8)))).toEqual([4, 4]);
  });

  it("9 elementos se reparten 5 y 4", () => {
    expect(tamanos(repartirEnFilas(lista(9)))).toEqual([5, 4]);
  });

  it("conserva el orden y no pierde elementos", () => {
    expect(repartirEnFilas(lista(9)).flat()).toEqual(lista(9));
  });

  it("nunca deja una fila con un solo elemento (salvo si hay uno solo)", () => {
    for (let n = 2; n <= 30; n++) {
      const filas = repartirEnFilas(lista(n));
      expect(Math.min(...tamanos(filas)), `con ${n} elementos`).toBeGreaterThan(1);
    }
  });

  it("respeta un máximo distinto por fila", () => {
    expect(tamanos(repartirEnFilas(lista(5), 3))).toEqual([3, 2]);
  });
});
