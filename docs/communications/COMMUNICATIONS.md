# FIKTA - Communication Module Specification

This document details the communication workflow, email templating system, and database logging specs for the **Communication Module** (`Fikta.Communications`).

---

## 1. Overview & Core Purpose

The Communication Module handles automated notifications, user account lifecycle emails, and marketing campaigns (such as sharing catalogs/collections with users).
To support the **Multi-Tenant White Label** structure, all communication emails are personalized dynamically using the sending Provider's logo, brand colors, custom domains, and support signatures.

---

## 2. Core Concepts & Database Entities

The communication domain is governed by four central concepts:

1.  **EmailTemplate**: Declares the structure, base HTML, and placeholders (e.g. `{{CustomerName}}`, `{{CatalogLink}}`) for a communication category.
2.  **EmailMessage**: Represents a specific email queue object to be dispatched, containing resolved HTML contents.
3.  **EmailDelivery**: Handles SMTP configuration, provider delivery credentials, and dispatch queues.
4.  **EmailDeliveryLog**: Audits the delivery process, recording delivery status, provider errors, retry counts, and timestamps.

---

## 3. Communication Case Studies & Scenarios

### 3.1. Customer Onboarding & Welcome
*   **Trigger**: Triggered automatically when a B2C Customer is added via direct admin panel import or synced from the ERP.
*   **Content**: Welcomes the customer, provides download links to mobile portals, and sets up login expectations.
*   **White Labeling**: Inherits the primary/secondary color schemes of the parent ISP and displays the ISP's official logo.

### 3.2. Platform Invitation
*   **Trigger**: Sent to a new admin operator or B2C customer who needs to initialize their password.
*   **Content**: Contains a unique, secure, tokenized invitation link (e.g. `https://books.myisp.com/invite?token=abc123xyz`).

### 3.3. Password Reset (Forgot Password)
*   **Trigger**: Requested from the B2C Portal or Admin login pages.
*   **Content**: Short-lived secure reset link (valid for 15 minutes).

### 3.4. Catalog Campaign (Catalog Sharing)
*   **Trigger**: Triggered by a Provider Admin to share a curated set of books, authors, or a newly licensed collection.
*   **Content**: Contains links, book covers, and brief descriptions of the featured books.
*   **Dynamic Customization**:
    *   The email template matches the provider's exact layout.
    *   The URL buttons point to the provider's custom domain (e.g. `https://books.provider.com/catalog/collection-gold`).
    *   Header image displays the provider logo.

---

## 4. Templating Engine Workflow

```
[Trigger Onboarding/Campaign]
             │
             ▼
[Resolve Provider Brand Identity] ──► (Logo URL, Colors, Domain, Contact Phone)
             │
             ▼
[Fetch Base EmailTemplate HTML]
             │
             ▼
[Inject Brand Variables into Base HTML CSS] (Customizes colors & header banner)
             │
             ▼
[Replace Template Variables] (e.g., {{CustomerName}}, {{InviteUrl}})
             │
             ▼
[Create EmailMessage Entity] (Queue for dispatch)
             │
             ▼
[Dispatch via SMTP/SendGrid/SES] ──► [Write EmailDeliveryLog (Success/Failure)]
```
