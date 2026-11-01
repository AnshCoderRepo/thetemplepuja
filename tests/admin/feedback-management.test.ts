import { describe, expect, it } from "vitest";
import {
  createFeedback,
  getPublicApprovedFeedback,
  getAdminFeedback,
  updateFeedbackItem,
  deleteFeedbackItem,
  sanitizeText,
  type FeedbackItem,
} from "@/lib/feedback-store";

describe("User Feedback & Review System", () => {
  it("submits feedback successfully with default pending status and isFeatured=false", async () => {
    const feedback = await createFeedback({
      name: "Siddharth Verma",
      phone: "+91 98765 43210",
      email: "siddharth@example.com",
      message: "The Rudrabhishek ceremony was exceptionally divine and fulfilling.",
      rating: 5,
    });

    expect(feedback.id).toMatch(/^fb_/);
    expect(feedback.name).toBe("Siddharth Verma");
    expect(feedback.rating).toBe(5);
    expect(feedback.status).toBe("pending"); // MUST default to pending
    expect(feedback.isFeatured).toBe(false); // MUST default to false
    expect(feedback.createdAt).toBeDefined();

    // Verify it appears in Admin list under pending
    const adminRes = await getAdminFeedback({ status: "pending" });
    const found = adminRes.items.find((i) => i.id === feedback.id);
    expect(found).toBeDefined();
    expect(found?.status).toBe("pending");
    expect(found?.phone).toBe("+91 98765 43210");
  });

  it("does not expose pending feedback to the public landing page API", async () => {
    const pendingItem = await createFeedback({
      name: "Unapproved Devotee",
      message: "Testing unapproved feedback visibility.",
      rating: 4,
    });

    const publicList = await getPublicApprovedFeedback();
    const found = publicList.find((i) => i.id === pendingItem.id);
    expect(found).toBeUndefined(); // Pending MUST NOT be public
  });

  it("allows admin to approve feedback, which then appears publicly without phone/email", async () => {
    const item = await createFeedback({
      name: "Ananya Iyer",
      phone: "+91 91234 56789",
      email: "ananya.iyer@example.com",
      message: "Panditji conducted the Griha Pravesh with complete Vedic authenticity.",
      rating: 5,
    });

    // Admin approves the review
    const updated = await updateFeedbackItem(item.id, { status: "approved" });
    expect(updated).toBeDefined();
    expect(updated?.status).toBe("approved");

    // Check public approved list
    const publicList = await getPublicApprovedFeedback();
    const publicItem = publicList.find((i) => i.id === item.id);
    expect(publicItem).toBeDefined();
    expect(publicItem?.name).toBe("Ananya Iyer");
    expect(publicItem?.rating).toBe(5);
    expect(publicItem?.message).toContain("Griha Pravesh");

    // Privacy verification: phone and email MUST NOT be exposed
    expect((publicItem as unknown as FeedbackItem).phone).toBeUndefined();
    expect((publicItem as unknown as FeedbackItem).email).toBeUndefined();
  });

  it("allows admin to feature feedback and filters featured reviews", async () => {
    const item = await createFeedback({
      name: "Rameshwar Dayal",
      message: "Prasad delivery arrived in Varanasi within 48 hours, packed with Gangajal.",
      rating: 5,
    });

    // Approve and feature
    await updateFeedbackItem(item.id, { status: "approved", isFeatured: true });

    const featuredList = await getPublicApprovedFeedback({ featuredOnly: true });
    const featuredFound = featuredList.find((i) => i.id === item.id);
    expect(featuredFound).toBeDefined();
    expect(featuredFound?.isFeatured).toBe(true);

    // Un-feature
    await updateFeedbackItem(item.id, { isFeatured: false });
    const updatedFeaturedList = await getPublicApprovedFeedback({ featuredOnly: true });
    const unfeaturedFound = updatedFeaturedList.find((i) => i.id === item.id);
    expect(unfeaturedFound).toBeUndefined();
  });

  it("removes feedback from public display when admin rejects it", async () => {
    const item = await createFeedback({
      name: "Spam Submitter",
      message: "Check out this promotional link here.",
      rating: 1,
    });

    // Admin rejects
    await updateFeedbackItem(item.id, { status: "rejected" });

    const publicList = await getPublicApprovedFeedback();
    const found = publicList.find((i) => i.id === item.id);
    expect(found).toBeUndefined();

    // Verify it is categorized under Rejected in Admin
    const adminRes = await getAdminFeedback({ status: "rejected" });
    const adminFound = adminRes.items.find((i) => i.id === item.id);
    expect(adminFound).toBeDefined();
    expect(adminFound?.status).toBe("rejected");
  });

  it("allows admin to edit feedback content and delete it", async () => {
    const item = await createFeedback({
      name: "Kavita Rao",
      message: "Original message with minor typos.",
      rating: 4,
    });

    // Edit message and rating
    const edited = await updateFeedbackItem(item.id, {
      message: "Edited clean message with no typos.",
      rating: 5,
    });
    expect(edited?.message).toBe("Edited clean message with no typos.");
    expect(edited?.rating).toBe(5);

    // Delete review
    const deleted = await deleteFeedbackItem(item.id);
    expect(deleted).toBe(true);

    const adminCheck = await getAdminFeedback();
    const checkFound = adminCheck.items.find((i) => i.id === item.id);
    expect(checkFound).toBeUndefined();
  });

  it("sanitizes HTML tags and scripts to protect against XSS", () => {
    const malicious = "<script>alert('xss')</script><b>Sacred Puja</b>";
    const clean = sanitizeText(malicious);
    expect(clean).not.toContain("<script>");
    expect(clean).not.toContain("<b>");
    expect(clean).toContain("Sacred Puja");
  });

  it("clamps ratings strictly between 1 and 5", async () => {
    const low = await createFeedback({
      name: "Low Test",
      message: "Low rating test.",
      rating: -2,
    });
    expect(low.rating).toBe(1);

    const high = await createFeedback({
      name: "High Test",
      message: "High rating test.",
      rating: 10,
    });
    expect(high.rating).toBe(5);
  });
});

