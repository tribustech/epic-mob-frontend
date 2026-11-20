# Shop photo art direction (v2)

Source of truth: `scripts/shop-art-direction.json` (39 products, 234 variants: one photo per colour combination, output `public/magazin/foto/<slug>/<paletteId>.webp`).
Each variant carries: the render (geometry/colour reference), 2–3 of our own portfolio photos (room, light and build-quality reference), 2–3 web reference photos, and the prompt.

## Why the first batch was rejected (common faults)

- One beige "AI catalogue" room reused 39 times: same golden dappled sun, same olive-branch vase, same curtains and framed landscape. No sockets, switches, radiators, skirting: nothing of a real Romanian flat.
- Scale is wrong almost everywhere: 2.6 m wardrobes look 2 m tall under 3 m+ ceilings; small pieces (nightstand, bathroom cabinet, hall wall cabinet) are blown up to fill the frame.
- Placement without logic: wardrobes free on a wall next to windows, a walk-in dressing in the middle of a bedroom, dividers flat on walls, wall-hung units at mid-wall with nothing below, TV units without a TV.
- Materials look like the render: flat colour fields with no edge banding, gaps, thickness or sheen; black supermatt is a black hole; cashmere came out pink; oak is orange with repeated grain.
- Mirrors reflect a different room than the one photographed.
- No handles on most fronts, and the same black bar on the rest.

## Rules set for the new batch

1. **Furniture = render.** Same proportions, same number of doors/drawers/columns/niches, same colours, the handle chosen below. The render is geometry and colour only; the picture must be a photograph.
2. **Real room, real scale.** Ceiling 2.60–2.70 m (2.85 m only for the 2.8 m wardrobe). Doors 2.05 m, sockets 30 cm, switches 1.05 m. Wardrobes of 2.5–2.6 m end 10 cm below the ceiling; the 2.8 m one closes against it; the 3.6 m one goes wall to wall.
3. **Placement by type.**
   - Wardrobes: on a full wall, one side in a corner (or wall to wall / in a niche), never in front of a window, radiator or door; bed with an 80–90 cm passage.
   - Open dressing: back wall of a dressing room or walk-in niche, lightly dressed with clothes.
   - Mirror doors: the reflection is the same room, camera oblique so no photographer shows.
   - Nightstand: beside the bed head, top level with the mattress, about one third of the bed's width, lamp on top, twin on the other side.
   - TV units: a wall-mounted TV always above; floor-standing ones on a recessed plinth, floating ones with the underside 30 cm above the floor and the TV 20–25 cm above the top.
   - Dividers: perpendicular to a wall between two zones, seen through, one third filled. The two with a closed base may also stand against a wall.
   - Wall cabinets: always above something. 1.2 m cabinet above a desk or washing machine (underside 140 cm); bathroom cabinet small, beside the mirror / above the toilet / above the washer (underside 125–135 cm); Aventos above a desk or bed head (155 cm); shelf above sofa or desk (145 cm); the 0.9 m hall cabinet above a washing machine or shoe bench (140 cm); the 2 m unit with niche becomes a low floating sideboard (30 cm).
4. **Camera.** Eye level 1.35–1.45 m for tall pieces, 1.1 m for low ones, 0.9–1.0 m for the nightstand; 24–35 mm equivalent, straight verticals, no fisheye; 4:3; whole piece visible, about 55–65% of the frame (small wall cabinets and the nightstand deliberately smaller so the context gives the scale).
5. **Six photos, six rooms.** Each colour of a model gets its own scene (different wall, props, light), and wall/floor are chosen per palette so the piece separates from the background (white furniture on greige walls, oak furniture on grey floors).
6. **Decor look in words.** W1000 premium white; H1180 Halifax natural oak (honey-gold, cracks and knots); U702 cashmere (warm greige, not pink); U961 graphite; U999 black; H3734 Dijon walnut; U222 cream beige; H1145 Bardolino oak (pale); U638 sage; U540 denim; U732 dust grey; U707 silk grey; AGT 723/734/398 supermatt black/white/cream.
7. **Review.** Every product has a checklist in the JSON; reject a photo on any miss in count of doors/drawers, mounting height, scale or colour swap.

## Handle per model

Types used: APLICAT (bar), BUTON (knob), GOLA (hidden channel), PUSH (no handle); finishes NEGRU / INOX / AURIU. No INGROPAT or PROFIL_J. Sliding-door wardrobes and open pieces have no handle. Mirror hinged doors keep APLICAT.

