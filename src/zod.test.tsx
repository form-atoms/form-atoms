import { act as domAct, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { z } from "zod";

import { zodValidate } from "./zod";

import { fieldAtom, useFieldAtom } from ".";

describe("zodValidate()", () => {
  it("should validate without a config", async () => {
    const nameAtom = fieldAtom({
      value: "",
      validate: zodValidate(z.string().min(3, "3 plz")),
    });

    const field = renderHook(() => useFieldAtom(nameAtom));

    domAct(() => {
      field.result.current.actions.validate();
    });

    await domAct(() => Promise.resolve());
    expect(field.result.current.state.validateStatus).toBe("invalid");
    expect(field.result.current.state.errors).toEqual(["3 plz"]);
  });

  it("should throw multiple errors", async () => {
    const nameAtom = fieldAtom({
      value: "",
      validate: zodValidate(
        z.string().min(3, "3 plz").regex(/foo/, "must match foo")
      ),
    });

    const field = renderHook(() => useFieldAtom(nameAtom));

    domAct(() => {
      field.result.current.actions.validate();
    });

    await domAct(() => Promise.resolve());
    expect(field.result.current.state.validateStatus).toBe("invalid");
    expect(field.result.current.state.errors).toEqual([
      "3 plz",
      "must match foo",
    ]);
  });

  it("should throw first error in chain", async () => {
    const nameAtom = fieldAtom({
      value: "",
      validate: zodValidate(
        z.string().min(3, "3 plz").regex(/foo/, "must match foo"),
        {
          on: "touch",
          failFast: true,
        }
      ).or({
        on: "change",
        ifDirty: true,
      }),
    });

    const field = renderHook(() => useFieldAtom(nameAtom));

    domAct(() => {
      field.result.current.actions.setTouched(true);
      field.result.current.actions.setValue("ab");
    });

    await domAct(() => Promise.resolve());
    expect(field.result.current.state.validateStatus).toBe("invalid");
    expect(field.result.current.state.errors).toEqual([
      "3 plz",
      "must match foo",
    ]);
  });

  it("should throw every error in chain", async () => {
    const nameAtom = fieldAtom({
      value: "",
      validate: zodValidate(
        z.string().min(3, "3 plz").regex(/foo/, "must match foo"),
        {
          on: "touch",
          failFast: false,
        }
      )
        .or({
          on: "change",
          ifDirty: true,
        })
        .or({
          on: "change",
        }),
    });

    const field = renderHook(() => useFieldAtom(nameAtom));

    domAct(() => {
      field.result.current.actions.setTouched(true);
    });

    domAct(() => {
      field.result.current.actions.setValue("ab");
    });

    await domAct(() => Promise.resolve());

    domAct(() => {
      field.result.current.actions.setValue("abc");
    });

    await domAct(() => Promise.resolve());
    expect(field.result.current.state.validateStatus).toBe("invalid");
    expect(field.result.current.state.errors).toEqual([
      "must match foo",
      "must match foo",
    ]);
  });

  it("should use custom error formatting", async () => {
    const nameAtom = fieldAtom({
      value: "",
      validate: zodValidate(
        z.string().min(3, "3 plz").regex(/foo/, "must match foo"),
        {
          formatError: (err) =>
            err.errors.map((e) =>
              JSON.stringify({ code: e.code, message: e.message })
            ),
          failFast: false,
        }
      ),
    });

    const field = renderHook(() => useFieldAtom(nameAtom));

    domAct(() => {
      field.result.current.actions.validate();
    });

    await domAct(() => Promise.resolve());
    expect(field.result.current.state.validateStatus).toBe("invalid");
    expect(field.result.current.state.errors).toEqual([
      JSON.stringify({ code: "too_small", message: "3 plz" }),
      JSON.stringify({ code: "invalid_string", message: "must match foo" }),
    ]);
  });

  it("should validate 'on' a given event", async () => {
    const nameAtom = fieldAtom({
      value: "",
      validate: zodValidate(z.string().min(3, "3 plz"), { on: "change" }),
    });

    const field = renderHook(() => useFieldAtom(nameAtom));

    domAct(() => {
      field.result.current.actions.validate();
    });

    await domAct(() => Promise.resolve());
    expect(field.result.current.state.validateStatus).toBe("valid");
    expect(field.result.current.state.errors).toEqual([]);

    domAct(() => {
      field.result.current.actions.setValue("f");
    });

    await domAct(() => Promise.resolve());
    expect(field.result.current.state.validateStatus).toBe("invalid");
    expect(field.result.current.state.errors).toEqual(["3 plz"]);
  });

  it("should validate only when dirty", async () => {
    const nameAtom = fieldAtom({
      value: "",
      validate: zodValidate(z.string().min(3, "3 plz"), {
        ifDirty: true,
      }),
    });

    const field = renderHook(() => useFieldAtom(nameAtom));

    domAct(() => {
      field.result.current.actions.validate();
    });

    await domAct(() => Promise.resolve());
    expect(field.result.current.state.validateStatus).toBe("valid");
    expect(field.result.current.state.errors).toEqual([]);

    domAct(() => {
      field.result.current.actions.setValue("f");
    });

    await domAct(() => Promise.resolve());
    expect(field.result.current.state.validateStatus).toBe("invalid");
    expect(field.result.current.state.errors).toEqual(["3 plz"]);
  });

  it("should validate only when touched", async () => {
    const nameAtom = fieldAtom({
      value: "",
      validate: zodValidate(z.string().min(3, "3 plz"), {
        ifTouched: true,
      }),
    });

    const field = renderHook(() => useFieldAtom(nameAtom));

    domAct(() => {
      field.result.current.actions.setTouched(true);
    });

    await domAct(() => Promise.resolve());
    expect(field.result.current.state.validateStatus).toBe("invalid");
    expect(field.result.current.state.errors).toEqual(["3 plz"]);
  });

  it("should validate multiple conditions", async () => {
    const nameAtom = fieldAtom({
      value: "",
      validate: zodValidate(z.string().min(3, "3 plz"), {
        on: "user",
      }).or({ on: "change", ifDirty: true }),
    });

    const field = renderHook(() => useFieldAtom(nameAtom));

    domAct(() => {
      field.result.current.actions.validate();
    });

    await domAct(() => Promise.resolve());
    expect(field.result.current.state.validateStatus).toBe("invalid");
    expect(field.result.current.state.errors).toEqual(["3 plz"]);

    domAct(() => {
      field.result.current.actions.setValue("foo bar");
    });

    await domAct(() => Promise.resolve());
    expect(field.result.current.state.validateStatus).toBe("valid");
    expect(field.result.current.state.errors).toEqual([]);

    domAct(() => {
      field.result.current.actions.setValue("fo");
    });

    await domAct(() => Promise.resolve());
    expect(field.result.current.state.validateStatus).toBe("invalid");
    expect(field.result.current.state.errors).toEqual(["3 plz"]);
  });

  it("should validate with jotai getter", async () => {
    const nameAtom = fieldAtom({
      value: "",
      validate: zodValidate(() => z.string().min(3, "3 plz")),
    });

    const field = renderHook(() => useFieldAtom(nameAtom));

    domAct(() => {
      field.result.current.actions.validate();
    });

    await domAct(() => Promise.resolve());
    expect(field.result.current.state.validateStatus).toBe("invalid");
    expect(field.result.current.state.errors).toEqual(["3 plz"]);
  });

  it("should throw for unexpected errors", async () => {
    await expect(async () => {
      await zodValidate(
        z.string().refine(() => {
          throw new Error("foo");
        })
        // @ts-expect-error
      )({ value: "foo" });
    }).rejects.toThrow();
  });
});
