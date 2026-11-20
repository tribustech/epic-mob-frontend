# Pilot photo review (6 photos)

Reviewed: `/tmp/claude-0/pilot/<slug>/<paletteId>.webp` against the current render
`public/magazin/randari/<slug>/<paletteId>.webp` and the brief in `scripts/shop-art-direction.json`.
Sizes were estimated by measuring pixels in the photo against known references
(sockets ~30 cm, switches ~105 cm, washing machine 85 cm, door 205 cm), so every cm figure is ±10%.

## Verdicts

| Photo | Verdict | Realism | Main reason |
|---|---|---|---|
| comoda-tv-240 / alb-total | ACCEPT | 8.5 | Matches render (2 doors + 2 drawers + 2 doors, push, plinth); room slightly compressed |
| dressing-hol-120 / casmir-alb | ACCEPT | 8 | Matches render; real hall, in the corner, clearly taller than the entrance door |
| noptiera-50 / stejar-casmir | ACCEPT | 9 | Best of the batch; right size beside the bed, right handles and colours |
| separator-biblioteca-120 / stejar-natur | ACCEPT | 8.5 | 3 × 5 open grid, used as a divider, room visible through it |
| suspendat-hol-90 / gri-casmir | ACCEPT | 8 | Square 2-door unit above a washing machine; hangs ~10 cm lower than the brief |
| suspendat-tv-180 / alb-total | REJECT | 8 | Realistic photo, but the unit is about 15–20% too slim/long vs the render and the TV is 65", not 55" |

## Per photo