| Model | Handle | Underside (cm) |
|---|---|---|
| dressing-clasic-240 | none (no handled fronts) | floor |
| dressing-hol-120 | APLICAT INOX | floor |
| dressing-dormitor-180 | none (no handled fronts) | floor |
| dressing-oglinda-240 | none (no handled fronts) | floor |
| dressing-familie-300 | none (no handled fronts) | floor |
| dressing-mare-360 | none (no handled fronts) | floor |
| dressing-deschis-280 | none (no handled fronts) | floor |
| dressing-sertare-200 | APLICAT NEGRU | floor |
| dressing-copii-150 | BUTON INOX | floor |
| dressing-tavan-270 | PUSH (no handle) | floor |
| dressing-hol-oglinda-160 | APLICAT NEGRU | floor |
| dressing-oglinda-una-180 | none (no handled fronts) | floor |
| dressing-oglinda-mijloc-240 | APLICAT AURIU | floor |
| dressing-oglinzi-300 | none (no handled fronts) | floor |
| dressing-sticla-300 | none (no handled fronts) | floor |
| dressing-ingust-90 | BUTON NEGRU | floor |
| comoda-clasica-160 | BUTON NEGRU | floor |
| comoda-4-sertare-100 | GOLA INOX | floor |
| comoda-tv-200 | GOLA NEGRU | floor |
| comoda-tv-240 | PUSH (no handle) | floor |
| noptiera-50 | BUTON AURIU | floor |
| comoda-hol-120 | APLICAT NEGRU | floor |
| comoda-mixta-180 | APLICAT AURIU | floor |
| comoda-inalta-80 | APLICAT INOX | floor |
| comoda-nisa-140 | APLICAT NEGRU | floor |
| separator-biblioteca-120 | none (no handled fronts) | floor |
| separator-sertare-160 | APLICAT NEGRU | floor |
| separator-usi-180 | PUSH (no handle) | floor |
| separator-inalt-240 | none (no handled fronts) | floor |
| separator-scund-200 | none (no handled fronts) | floor |
| separator-ingust-90 | BUTON AURIU | floor |
| suspendat-clasic-120 | APLICAT INOX | 140 |
| suspendat-tv-180 | PUSH (no handle) | 30 |
| suspendat-tv-240 | GOLA NEGRU | 30 |
| suspendat-baie-60 | BUTON INOX | 125 |
| suspendat-aventos-180 | PUSH (no handle) | 155 |
| suspendat-etajera-150 | none (no handled fronts) | 145 |
| suspendat-mixt-200 | GOLA INOX | 30 |
| suspendat-hol-90 | BUTON AURIU | 140 |

## Web references

Free stock photos (Pexels / Unsplash), direct image URLs as found on the pages. They were selected from titles and descriptions only (the images could not be opened from the build machine), so look at each one once after download and drop any that does not show the intended situation.

## Critique of the current photos

