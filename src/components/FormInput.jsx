function FormInput({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  as = "input",
  rows = 4,
  options = [],
  ...rest
}) {
  const baseStyles =
    "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-semibold text-slate-700">
        {label}
        {required ? <span className="ml-1 text-rose-600">*</span> : null}
      </span>
      {as === "textarea" ? (
        <textarea
          name={name}
          rows={rows}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={baseStyles}
          {...rest}
        />
      ) : null}
      {as === "select" ? (
        <select name={name} value={value} onChange={onChange} required={required} className={baseStyles} {...rest}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : null}
      {as === "input" ? (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={baseStyles}
          {...rest}
        />
      ) : null}
    </label>
  );
}

export default FormInput;
