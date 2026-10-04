"use client";

interface PaymentUpiProps {
  vpa: string;
  onVpaChange: (val: string) => void;
  inputCls: string;
}

const upiApps = [
  { name: "GPay", bg: "bg-[#00b962]", letter: "G" },
  { name: "PhonePe", bg: "bg-[#5f259f]", letter: "P" },
  { name: "Paytm", bg: "bg-[#00baf2]", letter: "P" },
  { name: "BHIM", bg: "bg-[#0088ca]", letter: "B" },
];

export default function PaymentUpi({ vpa, onVpaChange, inputCls }: PaymentUpiProps) {
  return (
    <>
      <div className="flex items-center gap-2.5">
        {upiApps.map((app) => (
          <button
            key={app.name}
            type="button"
            onClick={() => onVpaChange("")}
            title={app.name}
            className="group flex flex-col items-center gap-1"
          >
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-full ${app.bg} text-sm font-bold text-white shadow transition-transform group-hover:scale-110`}
            >
              {app.letter}
            </span>
            <span className="text-[10px] font-medium text-gray-500">
              {app.name}
            </span>
          </button>
        ))}
      </div>
      <div>
        <label className="mb-1 block text-[11px] font-semibold text-gray-500">
          UPI ID
        </label>
        <input
          value={vpa}
          onChange={(e) => onVpaChange(e.target.value)}
          placeholder="yourname@okhdfcbank"
          inputMode="email"
          autoFocus
          className={inputCls}
        />
      </div>
      <p className="text-[11px] text-gray-400">
        You will receive a collect request on your UPI app. Enter your UPI PIN to complete the payment.
      </p>
    </>
  );
}
