import "@testing-library/jest-dom/extend-expect";
import React from "react";

import { render, screen } from "@testing-library/react";
import { act as domAct, renderHook } from "@testing-library/react-hooks/dom";
import userEvent from "@testing-library/user-event";
import type { ExtractAtomValue } from "jotai";
import { Provider, createStore, useAtomValue } from "jotai";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { FieldAtom, UseForm } from ".";
import {
  Field,
  Form,
  InputField,
  SelectField,
  TextareaField,
  fieldAtom,
  formAtom,
  useFieldErrors,
  useFieldInitialValue,
  useFieldValue,
  useForm,
  useFormActions,
  useFormErrors,
  useFormState,
  useFormStatus,
  useFormSubmit,
  useFormValues,
  useInputField,
  useSelectField,
  useTextareaField,
} from ".";

vi.useFakeTimers();

afterEach(() => {
  vi.clearAllMocks();
  vi.clearAllTimers();
});

describe("<Field>", () => {
  it('should render "component" prop', () => {
    const atom = fieldAtom({ value: "test" });
    const field = renderHook(() => useInputField(atom));
    render(
      <Field
        atom={atom}
        component={(props) => {
          return <button onClick={() => props.actions.setValue("foo")} />;
        }}
      />
    );

    userEvent.click(screen.getByRole("button"));
    expect(field.result.current.state.value).toBe("foo");
  });

  it('should render "render" prop', () => {
    const atom = fieldAtom({ value: "test" });
    const field = renderHook(() => useInputField(atom));
    render(
      <Field
        atom={atom}
        render={(state, actions) => {
          return <button onClick={() => actions.setValue("foo")} />;
        }}
      />
    );

    userEvent.click(screen.getByRole("button"));
    expect(field.result.current.state.value).toBe("foo");
  });

  it("should set initial value", () => {
    const atom = fieldAtom({ value: "test" });

    render(
      <Field
        atom={atom}
        initialValue="hello"
        component={(props) => {
          return (
            <button onClick={() => props.actions.setValue("foo")}>
              {props.state.value}
            </button>
          );
        }}
      />
    );

    expect(screen.getByText("hello")).toBeInTheDocument();
  });

  it("should preprocess value", () => {
    const atom = fieldAtom<number | null>({
      value: 0,
      preprocess(value) {
        if (value !== null && isNaN(value)) {
          return null;
        }

        return value;
      },
    });

    const { result } = renderHook(() =>
      // @ts-expect-error: fine for this purpose
      useInputField(atom, { type: "number", initialValue: "hello" })
    );

    expect(result.current.state.value).toBeNull();

    domAct(() => {
      result.current.actions.setValue(1);
    });

    expect(result.current.state.value).toBe(1);

    domAct(() => {
      result.current.actions.setValue(NaN);
    });

    expect(result.current.state.value).toBe(null);
  });

  it("should set an object value", () => {
    const atom = fieldAtom({ value: { id: "0123", name: "Foo" } });
    const field = renderHook(() => useFieldValue(atom));
    render(
      <Field
        atom={atom}
        render={(state, actions) => {
          return (
            <button
              onClick={() => actions.setValue({ id: "999", name: "Bar" })}
            />
          );
        }}
      />
    );

    userEvent.click(screen.getByRole("button"));
    expect(field.result.current).toStrictEqual({
      id: "999",
      name: "Bar",
    });
  });

  it("should set an array value", () => {
    const atom = fieldAtom({ value: [] as any[] });
    const field = renderHook(() => useFieldValue(atom));
    render(
      <Field
        atom={atom}
        render={(state, actions) => {
          return <button onClick={() => actions.setValue(["foo", 1])} />;
        }}
      />
    );

    userEvent.click(screen.getByRole("button"));
    expect(field.result.current).toStrictEqual(["foo", 1]);
  });
});

