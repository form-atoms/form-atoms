import { render, screen } from "@testing-library/react";
import { act as domAct, renderHook } from "@testing-library/react-hooks/dom";
import userEvent from "@testing-library/user-event";
import { Provider } from "jotai";
import React from "react";
import type { FieldAtom } from ".";
import {
  fieldAtom,
  formAtom,
  useFieldAtom,
  useFieldAtomErrors,
  useFieldAtomInitialValue,
  useFieldAtomValue,
  useFormAtom,
  useFormAtomActions,
  useFormAtomErrors,
  useFormAtomState,
  useFormAtomStatus,
  useFormAtomSubmit,
  useFormAtomValues,
} from ".";

describe("useFieldAtom()", () => {
  it("should add default props", () => {
    const firstNameAtom = fieldAtom({
      name: "firstName",
      value: "test",
    });
    const TextField = createTextField(firstNameAtom);

    render(
      <Provider>
        <TextField />
      </Provider>
    );

    expect(screen.getByRole("textbox")).toHaveAttribute("name", "firstName");
    expect(screen.getByRole("textbox")).toHaveAttribute(
      "aria-invalid",
      "false"
    );
    expect(screen.getByRole("textbox")).toHaveAttribute("value", "test");
  });

  it("should add add a change handler", () => {
    const firstNameAtom = fieldAtom({
      name: "firstName",
      value: "test",
    });
    const TextField = createTextField(firstNameAtom);
    render(
      <Provider>
        <TextField />
      </Provider>
    );

    const textbox = screen.getByRole("textbox");
    userEvent.type(textbox, "abc");
    expect(screen.getByRole("textbox")).toHaveValue("testabc");
  });

  it("should be dirty", () => {
    const firstNameAtom = fieldAtom({
      name: "firstName",
      value: "test",
    });
    const { result } = renderHook(() => useFieldAtom(firstNameAtom));

    expect(result.current.state.dirty).toBeFalsy();

    domAct(() => {
      result.current.actions.setValue("abc");
    });

    expect(result.current.state.dirty).toBeTruthy();

    domAct(() => {
      result.current.actions.setValue("test");
    });

    expect(result.current.state.dirty).toBeFalsy();
  });

  it("should be touched on blur", () => {
    const firstNameAtom = fieldAtom({
      name: "firstName",
      value: "test",
    });
    const { result } = renderHook(() => useFieldAtom(firstNameAtom));

    expect(result.current.state.touched).toBeFalsy();

    domAct(() => {
      result.current.props.onBlur({} as any);
    });

    expect(result.current.state.touched).toBeTruthy();
  });

  it("should call validate on blur", () => {
    const atomConfig = {
      name: "firstName",
      value: "test",
      validate: jest.fn(() => {
        return ["error"];
      }),
    };
    const firstNameAtom = fieldAtom(atomConfig);
    const { result } = renderHook(() => useFieldAtom(firstNameAtom));
    domAct(() => {
      result.current.props.onBlur({} as any);
    });

    expect(atomConfig.validate).toHaveBeenCalledWith(
      expect.objectContaining({ event: "blur" })
    );
  });

  it("should call validate on change", () => {
    const atomConfig = {
      name: "firstName",
      value: "test",
      validate: jest.fn(() => {
        return ["error"];
      }),
    };
    const firstNameAtom = fieldAtom(atomConfig);
    const { result } = renderHook(() => useFieldAtom(firstNameAtom));
    domAct(() => {
      result.current.props.onChange({ target: { value: "test" } } as any);
    });

    expect(atomConfig.validate).toHaveBeenCalledWith(
      expect.objectContaining({ event: "change" })
    );
  });

  it("should have an aria-invalid prop when validation fails", () => {
    const firstNameAtom = fieldAtom({
      name: "firstName",
      value: "test",
      validate() {
        return ["error"];
      },
    });
    const { result } = renderHook(() => useFieldAtom(firstNameAtom));

    expect(result.current.props["aria-invalid"]).toBeFalsy();

    domAct(() => {
      result.current.props.onBlur({} as any);
    });

    expect(result.current.props["aria-invalid"]).toBeTruthy();
  });

  it("should have a errors when validation fails", () => {
    const firstNameAtom = fieldAtom({
      name: "firstName",
      value: "test",
      validate() {
        return ["error"];
      },
    });
    const { result } = renderHook(() => useFieldAtom(firstNameAtom));

    expect(result.current.state.errors).toEqual([]);

    domAct(() => {
      result.current.props.onBlur({} as any);
    });

    expect(result.current.state.errors).toEqual(["error"]);
  });

  it("should set touched", () => {
    const firstNameAtom = fieldAtom({
      name: "firstName",
      value: "test",
    });
    const { result } = renderHook(() => useFieldAtom(firstNameAtom));

    expect(result.current.state.touched).toBeFalsy();

    domAct(() => {
      result.current.actions.setTouched(true);
    });

    expect(result.current.state.touched).toBeTruthy();
  });

  it("should validate when setTouched is called w/ 'true'", () => {
    const atomConfig = {
      name: "firstName",
      value: "test",
      validate: jest.fn(() => {
        return ["error"];
      }),
    };
    const firstNameAtom = fieldAtom(atomConfig);
    const { result } = renderHook(() => useFieldAtom(firstNameAtom));

    expect(result.current.state.errors).toEqual([]);

    domAct(() => {
      result.current.actions.setTouched(true);
    });

    expect(result.current.state.errors).toEqual(["error"]);
    expect(atomConfig.validate).toHaveBeenCalledWith(
      expect.objectContaining({
        value: "test",
        event: "touch",
        dirty: false,
        touched: true,
        get: expect.any(Function),
      })
    );
  });

  it("should not validate when setTouched is called w/ 'false'", () => {
    const atomConfig = {
      name: "firstName",
      value: "test",
      validate: jest.fn(() => {
        return ["error"];
      }),
    };
    const firstNameAtom = fieldAtom(atomConfig);
    const { result } = renderHook(() => useFieldAtom(firstNameAtom));

    expect(result.current.state.errors).toEqual([]);

    domAct(() => {
      result.current.actions.setTouched(false);
    });

    expect(result.current.state.errors).toEqual([]);
    expect(atomConfig.validate).not.toHaveBeenCalledWith();
  });

  it("should validate when validate is called", () => {
    const atomConfig = {
      name: "firstName",
      value: "test",
      validate: jest.fn(() => {
        return ["error"];
      }),
    };
    const firstNameAtom = fieldAtom(atomConfig);
    const { result } = renderHook(() => useFieldAtom(firstNameAtom));

    expect(result.current.state.errors).toEqual([]);

    domAct(() => {
      result.current.actions.validate();
    });

    expect(result.current.state.errors).toEqual(["error"]);
    expect(atomConfig.validate).toHaveBeenCalledWith(
      expect.objectContaining({
        value: "test",
        event: "user",
        dirty: false,
        // validate() force touches
        touched: true,
        get: expect.any(Function),
      })
    );
  });

  it("should validate when setValue is called", () => {
    const atomConfig = {
      name: "firstName",
      value: "test",
      validate: jest.fn(() => {
        return ["error"];
      }),
    };
    const firstNameAtom = fieldAtom(atomConfig);
    const { result } = renderHook(() => useFieldAtom(firstNameAtom));

    expect(result.current.state.errors).toEqual([]);

    domAct(() => {
      result.current.actions.setValue("abc");
    });

    expect(result.current.state.errors).toEqual(["error"]);
    expect(atomConfig.validate).toHaveBeenCalledWith(
      expect.objectContaining({
        value: "abc",
        event: "change",
        dirty: true,
        // has not been touched yet
        touched: false,
        get: expect.any(Function),
      })
    );
  });

  it("should focus ref when focus is invoked", () => {
    const firstNameAtom = fieldAtom({
      name: "firstName",
      value: "test",
    });
    const { result } = renderHook(() => useFieldAtom(firstNameAtom));
    const handleFocus = jest.fn();

    domAct(() => {
      result.current.props.ref({ focus: handleFocus } as any);
    });

    domAct(() => {
      result.current.actions.focus();
    });

    expect(handleFocus).toHaveBeenCalledTimes(1);
  });

  it("should reset the atom when reset is called", () => {
    const firstNameAtom = fieldAtom({
      name: "firstName",
      value: "test",
      validate() {
        return ["error"];
      },
    });
    const { result } = renderHook(() => useFieldAtom(firstNameAtom));

    domAct(() => {
      result.current.actions.setValue("abc");
      result.current.actions.setTouched(true);
      result.current.actions.validate();
    });

    expect(result.current.state.value).toBe("abc");
    expect(result.current.state.touched).toBeTruthy();
    expect(result.current.state.errors).toEqual(["error"]);
    expect(result.current.state.validateStatus).toEqual("invalid");

    domAct(() => {
      result.current.actions.reset();
    });

    expect(result.current.state.value).toBe("test");
    expect(result.current.state.touched).toBeFalsy();
    expect(result.current.state.errors).toEqual([]);
    expect(result.current.state.validateStatus).toEqual("valid");
  });

  it("should validate asynchronously", async () => {
    const firstNameAtom = fieldAtom({
      name: "firstName",
      value: "test",
      validate() {
        return Promise.resolve(["error"]);
      },
    });
    const { result } = renderHook(() => useFieldAtom(firstNameAtom));

    domAct(() => {
      result.current.actions.validate();
    });

    await domAct(() => Promise.resolve());
    expect(result.current.state.errors).toEqual(["error"]);
  });

  it("should set validate status to 'validating' when asynchronous", async () => {
    const firstNameAtom = fieldAtom({
      name: "firstName",
      value: "test",
      validate() {
        return Promise.resolve(["error"]);
      },
    });
    const { result } = renderHook(() => useFieldAtom(firstNameAtom));

    domAct(() => {
      result.current.actions.validate();
    });

    expect(result.current.state.validateStatus).toEqual("validating");
    await domAct(() => Promise.resolve());
    expect(result.current.state.errors).toEqual(["error"]);
    expect(result.current.state.validateStatus).toEqual("invalid");
  });

  it("should always resolve async validation with the latest invocation data", async () => {
    const firstNameAtom = fieldAtom({
      name: "firstName",
      value: 100,
      validate({ value }) {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve([`${value}-error`]);
          }, value);
        });
      },
    });
    const { result } = renderHook(() => useFieldAtom(firstNameAtom));

    domAct(() => {
      result.current.actions.validate();
    });

    domAct(() => {
      result.current.actions.setValue(50);
    });

    jest.advanceTimersByTime(100);
    await domAct(() => Promise.resolve());
    expect(result.current.state.errors).toEqual(["50-error"]);
  });
});

