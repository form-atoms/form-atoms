import React from "react";
import { zodValidate } from "form-atoms/zod";
import { formAtom, fieldAtom, InputField, Form } from "form-atoms";
import { FieldErrors } from "./components/field-errors";
import { z } from "zod";

const nameSchema = z.object({
  name: z.string().refine(async (value) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return value.length < 3 ? false : true;
  }),
});

const nameAtom = fieldAtom({
  value: "",
  validate: zodValidate(nameSchema.shape.name, {
    on: "blur",
    when: "dirty",
  }),
});

export const nameFormAtom = formAtom({
  name: nameAtom,
});

export default function ValidateOn() {
  return (
    <Template title="Validate a field asynchronously">
      <Form
        atom={nameFormAtom}
        render={({ submit, fieldAtoms, reset }) => {
          return (
            <form
              onSubmit={submit((values) => alert(JSON.stringify(values)))}
              onReset={reset}
            >
              <label>
                <span>Name</span>

                <FieldErrors atom={fieldAtoms.name}>
                  <InputField
                    atom={fieldAtoms.name}
                    initialValue="Jared"
                    component="input"
                  />
                </FieldErrors>
              </label>

              <button type="submit">Submit</button>
              <button type="reset">Reset</button>
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
