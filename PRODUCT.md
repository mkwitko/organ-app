# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React + Vite + Tailwind CSS + Firebase (Firestore, Anonymous Auth, Hosting). Chosen by the user.

## Users

- **Sócios** of a spiritist center (UDV), many on their phones, often older and not tech-savvy. They open a shared link (usually from WhatsApp) to say what they will bring to the snack of the next sessão.
- **Organizers (admin)** who set up the event, list the snack items needed, and check who is bringing what.

## Product Purpose

Replace the messy WhatsApp "who brings what" thread with a link where a member picks an item in as few taps as possible. Success: a member commits in under 10 seconds; the organizer sees a complete, accurate list without chasing people.

## Operating Context

- Link shared in the center's WhatsApp group; opened on phones, in a mobile browser.
- Several sessões over time, each with a name and date. The home page shows the next upcoming one.
- Items have a number of slots (e.g. "Bolo — 3 pessoas"); full items stop being offered. Members can also write a free-form item.

## Capabilities and Constraints

- Member identity is just a typed name, remembered on the device. No account, no login screen.
- Admin area at `/admin`, for organizers who sign in with email/password. Accounts and the admin list are managed only in the Firebase console.
- Admin: create events, add/remove items with slot counts, see and remove sign-ups, copy the list to share on WhatsApp.
- Language: Brazilian Portuguese only. UI calls each event a "sessão".

## Brand Commitments

None recorded. Tone should be warm, simple and respectful of a religious community; no gamification.

## Evidence on Hand

No logo, photos or existing brand assets. Do not invent any.

## Product Principles

1. Fewest taps wins: the member's whole job is "tap an item".
2. Nothing to learn: big targets, plain words, no jargon.
3. The organizer's list is always the truth.

## Accessibility & Inclusion

Older users: large text and touch targets, high contrast, no reliance on color alone.