describe("useFieldAtomInitialValue()", () => {
  it("should set an initial value", () => {
    const firstNameAtom = fieldAtom({
      value: "test",
    });
    const field = renderHook(() => useFieldAtom(firstNameAtom));
    renderHook(() => useFieldAtomInitialValue(firstNameAtom, "jared"));
    expect(field.result.current.props.value).toBe("jared");
  });

  it("should not set an initial value if initial value is undefined", () => {
    const firstNameAtom = fieldAtom({
      value: "test",
    });
    const field = renderHook(() => useFieldAtom(firstNameAtom));
    renderHook(() => useFieldAtomInitialValue(firstNameAtom, undefined));
    expect(field.result.current.props.value).toBe("test");
  });
});

describe("useFieldAtomValue()", () => {
  it("should return the value of the atom", () => {
    const firstNameAtom = fieldAtom({
      name: "firstName",
      value: "test",
    });
    const { result } = renderHook(() => useFieldAtomValue(firstNameAtom));

    expect(result.current).toBe("test");
  });
});

describe("useFieldAtomErrors", () => {
  it("should return the errors of the atom", () => {
    const firstNameAtom = fieldAtom({
      name: "firstName",
      value: "test",
      validate() {
        return ["error"];
      },
    });
    const atom = renderHook(() => useFieldAtom(firstNameAtom));
    const { result } = renderHook(() => useFieldAtomErrors(firstNameAtom));
    domAct(() => {
      atom.result.current.actions.validate();
    });
    expect(result.current).toEqual(["error"]);
  });
});

