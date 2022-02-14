// import { renderHook } from "@testing-library/react-hooks";
import { render, screen } from "@testing-library/react";
// import userEvent from '@testing-library/user-event
import { Provider } from "jotai";
import React from "react";
import type { FieldAtom } from ".";
import { fieldAtom, useFieldAtom } from ".";

describe("useFieldAtom()", () => {
  it("should pass", () => {
    const firstNameAtom = fieldAtom({
      name: "firstName",
      value: "",
    });
    const Form = createForm(firstNameAtom);
    const result = render(
      <Provider>
        <Form />
      </Provider>
    );
    expect(result.asFragment()).toMatchSnapshot();
    expect(screen.getByRole("textbox")).toHaveAttribute("name", "firstName");
  });
});

function createForm<Value>(fieldAtom: FieldAtom<Value>) {
  return function Form() {
    const field = useFieldAtom(fieldAtom);
    console.log("wtf", field);
    // @ts-expect-error
    return <input type="text" {...field.props} />;
  };
}
