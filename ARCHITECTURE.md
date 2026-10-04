# Architecture & Technical Design Guide

## 1. Executive Summary

**The Temple Puja** (`templepujaseva`) is a full-stack Next.js 15 application engineered for booking Vedic Pujas, Chadhava, and Temple Sevas across revered Indian temples. The codebase is organized according to **Feature-Driven Architecture** and **Clean Component Separation**, adhering strictly to SOLID principles, high cohesion, low coupling, and robust backward compatibility.

---

## 2. Directory Structure Overview

```
templepujaseva/
├── app/                              # Next.js 15 App Router (Pages, Layouts, APIs)
│   ├── admin/                        # Admin portal route
│   ├── book/                         # Multi-step booking route
│   ├── booking/[bookingId]/          # Dynamic receipt & confirmation route
│   ├── pooja/[slug]/                 # Puja detail route
│   ├── temple/[slug]/                # Temple detail route
│   ├── profile/                      # Devotee profile & booking history
│   ├── login/                        # Devotee login route
│   ├── signup/                       # Devotee registration route
│   ├── forgot-password/              # Password recovery route
│   ├── privacy/ & terms/             # Legal & compliance routes
│   ├── layout.tsx                    # Root layout (Providers, Fonts, ErrorBoundary)
│   └── page.tsx                      # Landing / Home page
│
├── features/                         # Feature Modules (Domain-Driven)
│   ├── admin/                        # Admin dashboard, sidebar, devotee audit
│   │   ├── components/               # AdminDashboard, AdminSidebar, AdminHeader, AdminDevoteesTab
│   │   ├── types/                    # AdminTab, NavItem, AdminConfig
│   │   └── index.ts                  # Public barrel export
│   ├── auth/                         # Authentication & identity management
│   │   ├── api/                      # authApi.ts
│   │   ├── components/               # DevoteeLoginForm, DevoteeSignupForm, ForgotPasswordSteps, AdminLoginGate
│   │   ├── types/                    # auth.types.ts
│   │   └── index.ts
│   ├── bookings/                     # Booking workflow domain
│   │   ├── api/                      # bookingApi.ts
│   │   ├── components/               # BookingFlow, BookingDevoteeDetails, BookingDateSelect, BookingAddons, BookingSummarySection, BookingConfirmation
│   │   ├── services/                 # bookingService.ts (seat calculation, total calculations)
│   │   ├── types/                    # booking.types.ts
│   │   └── index.ts
│   ├── catalog/                      # Puja & Temple browsing catalog
│   │   ├── api/                      # catalogApi.ts
│   │   ├── components/               # PoojaCatalog, PoojaCard, PoojaFilters, PoojaExperience, UpcomingEvents
│   │   ├── hooks/                    # useCatalog.ts
│   │   ├── types/                    # catalog.types.ts
│   │   └── index.ts
│   ├── contact/                      # Contact, Support & WhatsApp Floating Action
│   │   ├── components/               # Contact, FloatingWhatsApp, AIGuide
│   │   └── index.ts
│   ├── devotees/                     # Devotee profiles & booking self-service
│   │   ├── api/                      # devoteeApi.ts
│   │   ├── components/               # DevoteeProfileView, DevoteeProfileCard, DevoteeBookingsList, BookingRescheduleForm, BookingCancelDialog, DevoteeLookupGate
│   │   ├── types/                    # devotee.types.ts
│   │   └── index.ts
│   ├── home/                         # Landing & Marketing presentation
│   │   ├── components/               # Hero, WhyChooseUs, Testimonials, FAQ, Deals, ExperienceSection
│   │   └── index.ts
│   ├── payments/                     # Razorpay integration & checkout UI
│   │   ├── api/                      # paymentApi.ts
│   │   ├── components/               # RazorpayCheckout, PaymentMethodTabs, CouponInput, PaymentUpi, PaymentCard, PaymentNetbanking, PaymentWallet
│   │   ├── services/                 # razorpayScript.ts
│   │   ├── types/                    # payment.types.ts
│   │   └── index.ts
│   └── receipts/                     # Booking invoices & receipts
│       ├── api/                      # receiptApi.ts
│       ├── components/               # BookingReceiptPage, BookingReceipt, ReceiptGate, ReceiptNotFound
│       ├── types/                    # receipt.types.ts
│       └── index.ts
│
├── components/                       # Shared & Cross-Feature UI Components
│   ├── common/                       # Generic, reusable UI primitives
│   │   ├── ErrorBoundary/            # Error boundary fallback wrapper
│   │   ├── SectionHeading/           # Standardized section headings
│   │   ├── Reveal/                   # Scroll-in reveal animations
│   │   ├── ScrollToTop/              # Interactive scroll-to-top floating control
│   │   ├── LanguageToggle/           # Multi-language selector (EN, HI, TE, TA)
│   │   ├── JsonLd/                   # JSON-LD SEO structured data renderer
│   │   └── index.ts                  # Public barrel export
│   ├── layout/                       # Structural layout components
│   │   ├── Header/                   # Header.tsx, index.ts
│   │   ├── Footer/                   # Footer.tsx, index.ts
│   │   ├── BookPageHeader/           # BookPageHeader.tsx, index.ts
│   │   └── index.ts                  # Layout barrel export
│   ├── providers/                    # Application context providers (I18n, Root)
│   │   ├── I18nProvider.tsx          # Multi-language translation context
│   │   ├── Providers.tsx             # Root client providers wrapper
│   │   └── index.ts
│   ├── admin/                        # Dedicated Admin sub-managers
│   ├── ui/                           # Reusable UI primitives (interactive accordions, testimonials)
│   └── [façades]                     # Re-export wrappers (Header.tsx, BookingFlow.tsx, etc.) ensuring 100% backward compatibility
│
├── hooks/                            # Shared Application Hooks
│   ├── useCopyToClipboard.ts         # Clipboard copying hook with timeout state
│   ├── useDebounce.ts                # Value debouncing hook
│   └── index.ts
│
├── lib/                              # Core Infrastructure & Data Access
│   ├── api.ts                        # Master client API bridge with fallback offline handling
│   ├── storage.ts                    # LocalStorage persistence & schema definitions
│   ├── server-store.ts               # Server-side persistent catalog & credentials store
│   ├── users-store.ts                # Server-side devotees, bookings & media persistence
│   ├── json-store.ts                 # Disk/Memory JSON fallback store
│   ├── mongo.ts                      # MongoDB driver client connection
│   ├── data.ts                       # Static fallback catalog & sample data
│   ├── format.ts                     # Currency (INR) & date formatting helpers
│   ├── validation.ts                 # Phone & input validators
│   ├── whatsapp.ts                   # Twilio WhatsApp notification client
│   └── razorpay.ts                   # Razorpay Node.js SDK server integration
│
└── tests/                            # Comprehensive Vitest Test Suite (189 tests)
```