describe("useFormAtom()", () => {
  it("should create the form atom", () => {
    const atom = formAtom({
      name: {
        first: fieldAtom({
          name: "firstName",
          value: "jared",
        }),
        last: fieldAtom({
          name: "lastName",
          value: "lunde",
        }),
      },
      hobbies: [
        fieldAtom({
          name: "hobbies.0",
          value: "test",
        }),
      ],
    });
    const { result } = renderHook(() => useFormAtom(atom));
    expect(result.current.fieldAtoms.name.first).not.toBeUndefined();
    expect(result.current.fieldAtoms.name.last).not.toBeUndefined();
    expect(result.current.fieldAtoms.hobbies[0]).not.toBeUndefined();
  });

  it("should reset fields", () => {
    const config = {
      name: fieldAtom({
        value: "lunde",
      }),
      hobbies: [
        fieldAtom({
          name: "hobbies.0",
          value: "test",
        }),
      ],
    };
    const atom = formAtom(config);
    const { result } = renderHook(() => useFormAtom(atom));
    const form = renderHook(() => useFormAtomState(atom));
    const nameField = renderHook(() => useFieldAtom(config.name));
    const hobbiesField = renderHook(() => useFieldAtom(config.hobbies[0]));

    domAct(() => {
      nameField.result.current.actions.setValue("jared");
      nameField.result.current.actions.setTouched(true);
      nameField.result.current.actions.setErrors(["abc"]);
      hobbiesField.result.current.actions.setValue("test2");
      hobbiesField.result.current.actions.setTouched(true);
      hobbiesField.result.current.actions.setErrors(["def"]);
      result.current.submit(() => {});
    });

    domAct(() => {
      result.current.reset();
    });

    expect(nameField.result.current.state.value).toBe("lunde");
    expect(nameField.result.current.state.touched).toBe(false);
    expect(nameField.result.current.state.errors).toEqual([]);
    expect(hobbiesField.result.current.state.value).toBe("test");
    expect(hobbiesField.result.current.state.touched).toBe(false);
    expect(hobbiesField.result.current.state.errors).toEqual([]);
    expect(form.result.current.submitStatus).toBe("idle");
  });

  it("should prevent stale validations on reset", async () => {
    const config = {
      name: fieldAtom({
        value: "lunde",
        validate() {
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve(["abc"]);
            }, 100);
          });
        },
      }),
      hobbies: [
        fieldAtom({
          name: "hobbies.0",
          value: "test",
        }),
      ],
    };
    const atom = formAtom(config);
    const { result } = renderHook(() => useFormAtom(atom));
    const form = renderHook(() => useFormAtomState(atom));

    domAct(() => {
      result.current.validate();
    });

    expect(form.result.current.validateStatus).toBe("validating");

    domAct(() => {
      result.current.reset();
    });

    await domAct(() => Promise.resolve());
    expect(form.result.current.validateStatus).toBe("valid");
  });

  it("should prevent stale submit status on reset", async () => {
    const config = {
      name: fieldAtom({
        value: "lunde",
      }),
      hobbies: [
        fieldAtom({
          name: "hobbies.0",
          value: "test",
        }),
      ],
    };
    const atom = formAtom(config);
    const { result } = renderHook(() => useFormAtom(atom));
    const form = renderHook(() => useFormAtomState(atom));

    domAct(() => {
      result.current.submit(async () => {})();
    });

    domAct(() => {
      result.current.reset();
    });

    await domAct(() => Promise.resolve());
    expect(form.result.current.submitStatus).toBe("idle");
  });

  it("should async submit form with values", async () => {
    const config = {
      name: fieldAtom({
        value: "lunde",
      }),
      hobbies: [
        fieldAtom({
          name: "hobbies.0",
          value: "test",
        }),
      ],
    };
    const atom = formAtom(config);
    const { result } = renderHook(() => useFormAtom(atom));
    const form = renderHook(() => useFormAtomState(atom));
    const handleSubmit = jest.fn(async () => {});
    domAct(() => {
      result.current.submit(handleSubmit)();
    });

    await domAct(() => Promise.resolve());
    expect(form.result.current.submitStatus).toBe("submitted");
    expect(handleSubmit).toHaveBeenCalledWith({
      name: "lunde",
      hobbies: ["test"],
    });
  });

  it("should sync submit form with values", async () => {
    const config = {
      name: fieldAtom({
        value: "lunde",
      }),
      hobbies: [
        fieldAtom({
          name: "hobbies.0",
          value: "test",
        }),
      ],
    };
    const atom = formAtom(config);
    const { result } = renderHook(() => useFormAtom(atom));
    const form = renderHook(() => useFormAtomState(atom));
    const handleSubmit = jest.fn(() => {});
    domAct(() => {
      result.current.submit(handleSubmit)();
    });

    await domAct(() => Promise.resolve());
    expect(form.result.current.submitStatus).toBe("submitted");
    expect(handleSubmit).toHaveBeenCalledWith({
      name: "lunde",
      hobbies: ["test"],
    });
  });

  it("should prevent submit when form state is invalid", async () => {
    const hobbyConfig = {
      name: "hobbies.0",
      value: "test",
      validate: jest.fn(),
    };
    const config = {
      name: fieldAtom({
        value: "lunde",
        validate() {
          return ["error"];
        },
      }),
      hobbies: [fieldAtom(hobbyConfig)],
    };
    const atom = formAtom(config);
    const { result } = renderHook(() => useFormAtom(atom));
    const form = renderHook(() => useFormAtomState(atom));
    const handleSubmit = jest.fn(() => {});
    domAct(() => {
      result.current.submit(handleSubmit)();
    });

    await domAct(() => Promise.resolve());
    expect(form.result.current.submitStatus).toBe("idle");
    expect(hobbyConfig.validate).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "submit",
      })
    );
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it("should sync validate form", async () => {
    const config = {
      name: fieldAtom({
        value: "lunde",
      }),
      hobbies: [
        fieldAtom({
          name: "hobbies.0",
          value: "test",
          validate() {
            return ["abc"];
          },
        }),
      ],
    };
    const atom = formAtom(config);
    const { result } = renderHook(() => useFormAtom(atom));
    const form = renderHook(() => useFormAtomState(atom));

    domAct(() => {
      result.current.validate();
    });

    expect(form.result.current.validateStatus).toBe("invalid");
  });

  it("should async validate form", async () => {
    const config = {
      name: fieldAtom({
        value: "lunde",
        validate() {
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve(["abc"]);
            }, 100);
          });
        },
      }),
      hobbies: [
        fieldAtom({
          name: "hobbies.0",
          value: "test",
        }),
      ],
    };
    const atom = formAtom(config);
    const { result } = renderHook(() => useFormAtom(atom));
    const form = renderHook(() => useFormAtomState(atom));

    domAct(() => {
      result.current.validate();
    });

    expect(form.result.current.validateStatus).toBe("validating");

    jest.advanceTimersByTime(100);
    await domAct(() => Promise.resolve());
    expect(form.result.current.validateStatus).toBe("invalid");
  });

  it("should async validate valid form", async () => {
    const config = {
      name: fieldAtom({
        value: "lunde",
        validate() {
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve([]);
            }, 100);
          });
        },
      }),
      hobbies: [
        fieldAtom({
          name: "hobbies.0",
          value: "test",
        }),
      ],
    };
    const atom = formAtom(config);
    const { result } = renderHook(() => useFormAtom(atom));
    const form = renderHook(() => useFormAtomState(atom));

    domAct(() => {
      result.current.validate();
    });

    expect(form.result.current.validateStatus).toBe("validating");

    jest.advanceTimersByTime(100);
    await domAct(() => Promise.resolve());
    expect(form.result.current.validateStatus).toBe("valid");
  });

  it("should sync validate valid form", async () => {
    const config = {
      name: fieldAtom({
        value: "lunde",
        validate() {
          return [];
        },
      }),
      hobbies: [
        fieldAtom({
          name: "hobbies.0",
          value: "test",
          validate() {
            return [];
          },
        }),
      ],
    };
    const atom = formAtom(config);
    const { result } = renderHook(() => useFormAtom(atom));
    const form = renderHook(() => useFormAtomState(atom));

    domAct(() => {
      result.current.validate();
    });

    expect(form.result.current.validateStatus).toBe("valid");
  });

  it("should return the dirty state", async () => {
    const config = {
      name: fieldAtom({
        value: "lunde",
      }),
      hobbies: [
        fieldAtom({
          name: "hobbies.0",
          value: "test",
        }),
      ],
    };
    const atom = formAtom(config);
    const field = renderHook(() => useFieldAtom(config.name));
    const form = renderHook(() => useFormAtomState(atom));
    expect(form.result.current.dirty).toBe(false);

    domAct(() => {
      field.result.current.actions.setValue("jared");
    });

    expect(form.result.current.dirty).toBe(true);
  });

  it("should return the touched state", async () => {
    const config = {
      name: fieldAtom({
        value: "lunde",
      }),
      hobbies: [
        fieldAtom({
          value: "test",
          touched: true,
        }),
      ],
    };
    const atom = formAtom(config);
    const form = renderHook(() => useFormAtomState(atom));

    expect(form.result.current.touchedFields).toEqual({
      name: false,
      hobbies: [true],
    });
  });
});

