# Stripe Payment Completion: Emails + Slack Notifications

## Context

The academy registration flow (`/academy/:id/register`) already has a complete Stripe integration:
- Frontend: 3-step form (info → payment → success) with Stripe Elements (card + Bancontact)
- Backend: PaymentIntent creation + webhook handler that creates registration records

**Problem**: The flow doesn't work because Stripe environment variables aren't configured. Additionally, after successful payment, no email is sent to the participant and no notification goes to the team.

**Goal**: Make the payment flow operational end-to-end with confirmation emails and Slack notifications.

## What Already Exists

| Component | File | Status |
|-----------|------|--------|
| Registration form + Stripe Elements | `app/frontend/pages/Academy/Registration.jsx` | Complete |
| PaymentIntent creation | `app/controllers/api/v1/public/academy_registrations_controller.rb` | Complete |
| Webhook (creates registration) | `app/controllers/api/v1/public/stripe_webhooks_controller.rb` | Complete, needs email + Slack |
| Stripe config | `config/initializers/stripe.rb` | Complete, needs env vars |
| Mailer infrastructure | `app/mailers/application_mailer.rb`, AWS SES in prod, letter_opener in dev | Complete |
| Email layout | `app/views/layouts/mailer.html.erb` | Complete (Semisto branded) |
| Success page | Registration.jsx lines 264-291 | Complete |

## Design

### 1. Environment Variables

| Variable | Purpose | Where read |
|----------|---------|-----------|
| `STRIPE_SECRET_KEY` | Stripe API key (server) | `config/initializers/stripe.rb` |
| `STRIPE_PUBLISHABLE_KEY` | Stripe key (client) | `app/controllers/app_controller.rb` |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature verification | `stripe_webhooks_controller.rb` |
| `SLACK_WEBHOOK_URL` | Incoming Webhook URL for notifications | New `SlackNotifier` service |

First three already have reading code. Only `SLACK_WEBHOOK_URL` is new.

### 2. AcademyMailer — Confirmation Email

**File**: `app/mailers/academy_mailer.rb`

Single method `registration_confirmation(registration)` following `MemberMailer` pattern:
- Loads training with sessions
- Resolves location names via `Academy::TrainingLocation.where(id: sessions.flat_map(&:location_ids).uniq)` (same pattern as `academy_registrations_controller.rb` lines 28-32)
- Sets `@registration`, `@training`, `@sessions`, `@locations`, `@amount_paid`
- Subject: `"Confirmation d'inscription — #{@training.title}"`
- Sent to `registration.contact_email`
- Note: `contact_name` is a full name (e.g. "Marie Martin"), not split first/last. Use as-is for greeting.

**Email content** (essential only):
- Greeting with contact_name
- Payment confirmed message
- Activity title, dates (first→last session), location(s), amount paid
- If deposit (payment_status == "partial"): note about remaining balance
- No CTA button needed

**Templates**:
- `app/views/academy_mailer/registration_confirmation.html.erb` — follows `password_reset.html.erb` style (h2 in #234766, inline CSS)
- `app/views/academy_mailer/registration_confirmation.text.erb` — plain text equivalent

### 3. SlackNotifier Service

**File**: `app/services/slack_notifier.rb`

Simple PORO using `Net::HTTP` POST to Slack Incoming Webhook URL. No gem dependencies.

```ruby
class SlackNotifier
  def self.post(text:, url: nil)
    webhook_url = url || ENV["SLACK_WEBHOOK_URL"]
    return if webhook_url.blank?
    # POST JSON { text: ... } to webhook_url
    # Rescue all errors — Slack is non-critical
  end
end
```

Design decisions:
- Fire-and-forget: errors logged but swallowed (registration must never fail because of Slack)
- Inline call (not backgrounded) — webhook handler is server-to-server, ~200ms is fine
- Generic interface reusable across the app

### 4. Webhook Controller Changes

**File**: `app/controllers/api/v1/public/stripe_webhooks_controller.rb`

Modifications to `handle_payment_intent_succeeded`:
1. Hoist `registration` variable above transaction block (`registration = nil` before the block)
2. After transaction block closes (no rescue around it — if transaction raises, method exits without sending notifications):
   - `AcademyMailer.registration_confirmation(registration).deliver_later`
   - `notify_slack(registration)` (private method formatting the Slack message)

Critical: both calls are **outside** the transaction — a notification failure must not roll back the registration. If the transaction raises an exception, it propagates past the notification calls so they never execute.

Note on `deliver_later`: No explicit Active Job queue adapter is configured — Rails defaults to `:async` (in-process thread pool). This is adequate for this volume. The webhook is server-to-server so the response time of `deliver_later` (near-instant enqueue) does not impact user experience.

Slack message format (use `sprintf("%.2f", amount)` for consistent formatting):
```
:tada: Nouvelle inscription !
*Marie Martin* s'est inscrit(e) à *Introduction à la permaculture*
Montant payé : 250.00 EUR (paiement complet)
```

### 5. No Frontend Changes

The success page already shows "Inscription confirmée !" and "Vous recevrez un e-mail de confirmation prochainement." — no changes needed.

## Files to Create/Modify

| File | Action |
|------|--------|
| `app/mailers/academy_mailer.rb` | Create |
| `app/views/academy_mailer/registration_confirmation.html.erb` | Create |
| `app/views/academy_mailer/registration_confirmation.text.erb` | Create |
| `app/services/slack_notifier.rb` | Create |
| `app/controllers/api/v1/public/stripe_webhooks_controller.rb` | Modify |
| `test/integration/academy_registration_test.rb` | Modify (add email assertion with `include ActiveJob::TestHelper` + `assert_enqueued_emails`) |

**No gems added. No migrations. No frontend changes.**

## Verification

### Local testing
1. Set Stripe test keys in `.env`
2. Run `stripe listen --forward-to localhost:3000/api/v1/public/stripe-webhooks`
3. Set `STRIPE_WEBHOOK_SECRET` to the `whsec_...` output
4. Navigate to `/academy/:id/register`, fill form, pay with test card `4242 4242 4242 4242`
5. Email opens in browser via letter_opener
6. Set `SLACK_WEBHOOK_URL` to a test channel to verify Slack notification

### Automated tests
```bash
bin/rails test test/integration/academy_registration_test.rb
```
Existing webhook tests should pass + new email assertion verifies email is enqueued.

### Production
1. Configure env vars (Stripe live keys + webhook secret + Slack webhook URL)
2. Register webhook endpoint in Stripe Dashboard: `https://terranova.semisto.org/api/v1/public/stripe-webhooks` → subscribe to `payment_intent.succeeded`
3. Test with a real training with `registrations_open` status
