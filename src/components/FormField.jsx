export default function FormField({
  label,
  id,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
  helper,
  error,
  name,
  disabled = false,
  readOnly = false,
}) {
  const describedBy = error
    ? `${id}-error`
    : helper
    ? `${id}-helper`
    : undefined;
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        readOnly={readOnly}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={`mt-2 w-full rounded-2xl border bg-white/90 px-4 py-3 text-sm text-ink shadow-sm outline-none transition focus:border-ink/40 focus:ring-2 focus:ring-ink/10 ${
          error ? "border-rose/70" : "border-clay/70"
        } ${disabled || readOnly ? "cursor-not-allowed bg-mist text-slate" : ""}`}
      />
      {helper && !error ? (
        <p id={`${id}-helper`} className="mt-2 text-xs text-slate">
          {helper}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="mt-2 text-xs text-rose">
          {error}
        </p>
      ) : null}
    </div>
  );
}
