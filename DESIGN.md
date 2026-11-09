---
name: Lanche (organ-app)
description: One-tap snack sign-up on leaf-green bands over a pale leaf ground, for older members on phones.
colors:
  mata: "oklch(0.975 0.012 140)"
  mata-alta: "oklch(0.935 0.025 140)"
  folha: "oklch(0.88 0.075 140)"
  folha-hover: "oklch(0.84 0.085 140)"
  tinta: "oklch(0.24 0.06 150)"
  tinta-suave: "oklch(0.38 0.05 150)"
  sol: "oklch(0.88 0.16 95)"
  musgo: "oklch(0.91 0.01 140)"
  nevoa: "oklch(0.3 0.04 150)"
  alerta: "oklch(0.5 0.16 35)"
typography:
  display:
    fontFamily: "Atkinson Hyperlegible, system-ui, sans-serif"
    fontSize: "3rem"
    fontWeight: 700
    lineHeight: 1.25
  headline:
    fontFamily: "Atkinson Hyperlegible, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
  title:
    fontFamily: "Atkinson Hyperlegible, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
  body:
    fontFamily: "Atkinson Hyperlegible, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
  numeral:
    fontFamily: "Atkinson Hyperlegible, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1
rounded:
  band: "1rem"
  small: "0.75rem"
spacing:
  band-x: "20px"
  band-y: "16px"
  gap: "12px"
components:
  band-open:
    backgroundColor: "{colors.folha}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.band}"
    padding: "16px 20px"
  band-open-hover:
    backgroundColor: "{colors.folha-hover}"
  band-mine:
    backgroundColor: "{colors.sol}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.band}"
    padding: "16px 20px"
  band-full:
    backgroundColor: "{colors.musgo}"
    textColor: "{colors.nevoa}"
    rounded: "{rounded.band}"
    padding: "16px 20px"
  button-primary:
    backgroundColor: "{colors.sol}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.band}"
    padding: "0 20px"
  button-primary-disabled:
    backgroundColor: "{colors.musgo}"
    textColor: "{colors.nevoa}"
  input:
    backgroundColor: "{colors.folha}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.band}"
    padding: "16px 20px"
  panel-admin:
    backgroundColor: "{colors.mata-alta}"
    textColor: "{colors.nevoa}"
    rounded: "{rounded.band}"
    padding: "20px"
---

# Design System: Lanche (organ-app)

## Overview

**Creative North Star: "The Leaf Band"**

Picking a snack is one tap on a leaf-green item card, never a form. A pale leaf ground carries a full-width grid of cards (user request 2026-11-09); each card says one thing: item, who, remaining slots.

**Key Characteristics:**
- Pale leaf ground, light green bands, dark green ink everywhere. Light theme chosen by the user (2026-11-09) for clarity.
- Sun yellow means "yours" or "do it", nothing else.
- Rows change state (open, mine, full) without leaving the list.
- Single 36rem column, Portuguese copy, one monumental numeral per band.

## Colors

Monochrome forest hue (~150) in four lightness steps, plus one sun-yellow and one warm alert.

### Primary
- **Sol** (oklch(0.88 0.16 95)): the member's own choice and the primary action (Levo, selection).

### Neutral
- **Mata** (oklch(0.975 0.012 140)): page ground. **Mata Alta** (0.935): raised panels, other people's extras, admin cards.
- **Folha** (oklch(0.88 0.075 140)): open bands, open admin rows. **Folha Hover** (0.84): hover on open band.
- **Tinta** (oklch(0.24 0.06 150)) / **Tinta Suave** (0.38): ink on light bands; placeholders.
- **Musgo** (oklch(0.91 0.01 140)): full items and disabled controls, with tinta-suave text. **Nevoa** (oklch(0.3 0.04 150)): body text on ground. Headings use tinta.
- **Alerta** (oklch(0.5 0.16 35)): error and destructive-adjacent text on ground only.

### Named Rules
**The Sun Rule.** Yellow appears only on the member's own selection and the primary action.
**The Ink Rule.** Dark green ink on every surface; never light text.

## Typography

**Font:** Atkinson Hyperlegible 400/700 (system-ui fallback), tabular numerals globally.

