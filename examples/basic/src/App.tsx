import React from "react";
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
  month: fieldAtom<Date>({
    value: new Date(),
  }),
  week: fieldAtom<Date>({
    value: new Date(),
  }),
  time: fieldAtom<Date>({
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

                <FieldErrors atom={fieldAtoms.text}>
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

                <FieldErrors atom={fieldAtoms.month}>
                  <InputField
                    atom={fieldAtoms.month}
                    // Tomorrow
                    initialValue={new Date(Date.now() + 24 * 60 * 60 * 1000)}
                    component="input"
                    type="month"
                  />
                </FieldErrors>

                <FieldErrors atom={fieldAtoms.week}>
                  <InputField
                    atom={fieldAtoms.week}
                    // Tomorrow
                    initialValue={new Date(Date.now() + 24 * 60 * 60 * 1000)}
                    component="input"
                    type="week"
                  />
                </FieldErrors>

                <FieldErrors atom={fieldAtoms.time}>
                  <InputField
                    atom={fieldAtoms.time}
                    // Tomorrow
                    initialValue={new Date(Date.now() + 24 * 60 * 60 * 1000)}
                    component="input"
                    type="time"
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

                <FieldErrors atom={fieldAtoms.select}>
                  <SelectField
                    atom={fieldAtoms.select}
                    initialValue="2"
                    render={(props) => {
                      return (
                        <select {...props}>
                          <option value="1">One</option>
                          <option value="2">Two</option>
                          <option value="3">Three</option>
                        </select>
                      );
                    }}
                  />
                </FieldErrors>

                <FieldErrors atom={fieldAtoms.selectMultiple}>
                  <SelectField
                    atom={fieldAtoms.selectMultiple}
                    initialValue={["1", "3"]}
                    multiple
                    render={(props) => {
                      return (
                        <select {...props}>
                          <option value="1">One</option>
                          <option value="2">Two</option>
                          <option value="3">Three</option>
                        </select>
                      );
                    }}
                  />
                </FieldErrors>

                <FieldErrors atom={fieldAtoms.textarea}>
                  <TextareaField
                    atom={fieldAtoms.textarea}
                    initialValue="Hello world"
                    component="textarea"
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
