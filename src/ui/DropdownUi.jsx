import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Field,
  Label,
} from "@headlessui/react";
import { ChevronDownIcon } from "lucide-react";
import clsx from "clsx";

function DropdownUi({
  label,
  options = [],
  value,
  onChange,
  className,
  buttonClassName,
  optionsClassName,
}) {
  const selectedOption =
    options.find((opt) => opt.value === value) || options[0];

  return (
    <div className={clsx("w-full", className)}>
      <Field>
        {label && (
          <Label className="text-sm/6 font-medium text-brand-accent mb-1 block">
            {label}
          </Label>
        )}
        <Listbox value={value} onChange={onChange}>
          <div className="relative">
            <ListboxButton
              className={clsx(
                "relative block h-11 w-full rounded-sm border border-brand-accent/10 bg-brand-accent/5 px-3 py-1.5 pr-8 text-left text-sm/6 text-brand-accent",
                "focus:outline-none data-focus:outline-1 data-focus:-outline-offset-1 data-focus:outline-brand-accent/25",
                buttonClassName,
              )}>
              {selectedOption?.label}
              <ChevronDownIcon
                className="pointer-events-none absolute top-2.5 right-2.5 size-4 fill-brand-accent/60"
                aria-hidden="true"
              />
            </ListboxButton>

            <ListboxOptions
              anchor="bottom start"
              portal
              modal={false}
              transition
              className={clsx(
                "z-50 w-(--button-width) rounded-sm border border-brand-accent/10 bg-white p-1 shadow-[0_24px_60px_-36px_rgba(10,37,37,0.45)] [--anchor-gap:4px] focus:outline-none",
                "transition duration-100 ease-in data-leave:data-closed:opacity-0",
                optionsClassName,
              )}>
              {options.map((option) => (
                <ListboxOption
                  key={option.value}
                  value={option.value}
                  className="group flex cursor-pointer gap-2 rounded-sm py-1.5 px-3 select-none data-focus:bg-brand-accent/5 data-selected:bg-brand-accent/10">
                  <div className="text-sm/6 text-brand-accent">
                    {option.label}
                  </div>
                </ListboxOption>
              ))}
            </ListboxOptions>
          </div>
        </Listbox>
      </Field>
    </div>
  );
}

export default DropdownUi;
