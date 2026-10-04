"use client";

import { I18nProvider } from "./I18nProvider";
import { BookingModalProvider } from "./BookingModalContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <BookingModalProvider>
        {children}
      </BookingModalProvider>
    </I18nProvider>
  );
}
