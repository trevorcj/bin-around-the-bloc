import { Field, Input, Label } from "@headlessui/react";
import clsx from "clsx";

function InputUi({
  label,
  type,
  required,
  placeholder,
  className,
  ...props
}) {
  return (
    <div className="w-full ">
      <Field>
        <Label className="text-sm/6 font-medium text-brand-accent">
          {label} {required && <span className="text-status-error">*</span>}
        </Label>
        <Input
          type={type}
          className={`${clsx(
            "rounded-sm block h-11 w-full border border-brand-accent/10 bg-brand-accent/5 px-3 py-1.5 text-sm/6 text-brand-accent",
            "focus:not-data-focus:outline-none data-focus:outline-1 data-focus:-outline-offset-1 data-focus:outline-brand-accent/25",
          )} ${className}`}
          placeholder={placeholder}
          {...props}
        />
      </Field>
    </div>
  );
}

export default InputUi;
