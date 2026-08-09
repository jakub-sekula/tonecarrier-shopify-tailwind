# toneScan purchase paths

> **The authority is now `agents/LICENSING-SPEC.md` in the electron-test repo, §6.** It was written
> after this document and supersedes it wherever they disagree, in particular the whole of section 6
> below (the beta discount sketch) and the mechanism details in P3/P6. What survives here is the path
> enumeration itself and the reasoning behind the settled decisions.

Every route a buyer can take through the pricing section, what the fulfilment Worker does with it,
and what the confirmation should say.

**Everything under "What happens" is read from the code**, in
`electron-test/infra/shop-fulfillment/src/` and `snippets/tonescan-scripts.liquid`. Anything not
yet decided is marked **DECIDE**. Nothing here is inferred from how it ought to work.

---

## 1. How a purchase resolves

`fulfilNew()` picks one of three outcomes, in this order. Both purchase types (perpetual via
`transaction.completed`, subscription via `subscription.*`) funnel through it.

1. **Trial handle.** `custom_data.trialHandle` is present and matches `metadata[upgradeHandle]` on a
   licence. Strongest signal there is: it names one specific licence, so it beats any email match.
2. **Beta licence for the email.** `custom_data.beta_email` if given, otherwise the Paddle customer
   email, matched against licences on the beta policy only. An already-paid licence can never match.
3. **Neither.** Mint a new licence.

Outcomes 1 and 2 both call `upgradeLicence()`, which **keeps the existing key**. It moves the policy,
merges metadata, renames the licence to the buyer's email, and clears the one-time handle. The buyer's
installed app stays activated and never sees a new key.

Outcome 3 calls `createLicence()` and the key is new.

That distinction drives everything below: **on an upgrade there is no new key to reveal.**

## 2. How the page learns the outcome

Three independent signals, any of which can be the one that lands:

- `checkout.completed` from the Paddle overlay, carrying `transaction_id` and customer email.
- A redirect back with `?_ptxn=`, only if a success URL is configured (it is off by default,
  because the redirect fires immediately and cuts the reveal short).
- Neither, in which case there is nothing to poll with.

With a transaction id the page polls `GET /shop/key?txn=`, which answers one of four ways:

| Response | Meaning | Page today |
|---|---|---|
| `200 {key,email}` | Licence found, minted inside the reveal window | Reveals the key |
| `202 {status:"pending"}` | Not fulfilled yet, keep polling | Stays on "Almost there…" |
| `410 {status:"expired"}` | Found, but outside the reveal window | "Your key was issued earlier" |
| network error | Unreachable | "It's taking longer than usual" |

The reveal window is `KEY_REVEAL_WINDOW_S`, 1800s. It exists because the transaction id sits in the
buyer's URL and history, so a key is only served while it is plausibly still them at the screen.

---

## 3. The paths

### P1. Fresh purchase, perpetual. No history.

**What happens:** no handle, no beta match, `createLicence`. New key. `licenceEmail` sends
"Your toneScan licence key".
**Key situation:** new, and the buyer has never seen it.
**Page:** reveal the key. This is the state the confirmation was built for and it is correct today.

### P2. Fresh purchase, subscription. No history.

**What happens:** `subscription.created` (or `.activated` / `.trialing`) fulfils.
`transaction.completed` does **not** fulfil, by design, or it would double-fulfil. It only maps
`txn → licence` so the page can reveal the key.
**Key situation:** new.
**Page:** same as P1. But see **P15**, which breaks the reveal for this path specifically.

### P3. Trial upgrade, handle present and resolves. THE MAIN GAP.

**What happens:** `findLicenceByUpgradeHandle` finds the trial licence, `upgradeLicence` moves it to
the paid policy **keeping the same key**, clears `upgradeHandle` so it cannot be reused, and renames
the licence from `Trial <fingerprint>` to the buyer's email. `upgradeEmail` sends
"You're on the full version of toneScan".
**Key situation:** unchanged. It is already entered in the app they have open behind the browser.
**Page today:** treats it as a fresh purchase and either reveals the key as though it were new, or
410s and says it was issued earlier.

**DECIDE.** The email already takes a position worth matching. Its own comment:

> Beta upgrade-in-place: the customer's EXISTING key was moved onto a paid policy. Leading with the
> key would invite them to re-enter something that's already working, so this email leads with
> "nothing to do".

The same logic applies harder on the page, and **reaching this path at all proves where they are**.
The handle is only ever on the URL because the app appended it, so anyone in P3 is sitting at the
machine that holds the trial, with the app open behind the browser and the key already entered in it.
Someone buying from a different machine has no handle, does not take this path, and is P4.

