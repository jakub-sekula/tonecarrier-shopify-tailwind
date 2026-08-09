# toneScan Studio: product brief for copywriting

Everything below is taken from live copy on `/pages/tonescan` or stated directly by the product
owner. **Nothing here is inferred or invented.** If a claim you want to make is not on this page,
it has not been verified and should not be written.

---

## 1. The brief

Write the **hero subheading**. It sits directly under the headline and above the email capture.

- **Current line (to be replaced):** "toneScan Studio is standalone software for serious film
  scanning. Seamless RGB, a physically accurate colour engine, and real speed."
- **Why it is being replaced:** the three differentiators are vague or jargon. "Seamless RGB" is an
  adjective doing no work, "a physically accurate colour engine" is jargon, "real speed" is
  unquantified. The *structure* is fine: name the product, state the category, then the
  differentiators.
- **Must contain the product name.** A candidate set that omitted "toneScan Studio" was rejected.
- **Length budget:** the element is capped at 620px, roughly 75 characters per line. The current
  line is 133 characters and wraps to two lines. **Two lines is the target. Three is too long.**

### Surrounding copy (do not duplicate)

| Slot | Current text |
|---|---|
| Badge above headline | Now in open beta |
| Headline | Film scanning, start to finish. |
| Button | Join the beta |
| Under button | Available for Mac and Windows |

The next section down opens with: *"toneScan Studio is standalone software for serious film
scanning. Import a roll and you are looking at photographs, not negatives to work through."*
If the hero keeps the "standalone software for serious film scanning" sentence, that intro line
will be changed instead so the two do not both open the same way.

### A direction already approved

The owner picked this shape and asked for more of it:

> …Trichromatic scanning, a colour engine built on real film behaviour, and nothing that makes you
> wait.

What works: speed expressed as **the absence of friction** rather than as a feature. Keep that
angle. Keep the negation to one instance, though, since stacking "no X, no Y, no Z" reads as
machine-written.

---

## 2. What toneScan Studio is

Standalone desktop software for scanning film with a camera. Native macOS and Windows builds. Not a
plugin and not hosted inside another application. Currently in free open beta; at launch there will
be a perpetual licence and a subscription option.

Related products, **not** the software:
- **toneLight** is the company's own RGB light source. Optional.
- **Tone Photographic** is the company.

---

## 3. Positioning angles that landed in review

These came from the product owner during a copy review and are the approved way to frame the
product.

1. **A lab scanner experience, with camera scanning.** Anyone who has used a Frontier or Noritsu
   knows what "feed it a roll, collect the files" feels like. That is the promise. This is the
   single strongest frame available.
2. **The home for your whole film photography workflow.** Not one step in a chain. Catalogue,
   convert, correct, calibrate and export all happen in the one app.
3. **Trichromatic scanning as a first-class feature**, not an add-on.
4. **Speed and usability as a genuine differentiator**, covering the whole app: import, viewport,
   general responsiveness of the interface, keyboard shortcuts. Not just the viewport.
5. **Automation.** It does the work quickly and without fuss.

---

## 4. Verified capabilities

### Conversion and colour
- Inversion modelled on film physics and the way darkroom paper responds to light.
- The starting point already looks like a print, so you adjust to taste rather than rescue a file.
- Three process modes: colour negative, B&W negative, slide.
- Smart auto white balance, or pick your own neutral. Auto density.
- Exposure, contrast, density, highlight rolloff, shadow lift. Levels, tone trims, sharpening.
- True exposure read from the raw signal rather than the histogram.
- Live RGB histogram. Pixel loupe with a live density readout.

### Trichromatic / RGB scanning
- The negative is photographed three times, under red, green and blue light in turn. Each exposure
  reads a single dye layer on its own.
- toneScan Studio finds the three frames in your capture folder, matches them channel by channel
  and combines them. You do not align anything yourself.
- Under white light a sensor sees all three dye layers at once through its own colour filters and
  the channels bleed into each other. Separating the exposures keeps each layer measured largely
  on its own: far less crosstalk to unpick, and far more room in the shadows before colour starts
  to fall apart.
- Requires any digital camera and a light source that can give red, green and blue separately.
  Monochrome sensors work too.
- White-light single-shot scanning also works.
- Per-channel inspection: view R, G or B alone.
- A companion web app that turns a phone into the light source is on the way.
- This is how high-end lab scanners have always got their colour.

