import React from "react";
import { zodValidate } from "form-atoms/zod";
import {
  formAtom,
  fieldAtom,
  InputField,
  SelectField,
  TextareaField,
  Form,
} from "form-atoms";
import { FieldErrors } from "./components/field-errors";

export const nameFormAtom = formAtom({
  text: fieldAtom({
    value: "",
  }),
  date: fieldAtom<Date | null>({
    value: null,
  }),
  datetimeLocal: fieldAtom<Date>({
    value: new Date(),
  }),
  number: fieldAtom({
    value: 0,
  }),
  range: fieldAtom({
    value: 0,
  }),
  files: fieldAtom<FileList | null>({
    value: null,
  }),
  select: fieldAtom({
    value: "1",
  }),
  selectMultiple: fieldAtom({
    value: ["1"],
  }),
  textarea: fieldAtom({
    value: "",
  }),
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
                    atom={fieldAtoms.text}
                    initialValue={String(Math.random())}
                    component="input"
                  />
                </FieldErrors>

                <FieldErrors atom={fieldAtoms.date}>
                  <InputField
                    atom={fieldAtoms.date}
                    initialValue={null}
                    component="input"
                    type="date"
                  />
                </FieldErrors>

                <FieldErrors atom={fieldAtoms.datetimeLocal}>
                  <InputField
                    atom={fieldAtoms.datetimeLocal}
                    // Tomorrow
                    initialValue={new Date(Date.now() + 24 * 60 * 60 * 1000)}
                    component="input"
                    type="datetime-local"
                  />
                </FieldErrors>

                <FieldErrors atom={fieldAtoms.number}>
                  <InputField
                    atom={fieldAtoms.number}
                    initialValue={12}
                    component="input"
                    type="number"
                  />
                </FieldErrors>

                <FieldErrors atom={fieldAtoms.range}>
                  <InputField
                    atom={fieldAtoms.range}
                    initialValue={12}
                    component="input"
                    type="range"
                  />
                </FieldErrors>

                <FieldErrors atom={fieldAtoms.files}>
                  <InputField
                    atom={fieldAtoms.files}
                    initialValue={null}
                    component="input"
                    type="file"
                  />
                </FieldErrors>
              </label>

              <button type="submit">Submit</button>
              <button type="reset" className="outline">
                Reset
              </button>
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