### comoda-tv-240 / alb-total: ACCEPT, realism 8.5
- Render match: 2 doors + 2 stacked drawers + 2 doors, no handles, white body and fronts, recessed white plinth on the floor. Height-to-length ratio is right (about 0.22 in the photo, 0.21 real). Drawer block is about 36% of the width in the photo and 32% in the render: fine.
- Placement/scale: unit to TV ratio is right (TV reads ~143 cm, a 65"). TV lower edge is about 14 cm above the top (brief: 20–25); a soundbar fills the gap.
- Weak points: the room is slightly compressed. The door frame on the right reads ~1.9 m and the ceiling ~2.1–2.2 m, so the unit looks about 10% bigger than it is. Not noticeable without measuring.
- Styling: the ribbed white vase is back. The brief's critique of the old photos named "same beige set and vase" as a problem.
- Artefacts: none found. Gaps, edges, TV reflections and socket are clean.
- Optional improvements if regenerated: `Ceiling at 2.60 m, visible in the frame; the interior door frame is 2.05 m high, four times the height of the unit.` `No vase on the unit.`

### dressing-hol-120 / casmir-alb: ACCEPT, realism 8
- Render match: exactly 2 full-height doors, 2 vertical brushed-steel bar handles at the centre joint at the render's height and length (~32 cm), white fronts, cashmere side, top edge and recessed plinth. Width to height is about 0.55 (real 0.5).
- Placement/scale: left side tight to the corner, next to the entrance door, ~15–20 cm below the ceiling, clearly taller than the entrance door. Switch (~1.0 m) and socket (~20–25 cm) are plausible. Nothing is blocked.
- Weak points: two oversized coat hooks sit very high on the right wall, above a mirror, where nobody would hang coats. The doorless opening on the left has a slightly odd header. Both are minor.
- Artefacts: none on the furniture. Tile joints and door hardware are clean.
- Optional improvement: `Coat hooks in a row at 1.70 m on a free wall, not above the mirror.`

### noptiera-50 / stejar-casmir: ACCEPT, realism 9
- Render match: exactly 2 drawers, one gold knob centred on each, oak body, cashmere fronts (greige, not pink), oak plinth recessed at the front and side. The front is square, as in the render.
- Small mismatch: the oak top overhangs the drawer fronts as a visible slab; in the render the top drawer front runs up to the top edge. Knobs are mushroom-shaped, the render's are balls. Not worth a regeneration.
- Placement/scale: beside the bed head, top within ~5 cm of the mattress top, small relative to the bed, second identical nightstand with lamp on the far side. Socket and switch above it are at believable heights.
- Artefacts: none.

### separator-biblioteca-120 / stejar-natur: ACCEPT, realism 8.5
- Render match: 3 columns × 5 rows, no back panel, natural oak, low plinth, 2 m high (just under the door frame top), width to height about 0.57 (real 0.6). Perspective of the uprights is consistent.
- Placement: it continues the end of a wall and separates the sofa zone from the dining zone; the dining area and floor are visible through it. About a third filled. This is the first photo of this piece that shows what it is for.
- Weak points: book spines and the amber jar label carry tiny pseudo-text; illegible at site size. The relation to the wall on the right (in line with it, not perpendicular as in the brief) takes a second look to read.
- Optional improvements: `Book spines plain, without lettering; no labels on jars.` `One end of the unit touches a side wall at a right angle.`

### suspendat-hol-90 / gri-casmir: ACCEPT, realism 8
- Render match: exactly 2 doors, square front (328 × 320 px), cashmere body and fronts, 2 small gold knobs low at the centre joint. Knobs are a little smaller and flatter than the render's balls.
- Placement/scale: hangs above a washing machine under a worktop of the same width (~93 cm), so it has a clear purpose. Underside reads ~125–135 cm (brief 140), gap to the worktop ~44 cm (brief 50), top ~215–225 cm. Ceiling is low (~2.3 m), so the unit ends ~10–15 cm under it instead of 30. Believable for a bathroom with a lowered ceiling.
- Weak points: the washing machine sits off-centre between its side panels and stands slightly proud of them; the unit's right side shows a faint double edge. The bathroom opens straight onto the living room.
- Artefacts: no warped lines; skirting and tile joints follow the perspective. Washing machine markings are blurred, not readable text.
- Optional improvements: `Underside of the wall unit 140 cm above the floor; 30 cm of wall between its top and the ceiling.` `Washing machine centred under the worktop.`

### suspendat-tv-180 / alb-total: REJECT, realism 8
The photo is believable as a photo, and the mounting height is finally right (underside ~30 cm, TV centre ~1.2 m, TV 19 cm above the unit). It fails on the product itself, and it was generated from the wrong render, so it should be regenerated with the current one.
- Mismatch vs render: the front is about 6.2 : 1 in the photo; the real unit is 5.1 : 1 (180 × 35) and should look about 4.9 : 1 at this camera angle. The unit reads ~29–30 cm high instead of 35, i.e. slimmer and longer than what the client receives. Next to the render on the product page the difference is visible.
- Scale: the TV reads ~143–147 cm wide (65") instead of 55" (123 cm). It covers almost 80% of the unit's length instead of two thirds, which makes the unit look smaller. The TV is also slightly too tall for 16:9.
- Correct: 2 equal flap fronts, no handles, white, wall-hung with floor and skirting visible underneath, soft shadow.
- Styling: almost the same set as comoda-tv-240 (greige wall, curtain on the left, soundbar, switch and socket on the right, door frame at the right edge). On the site the two will look like one room with the furniture swapped.
- Artefacts: none.
- Prompt additions for regeneration:
  - `Attach the current render (180 × 35 cm box, 2 flaps) as the geometry reference.`
  - `The front of the unit is a chunky box: its height is one fifth of its length (35 cm high, 180 cm long). Do not make it thinner or longer than the render.`
  - `Each flap front is 90 cm wide and 35 cm high, about 2.5 times wider than high.`
  - `The TV is 55 inch, 123 cm wide, 16:9: two thirds of the unit's length, leaving about 28 cm of unit visible on each side.`
  - `The unit's height (35 cm) is slightly more than the height of the wall socket above the floor (30 cm).`
  - `Different room from the other TV unit photos: white or light grey wall, window on the right, no door frame in the picture.`

## General rules to add to all remaining prompts

1. `Keep the exact height-to-width ratio of the piece in the render; state it in words (for example "five times longer than high"). Never make a piece slimmer, longer or taller than the render.` The only reject was a proportion drift, not a scene problem.
2. `Anchor the scale with three references in the frame: a 2.05 m interior door or its frame, the ceiling at 2.60 m, and a socket at 30 cm. The piece must have its real size relative to all three.` Two photos (comoda, hol) have compressed rooms with ~1.9 m doors or ~2.2–2.3 m ceilings.
3. `State the TV size as a fraction of the furniture length (for example "the TV is two thirds as long as the unit") and require 16:9.` Inch sizes alone were ignored.
4. `Each photo is a different apartment: vary wall colour, floor, window side and decor per product. No ribbed vase, no soundbar-plus-curtain-left set repeated.` The two TV photos are near-duplicates and the vase the owner disliked is back.
5. `No lettering anywhere: plain book spines, no labels on jars or bottles, no markings on appliances.` Pseudo-text appears on books and a jar.
6. `Props must be usable where they are: hooks at 1.70 m on a free wall, appliances centred under worktops, nothing hung above a mirror.` Small nonsense details are what make a room read as generated.
7. For wall-hung pieces: `Give the mounting height twice, as a number and as a relation: "underside 140 cm above the floor, 50 cm above the worktop below it, 30 cm of wall between its top and the ceiling".` Mount heights were close but drifted 10–15 cm where only the number was given.

---

# Batch 1 (9 photos)

Reviewed: `/tmp/claude-0/batch1/<slug>/<paletteId>.webp`, same method and standard as the pilot. Measurements are ±10%.

## Verdicts

| Photo | Verdict | Realism | Main reason |
|---|---|---|---|
| dressing-clasic-240 / alb-stejar-natur | ACCEPT | 8.5 | Matches render; ~20 cm dead gap between the wardrobe and the corner |
| dressing-clasic-240 / alb-total | REJECT | 7.5 | Doors sit inside a visible carcass frame (render: doors cover the whole front); wide-angle stretching; not in the corner |
| dressing-clasic-240 / antracit-stejar | ACCEPT | 8 | Matches render; anthracite body reads correctly around oak doors |
| dressing-clasic-240 / gri-casmir | ACCEPT | 8.5 | Matches render; tight in the corner beside the balcony-door wall |
| dressing-clasic-240 / nuc-crem | ACCEPT | 8.5 | Matches render; tight in the corner, room door and dresser give scale |
| dressing-clasic-240 / stejar-natur | ACCEPT | 9 | Best of the six; corner, window, radiator, bench all make sense |
| dressing-hol-120 / alb-total | ACCEPT | 8.5 | Matches render; corner beside the entrance door, bench and umbrella stand |
| dressing-hol-120 / gri-casmir | ACCEPT | 8.5 | Matches render; wardrobe reaches the ceiling instead of ending 20 cm below |
| suspendat-tv-180 / alb-total (regenerated) | REJECT (borderline) | 8.5 | Everything fixed except the box itself: still about 20% too long for its height |

## Per photo

### dressing-clasic-240 / alb-stejar-natur: ACCEPT, realism 8.5
- Render match: 3 equal full-height doors, no handles, oak fronts with vertical grain, white top edge, side and recessed plinth.
- Placement/scale: ends ~10 cm under the ceiling; switch and socket on the same wall give a believable 2.4–2.5 m height. Bed and rug at lower left.
- Weak point: the wardrobe starts ~20 cm away from the left corner (behind the curtain) and the wall continues on the right, so neither end is in a corner as the brief asks. Reads as a normal freestanding wardrobe, not as a mistake.
- Artefacts: none.

### dressing-clasic-240 / alb-total: REJECT, realism 7.5
- Mismatch vs render: the three doors are set inside a carcass frame. A ~8 cm white header runs above the doors, a stile on the left and a rail under them. In the render (and in the other five photos) the doors cover the whole front. It looks like a different wardrobe model.
- Perspective: the near end is 787 px high and the far end 545 px (ratio 1.44 across 2.4 m). The brief asks for no wide-angle stretching; the wardrobe looks like it leans into the room.
- Placement: far end stops ~40 cm short of the corner, with an armchair squeezed behind it. Near end stands free beside the room door.
- Styling: an olive tree at the right edge (the prompt's avoid list names olive branches) and a large drum pendant cut by the top of the frame.
- Correct: 3 equal doors, no handles, white on greige wall, plinth, ~10 cm under the ceiling, taller than the room door.
- Prompt additions:
  - `The three door panels cover the entire front of the wardrobe from the top edge down to the plinth and from side to side. No frame, header, stile or rail is visible around or between the doors.`
  - `Camera 4 m back with a 35 mm lens; the far end of the wardrobe is at least 80% as high in the picture as the near end. No wide-angle stretching.`
  - `The far end of the wardrobe touches the side wall in the room corner; nothing stands between the wardrobe and that wall. The reading chair is on another wall.`
  - `No plant and no ceiling lamp in the frame.`

### dressing-clasic-240 / antracit-stejar: ACCEPT, realism 8
- Render match: 3 equal oak doors, anthracite side, thin anthracite top edge and plinth. Dark grey, not black.
- Placement/scale: ~5–10 cm under the ceiling; by the switch it reads ~2.6 m. Laundry basket fills the ~60 cm between the wardrobe end and the corner, as the scene asked.
- Weak points: perspective a bit strong (far end 79% of the near end). A white table in the lower-left corner is not clearly a nightstand or a dresser.
- Artefacts: none.

### dressing-clasic-240 / gri-casmir: ACCEPT, realism 8.5
- Render match: 3 equal doors, cashmere body and fronts (greige, not pink), side panel and recessed plinth visible.
- Placement/scale: tight in the corner, balcony door on the adjacent wall and not blocked. Reads ~2.5 m by the switch; small gap to the ceiling.
- Weak point: the lit pendant is large in the foreground. Not a defect.
- Artefacts: none.

### dressing-clasic-240 / nuc-crem: ACCEPT, realism 8.5
- Render match: 3 equal cream doors, walnut side, top edge and plinth. Cream is warm ivory as in the render.
- Placement/scale: tight in the left corner; the room door on the same wall reads 2.1 m and the wardrobe is clearly taller.
- Artefacts: none. The framed print is abstract shapes, no text.

### dressing-clasic-240 / stejar-natur: ACCEPT, realism 9
- Render match: 3 equal oak doors, oak side and plinth, vertical grain.
- Placement/scale: tight in the corner next to the window wall, radiator under the window, bench at the bed's foot, grey floor separates from the oak.
- Artefacts: none.

### Variety across the six dressing-clasic-240 photos
They are not near-clones: wall colour, floor, bedding and the neighbouring element (curtain, room door, balcony door, window with radiator, dresser, laundry basket) differ in each, and each room makes sense. Three things repeat and show the template:
- The same linen drum pendant hangs at the top of 5 of the 6 photos.
- 4 of the 6 use the identical composition: camera on the left, bed at lower left, switch and socket on the wall to the right of the wardrobe at the same spot.
- All six are empty of personal objects.

For the remaining colours of this product add: `No ceiling lamp in the frame.` `Camera on the right side of the room, bed at lower right, wardrobe corner on the right.` (alternate left/right per colour) and vary one visible element per photo (mirror, chair with clothes, plant, open curtain).

### dressing-hol-120 / alb-total: ACCEPT, realism 8.5
- Render match: 2 full-height doors, 2 vertical steel bar handles at the centre, white body, fronts and recessed plinth; width to height 0.49 (real 0.5).
- Placement/scale: tight in the corner next to the entrance door, ~10–15 cm under the ceiling, clearly taller than the door. Shoe bench, shoes, umbrella stand, living room visible on the right.
- Weak points: the socket sits at ~65 cm instead of 30; the bench is a little tall (~55 cm).
- Artefacts: none.

### dressing-hol-120 / gri-casmir: ACCEPT, realism 8.5
- Render match: 2 full-height doors, steel bar handles, cashmere body and fronts, recessed plinth.
- Placement/scale: tight in the corner beside the entrance door; wall lamp, runner, bathroom door and a second door at the end of the hall.
- Weak point: the wardrobe top meets the ceiling (gap under 5 cm). The brief says 20 cm below a 2.60 m ceiling, so the client's 2.40 m wardrobe will not look built-in like this.
- Optional improvement: `A clear 20 cm strip of wall is visible between the top of the wardrobe and the ceiling.`

### suspendat-tv-180 / alb-total (regenerated): REJECT (borderline), realism 8.5
- Fixed: new room (grey wall, window on the right, no door frame), 2 flap fronts, no handles, underside ~30 cm above the floor, height ~33 cm by the socket and switch, TV about 70% of the unit's length, TV 16:9, TV ~20 cm above the top.
- Still wrong: the front is 5.95 : 1 (732 × 123 px) against 5.1 : 1 real, about 4.8–5.0 expected at this angle. It was 6.2 : 1 before. By the socket and switch the unit reads ~2.0 m long and the TV ~65". The model keeps the height and stretches the length together with the TV.
- This is the only defect. If a third generation does not fix it, this photo is usable and the decision is Andrew's.
- Prompt additions (replace the earlier ratio lines, which did not work):
  - `The unit's front is half as high as the TV screen is high.`
  - `The unit is short: only 4 times as long as the distance from its top to the floor (65 cm).`
  - `The soundbar is 90 cm long and covers exactly one flap's width, half of the unit.`
  - `The unit spans no more than 50% of the frame width.`