---

## 3. Developer Guide: How to Work on This Codebase

### Where do I find code for...?
- **Navbar / Footer / Top Banner**: [components/layout/](file:///c:/Users/anshk/OneDrive/Desktop/templepujaseva/components/layout/)
- **Hero / Why Us / Testimonials / FAQ / Deals**: [features/home/](file:///c:/Users/anshk/OneDrive/Desktop/templepujaseva/features/home/)
- **Contact / WhatsApp Button / Pandit AI Guide**: [features/contact/](file:///c:/Users/anshk/OneDrive/Desktop/templepujaseva/features/contact/)
- **Booking Steps / Price Calculation**: [features/bookings/](file:///c:/Users/anshk/OneDrive/Desktop/templepujaseva/features/bookings/)
- **Razorpay UI / Payment Methods / Coupons**: [features/payments/](file:///c:/Users/anshk/OneDrive/Desktop/templepujaseva/features/payments/)
- **Receipts / Invoices**: [features/receipts/](file:///c:/Users/anshk/OneDrive/Desktop/templepujaseva/features/receipts/)
- **Devotee Dashboard / Rescheduling**: [features/devotees/](file:///c:/Users/anshk/OneDrive/Desktop/templepujaseva/features/devotees/)
- **Admin Dashboard / Navigation**: [features/admin/](file:///c:/Users/anshk/OneDrive/Desktop/templepujaseva/features/admin/)
- **Puja Catalog & Grid**: [features/catalog/](file:///c:/Users/anshk/OneDrive/Desktop/templepujaseva/features/catalog/)
- **Shared Primitives (ErrorBoundary, Reveal, ScrollToTop, LanguageToggle)**: [components/common/](file:///c:/Users/anshk/OneDrive/Desktop/templepujaseva/components/common/)
- **Shared Hooks (useDebounce, useCopyToClipboard)**: [hooks/](file:///c:/Users/anshk/OneDrive/Desktop/templepujaseva/hooks/)
- **Providers & I18n Context**: [components/providers/](file:///c:/Users/anshk/OneDrive/Desktop/templepujaseva/components/providers/)
- **Database / Server Persistence**: [lib/server-store.ts](file:///c:/Users/anshk/OneDrive/Desktop/templepujaseva/lib/server-store.ts) and [lib/users-store.ts](file:///c:/Users/anshk/OneDrive/Desktop/templepujaseva/lib/users-store.ts)

### How do I run tests & typechecks?
```bash
# Run all unit and integration tests (189 tests)
npm test

# Run TypeScript compilation check
npm run typecheck

# Run Next.js lint check
npm run lint
```
