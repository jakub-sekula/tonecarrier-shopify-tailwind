---
name: tonescan-lite
description: |
  Keep the public toneScan page in step with the full one. Use whenever
  templates/page.tonescan.json changes, whenever a section is to be made public or
  held back, after `shopify theme pull`, and before any push or merge that touches
  the toneScan templates. Covers regenerating page.tonescan-lite.json, the
  allowlist in lite-sections.json, and verifying the result.
---

# The public toneScan page is generated

`templates/page.tonescan-lite.json` is the page real visitors get. It is **not maintained**. It is
`templates/page.tonescan.json` with the in-progress sections removed and nothing else changed:
every section it keeps is copied across verbatim, so the two cannot disagree about a heading, an
image or a block.

Three files:

| File | What it is |
|---|---|
| `templates/page.tonescan.json` | the full page. **This is the one to edit.** |
| `lite-sections.json` | an allowlist of section keys that are public |
| `templates/page.tonescan-lite.json` | generated. Never edit. |

## The rule

**Edit the full template. Regenerate. Commit both.**

```bash
npm run lite
```

Anything typed into the lite template, by hand or in the theme editor, is gone the next time that
runs. The file carries a banner saying so.

## When to run it

- After any change to `templates/page.tonescan.json`
- After `shopify theme pull`, which can bring theme-editor changes down into either template
- Before pushing or merging anything that touches the toneScan templates
- After changing `lite-sections.json`

`npm run lite:check` exits non-zero when the file on disk is not what would be generated. Use it to
find out whether anything needs doing; use `npm run lite` to do it.

## Publishing a section, or holding one back

The list is an **allowlist**, and that direction is deliberate. A section added to the full template
stays off the public page until someone names it. New work is in progress until it is declared
otherwise, and an oversight hides a section rather than publishing an unfinished one.

```bash
npm run lite:list              # what is public, what is held back
npm run lite:add rgb           # publish, then regenerate
npm run lite:remove rgb        # hold back, then regenerate
```

The keys are the section keys from the full template's `order`, not section types: `rgb`, not
`tonescan-rgb`. `lite:list` prints both.

## Checking the result

`lite:check` compares the file against what would be generated. That catches drift but says nothing
about whether the page renders. When a section has just been published or held back, also confirm
what the page actually serves, by the section wrapper rather than by CSS class names:

```bash
curl -s "http://127.0.0.1:9292/pages/tonescan?view=tonescan-lite" | grep -o 'id="shopify-section-[a-z-]*"' | sort -u
```

Grepping for a class like `ts-pricing` proves nothing: the stylesheet is rendered by the layout on
every toneScan page, so every section's CSS is present whether or not that section is on the page.
`id="shopify-section-<key>"` is the marker that only appears when the section is really rendered.

## Two things that go wrong

**A section file that fails to upload reports as missing.** `Section type 'x' does not refer to an
existing section file` usually means the `.liquid` file is there but Shopify rejected it, or the dev
server was mid-sync. Check the schema parses and that no setting has `"default": ""`, which Shopify
rejects outright and which fails the whole theme upload. If the schema is fine, reload: writing
several template files at once can race the dev server's upload.

**The full template gains a section and the public page does not.** That is the allowlist working.
Run `npm run lite:add <key>` when it is genuinely ready.
