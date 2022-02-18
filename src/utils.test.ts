import { deletePath, setPath } from "./utils";

describe("setPath()", () => {
  it("should set a shallow value", () => {
    const obj = {};
    expect(setPath(obj, ["a"], "hello")).toEqual({
      a: "hello",
    });
  });

  it("should set a deep value", () => {
    const obj = {};
    expect(setPath(obj, ["a", "b", "c"], "hello")).toEqual({
      a: { b: { c: "hello" } },
    });
    expect(setPath(obj, ["a", "b", "c"], "hello")).toBe(obj);
  });

  it("should set an existing deep value", () => {
    const obj = { a: { b: { d: "world" } } };
    expect(setPath(obj, ["a", "b", "c"], "hello")).toEqual({
      a: { b: { c: "hello", d: "world" } },
    });
    expect(setPath(obj, ["a", "b", "c"], "hello")).toBe(obj);
    // @ts-expect-error
    expect(setPath(obj, ["a", "b", "c"], "hello").a.b).toBe(obj.a.b);
  });

  it("should set a deep array value", () => {
    expect(setPath({}, ["a", "b", "0"], "hello")).toEqual({
      a: { b: ["hello"] },
    });
  });

  it("should set a deep existing array value", () => {
    const obj = { a: { b: [0] } };
    expect(setPath(obj, ["a", "b", "1"], 1)).toEqual({
      a: { b: [0, 1] },
    });
    // @ts-expect-error
    expect(setPath(obj, ["a", "b", "1"], 1).a.b).toBe(obj.a.b);
  });

  it("should set a shallow value immutably", () => {
    const obj = {};
    expect(setPath(obj, ["a"], "hello", { immutable: true })).toEqual({
      a: "hello",
    });
    expect(setPath(obj, ["a"], "hello", { immutable: true })).not.toBe(obj);
  });

  it("should set a deep value immutably", () => {
    const obj = { a: { b: { c: "hello" } } };
    const out = setPath<any>({}, ["a", "b", "c"], "world", { immutable: true });
    expect(out.a.b.c).toEqual("world");
    expect(out.a).not.toEqual(obj.a);
    expect(out.a.b).not.toEqual(obj.a.b);
  });

  it("should set an existing deep value immutably", () => {
    const obj = { a: { b: { d: "world" } } };
    expect(
      setPath(obj, ["a", "b", "c"], "hello", {
        immutable: true,
      })
    ).toEqual({
      a: { b: { c: "hello", d: "world" } },
    });
    expect(
      // @ts-expect-error
      setPath(obj, ["a", "b", "c"], "hello", { immutable: true }).a.b
    ).not.toBe(obj.a.b);
  });

  it("should set a deep array value immutably", () => {
    expect(setPath({}, ["a", "b", "0"], "hello", { immutable: true })).toEqual({
      a: { b: ["hello"] },
    });
  });

  it("should set a deep existing array value immutably", () => {
    const obj = { a: { b: [0] } };
    expect(setPath(obj, ["a", "b", "1"], 1, { immutable: true })).toEqual({
      a: { b: [0, 1] },
    });
    // @ts-expect-error
    expect(setPath(obj, ["a", "b", "1"], 1, { immutable: true }).a.b).not.toBe(
      obj.a.b
    );
  });

  it("should set a deep existing array value immutably 2", () => {
    expect(
      setPath({ a: { b: [0, 2] } }, ["a", "b", "0"], 3, { immutable: true })
    ).toEqual({
      a: { b: [3, 2] },
    });
  });
});

describe("deletePath()", () => {
  it("should delete a deep value", () => {
    expect(deletePath({ a: { b: { c: "d" } } }, ["a", "b", "c"])).toEqual({
      a: { b: {} },
    });
  });

  it("should delete a deep value immutably", () => {
    const input = { a: { b: { c: "d" } } };
    const output = deletePath(input, ["a", "b", "c"], { immutable: true });
    expect(output).toEqual({ a: { b: {} } });
    expect(input).not.toBe(output);
    // @ts-expect-error
    expect(input.a).not.toBe(output.a);
    // @ts-expect-error
    expect(input.a.b).not.toBe(output.a.b);
  });

  it("should delete a shallow value", () => {
    expect(deletePath({ a: { b: { c: "d" } } }, ["a"])).toEqual({});
  });

  it("should delete a shallow value immutably", () => {
    const input = { a: { b: { c: "d" } } };
    const output = deletePath(input, ["a"], { immutable: true });
    expect(output).toEqual({});
    expect(input).not.toBe(output);
  });

  it("should delete a deep array value", () => {
    expect(deletePath({ a: { b: [0, 1] } }, ["a", "b", "1"])).toEqual({
      a: { b: [0] },
    });
  });

  it("should delete a deep array value immutably", () => {
    const input = { a: { b: [0, 1] } };
    const output = deletePath(input, ["a", "b", "1"], { immutable: true });
    expect(output).toEqual({ a: { b: [0] } });
    expect(input).not.toBe(output);
    // @ts-expect-error
    expect(input.a).not.toBe(output.a);
    // @ts-expect-error
    expect(input.a.b).not.toBe(output.a.b);
  });
});
