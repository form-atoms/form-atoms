import { describe, it, expectTypeOf } from "vitest";
import {
  formAtom,
  fieldAtom,
  type FieldAtom,
  type FormValues,
  type FormErrors,
} from ".";

describe("FormValues", () => {
  it("works with array", () => {
    const hobbiesFormAtom = formAtom<{
      hobbies: Array<{
        name: FieldAtom<string>;
      }>;
    }>({
      hobbies: [{ name: fieldAtom({ value: "jumping rope" }) }],
    });

    expectTypeOf<FormValues<typeof hobbiesFormAtom>>().toEqualTypeOf<{
      hobbies: { name: string }[];
    }>();
  });
});

describe("FormErrors", () => {
  it("works with array", () => {
    const hobbiesFormAtom = formAtom<{
      hobbies: Array<{
        name: FieldAtom<string>;
      }>;
    }>({
      hobbies: [{ name: fieldAtom({ value: "jumping rope" }) }],
    });

    expectTypeOf<FormErrors<typeof hobbiesFormAtom>>().toEqualTypeOf<{
      hobbies: { name: string[] }[];
    }>();
  });
});
