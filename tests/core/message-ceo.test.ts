import { describe, expect, it } from "vitest";
import { saveCeoMessage, listCeoMessages } from "@/lib/server-store";

describe("Message the CEO Service", () => {
  it("saves a valid message directed to the CEO", async () => {
    const msg = await saveCeoMessage({
      name: "Rohit Agrawal",
      contact: "+91 9876543210",
      subject: "Suggestion for Live Darshan",
      message: "Please provide multi-camera view angles during the holy Rudrabhishek.",
    });

    expect(msg.id).toMatch(/^CEO-/);
    expect(msg.name).toBe("Rohit Agrawal");
    expect(msg.contact).toBe("+91 9876543210");
    expect(msg.subject).toBe("Suggestion for Live Darshan");
    expect(msg.status).toBe("new");
    expect(msg.createdAt).toBeDefined();

    const all = await listCeoMessages();
    const found = all.find((m) => m.id === msg.id);
    expect(found).toBeDefined();
    expect(found?.name).toBe("Rohit Agrawal");
  });

  it("handles messages without a subject", async () => {
    const msg = await saveCeoMessage({
      name: "Meenakshi Sundaram",
      contact: "meenakshi@example.com",
      message: "Thank you for the wonderful sankalp recitation and swift prasad delivery.",
    });

    expect(msg.id).toBeTruthy();
    expect(msg.subject).toBeUndefined();
    expect(msg.message).toContain("swift prasad delivery");
  });

  it("updates message status accurately (new -> read -> responded)", async () => {
    const { updateCeoMessageStatus } = await import("@/lib/server-store");
    const msg = await saveCeoMessage({
      name: "Anand Sharma",
      contact: "+91 96210 14155",
      subject: "Pooja booking feedback",
      message: "Pandit ji performed the puja with great devotion.",
    });

    expect(msg.status).toBe("new");

    const readSuccess = await updateCeoMessageStatus(msg.id, "read");
    expect(readSuccess).toBe(true);

    const respondedSuccess = await updateCeoMessageStatus(msg.id, "responded");
    expect(respondedSuccess).toBe(true);

    const all = await listCeoMessages();
    const updated = all.find((m) => m.id === msg.id);
    expect(updated?.status).toBe("responded");
  });
});