describe("useFormAtomValues()", () => {
  it("should derive values from its fields", () => {
    const config = {
      name: {
        first: fieldAtom({
          name: "firstName",
          value: "jared",
        }),
        last: fieldAtom({
          name: "lastName",
          value: "lunde",
        }),
      },
      hobbies: [
        {
          name: fieldAtom({
            value: "testing",
          }),
        },
      ],
    };

    const atom = formAtom<{
      name: {
        first: FieldAtom<string>;
        last: FieldAtom<string>;
      };
      hobbies: {
        name: FieldAtom<string>;
      }[];
    }>(config);
    const { result } = renderHook(() => useFormAtomValues(atom));
    const field = renderHook(() => useFieldAtom(config.name.first));

    expect(result.current).toEqual({
      name: {
        first: "jared",
        last: "lunde",
      },
      hobbies: [
        {
          name: "testing",
        },
      ],
    });

    domAct(() => {
      field.result.current.actions.setValue("josh");
    });

    expect(result.current).toEqual({
      name: {
        first: "josh",
        last: "lunde",
      },
      hobbies: [{ name: "testing" }],
    });
  });
});

describe("useFormAtomErrors()", () => {
  it("should derive errors from its fields", () => {
    const config = {
      name: {
        first: fieldAtom({
          name: "firstName",
          value: "jared",
          validate() {
            return ["First name is required"];
          },
        }),
        last: fieldAtom({
          name: "lastName",
          value: "lunde",
        }),
      },
      hobbies: [
        fieldAtom({
          name: "hobbies.0",
          value: "testing",
        }),
      ],
    };
    const atom = formAtom<{
      name: {
        first: FieldAtom<string>;
        last: FieldAtom<string>;
      };
      hobbies: FieldAtom<string>[];
    }>(config);
    const field = renderHook(() => useFieldAtom(config.name.first));
    const errors = renderHook(() => useFormAtomErrors(atom));

    expect(errors.result.current).toEqual({
      name: {
        first: [],
        last: [],
      },
      hobbies: [[]],
    });

    domAct(() => {
      field.result.current.actions.validate();
    });

    expect(errors.result.current).toEqual({
      name: {
        first: ["First name is required"],
        last: [],
      },
      hobbies: [[]],
    });
  });

  it("should derive errors from its fields w/ undefined result", async () => {
    const config = {
      name: {
        first: fieldAtom({
          value: "jared",
          async validate() {},
        }),
        last: fieldAtom({
          value: "lunde",
          validate() {},
        }),
      },
    };
    const atom = formAtom<{
      name: {
        first: FieldAtom<string>;
      };
    }>(config);
    const form = renderHook(() => useFormAtom(atom));
    const errors = renderHook(() => useFormAtomErrors(atom));

    expect(errors.result.current).toEqual({
      name: {
        first: [],
        last: [],
      },
    });

    domAct(() => {
      form.result.current.validate();
    });

    await domAct(() => Promise.resolve());
    expect(errors.result.current).toEqual({
      name: {
        first: [],
        last: [],
      },
    });
  });
});