**Character:** Plain, open, built for legibility. Weight 700 carries hierarchy; size does the rest.

### Hierarchy
- **Display** (700, 2.25rem/3rem sm, leading-tight): event name, folha.
- **Headline** (700, 1.5rem): section titles ("O que você vai levar?").
- **Title** (700, 1.25rem): item names, inputs, date (400).
- **Body** (400, 1.125rem): helper text, labels, messages.
- **Numeral** (700, 2.25rem, leading 1): slots remaining, with a 0.875rem "faltam/falta" caption.

### Named Rules
**The Big Enough Rule.** Nothing under 0.875rem; interactive text is 1.125rem or larger.

## Layout

Full-width page, `max-w-7xl`, `px-4` (`px-8` sm). On lg the title and the name field sit side by side. Item cards form a grid: 2 columns on phones, 3 sm, 4 lg, 5 xl, min height 10rem, 0.75rem gap (1rem sm). Forms stay `max-w-xl`.

## Elevation & Depth

Tonal layering with one soft shadow. Ground, then mata-alta panels, then leaf bands.

- **Faixa** (`box-shadow: 0 2px 6px oklch(0.15 0.04 150 / 0.35)`): on tappable bands and the primary button only; removed when disabled. Full bands are flat.

## Shapes

Rounded 1rem (`rounded-2xl`) on every band, input, button and panel; 0.75rem on small inline buttons. No borders except inputs (1px tinta/30 ring). Focus is a 3px tinta outline with 3px offset.

## Components

### Item Band
Signature component. Item card (ItemBand). Three states of one card: **open** (folha, shadow, name top-left, numeral top-right, names at bottom, hover folha-hover, active scale 0.98), **mine** (sol, check icon, names, underlined "Desistir"), **full** (musgo, struck name, "completo"). Names of those bringing show below the item name. Transition 300ms ease-out on background and transform; disabled under reduced motion.

### Buttons
Primary: sol, tinta text, bold 1.125rem, 1rem radius, icon plus label. Disabled: musgo/tinta-suave, no shadow. Secondary actions are underlined text links with 4px offset.

### Inputs
White fill, 1px tinta/30 ring, tinta text, 1.25rem, tinta-suave placeholder; focus is the tinta outline.

### Admin panel
Mata-alta 1rem panels with 1.25rem padding for forms and event lists; alerta for errors.

## Do's and Don'ts

### Do:
- **Do** keep one message per band and state changes inside the same row.
- **Do** use Atkinson at 700 for hierarchy and 1.125rem minimum for body copy.
- **Do** use only the ten tokens in `@theme`.

### Don't:
- **Don't** use yellow for anything but "yours" or the primary action.
- **Don't** nest cards, or put borders on cards.
- **Don't** drop full items from the list; restyle them to musgo.

## Revision 2026-11-09 (supersedes conflicting lines above)

- **Font:** Atkinson Hyperlegible Next (variable), self-hosted via `@fontsource-variable/atkinson-hyperlegible-next`.
- **Surfaces:** cards are white (`papel`) on the pale leaf ground, with a hairline ring (`linha`, tinta at 10%) and the soft two-layer `shadow-faixa`; hover lifts to `shadow-ergue`. Radius 1.5rem on cards, 1rem on inputs and buttons.
- **Primary button:** tinta fill, white text, min height 3.5rem. Sol is no longer a button color; it marks only the member's own choice.
- **Item card states:** open = white card, name on top, count at the bottom. Mine = tinta card, white name, sol check badge with "Você vai levar", and a full-width outlined "Cancelar" button. Full = musgo card, "Completo".
- **Count:** one pill per needed person (filled = confirmed) plus text. Text is "Precisa de N" when nobody has confirmed, otherwise "Já tem X de N". Never "falta".
- **Privacy:** the member page never shows who brings what. Names appear only in `/admin` and in the copied WhatsApp list.
- **Member flow:** numbered steps "1. Seu nome" and "2. Toque no que você vai levar". After a pick, a tinta confirmation strip shows "Pronto! Você vai levar: …". Tapping an item without a name shows an alert under the name field and scrolls to it.

