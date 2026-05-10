export default function Spinner({ size = "md" }: { size?: "sm" | "md" }) {
  const cls =
    size === "sm"
      ? "h-3.5 w-3.5 border-[1.5px]"
      : "h-6 w-6 border-2";
  return (
    <div
      className={`animate-spin rounded-full border-current border-t-transparent opacity-70 ${cls}`}
    />
  );
}
