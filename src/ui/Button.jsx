const SIZE_MAPS = {
  small: "w-32",
  medium: "max-w-md w-full",
  full: "w-full",
};

function Button({
  children,
  className = "",
  size = "full",
  disabled,
  type = "button",
  ...props
}) {
  const sizeClasses = SIZE_MAPS[size] || SIZE_MAPS.full;

  return (
    <button
      type={type}
      disabled={disabled}
      {...props}
      className={`rounded-sm mt-2 text-center block bg-brand-primary text-white font-medium px-3 py-1.5 text-sm/6 cursor-pointer disabled:bg-brand-accent/20 disabled:cursor-not-allowed ${sizeClasses} ${className}`}>
      {children}
    </button>
  );
}

export default Button;