**DECIDED: no key on the page. Still emailed, as confirmation.** The page sends them back to the app,
which is where the licence they already hold is about to start working. `upgradeEmail` continues to
carry the key for their records, so nothing is lost even if they carried the URL to another device.

Copy differs by where they came from, which the Worker already distinguishes as `upgradedFrom`:

| From | Line |
|---|---|
| Trial (P3) | Thank you for trying out toneScan. Your trial licence has been upgraded. Go back to the app to continue. |
| Beta (P6) | Thank you for helping us beta test. Your licence has been upgraded. Go back to the app to continue. |

`upgradedFrom` is set in `fulfilNew` and currently only reaches the licence metadata, so **the key
lookup needs to return it** for the page to pick the right line. Today `GET /shop/key` returns only
`{key, email}`.

The download button should go on this path. They already have the app installed, and it is the thing
they are being sent back to.

### P4. Trial upgrade, handle missing. SILENT FAILURE.

**Trigger:** the buyer reached the pricing page without `?trial=`. Opened it manually, navigated away
and back, switched browser, followed an old bookmark, or **bought from a different machine to the one
running the trial**. The handle is only ever appended by the app, so any route that does not start
with pressing Buy in the app lands here.
**What happens:** no handle, so it falls to the beta email match, which will not match a trial
licence (that lookup is scoped to the beta policy). **Mints a second licence.**
**Result:** the buyer pays, gets a new key by email, and their installed app still says trial until
they paste it in. Two licences on the account. No error anywhere, in Paddle or in the Worker.
**Page:** looks exactly like P1 and cannot tell the difference.

Passing `trialHandle` (done, commit `eb4641e2`) closes the common case. It does not close this one,
because the param has to be on the URL at all.

**DECIDED: leave it.** There is no way to match a trial to a buyer. A trial licence carries
`metadata: { fingerprint, kind: "trial", startedAt }` and is named `Trial <fingerprint-prefix>`. It
has **no email on it at all**, because trials are issued anonymously against a machine fingerprint,
so the email fallback that works for beta has nothing to match against here. Issuing a new key and
having them enter it in the app is the correct outcome, not a workaround.

**Follow-up, not blocking:** the trial licence is left orphaned, still on the trial policy and
expiring on its own. Worth a cleanup pass later. The hook is the fingerprint: `machine_fingerprint()`
is the same stable per-machine value used to node-lock a licence at activation, so once the buyer
activates the new paid licence on that machine, Keygen holds a machine under the paid licence whose
fingerprint equals the orphaned trial's `metadata.fingerprint`. A job can match on that and retire
the trial. Nothing needs to happen at purchase time.

### P5. Trial upgrade, handle present but matches nothing.

**Trigger:** a stale handle. It is one-time and cleared on use, so a second purchase from the same
URL carries a dead one.
**What happens:** `findLicenceByUpgradeHandle` returns null (it only throws if the Keygen request
itself fails, not on a no-match), logs `matched nothing`, and falls through. **Degrades to P4.**
**Page:** indistinguishable from P1.

### P6. Beta upgrade, bought under the beta email.

**What happens:** `findBetaLicence` matches on the beta policy, `upgradeLicence` keeps the key,
`upgradeEmail` sends.
**Key situation:** unchanged, same as P3.
**Page:** same decision as P3. From the Worker's side these are one case; only `upgradedFrom` differs
(`"trial"` vs `"beta"`), and that is recorded for support, not for the page.

### P7. Beta upgrade, bought under a different email.

**What happens:** `custom_data.beta_email` exists in the Worker precisely for this and takes priority
over the customer email. **The storefront never sends it.** Without it the beta lookup uses the
purchase email, finds nothing, and mints a new licence.

**DECIDED: leave it.** They get a new licence and enter it in the app, the same as any other buyer.
No beta address is collected at checkout. The `beta_email` support stays in the Worker for anything
driven by hand, but nothing on the storefront populates it.

### P8. Repeat purchase by an existing paid customer.

**What happens:** no handle. `findBetaLicence` is scoped to the beta policy, so a paid licence never
matches. **Mints a second paid licence.** No duplicate guard on the customer.