- **dressing-clasic-240**: The 2.6 m wardrobe reads as about 2.1 m: a big empty strip of wall above it and a 3 m+ ceiling. It stands alone in the middle of a wall like a showroom box, squeezed between window and plant. The three doors are flat oak boards with no sliding track or door edge, the oak pattern repeats identically on each door, and the room is the same beige set with golden sun patches as every other photo.
- **dressing-hol-120**: Shown in a hall that is really an open living room with a wide opening; the wardrobe stands in the middle of the wall and looks about 1.9 m tall next to an oddly sized door. Fronts are blank white with no edge or gap detail. Same beige set and vase as all the others.
- **dressing-dormitor-180**: A featureless white box about 1.9 m tall with half a metre of wall above it, standing right beside the balcony door. No door edges, track or panel thickness: it looks like an untextured render pasted into the room.
- **dressing-oglinda-240**: The mirrors reflect a tidy bed seen head-on that is not the bed in the foreground: the reflection belongs to another room. The wardrobe is too low for a 2.6 m piece and stands free on the wall between curtain and corner. Mirror frames look like gold trim.
- **dressing-familie-300**: Looks like a 2 m high, very wide sideboard wall: the 2.6 m height is lost and there is a huge empty wall above. It is pushed against the bed and the oak body shows only as a thin strip on the right. Cashmere fronts are pink-beige.
- **dressing-mare-360**: The wall-to-wall model floats in the middle of a longer wall with free wall left, right and half a metre above: it reads as a 2 m high cabinet, not a full-wall dressing. Four flat pinkish panels with no track or edges.
- **dressing-deschis-280**: A walk-in dressing shown as a free-standing empty shelf unit in a bedroom, set forward from the wall on little legs (the model has a plinth), next to the window and the bed. Completely empty, with glowing rails: it reads as a 3D model, and the place makes no sense.
- **dressing-sertare-200**: Geometry is right, but the wardrobe looks about 2.1 m tall with a big gap to the ceiling, and it sits in the same beige set with the same vase. Oak fronts are too orange and the grain repeats; the anthracite body looks like black plastic.
- **dressing-copii-150**: One of the better ones, but the blue is a flat pastel rather than the dusty denim decor, the handles are generic black bars and the room is a staged nursery cliché (teddy print, toy basket) in the usual beige light.
- **dressing-tavan-270**: The whole point of this model is that it reaches the ceiling, and here it stops about 40 cm below it. Fronts are plain white instead of cream supermatt, with no visible gaps or material: it looks like six white rectangles.
- **dressing-hol-oglinda-160**: Supposed to be a hall, but it stands beside a floor-to-ceiling curtained window, and the mirrors reflect a long corridor with a door that does not exist in the room. Squat proportions, and a door on the right that is barely taller than the handle height suggests.
- **dressing-oglinda-una-180**: Acceptable composition, but the wardrobe is squat (about 2 m) with a wide band of wall above, the cashmere panel is peach-pink, and the styling is the same beige set. The mirror shows a bed that is not where the real bed is.
- **dressing-oglinda-mijloc-240**: Structure is right, but the mirror shows a different bedroom than the one in the photo, the wardrobe is too low for 2.5 m, the cashmere is pink, and the side-table-with-hydrangeas styling is repeated from other photos.
- **dressing-oglinzi-300**: The reflection is a postcard view of a perfectly centred bed, while the real bed lies at the bottom left: two different rooms. The wardrobe stands free on the wall and looks about 2 m tall; gold frames instead of slim aluminium profiles.
- **dressing-sticla-300**: Looks like the 3D model itself: dark empty interior with glowing white rails and painted diagonal glare streaks on the glass. Nothing inside, standing free next to the bed. Not believable as a photo.
- **dressing-ingust-90**: Placed in the open on a wall between the entrance door and a floor-to-ceiling window, not in a niche or behind a door as the model is meant. The entrance door next to it is much shorter than the 2.4 m wardrobe, so the scale looks wrong.
- **comoda-clasica-160**: Geometry is fine, but the plinth is too tall and flush, there are no handles, and it stands in the usual beige set with the olive-branch vase and golden light. The oak top and sides look printed, with no edge.
- **comoda-4-sertare-100**: Reads as a 1.5 m wide block as high as the window sill, far larger than a 1 m chest. A tall flush plinth, no handles, pure white with no edges: untextured render look. Nothing on top, bed cropped at the corner.
- **comoda-tv-200**: A TV unit photographed without a TV: a framed landscape hangs above it. The open niche is empty, the unit looks about 3 m long, and the oak drawer fronts are orange with a repeated grain. Same beige set.
- **comoda-tv-240**: The black one the owner singled out: the fronts are a flat black void with thin light outlines like a wireframe, no supermatt material at all. The walnut plinth sticks out in front of the fronts, the unit is stretched to about 3.5 m, and a landscape painting hangs where the TV should be.
- **noptiera-50**: The worst of the batch: the nightstand fills half the picture and reads as a metre-wide chest, with a huge oak plinth block sticking out below. The bed is pushed to the edge, so there is no scale or context; no lamp, no handles, pinkish fronts.
- **comoda-hol-120**: Placed between a floor-to-ceiling window and the entrance door in a room that is not a hall. It looks about 1.5 m wide and deep like a sideboard, with two blank white doors and no handles; no mirror, hooks or shoes that would explain it.
- **comoda-mixta-180**: Usable geometry, but the cream is yellow, the walnut plinth is a thick flush block and there are no handles. The piece stands half on a rug in the standard beige set with the same vase.
- **comoda-inalta-80**: Looks wider than its 80 cm and is parked in front of the window and radiator. Pink-beige instead of cashmere greige, flush tall plinth, no handles, featureless fronts.
- **comoda-nisa-140**: Decent structure, but the niche is empty, the light oak is a cheap repeated print, and it sits in the standard beige set. No handles.
- **separator-biblioteca-120**: A room divider shown as an ordinary bookcase flat against a wall, completely empty. It also looks about 1.6 m wide instead of 1.2. Standard beige set.
- **separator-sertare-160**: Structurally correct and the handles are there, but it stands empty and flat on a wall in the beige set; nothing tells you it is a divider or how big it is.
- **separator-usi-180**: Correct structure, but empty, flat on the wall, with random black handles and the same staging as everything else. White shelves have no thickness or edge, so it looks drawn.
- **separator-inalt-240**: A ceiling-high partition shown as an empty bookcase on a wall, standing on little legs and stopping well below the ceiling. Nothing behind it, nothing on it.
- **separator-scund-200**: The 1.2 m divider looks about 1.6 m tall, towering over the sofa, and stands against a wall. The anthracite is rendered as dark wenge wood grain. Empty.
- **separator-ingust-90**: Shown flat against a wall beside a doorway, empty, so it does not separate anything. Otherwise the proportions are close.
- **suspendat-clasic-120**: Hung in a hall at knee-to-chest height (about 40–130 cm) like a floating sideboard with plants on top, and blown up to roughly 2 m × 0.9 m. Nothing below it, no reason for it to be there.
- **suspendat-tv-180**: Hung too high: the underside is about 55–60 cm off the floor and the TV is pushed up towards the ceiling. Black fronts are a flat void without material or a visible gap.
- **suspendat-tv-240**: Better than the 1.8 m one but still about 50 cm off the floor, with the TV too high. The niche is empty and the black fronts have no supermatt character.
- **suspendat-baie-60**: A 60 × 70 cm cabinet rendered as a slab more than a metre square that covers the whole wall above the basin, almost touching the tap, with no mirror left. Completely out of scale.
- **suspendat-aventos-180**: Placement above a desk is right, but the cabinet is far too bulky (reads about 55 cm high and over 2 m long) and hangs low enough to hit your head when you sit. Plain white box without gaps or material.
- **suspendat-etajera-150**: The idea (above the sofa) is fine, but the boxes are drawn about 50 cm deep instead of 25, hang low over the sofa where heads go, and are completely empty with an exaggerated oak print.
- **suspendat-mixt-200**: Hangs at about 1 m in the middle of a bare wall with nothing below or above: too high for a sideboard, too low for a wall cabinet. Empty niche, no handles, nothing explains it.
- **suspendat-hol-90**: The one the owner asked about: a box of about 1.5 × 1.4 m floating in the middle of a hall wall beside the entrance door, with nothing under it. Wrong scale, wrong height, no purpose.