describe("<InputField>", () => {
  it('should render "component" prop in scope', () => {
    const atom = fieldAtom({ value: "test" });
    render(<InputField atom={atom} component="input" />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it('should render "render" prop', () => {
    const atom = fieldAtom({ value: "test" });
    render(<InputField atom={atom} render={(props) => <input {...props} />} />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("should set initial value", () => {
    const atom = fieldAtom({ value: "test" });

    render(
      <InputField
        atom={atom}
        initialValue="hello"
        render={(props, state, actions) => {
          return (
            <button onClick={() => actions.setValue("foo")}>
              {state.value}
            </button>
          );
        }}
      />
    );

    expect(screen.getByText("hello")).toBeInTheDocument();
  });

  it('should render "component" prop in scope w/ date type', () => {
    const atom = fieldAtom<Date | null>({ name: "date", value: null });
    render(
      <InputField
        atom={atom}
        type="date"
        component={(props) => <input data-testid="input" {...props} />}
      />
    );
    expect(screen.getByTestId("input")).toHaveAttribute("type", "date");
  });

  it('should render "component" prop in scope w/ datetime-local type', () => {
    const atom = fieldAtom<Date | null>({ value: null });
    render(
      <InputField
        atom={atom}
        type="datetime-local"
        component={(props) => <input data-testid="input" {...props} />}
      />
    );
    expect(screen.getByTestId("input")).toHaveAttribute(
      "type",
      "datetime-local"
    );
  });

  it('should render "component" prop in scope w/ month type', () => {
    const atom = fieldAtom<Date | null>({ value: null });
    render(
      <InputField
        atom={atom}
        type="month"
        component={(props) => <input data-testid="input" {...props} />}
      />
    );
    expect(screen.getByTestId("input")).toHaveAttribute("type", "month");
  });

  it('should render "component" prop in scope w/ week type', () => {
    const atom = fieldAtom<Date | null>({ value: null });
    render(
      <InputField
        atom={atom}
        type="week"
        component={(props) => <input data-testid="input" {...props} />}
      />
    );
    expect(screen.getByTestId("input")).toHaveAttribute("type", "week");
  });

  it('should render "component" prop in scope w/ time type', () => {
    const atom = fieldAtom<Date | null>({ value: null });
    render(
      <InputField
        atom={atom}
        type="time"
        component={(props) => <input data-testid="input" {...props} />}
      />
    );
    expect(screen.getByTestId("input")).toHaveAttribute("type", "time");
  });

  it('should render "component" prop in scope w/ file type', () => {
    const atom = fieldAtom<FileList | null>({ value: null });
    render(
      <InputField
        atom={atom}
        type="file"
        component={(props) => <input data-testid="input" {...props} />}
      />
    );
    expect(screen.getByTestId("input")).toBeInTheDocument();
  });

  it('should render "component" prop in scope w/ number type', () => {
    const atom = fieldAtom<number | null>({ value: 0 });
    render(
      <InputField
        atom={atom}
        type="number"
        component={(props) => <input data-testid="input" {...props} />}
      />
    );
    expect(screen.getByTestId("input")).toHaveAttribute("type", "number");
  });

  it('should render "component" prop in scope w/ range type', () => {
    const atom = fieldAtom({ value: 0 });
    render(<InputField atom={atom} type="range" component="input" />);
    expect(screen.getByRole("slider")).toBeInTheDocument();
  });
});

describe("<SelectField>", () => {
  it('should render "component" prop in scope', () => {
    const atom = fieldAtom({ value: "test" });
    render(
      <SelectField
        atom={atom}
        component={(props) => <select data-testid="select" {...props} />}
      />
    );
    expect(screen.getByTestId("select")).toBeInTheDocument();
  });

  it('should render "render" prop', () => {
    const atom = fieldAtom({ value: "test" });
    render(
      <SelectField
        atom={atom}
        render={(props) => <select data-testid="select" {...props} />}
      />
    );
    expect(screen.getByTestId("select")).toBeInTheDocument();
  });

  it("should set initial value", () => {
    const atom = fieldAtom({ value: "test" });

    render(
      <SelectField
        atom={atom}
        initialValue="hello"
        render={(props, state, actions) => {
          return (
            <button onClick={() => actions.setValue("foo")}>
              {state.value}
            </button>
          );
        }}
      />
    );

    expect(screen.getByText("hello")).toBeInTheDocument();
  });

  it('should render "component" with multiple prop in scope', () => {
    const atom = fieldAtom({ value: ["test"] });
    render(
      <SelectField
        atom={atom}
        component={(props) => <select data-testid="select" {...props} />}
        multiple
      />
    );
    expect(screen.getByTestId("select")).toHaveAttribute("multiple");
  });

  it('should render multiple "render" prop', () => {
    const atom = fieldAtom({ value: ["test"] });
    render(
      <SelectField
        atom={atom}
        multiple
        render={(props) => <select data-testid="select" {...props} />}
      />
    );
    expect(screen.getByTestId("select")).toHaveAttribute("multiple");
  });

  it("should set multiple initial values", () => {
    const atom = fieldAtom({ value: ["test"] });

    render(
      <SelectField
        atom={atom}
        initialValue={["hello"]}
        multiple
        render={(props, state, actions) => {
          return (
            <button onClick={() => actions.setValue(["foo"])}>
              {state.value.join("")}
            </button>
          );
        }}
      />
    );

    expect(screen.getByText("hello")).toBeInTheDocument();
  });
});

describe("<TextareaField>", () => {
  it('should render "component" prop in scope', () => {
    const atom = fieldAtom({ value: "test" });
    render(<TextareaField atom={atom} component="textarea" />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it('should render "render" prop', () => {
    const atom = fieldAtom({ value: "test" });
    render(
      <TextareaField atom={atom} render={(props) => <textarea {...props} />} />
    );
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("should set initial value", () => {
    const atom = fieldAtom({ value: "test" });

    render(
      <TextareaField
        atom={atom}
        initialValue="hello"
        render={(props, state, actions) => {
          return (
            <button onClick={() => actions.setValue("foo")}>
              {state.value}
            </button>
          );
        }}
      />
    );

    expect(screen.getByText("hello")).toBeInTheDocument();
  });
});

describe("<Form>", () => {
  it('should render "component" prop in scope', () => {
    const atom = formAtom({
      name: fieldAtom({ value: "test" }),
    });

    const FormComponent = (
      props: UseForm<ExtractAtomValue<ExtractAtomValue<typeof atom>["fields"]>>
    ) => {
      const field = useInputField(props.fieldAtoms.name);

      return (
        <form onSubmit={props.submit((values) => console.log(values.name))}>
          <input {...field.props} />
        </form>
      );
    };

    render(<Form atom={atom} component={FormComponent} />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it('should render "render" prop in scope', () => {
    const atom = formAtom({
      name: fieldAtom({ value: "test" }),
    });

    const FormComponent = (
      props: UseForm<ExtractAtomValue<ExtractAtomValue<typeof atom>["fields"]>>
    ) => {
      const field = useInputField(props.fieldAtoms.name);

      return (
        <form onSubmit={props.submit((values) => console.log(values.name))}>
          <input {...field.props} />
        </form>
      );
    };

    render(<Form atom={atom} render={FormComponent} />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("should render same form atom in isolated scope", () => {
    const atom = formAtom({
      name: fieldAtom({ value: "test" }),
    });

    const FormComponentA = (
      props: UseForm<ExtractAtomValue<ExtractAtomValue<typeof atom>["fields"]>>
    ) => {
      const field = useInputField(props.fieldAtoms.name);
      useFieldInitialValue(props.fieldAtoms.name, "a");

      return (
        <form onSubmit={props.submit((values) => console.log(values.name))}>
          <input aria-label="input a" {...field.props} />
        </form>
      );
    };

    const FormComponentB = (
      props: UseForm<ExtractAtomValue<ExtractAtomValue<typeof atom>["fields"]>>
    ) => {
      const field = useInputField(props.fieldAtoms.name);
      useFieldInitialValue(props.fieldAtoms.name, "b");

      return (
        <form onSubmit={props.submit((values) => console.log(values.name))}>
          <input aria-label="input b" {...field.props} />
        </form>
      );
    };

    render(
      <div>
        <Form atom={atom} render={FormComponentA} />
        <Form atom={atom} render={FormComponentB} />
      </div>
    );

    expect(screen.getByLabelText("input a")).toBeInTheDocument();
    expect(screen.getByLabelText("input b")).toBeInTheDocument();

    userEvent.type(screen.getByLabelText("input a"), "foo");
    userEvent.type(screen.getByLabelText("input b"), "bar");

    expect(screen.getByLabelText("input a")).toHaveValue("afoo");
    expect(screen.getByLabelText("input b")).toHaveValue("bbar");
  });
});

describe("useField()", () => {
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
    expect(screen.getByRole("textbox")).toHaveValue("test");
  });

  it("should add add a change handler", async () => {
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
    const { result } = renderHook(() => useInputField(firstNameAtom));

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
    const { result } = renderHook(() => useInputField(firstNameAtom));

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
      validate: vi.fn(() => {
        return ["error"];
      }),
    };
    const firstNameAtom = fieldAtom(atomConfig);
    const { result } = renderHook(() => useInputField(firstNameAtom));
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
      validate: vi.fn(() => {
        return ["error"];
      }),
    };
    const firstNameAtom = fieldAtom(atomConfig);
    const { result } = renderHook(() => useInputField(firstNameAtom));
    domAct(() => {
      result.current.props.onChange({
        currentTarget: { value: "test" },
      } as any);
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
    const { result } = renderHook(() => useInputField(firstNameAtom));

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
    const { result } = renderHook(() => useInputField(firstNameAtom));

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
    const { result } = renderHook(() => useInputField(firstNameAtom));

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
      validate: vi.fn(() => {
        return ["error"];
      }),
    };
    const firstNameAtom = fieldAtom(atomConfig);
    const { result } = renderHook(() => useInputField(firstNameAtom));

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
      validate: vi.fn(() => {
        return ["error"];
      }),
    };
    const firstNameAtom = fieldAtom(atomConfig);
    const { result } = renderHook(() => useInputField(firstNameAtom));

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
      validate: vi.fn(() => {
        return ["error"];
      }),
    };
    const firstNameAtom = fieldAtom(atomConfig);
    const { result } = renderHook(() => useInputField(firstNameAtom));

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
      validate: vi.fn(() => {
        return ["error"];
      }),
    };
    const firstNameAtom = fieldAtom(atomConfig);
    const { result } = renderHook(() => useInputField(firstNameAtom));

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
    const { result } = renderHook(() => useInputField(firstNameAtom));
    const handleFocus = vi.fn();

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
    const { result } = renderHook(() => useInputField(firstNameAtom));

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

  it("should reset the atom when reset is called w/ initial value", () => {
    const firstNameAtom = fieldAtom({
      name: "firstName",
      value: "",
      validate() {
        return ["error"];
      },
    });
    const { result } = renderHook(() =>
      useInputField(firstNameAtom, { initialValue: "test" })
    );

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
    const { result } = renderHook(() => useInputField(firstNameAtom));

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
    const { result } = renderHook(() => useInputField(firstNameAtom));

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
    const { result } = renderHook(() => useInputField(firstNameAtom));

    domAct(() => {
      result.current.actions.validate();
    });

    domAct(() => {
      result.current.actions.setValue(50);
    });

    vi.advanceTimersByTime(100);
    await domAct(() => Promise.resolve());
    expect(result.current.state.errors).toEqual(["50-error"]);
  });
});

describe("useFieldInitialValue()", () => {
  it("should set an initial value", () => {
    const firstNameAtom = fieldAtom({
      value: "test",
    });
    const field = renderHook(() => {
      useFieldInitialValue(firstNameAtom, "jared");
      return useInputField(firstNameAtom);
    });
    field.result.current.props.type;
    expect(field.result.current.props.value).toBe("jared");
  });

  it("should not set an initial value if initial value is undefined", () => {
    const firstNameAtom = fieldAtom({
      value: "test",
    });
    const field = renderHook(() => useInputField(firstNameAtom));
    renderHook(() => useFieldInitialValue(firstNameAtom, undefined));

    expect(field.result.current.props.value).toBe("test");
  });

  it("should set an initial value if initial value once", () => {
    const firstNameAtom = fieldAtom({
      value: "test",
    });
    const firstStore = createStore();
    const field = renderHook(
      ({ initialValue, store }) =>
        useInputField(firstNameAtom, { initialValue, store }),
      { initialProps: { initialValue: "jared", store: firstStore } }
    );

    expect(field.result.current.props.value).toBe("jared");

    field.rerender({ initialValue: "john", store: firstStore });
    expect(field.result.current.props.value).toBe("jared");

    domAct(() => {
      field.result.current.actions.setValue("jared l");
    });

    field.rerender({ initialValue: "john", store: createStore() });
    expect(field.result.current.props.value).toBe("john");

    field.rerender({ initialValue: "john", store: firstStore });
    expect(field.result.current.props.value).toBe("jared l");
  });

  it("should not set initial value if field is dirty", () => {
    const firstNameAtom = fieldAtom({
      value: "test",
    });
    const firstStore = createStore();
    const field = renderHook(
      ({ initialValue, store }) =>
        useInputField(firstNameAtom, { initialValue, store }),
      { initialProps: { initialValue: undefined, store: firstStore } }
    );

    expect(field.result.current.props.value).toBe("test");
    // @ts-expect-error
    field.rerender({ initialValue: "john", store: firstStore });
    expect(field.result.current.props.value).toBe("test");

    domAct(() => {
      field.result.current.actions.setValue("jared l");
    });

    // @ts-expect-error
    field.rerender({ initialValue: "john", store: firstStore });
    expect(field.result.current.props.value).toBe("jared l");

    renderHook(
      ({ store }) => useFieldInitialValue(firstNameAtom, "john", { store }),
      { initialProps: { store: firstStore } }
    );

    expect(field.result.current.props.value).toBe("jared l");
  });
});

describe("useFieldValue()", () => {
  it("should return the value of the atom", () => {
    const firstNameAtom = fieldAtom({
      name: "firstName",
      value: "test",
    });
    const { result } = renderHook(() => useFieldValue(firstNameAtom));

    expect(result.current).toBe("test");
  });
});

describe("useFieldErrors", () => {
  it("should return the errors of the atom", () => {
    const firstNameAtom = fieldAtom({
      name: "firstName",
      value: "test",
      validate() {
        return ["error"];
      },
    });
    const atom = renderHook(() => useInputField(firstNameAtom));
    const { result } = renderHook(() => useFieldErrors(firstNameAtom));
    domAct(() => {
      atom.result.current.actions.validate();
    });
    expect(result.current).toEqual(["error"]);
  });
});

describe("useSelectField()", () => {
  it("should be multiple", () => {
    const atom = fieldAtom({
      value: ["test"],
    });
    const { result } = renderHook(() =>
      useSelectField(atom, { multiple: true })
    );
    expect(result.current.props.value).toStrictEqual(["test"]);
    expect(result.current.props.multiple).toBe(true);
    // @ts-expect-error
    expect(result.current.props.type).toBe(undefined);

    domAct(() => {
      result.current.actions.setValue(["test", "test2"]);
    });

    expect(result.current.props.value).toStrictEqual(["test", "test2"]);
  });

  it("should be multiple onChange", () => {
    const atom = fieldAtom({
      value: ["test"],
    });
    const { result } = renderHook(() =>
      useSelectField(atom, { multiple: true })
    );
    expect(result.current.props.value).toStrictEqual(["test"]);
    expect(result.current.props.multiple).toBe(true);
    // @ts-expect-error
    expect(result.current.props.type).toBe(undefined);

    domAct(() => {
      result.current.props.onChange({
        currentTarget: {
          options: [
            // @ts-expect-error
            { value: "test", selected: true },
            // @ts-expect-error
            { value: "test2", selected: true },
            // @ts-expect-error
            { value: "test3", selected: false },
          ],
        },
      });
    });

    expect(result.current.props.value).toStrictEqual(["test", "test2"]);
  });

  it("should be single by default", () => {
    const atom = fieldAtom({
      value: "",
    });
    const { result } = renderHook(() => useSelectField(atom));
    expect(result.current.props.value).toBe("");
    expect(result.current.props.multiple).toBe(undefined);

    domAct(() => {
      // @ts-expect-error
      result.current.props.onChange({ currentTarget: { value: "test" } });
    });

    expect(result.current.props.value).toStrictEqual("test");
  });

  it("should have an initialValue", () => {
    const atom = fieldAtom({
      value: "",
    });
    const { result } = renderHook(() =>
      useSelectField(atom, { initialValue: "test" })
    );
    expect(result.current.props.value).toBe("test");
  });
});

describe("useTextareaField()", () => {
  it("should change", () => {
    const atom = fieldAtom({
      value: "",
    });
    const { result } = renderHook(() => useTextareaField(atom));
    expect(result.current.props.value).toBe("");
    // @ts-expect-error
    expect(result.current.props.type).toBe(undefined);

    domAct(() => {
      result.current.actions.setValue("test");
    });

    expect(result.current.props.value).toStrictEqual("test");
  });

  it("should have an initialValue", () => {
    const atom = fieldAtom({
      value: "",
    });
    const { result } = renderHook(() =>
      useTextareaField(atom, { initialValue: "test" })
    );
    expect(result.current.props.value).toBe("test");
  });
});

describe("useForm()", () => {
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
    const { result } = renderHook(() => useForm(atom));
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
    const { result } = renderHook(() => useForm(atom));
    const form = renderHook(() => useFormState(atom));
    const nameField = renderHook(() => useInputField(config.name));
    const hobbiesField = renderHook(() => useInputField(config.hobbies[0]));

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
    const { result } = renderHook(() => useForm(atom));
    const form = renderHook(() => useFormState(atom));

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
    const { result } = renderHook(() => useForm(atom));
    const form = renderHook(() => useFormState(atom));

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
    const { result } = renderHook(() => useForm(atom));
    const form = renderHook(() => useFormState(atom));
    const handleSubmit = vi.fn(async () => {});
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
      empty: {
        array: [],
      },
    };
    const atom = formAtom(config);
    const { result } = renderHook(() => useForm(atom));
    const form = renderHook(() => useFormState(atom));
    const handleSubmit = vi.fn(() => {});
    domAct(() => {
      result.current.submit(handleSubmit)();
    });

    await domAct(() => Promise.resolve());
    expect(form.result.current.submitStatus).toBe("submitted");
    expect(handleSubmit).toHaveBeenCalledWith({
      name: "lunde",
      hobbies: ["test"],
      empty: {
        array: [],
      },
    });
  });

  it("should sync submit form with values 2", async () => {
    const config = {
      cities: [
        {
          name: fieldAtom({ value: "Atlantits" }),
          people: [{ name: [fieldAtom({ value: "Shrek" })] }],
        },
        {
          name: fieldAtom({ value: "Asdfgard" }),
          people: [{ name: [fieldAtom({ value: "Thorus" })] }],
        },
      ],
    };
    const atom = formAtom(config);
    const { result } = renderHook(() => useForm(atom));
    const form = renderHook(() => useFormState(atom));
    const handleSubmit = vi.fn(() => {});
    domAct(() => {
      result.current.submit(handleSubmit)();
    });

    await domAct(() => Promise.resolve());
    expect(form.result.current.submitStatus).toBe("submitted");
    expect(handleSubmit).toHaveBeenCalledWith({
      cities: [
        {
          name: "Atlantits",
          people: [{ name: ["Shrek"] }],
        },
        {
          name: "Asdfgard",
          people: [{ name: ["Thorus"] }],
        },
      ],
    });
  });

  it("should sync submit form with values 3", async () => {
    const config = {
      cities: [
        {
          name: fieldAtom({ value: "Atlantits" }),
          people: [{ name: fieldAtom({ value: "Shrek" }) }],
        },
        {
          name: fieldAtom({ value: "Asdfgard" }),
          people: [{ name: fieldAtom({ value: "Thorus" }) }],
        },
      ],
    };
    const atom = formAtom(config);
    const { result } = renderHook(() => useForm(atom));
    const form = renderHook(() => useFormState(atom));
    const handleSubmit = vi.fn(() => {});
    domAct(() => {
      result.current.submit(handleSubmit)();
    });

    await domAct(() => Promise.resolve());
    expect(form.result.current.submitStatus).toBe("submitted");
    expect(handleSubmit).toHaveBeenCalledWith({
      cities: [
        {
          name: "Atlantits",
          people: [{ name: "Shrek" }],
        },
        {
          name: "Asdfgard",
          people: [{ name: "Thorus" }],
        },
      ],
    });
  });

  it("should sync submit form with values 4", async () => {
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
      empty: {
        array: [],
      },
      empty2: {
        array: [
          fieldAtom({
            value: "def",
          }),
        ],
        array2: [],
      },
    };
    const atom = formAtom(config);
    const { result } = renderHook(() => useForm(atom));
    const form = renderHook(() => useFormState(atom));
    const handleSubmit = vi.fn(() => {});
    domAct(() => {
      result.current.submit(handleSubmit)();
    });

    await domAct(() => Promise.resolve());
    expect(form.result.current.submitStatus).toBe("submitted");
    expect(handleSubmit).toHaveBeenCalledWith({
      name: "lunde",
      hobbies: ["test"],
      empty: {
        array: [],
      },
      empty2: {
        array: ["def"],
        array2: [],
      },
    });
  });

  it("should prevent submit when form state is invalid", async () => {
    const hobbyConfig = {
      name: "hobbies.0",
      value: "test",
      validate: vi.fn(),
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
    const { result } = renderHook(() => useForm(atom));
    const form = renderHook(() => useFormState(atom));
    const handleSubmit = vi.fn(() => {});
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
    const { result } = renderHook(() => useForm(atom));
    const form = renderHook(() => useFormState(atom));

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
    const { result } = renderHook(() => useForm(atom));
    const form = renderHook(() => useFormState(atom));

    domAct(() => {
      result.current.validate();
    });

    expect(form.result.current.validateStatus).toBe("validating");

    vi.advanceTimersByTime(100);
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
    const { result } = renderHook(() => useForm(atom));
    const form = renderHook(() => useFormState(atom));

    domAct(() => {
      result.current.validate();
    });

    expect(form.result.current.validateStatus).toBe("validating");

    vi.advanceTimersByTime(100);
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
    const { result } = renderHook(() => useForm(atom));
    const form = renderHook(() => useFormState(atom));

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
    const field = renderHook(() => useInputField(config.name));
    const form = renderHook(() => useFormState(atom));
    expect(form.result.current.dirty).toBe(false);

    domAct(() => {
      field.result.current.actions.setValue("jared");
    });

    expect(form.result.current.dirty).toBe(true);
  });

  it("should return the dirty state w/ initial value set", async () => {
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
    const field = renderHook(() =>
      useInputField(config.name, { initialValue: "Jared" })
    );
    const form = renderHook(() => useFormState(atom));
    expect(form.result.current.dirty).toBe(false);

    domAct(() => {
      field.result.current.actions.setValue("Jared L");
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
    const form = renderHook(() => useFormState(atom));

    expect(form.result.current.touchedFields).toEqual({
      name: false,
      hobbies: [true],
    });
  });
});

describe("useFormValues()", () => {
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
    const { result } = renderHook(() => useFormValues(atom));
    const field = renderHook(() => useInputField(config.name.first));

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

describe("useFormErrors()", () => {
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
    const field = renderHook(() => useInputField(config.name.first));
    const errors = renderHook(() => useFormErrors(atom));

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
    const form = renderHook(() => useForm(atom));
    const errors = renderHook(() => useFormErrors(atom));

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

describe("useFormActions()", () => {
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
    const actions = renderHook(() => useFormActions(atom));
    expect(actions.result.current).toEqual({
      updateFields: expect.any(Function),
      validate: expect.any(Function),
      reset: expect.any(Function),
      submit: expect.any(Function),
    });
  });

  it('should validate with "user" event', () => {
    const handleValidate = vi.fn();
    const config = {
      name: fieldAtom({
        value: "jared",
        validate: handleValidate,
      }),
    };
    const atom = formAtom<{ name: FieldAtom<string> }>(config);
    const actions = renderHook(() => useFormActions(atom));

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
    const actions = renderHook(() => useFormActions(atom));
    const state = renderHook(() => useForm(atom));

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
    const { result } = renderHook(() => useFormActions(atom));
    const handleSubmit = vi.fn(async () => {});

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

describe("useFormStatus()", () => {
  it("should return object containing submit and validate status", () => {
    const atom = formAtom({
      name: fieldAtom({
        value: "jared",
      }),
    });
    const status = renderHook(() => useFormStatus(atom));

    expect(status.result.current).toEqual({
      submitStatus: "idle",
      validateStatus: "valid",
    });
  });
});

describe("useSubmit()", () => {
  it("should submit the form", async () => {
    const handleSubmit = vi.fn(async () => {});
    const atom = formAtom({
      name: fieldAtom({
        value: "jared",
      }),
    });
    const { result } = renderHook(() => useFormSubmit(atom));

    domAct(() => {
      result.current(handleSubmit)();
    });

    await domAct(() => Promise.resolve());
    expect(handleSubmit).toHaveBeenCalledWith({
      name: "jared",
    });
  });
});

describe("fieldAtom()", () => {
  it("debugLabels contain the field name when specified", () => {
    const field = fieldAtom({ value: "", name: "city" });

    const {
      result: { current: atoms },
    } = renderHook(() => useAtomValue(field));

    expect(atoms.name.debugLabel).toBe("field/name/city");
    expect(atoms.value.debugLabel).toBe("field/value/city");
    expect(atoms.touched.debugLabel).toBe("field/touched/city");
    expect(atoms.dirty.debugLabel).toBe("field/dirty/city");
    expect(atoms.validate.debugLabel).toBe("field/validate/city");
    expect(atoms.validateStatus.debugLabel).toBe("field/validateStatus/city");
    expect(atoms.errors.debugLabel).toBe("field/errors/city");
    expect(atoms.reset.debugLabel).toBe("field/reset/city");
    expect(atoms.ref.debugLabel).toBe("field/ref/city");
    expect(atoms._initialValue.debugLabel).toBe("field/_initialValue/city");
    expect(atoms._validateCount.debugLabel).toBe("field/_validateCount/city");
  });

  it("debugLabels contain atom id when field name not specified", () => {
    const field = fieldAtom({ value: "" });

    const {
      result: { current: atoms },
    } = renderHook(() => useAtomValue(field));

    expect(atoms.name.debugLabel).toBe(`field/name/${field}`);
    expect(atoms.value.debugLabel).toBe(`field/value/${field}`);
    expect(atoms.touched.debugLabel).toBe(`field/touched/${field}`);
    expect(atoms.dirty.debugLabel).toBe(`field/dirty/${field}`);
    expect(atoms.validate.debugLabel).toBe(`field/validate/${field}`);
    expect(atoms.validateStatus.debugLabel).toBe(
      `field/validateStatus/${field}`
    );
    expect(atoms.errors.debugLabel).toBe(`field/errors/${field}`);
    expect(atoms.reset.debugLabel).toBe(`field/reset/${field}`);
    expect(atoms.ref.debugLabel).toBe(`field/ref/${field}`);
    expect(atoms._initialValue.debugLabel).toBe(`field/_initialValue/${field}`);
    expect(atoms._validateCount.debugLabel).toBe(
      `field/_validateCount/${field}`
    );
  });
});

describe("formAtom()", () => {
  it("has atoms with debugLabels", () => {
    const field = formAtom({});

    const {
      result: { current: atoms },
    } = renderHook(() => useAtomValue(field));

    expect(atoms.fields.debugLabel).toBe("form/fields");
    expect(atoms.values.debugLabel).toBe("form/values");
    expect(atoms.errors.debugLabel).toBe("form/errors");
    expect(atoms.dirty.debugLabel).toBe("form/dirty");
    expect(atoms.touchedFields.debugLabel).toBe("form/touchedFields");
    expect(atoms.validate.debugLabel).toBe("form/validate");
    expect(atoms.validateStatus.debugLabel).toBe("form/validateStatus");
    expect(atoms.submit.debugLabel).toBe("form/submit");
    expect(atoms.submitStatus.debugLabel).toBe("form/submitStatus");
    expect(atoms.submitCount.debugLabel).toBe("form/submitCount");
    expect(atoms.reset.debugLabel).toBe("form/reset");
  });
});

function createTextField<Value extends string>(fieldAtom: FieldAtom<Value>) {
  return function Field() {
    const field = useInputField(fieldAtom);
    return <input {...field.props} />;
  };
}