**DECIDED: leave it.** Two licences on one email is a legitimate purchase, not an error to block.
**Follow-up:** they need to be tellable apart. Both are minted by `createLicence` with the same name
(the buyer's email) and metadata that differs only by transaction id, so a support request about
"my key" cannot be resolved without cross-referencing Paddle. Worth stamping something ordinal or
naming them distinctly at creation.

### P9. Duplicate transaction replay.

**What happens:** `findByTransaction` guard returns `duplicate_transaction`. No second licence.
**Page:** reveals the existing key normally. Correct as is.

### P10. Unknown price. SILENT FAILURE.

**Trigger:** a price added in the Paddle dashboard without updating `PRICE_MAP`.
**What happens:** logs `UNKNOWN PRICE`, **no licence created**, and acknowledges so Paddle stops
retrying.
**Page:** polls, gets 202 forever, times out, and says the key will be emailed. **No email is coming.**

#### Proposed fix: make it fail like P11 instead of acking

The whole problem is that this path throws away the one mechanism that already handles a failed
purchase correctly. P11 dead-letters, returns 500, Paddle retries for about three days, and the
page's email-fallback copy is *true* because the email really does arrive when a retry succeeds. P10
has the same shape (buyer charged, no licence) but opts out of it by acking.

**1. Throw instead of returning.** In both `onSubscription` and `onPerpetual`, replace the
`return { status: "unknown_price" }` with a throw. The existing outer handler then writes the
`fail:<eventId>` dead letter with the full event payload and returns 500.

- The operator adds the price to `PRICE_MAP` and deploys. The next retry fulfils normally and the
  licence email sends. **Nothing is replayed by hand and no state is patched.**
- The page needs no new state at all. The buyer sees the existing "it's taking longer than usual, we
  will send it via email" fallback, and fixing the map makes that sentence true.
- Safe for mixed carts: `planForItems` returns the **first** item whose price maps, so null means no
  item in the purchase is a recognised licence price. A licence bought alongside an unmapped extra
  still matches and still fulfils. This is only reached when nothing in the basket is recognised.

**2. Add an explicit way to say "not a licence".** With (1) alone, the only way to stop a genuine
non-licence sale from retrying for three days is to map its price to a plan, which would mint a
licence for it. So allow `PRICE_MAP` to carry `"ignore"` as a value (or a separate
`IGNORE_PRICE_IDS`), and ack cleanly on those. Silencing a price becomes a deliberate act rather
than the accidental default it is now.

**3. Alert when anything dead-letters.** The retry window is only worth having if somebody looks
inside it. The `fail:` key already exists but the admin dashboard that reads it is noted in the code
as not built, so today a dead letter is invisible. The Worker already has `sendMail`, so mailing the
support address on dead-letter closes the loop cheaply. Without this, (1) converts a silent permanent
failure into a silent three-day one.

Point 3 is not specific to P10. It applies to every dead letter, P11 included, and is the smaller
and more generally useful of the three changes.

### P11. Webhook failure, dead letter.

**Trigger:** Keygen down, expired token, transient error.
**What happens:** 500, written to `fail:<eventId>`, Paddle retries for about three days. Usually
resolves on a retry.
**Page:** times out to the email fallback, which is **accurate here**. The email arrives when a retry
succeeds. Correct as is.

### P12. Payment declined or checkout error.

**What happens:** `checkout.error`. No transaction, no fulfilment.
**Page:** red band under the pricing cards, which stay up because they have not bought anything.
Correct as is.

### P13. Overlay closed without buying.

**Page:** nothing. Deliberate, per the code comment: closing is a decision, not a fault. Correct as is.

### P14. Stale success URL, reveal window elapsed.

**Trigger:** returning to a success URL more than 30 minutes later.
**What happens:** 410.
**Page:** "Your key was issued earlier." Correct as is, and this is the state the copy was written for.

### P15. Subscription purchase where the transaction event beats the subscription event.

**What happens:** subscription licences are stamped `paddleSubscriptionId`, never
`paddleTransactionId`, so `findByTransaction` can never find one. The page's only route to the key is
the `txn:` KV record that `mapSubscriptionTxn` writes, and that is explicitly best-effort: if the
subscription event has not landed yet there is nothing to map and it returns `mapped: false`.
**Result:** the reveal silently becomes unavailable for that purchase and the page falls back to email.
**DECIDE:** whether to retry the mapping from the subscription handler once the licence exists.

### P16. No transaction id.

**Trigger:** overlay completes without one, or no key URL is configured on the section.
**What happens:** nothing to poll with.
**Page:** goes straight to the email fallback. Correct as is.

---

## 4. The bug that sits across P3 and P6

`handleKeyLookup` returns 410 when the mint time is missing or older than the reveal window. When the
KV `txn:` record is not readable at poll time it falls back to the licence's own `created` date, on
this stated assumption:

> Prefer the licence's own creation time — it exists even when the KV record doesn't, and it can't be
> older than the purchase.

True for a new purchase. **False for every upgrade**, where the licence is the original trial or beta
one and is days or months old. So an upgrade 410s whenever the KV fast path misses, and whether it
misses is a race between the webhook and the first poll.

This is why upgrades currently look like P14. The "issued earlier" copy happens to read correctly for
an upgrade, which is why it passed testing rather than surfacing as a bug.

**It has to be fixed either way**, because it decides P3 non-deterministically: webhook first and the
page reveals the key, poll first and it does not. Option (a) above needs the reveal to work reliably;
option (b) needs it to reliably not happen.

---

## 5. Summary of what needs deciding

## 6. Beta tester discount

> **SUPERSEDED, awaiting a spec.** The sketch below reuses the trial handle and the `?trial=` param
> for beta upgrades, which is wrong: a beta upgrade involves no trial, and the naming would carry that
> confusion into both the app and the Worker. A proper spec is coming from the app side. What stays
> valid is the argument against gating on the buyer's email, and the verified discount field shapes.
> Treat the flow itself as a strawman.

Beta testers should see a reduced price. The obvious shape is a query param on the app's upgrade
link that switches the page to discounted prices, with the Worker only honouring the discount if the
buyer's email matches a beta licence.

**The email check is the wrong gate**, for three reasons:

1. **The money has already moved.** By the time a webhook can compare emails, the buyer has been
   charged the discounted amount. Refusing to honour it means refunding them or handing them less
   than they paid for. There is no good branch.
2. **It contradicts P7.** A beta tester buying under a different address was just accepted as
   "new licence, no special handling". Gating a discount on the same match reintroduces that
   fragility in the one place where it costs the buyer money.
3. **A param is forgeable.** Anyone can type `?beta=1`. The check would have to happen after payment
   precisely because the front end cannot be trusted, which is what creates problem 1.

### Gate on the handle instead

`POST /upgrade-handle` takes **any** licence key, not only a trial's, and `findLicenceByUpgradeHandle`
has no policy filter. So a beta tester's app can already mint a handle from their beta key exactly as
a trial user does, and that handle is server-minted proof they hold a beta licence. It is the thing
actually being rewarded, and unlike an email it cannot be typed into a URL bar.

**Flow:**

1. App mints a handle from the beta key and opens `?trial=<handle>#pricing`, as it already does for
   trials.
2. Storefront calls a new `GET /shop/offer?handle=…`. The Worker resolves the handle to a licence and
   answers with what it entitles: `{ kind: "trial" }` or `{ kind: "beta", discountId, discountCode }`.
3. For a beta licence with no discount yet, the Worker creates one and stamps the code onto the
   licence metadata, so asking twice returns the same code rather than minting a second.
4. Storefront shows the discounted prices and passes the discount into checkout.

**Discount shape** (verified against the sandbox API, `client.discounts.create`):

| Field | Value | Why |
|---|---|---|
| `usage_limit` | `1` | One redemption. A leaked code burns the tester's own discount and nobody else's. |
| `restrict_to` | the paid price IDs | Cannot be turned on something else later. |
| `expires_at` | a window after issue | Limits the value of a leaked code. |
| `mode` | `custom` | Keeps per-tester codes out of the dashboard catalog. |
| `custom_data` | `{ licenceId }` | Ties the code back to who it was for, for support. |
| `type` / `amount` | `percentage`, TBD | **DECIDE the number.** |

**The residual leak, worth accepting:** the code reaches the browser, so it can be copied and passed
on. `usage_limit: 1` means the first redemption wins, which costs the tester their own discount and
nobody else anything. Since the code is stamped on the licence, support can reissue. Engineering
around this is not worth it.

**To confirm when building:** the Paddle.js parameter names for carrying a discount into
`Checkout.open` and into `PricePreview`, so the displayed price and the charged price agree. The
displayed price must come from `PricePreview` **with the discount applied**, not from arithmetic.

### Still open

| # | Decision | Affects |
|---|---|---|
| 1 | Fix the 410 fallback so upgrades stop racing | P3, P6 |
| 2 | The beta discount percentage | Section 6 |
| 3 | Subscription reveal depends on event ordering | P15 |

Decision 1 is now the blocker for the upgrade copy. "Go back to the app" has to appear every time an
upgrade happens, and today whether the page sees the upgrade at all is a race between the webhook and
the first poll.

### Settled

| Path | Decision |
|---|---|
| P3, P6 | No key on the page. Emailed as before. Send them back to the app, with copy split by trial vs beta. |
| P4, P5 | Leave. A trial has no email to match on, so a new key is the correct outcome. |
| P7 | Leave. New licence, no beta address collected at checkout. |
| P8 | Leave. Two licences on one email is valid. |
| P10 | Fix as proposed above: throw, ignore-list, alert. |
| Discount | Only that the buyer's email is the wrong gate. The mechanism awaits a spec from the app side. |

### Follow-ups, not blocking

| From | Work |
|---|---|
| P4 | Retire orphaned trial licences, matched by machine fingerprint. |
| P8 | Make two licences on one email tellable apart at a glance. |
| P10 | Alert on dead letter. Applies to P11 too, and is worth doing on its own. |