## Revision 2026-11-09 b (supersedes the card states above)

- **Icons:** every item has a food icon (`src/icons.js`, lucide, stroke 1.75, 28px) in a 3rem rounded tile. The admin picks it from a grid; until picked, it is suggested from the item name (`suggestIcon` in `src/lib.js`).
- **Select, then confirm:** tapping an open card only selects it (3px tinta ring + filled check circle; unselected cards show an empty circle). A fixed bottom bar shows "N itens escolhidos" and the **Confirmar** button, then "Confirmado! Obrigado." for 4 s. The bar overlays the page, so the layout never shifts; the page keeps 10rem bottom padding.
- **Confirmed card:** soft leaf fill (`folha` at 60%), white icon tile, "Você vai levar" with a check, and a white "Cancelar" button in alerta text. No dark cards on the member page.
- **Outra coisa:** a plain field; its text joins the same Confirmar action.
- **Outra coisa (rev c):** field plus an "Adicionar" button (mata-alta, secondary). Added entries show as removable chips with the same 3px tinta ring as a selected card, and count in the bar. Enter in the field opens the review.
- **Review dialog (rev c):** "Confirmar" opens a native `<dialog>`: "Está certo?", the member's name, each chosen thing with its icon, then "Sim, confirmar" (primary, autofocus) and "Voltar e mudar" (outlined). Only "Sim, confirmar" saves.
- **Admin item card (rev d):** pencil opens an inline editor (name, people, compact icon grid, Salvar/Cancelar); "Adicionar pessoa" opens an inline name field. Link preview image: `public/og.png` (1200×630, rendered from the app's own tokens and icons).

## Revision 2026-11-09 (e)

- Item icons are now colored Fluent Emoji Flat SVGs (MIT, Microsoft) served from `public/icons/{key}.svg`, shown on a 56px tile. Full items show the icon in grayscale at 60% opacity.
- Inputs: 1px ring at 20% ink, 2px ring at 70% ink on focus, no outline; corner radius 12px.
- Organizer screen: brand line and account at the top; session select next to "Nova sessão" (form opens inline); a summary card holds the name, date, open/closed pill, a progress bar and all actions; the add-item form is one row with a collapsible icon picker; "Apagar esta sessão" sits alone below a divider.

## Revision 2026-11-09 (f)

- Member page: a leaf strip under the name field lists "Você vai levar: …" for the current person. Cancelling a confirmed choice asks first.
- Admin on phones: the session select and "Nova sessão" stack full width; summary actions form a 2-column grid (WhatsApp and Encerrar span both columns). Item cards put the icon and the edit/remove buttons on one row and the name full width below. Remove buttons on name chips are 36px.
- Admin login: heading "Organização" with "App da Organ" below it, no eyebrow label.

## Revision 2026-11-09 (g) — user request

- **Glass cards:** cards and panels use `vidro` (white at 62%, 16px blur, saturate 1.4) with `shadow-faixa` and the `linha` ring. The page ground carries three soft radial glows (leaf, sun, leaf) fixed behind the content so the glass has something to frost. Print drops the glows.
- **Radius:** cards and panels 1rem (`rounded-2xl`), down from 1.5rem. Inputs stay 0.75rem.
- **Inputs:** 1px ring at 15% ink, 1px at 55% on focus plus a 4px halo at 8% ink. The global 3px focus outline lives in `@layer base` and skips text fields.
- **Icons:** 13 more fruits (Fluent Emoji Flat). The icon is optional (`icon: ''` hides the tile). The picker has a search field that matches labels and name keywords without accents, plus a "Sem ícone" choice.
- **Item instructions:** optional `note` (up to 120 chars) shows under the item name on both pages, in the review dialog and in the WhatsApp list as `— _note_`.

## Revision 2026-11-09 (h) — user request

- Removed icons: coxinha, lanche, cachorro-quente, rosquinha, doce, chocolate, sorvete, salada, sopa, ovo, café, chá, leite, gelo, copos/talheres, guardanapo. "Pudim / sobremesa" is now "Sobremesa". Items saved with a removed icon show no icon. "Coxinha" now suggests the salgado icon.
