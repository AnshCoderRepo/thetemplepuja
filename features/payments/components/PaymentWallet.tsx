"use client";

interface PaymentWalletProps {
  wallet: string;
  onWalletSelect: (wallet: string) => void;
}

const wallets = ["Paytm", "PhonePe", "Amazon Pay", "Mobikwik", "Freecharge"];

export default function PaymentWallet({ wallet, onWalletSelect }: PaymentWalletProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {wallets.map((w) => (
        <button
          key={w}
          type="button"
          onClick={() => onWalletSelect(w)}
          className={`rounded-lg border px-3 py-2.5 text-left text-xs font-semibold transition-all ${
            wallet === w
              ? "border-[#3395ff] bg-white text-[#0b245b] shadow-sm ring-2 ring-[#3395ff]/20"
              : "border-gray-200 bg-white text-gray-600 hover:border-[#3395ff]/40"
          }`}
        >
          {w}
        </button>
      ))}
    </div>
  );
}
