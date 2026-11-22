import { phoneProblem } from "./phone";

/** The order form's checks, shared by the basket (shown under each field) and the order route (400). */
export type ContactField = "name" | "phone" | "city";

export function checkContact(form: { name: string; phone: string; city: string }): Partial<Record<ContactField, string>> {
  const errors: Partial<Record<ContactField, string>> = {};
  if (form.name.trim().length < 2) errors.name = "Scrie numele tău, ca să știm cum să ți ne adresăm.";
  const phone = phoneProblem(form.phone);
  if (phone) errors.phone = phone;
  if (form.city.trim().length < 2) errors.city = "Scrie localitatea în care livrăm.";
  return errors;
}