### Capture and calibration
- Drives your light source and advances the film carrier directly, so a whole roll can run through
  without you touching the camera. Set the exposures once; from there the light changes, the
  carrier advances, and frames land in the right roll already merged.
- Works with the light you already have. Also works with toneLight.
- Tethered capture straight into the current roll.
- Light presets read from a connected light. Automatic calibration when paired with toneLight.
- Scan profiles: calibrate once, reuse on every roll.
- Per-channel exposure targets with an EV meter showing how far off you are.
- Crosstalk correction measured from your own setup. Linearity calibration.
- Flat-field correction cancels uneven light and lens falloff, so corners match the centre.

### Library and workflow
- Roll-based library with live frame counts. Organised by roll, the way you shoot.
- Point it at a folder and it watches for new captures and merges the channel triplets. No separate
  cataloguing step.
- Automatic triplet detection and merge.
- Batch editing: get one frame right and the whole roll follows, matched first frame to last.
- Markers and colour labels for fast culling. Undo and redo throughout.
- Smart auto-crop finds and squares frame edges on every shot. Crop, rotate and flip.
- Background processing: whole rolls convert and export while you carry on working.

### Speed and interface
- GPU viewport. Every slider lands on a full-resolution preview instantly, with no proxy image.
- Keyboard-driven, with shortcuts for everything.
- Quick imports.
- What you approve on screen is what the export gives you.

### Export
- Colour-managed viewport and export: sRGB, Adobe RGB, Display-P3 or Rec.2020, with the matching
  ICC profile embedded.
- TIFF or JPG, your quality and long edge. Cineon log export for grading downstream.
- Filename patterns from name, date, project or sequence.
- Batch export a selection or a whole roll.
- Rich metadata: film stock, camera and dev info on every file.

### Platform and licensing
- Native macOS and Windows builds.
- Fully standalone: no host app, no plugin bridge.
- Free during the open beta, every feature unlocked.
- At launch: own it outright, or subscribe.

---

## 5. Do not write these

Each of these was written, reviewed and rejected. They are listed with the reason so the mistake is
not repeated.

- **Do not lean on the motorised carrier or a controllable light.** These are a separate product
  and are not required to use the software. Copy must convince people who own neither. Hardware
  control is one capability among many, never the premise.
- **Do not say inversion is the easy part.** It is the core of the product. A headline saying
  "Inverting is the easy part" was rejected for calling the main thing trivial.
- **Do not restate the problem.** People shopping for conversion software already know a negative
  is orange, that light falls off, and that a roll drifts. A whole section built on this was cut
  for reading as filler.
- **Do not claim every film stock sits on a different orange base.** Unverified, explicitly cut.
- **Do not say light stands "fall off at the edges."** Lights fall off; a stand is a stand.
- **Do not use defensive phrasing** that answers an objection nobody raised, e.g. "Not bolted on."
- **Do not mix speed claims with colour-consistency claims** in the same breath unless the point is
  that the preview is truthful.
- **Avoid jargon in top-level copy:** "crosstalk", "dye layer", "proxy". These are fine in the deep
  RGB section, not in a headline or summary. Reader-facing copy should state the outcome.
- **Do not invent numbers**, speeds, percentages, resolutions or timings. None are verified.

---

## 6. House style

- **Brand is "toneScan Studio"** on first use.
- **No em dashes or en dashes.** Use a period, comma, colon or parentheses.
- **British spelling** (colour, cataloguing, standardise).
- Plain and concrete over promotional. No "seamless", "powerful", "revolutionary", "designed to".
- Second person. Talk to the reader.
- Prefer the outcome to the mechanism. The reader cares what they get, not how it is implemented.
- Never mention the tech stack or implementation details in customer copy.
- Avoid the AI tells: rule-of-three padding, tailing negations stacked up, "-ing" clauses bolted to
  the end of sentences, and inflated significance.

---

## 7. Phrases already in use elsewhere on the page

Reusing these verbatim in the hero will read as repetition, since all of them appear further down
the same page.

- "The way high-end lab scanners have always got their colour"
- "a keyboard shortcut for everything so you can fly through a roll"
- "Point toneScan Studio at your capture folder and the whole roll appears"
- "You're looking at finished pictures before you've touched a single slider"
- "No profile hunting, no per-frame guesswork, and no fighting an orange cast for twenty minutes"
- "the home for your whole film photography workflow"
- "Import a roll and you are looking at photographs, not negatives to work through"
