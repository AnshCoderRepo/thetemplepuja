"use client";

import { CreditCard, Landmark, Smartphone, Wallet } from "lucide-react";
import type { PaymentTab } from "../types/payment.types";

interface PaymentMethodTabsProps {
  activeTab: PaymentTab;
  onTabChange: (tab: PaymentTab) => void;
}

const tabs: { id: PaymentTab; label: string; icon: typeof Smartphone }[] = [
  { id: "upi", label: "UPI", icon: Smartphone },
  { id: "card", label: "Card", icon: CreditCard },
  { id: "netbanking", label: "Netbanking", icon: Landmark },
  { id: "wallet", label: "Wallet", icon: Wallet },
];

export default function PaymentMethodTabs({ activeTab, onTabChange }: PaymentMethodTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Payment method"
      className="flex border-b border-gray-100 bg-[#f3f7fa]"
    >
      {tabs.map((t) => {
        const Icon = t.icon;
        const active = activeTab === t.id;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={active}
            onClick={() => onTabChange(t.id)}
            className={`flex flex-1 flex-col items-center gap-1 border-b-2 pb-2.5 pt-3 text-[11px] font-semibold transition-colors ${
              active
                ? "border-[#3395ff] text-[#0b245b]"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            <Icon className="h-4 w-4" />
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
