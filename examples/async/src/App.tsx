import React from "react";

import { Form, InputField, fieldAtom, formAtom } from "form-atoms";

import { FieldErrors } from "./components/field-errors";

const nameAtom = fieldAtom({
  value: "",
  // Validate callbacks can be asynchronous. In this example
  // we force the validator to wait 500ms before returning a
  // result.
  async validate({
    // The value to validate
    value,
  }) {
    // Wait 500ms
    await new Promise((resolve) => setTimeout(resolve, 500));
    // validate() expects that you return an empty array
    // for valid fields and an array of strings for
    // invalid fields
    return value.length > 8 ? [] : ["Value must be longer than 8 characters"];
  },
});

export const nameFormAtom = formAtom({
  name: nameAtom,
});

export default function ValidateOn() {
  return (
    <Template title="Validate a field asynchronously">
      <Form
        atom={nameFormAtom}
        render={({ submit, fieldAtoms }) => {
          return (
            <form onSubmit={submit((values) => alert(JSON.stringify(values)))}>
              <label>
                <span>Name</span>

                <FieldErrors atom={fieldAtoms.name}>
                  <InputField atom={fieldAtoms.name} component="input" />
                </FieldErrors>
              </label>

              <button type="submit">Submit</button>
            </form>
          );
        }}
      />
    </Template>
  );
}

function Template({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ padding: "32px 64px" }}>
      <blockquote style={{ margin: 0 }}>
        <h3 style={{ margin: 0 }}>form-atoms</h3>
        {title}
      </blockquote>
      <hr style={{ margin: "32px auto" }} />
      {children}
    </div>
  );
}
