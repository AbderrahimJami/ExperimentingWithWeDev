export default function Button({
  as: Component = "button",
  variant = "primary",
  className = "",
  ...props
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";
  const variants = {
    primary: "bg-ink text-sand hover:bg-ink/90 focus-visible:outline-ink",
    secondary:
      "border border-ink/10 bg-white text-ink hover:border-ink/30 focus-visible:outline-ink",
    ghost: "text-ink hover:bg-ink/5 focus-visible:outline-ink",
  };
  const disabled = "disabled:cursor-not-allowed disabled:opacity-60";
  const classes = [
    base,
    variants[variant] || variants.primary,
    disabled,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <Component className={classes} {...props} />;
}
