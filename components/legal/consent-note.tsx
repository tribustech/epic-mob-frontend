import Link from "next/link";

/**
 * Short privacy notice shown under every submit button that sends personal data
 * (GDPR art. 13). Works in server and client components. Colour and size come
 * from the parent through `className`, so it fits both warm and dark themes.
 *
 * Shop cart: <ConsentNote subject="comanda ta" withTerms />
 */
export function ConsentNote({
  subject = "cererea ta",
  withTerms = false,
  className = "",
}: {
  /** What the visitor is sending, e.g. "cererea ta", "mesajul tău", "comanda ta". */
  subject?: string;
  /** Also link the Terms page (for orders). */
  withTerms?: boolean;
  className?: string;
}) {
  return (
    <p className={`text-xs leading-5 opacity-70 ${className}`.trim()}>
      Trimițând, ești de acord să te contactăm în legătură cu {subject}. Vezi{" "}
      <Link href="/politica-confidentialitate" className="underline underline-offset-2">
        Politica de confidențialitate
      </Link>
      {withTerms ? (
        <>
          {" "}și{" "}
          <Link href="/termeni-si-conditii" className="underline underline-offset-2">
            Termenii și condițiile
          </Link>
        </>
      ) : null}
      .
    </p>
  );
}
