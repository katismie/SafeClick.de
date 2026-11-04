# Cookiebot + Meta Pixel implementation review

This draft builds on the legal-page branch in PR #1. Merge/rebase that work first; do not deploy incomplete legal drafts. Latest main observed: 2e8437ed40eaa6d63517d79520e0c5d187e27b3f. Main has since removed placeholder paragraphs from the accordion; resolve that legal-section overlap when updating PR #1. No main branch, account settings or deployment configuration was changed here.

## Configuration supplied by the user
- Website hostname: katismie.github.io (project path /SafeClick.de/)
- Cookiebot CBID: 27874671-143a-44bb-8945-e260de6c4925
- Meta Pixel ID: 1686772673495132
These are public client-side identifiers, not credentials.

## Behavior
Cookiebot is the first script in head on index, Impressum and Datenschutz, with auto blocking, strict category opt-in and German language. Google Consent Mode is disabled because no Google advertising is configured.
The local consent controller is marked ignore so it can process refusal/revocation, but explicitly gates all Meta code. Only a true hasResponse, consent.method=explicit and consent.marketing=true can load fbevents.js. An unavailable CMP fails closed for Meta.
Only the landing page enables Meta. No Meta noscript image, preconnect or preload is present. PageView is sent once after SDK load. The CTA emits MehrErfahrenClick via trackSingleCustom for this pixel. No earlier clicks are buffered or replayed. Repeated real activations are separate events, not unique people.
Automatic pixel configuration is disabled before init; no advanced-matching fields or custom event parameters are supplied. The vendor may still transmit URL/browser/network/attribution information, as described in the privacy draft.
On withdrawal, revoke is sent, reachable _fbp/_fbc cookies are expired on the host and current path prefixes, and a document that loaded Meta reloads to unload vendor code. The consent cookie is rechecked on clicks and return to page to detect a change in another tab. Requests already in flight cannot be recalled; third-party cookies/data cannot be erased by this site. No localStorage, cross-site consent sharing, CAPI or tag manager is introduced.
Existing story wheel/key/touch controls and roll-text animation skip Cookiebot's dialog/widget.

## Verify before publication
1. Complete the unresolved legal facts in PR #1 and the new Meta/Cookiebot review paragraphs. Confirm the Cookiebot AVV, consent evidence retention, cookie lifetimes, subprocessors/transfers; Meta Art. 26 arrangement, current company address, retention and transfer safeguards. Provider pages do not substitute for actual contracts/settings. Meta documentation requests returned rate-limit/login restrictions during research; verify current terms in the account before approval.
2. Cookiebot dashboard: verify katismie.github.io, configure scan start at the actual /SafeClick.de/ URL (root may be empty), inspect all scan results, include required cookie disclosure, disable bulk/cross-domain sharing, and scope appropriately if other projects use this hostname.
3. Banner preview: German, Ablehnen and accept equally easy on the first layer, category controls visible, optional categories off by default, accessible legal links, privacy trigger on. Screenshots alone have not confirmed all these settings.
4. Meta Events Manager: turn automatic advanced matching and automatic event detection OFF. Remove duplicate installations/event-tool rules. No CAPI setup is needed.
5. Test a served preview on the registered hostname or a separately configured test hostname (localhost is not automatically registered). Use DevTools with preserve log and cache disabled:
   - Fresh/no answer, reject all, and statistics-only: zero connect.facebook.net or facebook.com/tr requests and no new Meta cookies; CTA and product demo still work.
   - Marketing acceptance: one SDK load, one PageView; each CTA activation after SDK readiness yields one MehrErfahrenClick. No past activations replay.
   - Persisted acceptance/rejection on navigation; legal pages: CMP works but no pixel or PageView.
   - Withdraw from CMP privacy button and footer; reload keeps Meta off, known first-party identifiers removed, later CTA events absent. Revoke while SDK is loading; fail/slow/block CMP or Meta; regrant; changed consent in another tab; no duplicate events.
   - Keyboard/mobile banner scrolling, focus, decline/accept/custom selection, and 3D story. Regression guards were added but live UI QA remains required.
6. Validate PageView and MehrErfahrenClick in Meta Test Events, subject to consent and blockers. Events measure activations, not unique visitors.
7. Publish only after legal/runtime review, then run Cookiebot Verify implementation against the actual project URL and repeat the fresh-browser network test. Review the displayed trial/plan terms in the account before relying on continued service; no subscription was purchased by this change.

## Automated verification
Run node tests/consent.test.cjs from the repository root. Tests use a controlled DOM/SDK substitute; no live requests or production events are sent. They cover missing/pending/refused/implied consent, grant/saved consent, duplicate CMP notifications, pre-consent/SDK-loading clicks, repeated clicks, revocation/load race, stale/cross-tab cookie choice, SDK failure, legal-page exclusion and integration markup. JavaScript syntax checks pass. This is not a live Cookiebot/Meta/browser verification.

## Official references
- https://www.cookiebot.com/en/developer/
- https://support.cookiebot.com/hc/en-us/articles/360004461894-Require-consent-before-loading-Facebook-pixel
- https://www.cookiebot.com/en/privacy-policy/
- https://developers.facebook.com/docs/meta-pixel/implementation/gdpr/
- https://www.facebook.com/privacy/policy/
- https://www.facebook.com/legal/controller_addendum
