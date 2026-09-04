import { useState } from "react";
import { Field, Input, Label } from "@headlessui/react";
import { Eye, EyeOff } from "lucide-react";
import clsx from "clsx";

function InputUi({
  label,
  type,
  required,
  placeholder,
  className,
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const computedType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className="w-full">
      <Field>
        {label && (
          <Label className="text-sm/6 font-medium text-brand-accent">
            {label} {required && <span className="text-status-error">*</span>}
          </Label>
        )}
        <div className="relative flex items-center">
          <Input
            type={computedType}
            className={`${clsx(
              "rounded-sm block h-11 w-full border border-brand-accent/10 bg-brand-accent/5 px-3 py-1.5 text-sm/6 text-brand-accent",
              isPassword && "pr-10",
              "focus:not-data-focus:outline-none data-focus:outline-1 data-focus:-outline-offset-1 data-focus:outline-brand-accent/25",
            )} ${className}`}
            placeholder={placeholder}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              className="absolute right-3 text-brand-accent/60 hover:text-brand-accent transition-colors focus:outline-none cursor-pointer"
              aria-label={showPassword ? "Hide password" : "Show password"}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
        </div>
      </Field>
    </div>
  );
}

export default InputUi;
