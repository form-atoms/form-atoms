import React from "react";

import { useFieldAtomErrors, useFieldAtomState } from "form-atoms";
import type { FieldAtom } from "form-atoms";

export function FieldErrors<Value>({
  atom,
  children,
}: {
  atom: FieldAtom<Value>;
  children: React.ReactElement;
}) {
  // @ts-expect-error: useId() exists brah
  const id = React.useId();
  const { validateStatus } = useFieldAtomState(atom);
  const errors = useFieldAtomErrors(atom);
  return (
    <div>
      {React.cloneElement(children, {
        "aria-describedby": errors.length > 0 ? id : undefined,
      })}

      {validateStatus === "validating" && (
        <div id={id} aria-busy="true" style={{ marginBottom: "1em" }}>
          Validating...
        </div>
      )}

      {validateStatus === "invalid" && errors.length > 0 && (
        <div id={id} style={{ marginBottom: "1em" }}>
          ⚠️ {errors.join("\n")}
        </div>
      )}
    </div>
  );
}
