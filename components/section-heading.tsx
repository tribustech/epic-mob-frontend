type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description?: string;
  variant?: "light" | "dark";
  centered?: boolean;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  variant = "light",
  centered = false,
}: SectionHeadingProps) {
  const isLight = variant === "light";

  return (
    <div className={`max-w-3xl ${centered ? "mx-auto text-center" : ""}`}>
      <p className="eyebrow">{eyebrow}</p>
      <h2
        className={`display-font mt-4 text-4xl leading-tight sm:text-5xl lg:text-6xl ${
          isLight ? "text-navy" : "text-white"
        }`}
      >
        {title}
      </h2>
      {description && (
        <p
          className={`mt-5 max-w-2xl text-base leading-8 ${
            isLight ? "text-navy/60" : "text-white/70"
          } ${centered ? "mx-auto" : ""}`}
        >
          {description}
        </p>
      )}
    </div>
  );
}
