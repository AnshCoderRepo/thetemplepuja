import {
  cancelBooking,
  mergeUserFromServer,
  removeBooking,
  rescheduleBooking,
  upsertBooking,
  type BookingInput,
  type RescheduleInput,
  type UserProfile,
} from "@/lib/storage";

export async function submitBooking(
  input: BookingInput
): Promise<{ ok: boolean; status?: number; user?: UserProfile }> {
  try {
    const res = await fetch("/api/users/booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const body = (await res.json().catch(() => ({}))) as { user?: UserProfile };
    if (res.ok && body.user) {
      mergeUserFromServer(body.user);
      return { ok: true, user: body.user };
    }
    removeBooking(input.phone, input.booking.bookingId);
    return { ok: false, status: res.status };
  } catch {
    const localUser = upsertBooking(input);
    return { ok: true, user: localUser };
  }
}

export async function cancelBookingRemote(
  phone: string,
  bookingId: string
): Promise<{ ok: boolean; user?: UserProfile }> {
  const local = cancelBooking(phone, bookingId);
  try {
    const res = await fetch("/api/users/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, bookingId }),
    });
    const body = (await res.json().catch(() => ({}))) as { user?: UserProfile };
    if (res.ok && body.user) {
      mergeUserFromServer(body.user);
      return { ok: true, user: body.user };
    }
    return { ok: local.ok, user: local.user };
  } catch {
    return local;
  }
}

export async function rescheduleBookingRemote(
  phone: string,
  bookingId: string,
  next: RescheduleInput
): Promise<{ ok: boolean; user?: UserProfile }> {
  const local = rescheduleBooking(phone, bookingId, next);
  try {
    const res = await fetch("/api/users/reschedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, bookingId, ...next }),
    });
    const body = (await res.json().catch(() => ({}))) as { user?: UserProfile };
    if (res.ok && body.user) {
      mergeUserFromServer(body.user);
      return { ok: true, user: body.user };
    }
    return { ok: local.ok, user: local.user };
  } catch {
    return local;
  }
}
