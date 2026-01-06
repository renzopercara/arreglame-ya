interface BadgeProps {
  label: string;
  variant?: "default" | "primary" | "success";
}

export default function Badge({
  label,
  variant = "default",
}: BadgeProps) {
  const variants = {
    default: "bg-slate-100 text-slate-600",
    primary: "bg-blue-100 text-blue-700",
    success: "bg-emerald-100 text-emerald-700",
  };

  return (
    <span
      className={`
        inline-flex items-center
        rounded-md
        px-2 py-0.5
        text-[11px] font-medium
        leading-none
        ${variants[variant]}
      `}
    >
      {label}
    </span>
  );
}
