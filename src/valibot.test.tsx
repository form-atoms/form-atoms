import { act as domAct, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { custom, minLength, parseAsync, pipe, regex, string } from "valibot";

import { createValibotValidator } from "./valibot";

import { fieldAtom, useInputField } from ".";
const valibotValidate = createValibotValidator(parseAsync);

describe("valibotValidate()", () => {
  it("should validate without a config", async () => {
    const nameAtom = fieldAtom({
      value: "",
      validate: valibotValidate(pipe(string(), minLength(3, "3 plz"))),
    });

    const field = renderHook(() => useInputField(nameAtom));

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
      validate: valibotValidate(
        pipe(string(), minLength(3, "3 plz"), regex(/foo/, "must match foo")),
      ),
    });

    const field = renderHook(() => useInputField(nameAtom));

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
      validate: valibotValidate(
        pipe(string(), minLength(3, "3 plz"), regex(/foo/, "must match foo")),
        {
          on: "touch",
          when: "touched",
        },
      ).or({
        on: "change",
      }),
    });

    const field = renderHook(() => useInputField(nameAtom));

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

  it("should use custom error formatting", async () => {
    const nameAtom = fieldAtom({
      value: "",
      validate: valibotValidate(
        pipe(string(), minLength(3, "3 plz"), regex(/foo/, "must match foo")),
        {
          formatError: (err) =>
            err.issues.map((e) =>
              JSON.stringify({ code: e.type, message: e.message }),
            ),
        },
      ),
    });

    const field = renderHook(() => useInputField(nameAtom));

    domAct(() => {
      field.result.current.actions.validate();
    });

    await domAct(() => Promise.resolve());
    expect(field.result.current.state.validateStatus).toBe("invalid");
    expect(field.result.current.state.errors).toEqual([
      JSON.stringify({ code: "min_length", message: "3 plz" }),
      JSON.stringify({ code: "regex", message: "must match foo" }),
    ]);
  });

  it("should validate 'on' a given event", async () => {
    const nameAtom = fieldAtom({
      value: "",
      validate: valibotValidate(pipe(string(), minLength(3, "3 plz")), {
        on: "change",
      }),
    });

    const field = renderHook(() => useInputField(nameAtom));

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
      validate: valibotValidate(pipe(string(), minLength(3, "3 plz")), {
        on: "change",
        when: "dirty",
      }),
    });

    const field = renderHook(() => useInputField(nameAtom));

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
      validate: valibotValidate(pipe(string(), minLength(3, "3 plz")), {
        on: "change",
        when: "touched",
      }),
    });

    const field = renderHook(() => useInputField(nameAtom));

    domAct(() => {
      field.result.current.actions.setTouched(true);
    });

    await domAct(() => Promise.resolve());

    domAct(() => {
      field.result.current.actions.setValue("ab");
    });

    await domAct(() => Promise.resolve());
    expect(field.result.current.state.validateStatus).toBe("invalid");
    expect(field.result.current.state.errors).toEqual(["3 plz"]);
  });

  it("should validate multiple conditions", async () => {
    const nameAtom = fieldAtom({
      value: "",
      validate: valibotValidate(pipe(string(), minLength(3, "3 plz"))).or({
        on: "change",
        when: "dirty",
      }),
    });

    const field = renderHook(() => useInputField(nameAtom));

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
      validate: valibotValidate(() => pipe(string(), minLength(3, "3 plz"))),
    });

    const field = renderHook(() => useInputField(nameAtom));

    domAct(() => {
      field.result.current.actions.validate();
    });

    await domAct(() => Promise.resolve());
    expect(field.result.current.state.validateStatus).toBe("invalid");
    expect(field.result.current.state.errors).toEqual(["3 plz"]);
  });

  it("should throw for unexpected errors", async () => {
    await expect(async () => {
      await valibotValidate(
        pipe(
          string(),
          custom(() => {
            throw new Error("foo");
          }),
        ),
        // @ts-expect-error
      )({ value: "foo", event: "user" });
    }).rejects.toThrow();
  });
});
