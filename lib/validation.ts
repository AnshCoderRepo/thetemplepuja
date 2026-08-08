// Pure form-validation rules for the booking flow, extracted so they can be
// unit-tested without rendering the component (see tests/validation.test.ts).

export const PHONE_RE = /^[6-9]\d{9}$/;

/** Indian mobile number: starts with 6–9 and is exactly 10 digits. */
export function isValidIndianPhone(phone: string): boolean {
  return PHONE_RE.test(phone.trim());
}

export interface BookingFormInput {
  prayerSlug: string;
  name: string;
  gotra: string;
  city: string;
  reason: string;
  phone: string;
}

/**
 * Returns the list of missing/invalid fields (using the same wording the form
 * shows in its error banner). An empty array means the input is ready to pay.
 */
export function validateBookingInput(input: BookingFormInput): string[] {
  const missing: string[] = [];
  if (input.prayerSlug === "") missing.push("choose a prayer");
  if (input.name.trim().length <= 1) missing.push("your name");
  if (input.gotra.trim().length === 0) missing.push("gotra");
  if (input.city.trim().length <= 1) missing.push("city");
  if (input.reason.trim().length <= 2) missing.push("why you want this puja");
  if (!isValidIndianPhone(input.phone))
    missing.push("a valid 10-digit mobile number");
  return missing;
}
