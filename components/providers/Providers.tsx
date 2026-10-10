"use client";

import { I18nProvider } from "./I18nProvider";
import { BookingModalProvider } from "./BookingModalContext";
import { RealtimeSyncProvider } from "./RealtimeSyncProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <RealtimeSyncProvider>
      <I18nProvider>
        <BookingModalProvider>
          {children}
        </BookingModalProvider>
      </I18nProvider>
    </RealtimeSyncProvider>
  );
}