## For the owner to decide

1. **Duplicate-looking variants.** Fully open models (separator-biblioteca-120, separator-inalt-240, separator-scund-200, suspendat-etajera-150) show only the body colour, so "Alb total" and "Alb & stejar natur" are the same all-white piece. The all-mirror sliding wardrobes (dressing-oglinda-240, dressing-oglinzi-300) differ between their 6 colours only by the thin door-frame tone. Keep 6 photos each, or cut these models to the colours that really differ?
2. **Glass wardrobe (dressing-sticla-300).** The shop text says lacquered (opaque) glass, the render shows transparent smoked glass with the interior visible. The prompts follow the render; say if the doors should be opaque lacquered glass instead.
3. **Cashmere (U702).** The renders draw it pink-beige; the real decor is a warm greige. The prompts ask for greige. If the render colour is corrected too, the photos and renders will agree.
4. **Rooms changed against `ROOMS` in products.ts:** suspendat-clasic-120 is shown above a desk or a washing machine (not on a hall wall); suspendat-hol-90 above a washing machine or a shoe bench; suspendat-mixt-200 as a low floating sideboard/console (underside 30 cm); suspendat-baie-60 beside the mirror / above the toilet / above the washer, not in place of the mirror.
5. **Handles** in the table above are a proposal (26 models with handled fronts: 10 bar, 7 knob, 4 Gola, 5 push); the CRM catalogue must offer Gola and the gold/steel finishes for comode and wall units, otherwise those fall back.
6. **Black/dark chests dropped (2026-11-20, Andrew).** No black or dark comode: all COMODA and SUSPENDAT models use only light, wood and colour palettes (no INCHIS mood). The palette list per model is `scripts/shop-palettes.json`; the critique above still describes the old black photos.