describe("useFormAtomActions()", () => {
  it("should return expected object", () => {
    const config = {
      name: fieldAtom({
        value: "jared",
      }),
      hobbies: [
        fieldAtom({
          value: "testing",
        }),
      ],
    };
    const atom = formAtom<{
      name: FieldAtom<string>;
      hobbies: FieldAtom<string>[];
    }>(config);
    const actions = renderHook(() => useFormAtomActions(atom));
    expect(actions.result.current).toEqual({
      updateFields: expect.any(Function),
      validate: expect.any(Function),
      reset: expect.any(Function),
      submit: expect.any(Function),
    });
  });

  it('should validate with "user" event', () => {
    const handleValidate = jest.fn();
    const config = {
      name: fieldAtom({
        value: "jared",
        validate: handleValidate,
      }),
    };
    const atom = formAtom<{ name: FieldAtom<string> }>(config);
    const actions = renderHook(() => useFormAtomActions(atom));

    domAct(() => {
      actions.result.current.validate();
    });

    expect(handleValidate).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "user",
      })
    );
  });

  it("should add new fields", () => {
    const config = {
      name: fieldAtom({
        value: "jared",
      }),
      hobbies: [
        fieldAtom({
          value: "testing",
        }),
      ],
    };
    const atom = formAtom<{
      name: FieldAtom<string>;
      hobbies: FieldAtom<string>[];
    }>(config);
    const actions = renderHook(() => useFormAtomActions(atom));
    const state = renderHook(() => useFormAtom(atom));

    domAct(() => {
      actions.result.current.updateFields((current) => {
        return {
          ...current,
          hobbies: [...current.hobbies, fieldAtom({ value: "testing2" })],
        };
      });
    });

    expect(state.result.current.fieldAtoms.hobbies.length).toBe(2);
  });

  it("should async submit form with values", async () => {
    const config = {
      name: fieldAtom({
        value: "lunde",
      }),
      hobbies: [
        fieldAtom({
          name: "hobbies.0",
          value: "test",
        }),
      ],
    };
    const atom = formAtom(config);
    const { result } = renderHook(() => useFormAtomActions(atom));
    const handleSubmit = jest.fn(async () => {});

    domAct(() => {
      result.current.submit(handleSubmit)();
    });

    await domAct(() => Promise.resolve());
    expect(handleSubmit).toHaveBeenCalledWith({
      name: "lunde",
      hobbies: ["test"],
    });
  });
});

describe("useFormAtomStatus()", () => {
  it("should return object containing submit and validate status", () => {
    const atom = formAtom({
      name: fieldAtom({
        value: "jared",
      }),
    });
    const status = renderHook(() => useFormAtomStatus(atom));

    expect(status.result.current).toEqual({
      submitStatus: "idle",
      validateStatus: "valid",
    });
  });
});

describe("useFormAtomSubmit()", () => {
  it("should submit the form", async () => {
    const handleSubmit = jest.fn(async () => {});
    const atom = formAtom({
      name: fieldAtom({
        value: "jared",
      }),
    });
    const { result } = renderHook(() => useFormAtomSubmit(atom));

    domAct(() => {
      result.current(handleSubmit)();
    });

    await domAct(() => Promise.resolve());
    expect(handleSubmit).toHaveBeenCalledWith({
      name: "jared",
    });
  });
});

function createTextField<Value extends string | number | readonly string[]>(
  fieldAtom: FieldAtom<Value>
) {
  return function Field() {
    const field = useFieldAtom(fieldAtom);
    return <input type="text" {...field.props} />;
  };
}
