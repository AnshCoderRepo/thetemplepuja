"use client";

interface CardState {
  number: string;
  name: string;
  expiry: string;
  cvv: string;
}

interface PaymentCardProps {
  card: CardState;
  onCardChange: React.Dispatch<React.SetStateAction<CardState>>;
  inputCls: string;
}

function formatCardNumber(v: string) {
  return v.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");
}

function formatExpiry(v: string) {
  const digits = v.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return digits.slice(0, 2) + "/" + digits.slice(2);
}

function detectBrand(num: string) {
  const d = num.replace(/\s/g, "");
  if (d.startsWith("4")) return "Visa";
  if (/^5[1-5]/.test(d)) return "Mastercard";
  if (/^3[47]/.test(d)) return "Amex";
  if (/^6/.test(d)) return "RuPay";
  return "";
}

export default function PaymentCard({ card, onCardChange, inputCls }: PaymentCardProps) {
  return (
    <>
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="text-[11px] font-semibold text-gray-500">
            Card Number
          </label>
          {detectBrand(card.number) && (
            <span className="rounded bg-white px-2 py-0.5 text-[10px] font-bold text-[#0b245b] shadow-sm">
              {detectBrand(card.number)}
            </span>
          )}
        </div>
        <input
          value={card.number}
          onChange={(e) =>
            onCardChange((c) => ({
              ...c,
              number: formatCardNumber(e.target.value),
            }))
          }
          placeholder="4242 4242 4242 4242"
          inputMode="numeric"
          autoFocus
          className={inputCls}
        />
      </div>
      <div>
        <label className="mb-1 block text-[11px] font-semibold text-gray-500">
          Name on Card
        </label>
        <input
          value={card.name}
          onChange={(e) =>
            onCardChange((c) => ({ ...c, name: e.target.value }))
          }
          placeholder="AARAV SHARMA"
          className={inputCls}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-[11px] font-semibold text-gray-500">
            Expiry
          </label>
          <input
            value={card.expiry}
            onChange={(e) =>
              onCardChange((c) => ({
                ...c,
                expiry: formatExpiry(e.target.value),
              }))
            }
            placeholder="MM/YY"
            inputMode="numeric"
            className={inputCls}
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-semibold text-gray-500">
            CVV
          </label>
          <input
            value={card.cvv}
            onChange={(e) =>
              onCardChange((c) => ({
                ...c,
                cvv: e.target.value.replace(/\D/g, "").slice(0, 4),
              }))
            }
            placeholder="•••"
            inputMode="numeric"
            type="password"
            className={inputCls}
          />
        </div>
      </div>
    </>
  );
}
