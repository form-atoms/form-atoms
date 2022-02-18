import { setPath } from "./utils";

describe("setPath()", () => {
  it("should set a shallow value", () => {
    const obj = {};
    setPath(obj, ["a"], "hello");
    expect(obj).toEqual({
      a: "hello",
    });
  });

  it("should set a deep value", () => {
    const obj = {};
    setPath(obj, ["a", "b", "c"], "hello");
    expect(obj).toEqual({
      a: { b: { c: "hello" } },
    });
    setPath(obj, ["a", "b", "c"], "hello");
    expect(obj).toBe(obj);
  });

  it("should set an existing deep value", () => {
    const obj = { a: { b: { d: "world" } } };
    setPath(obj, ["a", "b", "c"], "hello");
    expect(obj).toEqual({
      a: { b: { c: "hello", d: "world" } },
    });
    setPath(obj, ["a", "b", "c"], "hello");
    expect(obj).toBe(obj);
    setPath(obj, ["a", "b", "c"], "hello");
    expect(obj.a.b).toBe(obj.a.b);
  });

  it("should set a deep array value", () => {
    const obj = {};
    setPath(obj, ["a", "b", "0"], "hello");
    expect(obj).toEqual({
      a: { b: ["hello"] },
    });
  });

  it("should set a deep existing array value", () => {
    const obj = { a: { b: [0] } };
    setPath(obj, ["a", "b", "1"], 1);
    expect(obj).toEqual({
      a: { b: [0, 1] },
    });
    setPath(obj, ["a", "b", "1"], 1);
    expect(obj.a.b).toBe(obj.a.b);
  });
});
