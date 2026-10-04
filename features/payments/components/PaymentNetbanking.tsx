"use client";

interface PaymentNetbankingProps {
  bank: string;
  onBankSelect: (bank: string) => void;
}

const banks = [
  "State Bank of India",
  "HDFC Bank",
  "ICICI Bank",
  "Axis Bank",
  "Kotak Mahindra Bank",
  "Punjab National Bank",
  "Yes Bank",
  "Paytm Payments Bank",
];

export default function PaymentNetbanking({ bank, onBankSelect }: PaymentNetbankingProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {banks.map((b) => (
        <button
          key={b}
          type="button"
          onClick={() => onBankSelect(b)}
          className={`rounded-lg border px-3 py-2.5 text-left text-xs font-semibold transition-all ${
            bank === b
              ? "border-[#3395ff] bg-white text-[#0b245b] shadow-sm ring-2 ring-[#3395ff]/20"
              : "border-gray-200 bg-white text-gray-600 hover:border-[#3395ff]/40"
          }`}
        >
          {b}
        </button>
      ))}
    </div>
  );
}
