"""Builds scripts/shop-art-direction-v3.json: the photo brief for the photo colours (PHOTO_COLOURS in
lib/shop/products.ts) that have no accepted photo in lib/shop/photos.json yet. Re-run after changing the
range, the photo colours or the accepted photos:   python3 scripts/shop-art-direction-v3.py
(tests/shop.test.ts fails while the JSON and PHOTO_COLOURS disagree.)"""
import json, os, re, subprocess
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "")
v2 = json.load(open(ROOT + "scripts/shop-art-direction.json", encoding="utf-8"))
photos = json.load(open(ROOT + "lib/shop/photos.json", encoding="utf-8"))
renders = json.load(open(ROOT + "lib/shop/renders.json", encoding="utf-8"))
shop = json.loads(subprocess.run(["npx", "tsx", "scripts/shop-art-direction-v3-data.ts"], cwd=ROOT, capture_output=True, text=True, check=True).stdout)  # [{slug, category, size, paletteIds, photoColours, handle, rooms, isNew}]
V2V = {(v["slug"], v["paletteId"]): v for v in v2["variants"]}

DECOR = {
    "W1000": "premium white melamine (Egger W1000 ST9: clean neutral white, fine matt pearl texture, not glossy, not bluish)",
    "H1180": "Natural Halifax oak (Egger H1180 ST37: warm honey-gold oak decor with visible cracks, knots and a deep tactile grain)",
    "U702": "cashmere grey (Egger U702 ST9: a warm beige-greige plain colour, matt and slightly sandy; it must not look pink, peach or yellow)",
    "U961": "graphite anthracite (Egger U961: very dark warm charcoal grey, matt plain colour, reads as dark grey and not as pure black or brown wood)",
    "U540": "denim blue (Egger U540 ST9: dusty, muted grey-blue plain colour, matt, not baby blue)",
    "U707": "silk grey (Egger U707 ST9: light neutral grey plain colour, matt)",
    "H1145": "Natural Bardolino oak (Egger H1145 ST10: pale beige-grey Scandinavian oak decor with fine planked grain)",
    "U638": "sage green (Egger U638 ST9: muted grey-green plain colour, matt)",
    "U732": "dust grey (Egger U732 ST9: a mid, slightly warm grey plain colour, matt; clearly darker than cashmere, not blue)",
}
PAL = {  # id: (name, body, fronts)
    "alb-total": ("Alb total", "W1000", "W1000"),
    "salvie-stejar": ("Verde salvie & stejar deschis", "H1145", "U638"),
    "alb-gri-matase": ("Alb & gri mătase", "W1000", "U707"),
    "gri-casmir": ("Gri cașmir", "U702", "U702"),
    "alb-casmir": ("Alb & cașmir", "W1000", "U702"),
    "alb-stejar-natur": ("Alb & stejar natur", "W1000", "H1180"),
    "stejar-natur": ("Stejar natur", "H1180", "H1180"),
    "antracit-stejar": ("Antracit & stejar", "U961", "H1180"),
    "stejar-casmir": ("Stejar & cașmir", "H1180", "U702"),
    "denim-alb": ("Albastru denim & alb", "W1000", "U540"),
    "stejar-alb": ("Stejar & alb", "H1180", "W1000"),
    "bardolino-gri": ("Stejar bardolino & gri", "H1145", "U732"),
    "grafit-total": ("Grafit total", "U961", "U961"),
    "alb-stejar-deschis": ("Scandinav deschis", "W1000", "H1145"),
    "alb-antracit": ("Alb & antracit", "W1000", "U961"),
}
HANDLE_TXT = {
    ("APLICAT", "NEGRU"): "slim straight bar handles in matt black, one per front: vertical near the opening edge on doors, horizontal and centred near the top edge on drawers, positioned exactly as in the render. Same finish on every handle, real metal with soft reflections.",
    ("APLICAT", "INOX"): "slim straight bar handles in brushed stainless steel, one per front: vertical near the opening edge on doors, horizontal and centred near the top edge on drawers, positioned exactly as in the render. Same finish on every handle, real metal with soft reflections.",
    ("APLICAT", "AURIU"): "slim straight bar handles in brushed gold (satin brass look), one per front: vertical near the opening edge on doors, horizontal and centred near the top edge on drawers, positioned exactly as in the render. Same finish on every handle, real metal with soft reflections.",
    ("BUTON", "NEGRU"): "small round knobs (about 3 cm) in matt black, positioned exactly as in the render (near the opening edge on doors, centred on drawers). Same finish on every knob.",
    ("BUTON", "INOX"): "small round knobs (about 3 cm) in brushed stainless steel, positioned exactly as in the render (near the opening edge on doors, centred on drawers). Same finish on every knob.",
    ("BUTON", "AURIU"): "small round knobs (about 3 cm) in brushed gold (satin brass look), positioned exactly as in the render (near the opening edge on doors, centred on drawers). Same finish on every knob.",
    ("GOLA", "INOX"): "none on the fronts. Handle-less GOLA system: a continuous recessed aluminium channel in brushed stainless steel runs along the edge of the fronts (above each drawer front, along the opening edge of doors), visible as a thin metal-lined shadow groove exactly as in the render. No bars, no knobs.",
    ("GOLA", "NEGRU"): "none on the fronts. Handle-less GOLA system: a continuous recessed aluminium channel in matt black runs along the edge of the fronts (above each drawer front, along the opening edge of doors), visible as a thin metal-lined shadow groove exactly as in the render. No bars, no knobs.",
    ("PUSH", None): "none. Push-to-open (TIP-ON) doors: completely flat, with only thin, even 3 mm shadow gaps between them. Do not add any handle, knob, groove or profile.",
}

INTRO = "Real interior photograph, 4:3 landscape, of one piece of custom-made furniture installed in a Romanian apartment. The attached 3D render shows the piece: use it ONLY as the geometry and colour reference. The furniture in the photo must match the render exactly in proportions, number of doors, drawers and compartments, colours and handles; everything else (room, light, materials) must be a real photograph."
PHOTOREAL = "Photorealism: this must look like a real photograph of installed furniture taken by an interior photographer in a lived-in Romanian apartment, not a 3D render and not a catalogue illustration. Real melamine chipboard with matching 1–2 mm edge banding visible on the edges, even 2–3 mm gaps between fronts, true-to-scale 18 mm panel thickness, soft contact shadows under and beside the piece, faint natural reflections, slight real-life imperfection (a wall socket and light switch at normal heights, white skirting board, a radiator or door frame where it belongs). Believable scale: standard interior doors are 2.05 m high, sockets at 30 cm, switches at 1.05 m."
AVOID = "Avoid: text, logos, watermarks, people, pets; warped or bending lines, fisheye, tilted verticals; extra or missing doors, drawers, shelves or columns; changed proportions; oversized or miniature furniture; plastic or glowing CGI materials; orange/teal grading, golden dappled sun patches, HDR glow; identical showroom styling (no olive-branch vase, no ribbed vase, no framed landscape print as the only decor); furniture standing in the middle of the room, in front of a window, radiator or door; floating furniture"
AVOID_WALL = AVOID + " (this piece IS wall-hung: keep it at the stated height, with the wall, floor and the item below it clearly visible)."

CAM_TALL = "Camera at 1.35–1.45 m height, 35 mm full-frame equivalent, standing 4 m back, three-quarter view about 15–20° off the cupboard wall; verticals perfectly straight (corrected like an architectural shot), no fisheye, no wide-angle stretching at the edges. 4:3 landscape. The whole cupboard is visible from plinth to top with the ceiling line above and floor below; because it is narrow it fills only about 30–35% of the frame width."
CAM_LOW = "Camera at 1.1–1.2 m height, 35 mm full-frame equivalent, about 3 m back, three-quarter view about 20° off the wall; verticals straight, no fisheye. 4:3 landscape. Whole piece visible with floor in front and wall above; it fills about 45–50% of the frame width."
CAM_WALL = "Camera at 1.4 m height (standing eye level), 35 mm full-frame equivalent, 2.5–3 m back, about 20° off the wall; verticals straight, no fisheye. 4:3 landscape. The wall unit is fully visible together with what stands below it and the floor line, so its mounting height can be read; the unit fills about 50–55% of the frame width."
CAM_BATH_TALL = "Camera at 1.4 m height, 28–35 mm full-frame equivalent, from the bathroom doorway about 2.5 m back, about 20° off the wall; verticals straight, no fisheye. 4:3 landscape. Column visible from plinth to top with the floor and the ceiling line; it fills about 25% of the frame width."
CAM_BATH_LOW = "Camera at 1.2 m height, 28–35 mm full-frame equivalent, from the bathroom doorway about 2 m back, about 20° off the wall; verticals straight, no fisheye. 4:3 landscape. Whole cabinet visible with the floor in front and the fixture beside it; it fills about 35–40% of the frame width."
CAM_BATH_WALL = "Camera at 1.4 m height, 28–35 mm full-frame equivalent, from the bathroom doorway about 2 m back, about 20° off the wall; verticals straight, no fisheye. 4:3 landscape. Cabinet fully visible with the fixture below it and the floor line; it fills about 35–40% of the frame width."
CAM_DIV = "Camera at 1.2 m height, 35 mm full-frame equivalent, 3 m back, three-quarter view so the front and one end of the unit are visible and the wall or room behind shows through the open compartments; verticals straight, no fisheye. 4:3 landscape. Whole unit visible; about 45–50% of the frame width."

REALISM_CHECK = "Looks like a real photo: edges, gaps, shadows, plausible room; no text, people, warped lines"
COLOUR_CHECK = "Colours match the palette named in the prompt (body vs fronts not swapped); cashmere is greige, not pink"

BATH_WEB = v2["products"]["suspendat-baie-60"]["webRefs"]

# ───────────────────────── new products ─────────────────────────
NEW = {
 "dressing-camara-90": dict(
  kind="tall", room="Kitchen (bucătărie) or the pantry niche next to it.",
  piece="Tall pantry cupboard 90 cm wide × 220 cm high × 50 cm deep with exactly 4 hinged doors in two rows: 2 lower doors and 2 upper doors (2 columns of 45 cm), with one continuous horizontal joint line exactly where the render has it, on a 10 cm recessed plinth. All doors closed.",
  body="side panels, top and plinth", fronts="the 4 doors",
  placement="Floor-standing against a full wall of the kitchen, one side tight in the room corner or filling a niche beside a free-standing fridge; never in front of the window or radiator. The top is at 2.20 m: 15 cm higher than the 2.05 m door frame and 40 cm below the 2.60 m ceiling. It is a free-standing cupboard, not part of a fitted kitchen: any kitchen units in the picture are in a clearly different colour and only at the edge of the frame.",
  mount=None, camera=CAM_TALL,
  ratio="The cupboard is 2.4 times as tall as it is wide (90 × 220 cm). Each door is 45 cm wide, about half the width of an interior door leaf.",
  anchors="a 2.05 m interior door frame (the cupboard is 15 cm taller), the ceiling at 2.60 m (40 cm of wall above the cupboard) and a socket at 30 cm",
  checklist=["Exactly 4 doors: 2 columns × 2 rows, joint line as in the render", "One vertical matt-black bar handle per door, as in the render", "90 × 220 cm: 15 cm taller than the door frame, about 40 cm of wall below the ceiling", "On a recessed plinth, in a corner or niche of a real kitchen; reads as a separate cupboard, not as a fitted kitchen"],
  ourRefs=["public/portfolio/green-pesto-kitchen-column.webp", "public/portfolio/shaker-white-kitchen-column.webp", "public/portfolio/olive-hall-tall-cabinet.webp"], webRefs=[],
  scenes={
   "alb-total": ("On the short wall of an apartment kitchen, tight in the corner beside the kitchen door; the end of a wood-coloured worktop with a kettle at the far frame edge; a small dining table corner with one chair in the foreground. Room surfaces: walls painted a warm greige so the white cupboard separates clearly from the wall; matt light-grey floor tiles.", "Soft overcast daylight from a window on the left, neutral white balance.", "a mug on the table"),
   "alb-stejar-natur": ("Filling a 95 cm niche beside a free-standing stainless-steel fridge; a wicker basket on the floor at the other side; the kitchen itself is out of frame. Room surfaces: walls painted light warm grey (so the white side panel and the oak doors both separate from the wall); warm beige terracotta-look floor tiles.", "Cloudy-afternoon daylight from a window on the right, even and slightly cool.", "a tea towel over the fridge handle"),
  }),
 "dressing-serviciu-80": dict(
  kind="tall", room="Entrance hall (hol) or the passage to the kitchen.",
  piece="Utility cupboard for the vacuum cleaner and brooms, 80 cm wide × 220 cm high × 45 cm deep, with exactly 2 full-height hinged doors (40 cm each), on a 10 cm recessed plinth. Both doors closed.",
  body="side panels, top and plinth", fronts="the 2 doors",
  placement="Floor-standing at the end of the hall or in a corner beside a room door, one side tight to the side wall; it does not block any door. The top is at 2.20 m: 15 cm higher than the 2.05 m door frame and 40 cm below the 2.60 m ceiling. Tall and slim: 2.75 times taller than wide.",
  mount=None, camera=CAM_TALL,
  ratio="The cupboard is 2.75 times as tall as it is wide (80 × 220 cm): the same width as the interior door leaf beside it. Each door is only 40 cm wide, half of that door leaf.",
  anchors="a 2.05 m interior door (the cupboard is 15 cm taller and as wide as the door leaf), the ceiling at 2.60 m (40 cm of wall above the cupboard) and a socket at 30 cm",
  checklist=["Exactly 2 narrow full-height doors, closed", "No handles at all (push-to-open)", "80 × 220 cm: as wide as a door leaf, 15 cm taller than the door frame, 40 cm of wall below the ceiling", "On a recessed plinth, tight to a side wall in a real hall"],
  ourRefs=["public/portfolio/olive-hall-tall-cabinet.webp", "public/portfolio/walnut-laundry-cabinets.webp", "public/portfolio/cappuccino-wardrobe-v2.webp"], webRefs=v2["products"]["dressing-hol-120"]["webRefs"],
  scenes={
   "alb-total": ("At the end of a narrow entrance hall, tight in the corner next to the white bathroom door; a doormat near the entrance door at the frame edge; a row of three hooks on the opposite wall at 1.70 m. Room surfaces: walls painted a warm greige so the white side panel separates clearly from the wall; grey ceramic floor tiles.", "Even neutral daylight spilling in from the adjacent room, on the left.", "an umbrella leaning in the corner by the entrance door"),
   "gri-casmir": ("In the passage between hall and kitchen, tight to the side wall beside the kitchen doorway; a glimpse of the kitchen floor through the doorway. Room surfaces: plain white walls; mid-brown oak laminate floor.", "Daylight from the kitchen window on the right, soft and neutral.", "a pair of sneakers on the floor by the wall"),
  }),
 "dressing-baie-60": dict(
  kind="tall", bath=True, room="Bathroom (baie).",
  piece="Tall, shallow bathroom column 60 cm wide × 190 cm high × only 35 cm deep with exactly 2 hinged doors one above the other (each 60 cm wide), with the horizontal joint between them exactly where the render has it, on a 10 cm recessed plinth. Both doors closed.",
  body="side panels, top and plinth", fronts="the 2 doors",
  placement="Floor-standing against the tiled bathroom wall, one side in the corner or beside the washing machine; never in the shower zone. The top is at 1.90 m: 15 cm BELOW the top of the 2.05 m door frame and 70 cm below the ceiling. It is slim: 60 cm wide, the width of the washing machine beside it, and only 35 cm deep.",
  mount=None, camera=CAM_BATH_TALL,
  ratio="The column is 3.2 times as tall as it is wide (60 × 190 cm). It is exactly as wide as the washing machine (60 cm) and a little more than twice as high (190 cm against 85 cm).",
  anchors="the 2.05 m door frame (the column ends 15 cm below its top), the ceiling at 2.60 m and a washing machine or basin rim at 85 cm",
  checklist=["Exactly 2 doors, one above the other, full width", "One vertical brushed-steel bar handle per door, as in the render", "Slim: 60 × 190 × 35 cm; as wide as a washing machine, top 15 cm below the door-frame top", "Real bathroom: tiles, a fixture beside it; on a recessed plinth, against the wall"],
  ourRefs=["public/portfolio/cappuccino-bathroom-v2.webp", "public/portfolio/walnut-laundry-cabinets.webp", "public/portfolio/petrol-bathroom-vanity-full.webp"], webRefs=BATH_WEB,
  scenes={
   "alb-total": ("In the corner beside a white front-loading washing machine; a chrome towel radiator on the adjacent wall; a laundry basket on the floor. Room surfaces: large-format matte warm-grey wall tiles (so the white column separates from the wall); darker grey floor tiles.", "Even neutral ceiling light (about 4000 K, the lamp itself out of frame) plus daylight spilling in from the doorway on the left.", "a folded towel on the washing machine"),
   "alb-stejar-natur": ("Beside a white wall-hung vanity with a basin and chrome tap; the vanity's wall mirror further along the same wall. Room surfaces: white rectangular metro tiles up to 1.50 m, white paint above; anthracite floor tiles.", "Soft daylight from a small frosted window on the right, ceiling light off.", "a folded towel on the edge of the bathtub at the frame edge"),
  }),
 "dressing-birou-100": dict(
  kind="tall", room="Home office (birou).",
  piece="Office cupboard for binders and files, 100 cm wide × 200 cm high × 40 cm deep, with exactly 2 full-height hinged doors (50 cm each), on a 10 cm recessed plinth. Both doors closed.",
  body="side panels, top and plinth", fronts="the 2 doors",
  placement="Floor-standing against a wall of the home office, one side tight in the room corner, beside the desk wall; never in front of the window or radiator. The top is at 2.00 m: 5 cm below the top of the 2.05 m door frame and 60 cm below the 2.60 m ceiling. Exactly twice as tall as wide.",
  mount=None, camera=CAM_TALL,
  ratio="The cupboard is exactly twice as tall as it is wide (100 × 200 cm). It is a little wider than the interior door leaf (100 cm against 80 cm) and its top is level with the top of the door frame.",
  anchors="a 2.05 m interior door frame (the cupboard top is level with it, 5 cm lower), the ceiling at 2.60 m (60 cm of wall above the cupboard) and a socket at 30 cm",
  checklist=["Exactly 2 full-height doors, closed", "One small brushed-steel knob per door near the centre edge, as in the render", "100 × 200 cm: top level with the door frame, 60 cm of wall below the ceiling", "On a recessed plinth, in a corner of a real home office with a desk nearby"],
  ourRefs=["public/portfolio/double-office-wardrobe.webp", "public/portfolio/double-office-full.webp"], webRefs=[],
  scenes={
   "stejar-natur": ("In the corner of a home office; a white desk with a monitor and a task chair along the adjacent wall; a low plant on the floor on the far side. Room surfaces: plain white walls; light grey laminate floor (so the oak furniture does not merge with the floor).", "Soft overcast daylight from a window on the left, neutral white balance.", "reading glasses on the desk"),
   "alb-stejar-natur": ("In the corner of a small study in a living-room alcove; a white desk with a laptop and a desk lamp (switched off) on the adjacent wall. Room surfaces: walls painted light warm grey so the white side panel reads clearly; pale grey-beige laminate floor (clearly different from the oak doors).", "Clear winter daylight from a window on the right, cool-neutral, soft shadows.", "a mug on the desk"),
  }),
 "comoda-cafea-120": dict(
  kind="chest", room="Kitchen or dining area (bucătărie, sufragerie).",
  piece="Coffee sideboard 120 cm wide × 90 cm high × 45 cm deep, on a 10 cm recessed plinth: left section (60 cm) with exactly 1 hinged door, right section (60 cm) with exactly 3 drawers one above the other.",
  body="top, side panels and plinth", fronts="the door and the 3 drawer fronts",
  placement="Against a free wall of the kitchen or dining area, tight to the wall. The top is at 90 cm, the height of a kitchen worktop: an espresso machine and a few cups stand on it. A short wall shelf or one picture hangs above, lower edge 40 cm above the top. It is a free-standing sideboard, not part of a fitted kitchen.",
  mount=None, camera=CAM_LOW,
  ratio="The sideboard is 1.3 times as long as it is high (120 × 90 cm): a compact, fairly tall block. The door section and the drawer section are equal halves.",
  anchors="a 2.05 m interior door or its frame, the ceiling at 2.60 m and a socket at 30 cm; the top (90 cm) is a hand's width below the room-door handle",
  checklist=["Exactly 1 door on the left and 3 stacked drawers on the right, equal halves", "One small matt-black knob per front: centred on each drawer, near the opening edge on the door", "120 × 90 cm: top at worktop height, a hand's width below the door handle", "Recessed plinth, against a wall; espresso machine on top; the only cabinet in the photo"],
  ourRefs=["public/portfolio/cream-living-cover.webp", "public/portfolio/oak-studio-kitchen-cover-v2.webp"], webRefs=v2["products"]["comoda-mixta-180"]["webRefs"],
  scenes={
   "alb-stejar-natur": ("Dining corner of an apartment kitchen: an espresso machine, three white cups and a glass jar of coffee beans (no label) on top; one plain framed print above; the edge of a round dining table and one chair in the foreground. Room surfaces: walls painted a warm greige so the white body separates clearly from the wall; matt light-grey floor tiles (clearly different from the oak fronts).", "Soft overcast daylight from a window on the left, neutral white balance.", "a tea towel folded on the top"),
   "alb-total": ("On the wall between the living room and the dining table: a filter-coffee maker, a small tray with cups and a trailing plant on top; a short oak wall shelf above with a few glasses. Room surfaces: walls painted a muted sage grey-green so the white sideboard separates clearly from the wall; warm mid-brown laminate floor.", "Indirect daylight on a sunny day from a window on the right, no hard sun patches on the furniture.", "a mug on the dining table at the frame edge"),
  }),
 "comoda-baie-80": dict(
  kind="chest", bath=True, room="Bathroom (baie).",
  piece="Low, shallow bathroom cabinet 80 cm wide × 85 cm high × only 35 cm deep, on a 10 cm recessed plinth: left section (40 cm) with exactly 1 hinged door, right section (40 cm) with exactly 3 drawers one above the other. It has a plain flat top in the body colour: no basin, no tap.",
  body="top, side panels and plinth", fronts="the door and the 3 drawer fronts",
  placement="Floor-standing against the tiled bathroom wall, beside the washing machine or at the end of the bathtub; its top is at 85 cm, level with the top of the washing machine. It is a storage cabinet, NOT a vanity: there is no washbasin on it. Folded towels and a small basket stand on top.",
  mount=None, camera=CAM_BATH_LOW,
  ratio="The front is almost square: 80 cm wide and 85 cm high. The cabinet is 20 cm wider than the washing machine beside it and exactly as high.",
  anchors="the washing machine at 85 cm (same height as the cabinet), the 2.05 m door frame and the ceiling at 2.60 m",
  checklist=["Exactly 1 door on the left and 3 stacked drawers on the right", "No bars or knobs: thin steel-coloured channel above each drawer and along the door edge", "80 × 85 × 35 cm: as high as the washing machine, flat top with no basin", "Real bathroom: tiles, a fixture beside it; recessed plinth, against the wall"],
  ourRefs=["public/portfolio/cappuccino-bathroom-v2.webp", "public/portfolio/mustard-bathroom-vanity-cover.webp", "public/portfolio/walnut-laundry-washer.webp"], webRefs=BATH_WEB,
  scenes={
   "alb-casmir": ("Beside a white front-loading washing machine, tops level; two folded towels and a small wicker basket on top; a towel hook on the wall above at 1.60 m. Room surfaces: large-format matte light-grey wall tiles; darker grey floor tiles.", "Even neutral ceiling light (about 4000 K, the lamp itself out of frame) plus daylight spilling in from the doorway on the left.", "a folded towel"),
   "gri-casmir": ("At the foot end of a white bathtub, against the side wall; a small plant and a stack of towels on top; a chrome towel radiator further along the wall. Room surfaces: white rectangular metro tiles (so the cashmere cabinet separates from the wall); warm grey floor tiles.", "Soft daylight from a small frosted window on the right, ceiling light off.", "a bath mat on the floor in front of the tub"),
  }),
 "comoda-birou-90": dict(
  kind="chest", room="Home office (birou).",
  piece="Office chest 90 cm wide × 75 cm high × 45 cm deep, on a 10 cm recessed plinth: left section (45 cm) with exactly 3 drawers one above the other, right section (45 cm) with exactly 1 hinged door.",
  body="top, side panels and plinth", fronts="the 3 drawer fronts and the door",
  placement="Against the wall right beside the desk, tight to the wall; its top is at 75 cm, level with the desk top, so the two read as one work surface. A compact printer stands on top. It is small: 90 cm wide, about half the length of the desk.",
  mount=None, camera=CAM_LOW,
  ratio="The chest is 1.2 times as long as it is high (90 × 75 cm), a compact block exactly as high as the desk beside it. The drawer section and the door section are equal halves.",
  anchors="the desk top at 75 cm (same height), a 2.05 m interior door or its frame, the ceiling at 2.60 m and a socket at 30 cm; the top is well below the door handle (30 cm lower)",
  checklist=["Exactly 3 stacked drawers on the left and 1 door on the right, equal halves", "No bars or knobs: thin matt-black channel above each drawer and along the door edge", "90 × 75 cm: level with the desk top, about half the desk's length", "Recessed plinth, against the wall beside a desk; printer on top; the only cabinet in the photo"],
  ourRefs=["public/portfolio/double-office-cover.webp", "public/portfolio/double-office-full.webp"], webRefs=v2["products"]["comoda-nisa-140"]["webRefs"],
  scenes={
   "alb-stejar-natur": ("Home office: beside a white 160 cm desk with a monitor and a keyboard; a compact printer and a small plant on the chest; a task chair pushed in. Room surfaces: walls painted light warm grey so the white body separates from the wall; light grey laminate floor (clearly different from the oak fronts).", "Soft overcast daylight from a window on the left, neutral white balance.", "reading glasses on the desk"),
   "alb-total": ("Work corner of a bedroom-office: beside an oak-topped desk with a laptop and a desk lamp (switched off); a compact printer and a stack of plain paper on the chest. Room surfaces: walls painted a warm greige so the white furniture separates clearly from the wall; natural oak laminate floor.", "Bright late-morning daylight from a window on the right, filtered through sheer white curtains.", "a mug on the desk"),
  }),
 "separator-copii-120": dict(
  kind="divider", room="Child's room (camera copilului).",
  piece="Low children's bookcase 120 cm wide × 120 cm high × 35 cm deep, on a low plinth: 3 columns (40 cm each); upper part open on both faces (no back panel) with exactly 1 shelf per column (2 open compartments per column, 6 in total); bottom part 40 cm high, closed, with exactly 3 drawers side by side (one per column).",
  body="the frame, shelves and plinth", fronts="the 3 drawer fronts",
  placement="In the child's room, either against a wall (the wall shows through the open compartments) or perpendicular to a wall with one end against it, between the play corner and the bed or desk. The top is at 1.20 m: 15 cm above the light switch and the door handle, less than 60% of the door height, so a child reaches every shelf. Picture books, wooden blocks and one soft toy fill about half of the compartments.",
  mount=None, camera=CAM_DIV,
  ratio="The front is a square: exactly as wide as it is high (120 × 120 cm). The drawer row is the bottom third; the six open compartments are the upper two thirds.",
  anchors="a 2.05 m interior door (the bookcase is less than 60% of its height, its top 15 cm above the door handle), the ceiling at 2.60 m (140 cm of wall above the bookcase) and a socket at 30 cm",
  checklist=["3 columns: 2 open compartments each above, exactly 3 drawers side by side in the 40 cm base", "One small brushed-gold knob centred on each drawer", "Low and square: 120 × 120 cm, top just above the door handle and light switch", "Lived-in child's room; shelves half filled with picture books and toys; on a plinth"],
  ourRefs=["public/portfolio/cream-living-bookcase.webp", "public/portfolio/cream-living-bookcase-empty.webp"], webRefs=v2["products"]["dressing-copii-150"]["webRefs"],
  scenes={
   "alb-total": ("Against the wall beside a child's bed with plain bedding; picture books with plain spines, a box of wooden blocks and one soft toy on the shelves; a play rug in front. Room surfaces: walls painted a warm greige so the white frame separates clearly from the wall; natural oak laminate floor.", "Soft overcast daylight from a window on the left, neutral white balance.", "a toy car on the rug"),
   "stejar-alb": ("Perpendicular to the wall with one end against it, between the play corner and a child's desk; the desk and chair visible through the open compartments; a globe without lettering on top. Room surfaces: plain white walls; pale grey laminate floor (so the oak frame does not merge with the floor).", "Bright late-morning daylight from a window on the right, filtered through sheer white curtains.", "a small backpack on the floor by the desk"),
  }),
 "suspendat-bucatarie-180": dict(
  kind="wall", room="Kitchen (bucătărie), above a counter or coffee corner.",
  piece="Wall-hung kitchen cabinet 180 cm wide × 72 cm high × 32 cm deep with exactly 3 hinged doors (60 cm each, each door taller than wide); no legs, no plinth, fixed to the wall. All doors closed.",
  body="sides, top and underside", fronts="the 3 doors",
  placement="Hung on the kitchen wall with its underside 145 cm above the floor (top at 217 cm). It always hangs above a 90 cm high counter: 55 cm of free wall or backsplash between the worktop and the cabinet, and about 43 cm of wall between its top and the ceiling. No hob and no cooker hood under it. The counter below is not the product: it is in a clearly different colour, with a plain worktop.",
  mount=145, camera=CAM_WALL,
  ratio="The cabinet is 2.5 times as long as it is high (180 × 72 cm). Each door is 60 cm wide and 72 cm high: a little taller than wide. It is as long as the 180 cm counter below it.",
  anchors="the worktop at 90 cm, a 2.05 m door frame (the cabinet top is 12 cm above it) and the ceiling at 2.60 m",
  checklist=["Exactly 3 equal doors, each slightly taller than wide", "No bars or knobs: thin steel-coloured channel along the door edges, as in the render", "Underside about 145 cm above the floor, 55 cm above a 90 cm worktop; top about 217 cm", "Hangs above a counter in a real kitchen; no hob or hood under it; the counter is a different colour"],
  ourRefs=["public/portfolio/shaker-white-kitchen-wide.webp", "public/portfolio/oak-studio-kitchen-wide-v2.webp", "public/portfolio/white-marble-kitchen-cover.webp"], webRefs=[],
  scenes={
   "alb-total": ("Above a 180 cm base counter in matt sage green with an oak-look worktop: a kettle, a wooden chopping board leaning on the backsplash and a small herb pot; a socket in the backsplash at 110 cm. Room surfaces: wall painted a warm greige with pale grey square backsplash tiles (so the white cabinet separates from the wall); light oak laminate floor.", "Soft overcast daylight from a window on the left, neutral white balance.", "a mug on the worktop"),
   "alb-stejar-natur": ("Coffee corner: above a 180 cm dark-grey base counter with a pale stone-look worktop; an espresso machine, a jar of beans (no label) and three cups below it. Room surfaces: walls painted a warm greige, no tiles; matt light-grey floor tiles (clearly different from the oak doors).", "Cloudy-afternoon daylight from a window on the right, even and slightly cool.", "a tea towel on the worktop edge"),
  }),
 "suspendat-baie-nisa-90": dict(
  kind="wall", bath=True, room="Bathroom (baie).",
  piece="Small wall-hung bathroom cabinet 90 cm wide × 70 cm high × only 25 cm deep: left an open niche (30 cm wide) with exactly 2 shelves (3 open compartments, with a back panel), right exactly 1 hinged door (60 cm wide); no legs. Door closed.",
  body="sides, top, underside and the open niche with its shelves", fronts="the single door",
  placement="Hung on the tiled bathroom wall with its underside 135 cm above the floor (top at 205 cm, level with the top of the door frame). It always hangs above something: the washing machine (85 cm high, so 50 cm of free wall between them) or the wall-hung toilet's cistern panel. It is small and shallow; it does not replace the mirror. Rolled towels lie in the open niche.",
  mount=135, camera=CAM_BATH_WALL,
  ratio="The cabinet is 1.3 times as long as it is high (90 × 70 cm). The open niche is one third of the length, the door two thirds. It is 30 cm wider than the washing machine and only 25 cm deep, less than half the machine's depth.",
  anchors="the washing machine or cistern panel below it, the 2.05 m door frame (the cabinet top is level with it) and the ceiling at 2.60 m",
  checklist=["Open niche with exactly 2 shelves on the left (one third), exactly 1 door on the right (two thirds)", "One small matt-black knob at the lower opening corner of the door", "Underside about 135 cm above the floor, 50 cm above the washing machine; top level with the door frame", "Small and shallow (90 × 70 × 25 cm) in a real bathroom; rolled towels in the niche; mirror still present elsewhere"],
  ourRefs=["public/portfolio/cappuccino-bathroom-v2.webp", "public/portfolio/petrol-bathroom-vanity-full.webp", "public/portfolio/walnut-laundry-washer.webp"], webRefs=BATH_WEB,
  scenes={
   "alb-total": ("Above a white front-loading washing machine in a bathroom niche; three rolled grey towels and a small plant in the open niche; a laundry basket beside the machine. Room surfaces: large-format matte warm-grey wall tiles (so the white cabinet separates from the wall); darker grey floor tiles.", "Even neutral ceiling light (about 4000 K, the lamp itself out of frame) plus daylight spilling in from the doorway on the left.", "a folded towel on the washing machine"),
   "stejar-alb": ("Above the tiled cistern panel of a wall-hung toilet (panel top at 115 cm, so 20 cm of wall between panel and cabinet); rolled grey towels and two plain bottles (no labels) in the oak niche; a chrome towel radiator on the adjacent wall. Room surfaces: white rectangular metro tiles (so the oak body separates from the wall); anthracite floor tiles.", "Soft daylight from a small frosted window on the right, ceiling light off.", "a small plant on the cistern panel"),
  }),
}

NEW.update({
 "dressing-3-usi-150": dict(
  kind="tall", room="Bedroom (dormitor).",
  piece="Classic three-door bedroom wardrobe 150 cm wide × 210 cm high × 55 cm deep with exactly 3 full-height hinged doors of equal width (50 cm each), on a 10 cm recessed plinth. All doors closed.",
  body="side panels, top and plinth", fronts="the 3 doors",
  placement="Floor-standing against a full wall of the bedroom, one side tight in the room corner; never in front of the window, radiator or door. The top is at 2.10 m: 5 cm above the top of the 2.05 m door frame and 50 cm below the 2.60 m ceiling. A double bed stands parallel to it with an 85 cm passage.",
  mount=None, camera="Camera at 1.35–1.45 m height, 35 mm full-frame equivalent, standing 4 m back, three-quarter view about 15–20° off the wardrobe wall; verticals perfectly straight, no fisheye, no wide-angle stretching at the edges. 4:3 landscape. The whole wardrobe is visible from plinth to top with the ceiling line above and floor below; it fills about 45–50% of the frame width.",
  ratio="The wardrobe is 1.4 times as tall as it is wide (150 × 210 cm). Each door is 50 cm wide and more than four times as tall as wide; the three doors are equal.",
  anchors="a 2.05 m interior door frame (the wardrobe top is level with it, 5 cm higher), the ceiling at 2.60 m (50 cm of wall above the wardrobe) and a socket at 30 cm",
  checklist=["Exactly 3 equal full-height hinged doors", "One vertical brushed-steel bar handle per door, as in the render", "150 × 210 cm: top level with the door frame, 50 cm of wall below the ceiling", "On a recessed plinth, in a bedroom corner, bed with a clear passage"],
  ourRefs=["public/portfolio/cappuccino-wardrobe-v2.webp", "public/portfolio/mustard-bedroom-wardrobe.webp"], webRefs=v2["products"]["dressing-sertare-200"]["webRefs"],
  scenes={
   "alb-total": ("In the corner of a small bedroom beside the closed room door; a double bed with plain linen bedding at the lower left; an open metal-frame bedside stool. Room surfaces: walls painted a warm greige so the white wardrobe separates clearly from the wall; natural oak laminate floor.", "Soft overcast daylight from a window on the left, neutral white balance.", "a folded blanket on the bed"),
   "alb-stejar-natur": ("In the corner of a bedroom, on the wall opposite the window; a double bed with grey bedding at the lower right; a floor plant in the far corner. Room surfaces: walls painted light warm grey; pale grey-beige laminate floor (clearly different from the oak doors).", "Bright late-morning daylight from a window on the right, filtered through sheer white curtains.", "a laundry basket beside the bed"),
  }),
 "comoda-pantofar-80": dict(
  kind="chest", room="Entrance hall (hol).",
  piece="Tall, slim shoe cabinet 80 cm wide × 120 cm high × only 30 cm deep with exactly 2 full-height hinged doors (40 cm each), on a 10 cm recessed plinth. Both doors closed.",
  body="top, side panels and plinth", fronts="the 2 doors",
  placement="Against the wall of a narrow entrance hall close to the apartment's entrance door, tight to the wall. Its top is at 1.20 m, 15 cm above the door handle and the light switch. It is only 30 cm deep, so the passage stays free. A key bowl on top; a round mirror or a row of hooks on the wall above; a doormat nearby.",
  mount=None, camera=CAM_LOW.replace("it fills about 45–50% of the frame width", "it fills about 35–40% of the frame width"),
  ratio="The cabinet is 1.5 times as tall as it is wide (80 × 120 cm): as wide as the entrance-door leaf. Each door is 40 cm wide and almost three times as tall as wide. It is very shallow: 30 cm, about the length of one shoe.",
  anchors="the 2.05 m entrance door (the cabinet is as wide as the door leaf and its top is 15 cm above the door handle), the ceiling at 2.60 m and a socket at 30 cm",
  checklist=["Exactly 2 narrow full-height doors, closed", "No handles at all (push-to-open)", "Slim: 80 × 120 × 30 cm; top 15 cm above the door handle, very shallow", "Real entrance hall: entrance door, mirror or hooks above, mat; recessed plinth, against the wall; the only cabinet in the photo"],
  ourRefs=["public/portfolio/olive-hall-cover.webp", "public/portfolio/olive-hall-overview.webp"], webRefs=v2["products"]["comoda-hol-120"]["webRefs"],
  scenes={
   "alb-total": ("Narrow hall of a new apartment: a round mirror above, fully visible; a key bowl on top; the entrance door at the left frame edge, a doormat on grey ceramic tiles. Room surfaces: walls painted a warm greige so the white cabinet separates clearly from the wall; grey ceramic floor tiles.", "Even neutral daylight spilling in from the adjacent room on the left.", "a pair of sneakers on the doormat"),
   "alb-stejar-natur": ("Hall of an older apartment: a row of three hooks at 1.70 m on the wall above with one coat; a small plant on top; the entrance door at the right frame edge. Room surfaces: walls painted light warm grey; pale grey-beige laminate floor (clearly different from the oak doors).", "Daylight from an open room door on the right plus soft ambient light.", "a tote bag on one hook"),
  }),
 "separator-cuburi-150": dict(
  kind="divider", room="Living room, child's room or home office.",
  piece="Cube bookcase 150 cm wide × 150 cm high × 40 cm deep, open on both faces (no back panel), on a low plinth: exactly 4 columns × 4 rows = 16 equal, nearly square open compartments. No doors, no drawers.",
  body="the frame, shelves and plinth", fronts="",
  placement="Either against a wall (the wall shows through the compartments) or perpendicular to a wall with one end against it, between two zones of an open living room. The top is at 1.50 m: shoulder height, 55 cm below the top of a door, so you see over it. About half of the cubes hold books, two or three plain fabric boxes and a plant; the rest are empty.",
  mount=None, camera=CAM_DIV.replace("Camera at 1.2 m height", "Camera at 1.3 m height"),
  ratio="The front is a square: exactly as wide as it is high (150 × 150 cm), divided into 4 × 4 equal, nearly square cubes of about 35 cm.",
  anchors="a 2.05 m interior door (the bookcase is three quarters of its height), the ceiling at 2.60 m (110 cm of air above the bookcase) and a socket at 30 cm",
  checklist=["Exactly 4 columns × 4 rows = 16 equal open cubes, no back, no doors or drawers", "Square front: 150 × 150 cm, top at shoulder height (three quarters of a door)", "Against a wall or perpendicular to it as a divider; on a plinth", "Half filled: books with plain spines, 2–3 plain boxes, a plant"],
  ourRefs=["public/portfolio/cream-living-bookcase.webp", "public/portfolio/cream-living-bookcase-empty.webp"], webRefs=v2["products"]["separator-biblioteca-120"]["webRefs"],
  scenes={
   "alb-total": ("Against the living-room wall beside a grey sofa; books with plain spines, three plain grey fabric boxes in the bottom row and a trailing plant; a table lamp (switched off) on top. Room surfaces: walls painted a warm greige so the white bookcase separates clearly from the wall; natural oak laminate floor.", "Soft overcast daylight from a window on the left, neutral white balance.", "a folded blanket on the sofa arm"),
   "stejar-natur": ("Perpendicular to the wall with one end against it, between the sofa zone and a small dining table in an open living room with the kitchen beyond; the dining chairs visible through the empty cubes; two wicker baskets in the bottom row. Room surfaces: plain white walls; light grey laminate floor (so the oak bookcase does not merge with the floor).", "Cloudy-afternoon daylight from a window on the right, even and slightly cool.", "a mug on the top"),
  }),
})


CAM_KITCHEN = "Camera at 1.4–1.5 m height, 35 mm full-frame equivalent, standing 4–4.5 m back in the room (from the dining area or doorway), three-quarter view about 15–25° off the main kitchen wall; verticals perfectly straight, no fisheye, no wide-angle stretching. 4:3 landscape. The whole kitchen is visible from the plinth to the top of the wall cabinets, with the ceiling line above and floor in front; it fills about 70–80% of the frame width."
CAM_KITCHEN_L = CAM_KITCHEN.replace("three-quarter view about 15–25° off the main kitchen wall", "standing diagonally opposite the corner so both walls of the L are visible, the main wall a little more frontal")
K_REFS = ["public/portfolio/shaker-white-kitchen-wide.webp", "public/portfolio/oak-studio-kitchen-wide-v2.webp", "public/portfolio/white-marble-kitchen-wide.webp", "public/portfolio/green-pesto-kitchen-corner.webp"]
K_CHECK = ["Modules exactly as in the render, in the same order, same widths", "Worktop continuous at 90 cm in the named decor; 55 cm backsplash; wall cabinets as in the render", "Appliances built in only where the render shows them; fridge/dishwasher hidden behind fronts", "Real apartment kitchen with 1.10 m clear floor in front"]
K_BODY = "visible end panels, plinth, the underside and sides of the wall cabinets"
K_FRONTS = "all doors, drawer fronts and the panels in front of the dishwasher and fridge"

NEW.update({
 "bucatarie-240": dict(
  kind="kitchen", room="Kitchen of a Romanian apartment (bucătărie).",
  piece="Fitted kitchen on one wall, 240 cm long, 220 cm high to the top of the wall cabinets. Under the worktop, left to right, four 60 cm modules: a stack of 3 drawers; the sink cabinet with 2 doors; the integrated dishwasher (one full front); the built-in oven with the induction hob above it. Above them, four 60 cm wall cabinets with doors, except a stainless chimney hood above the hob. Doors and drawers closed.",
  body=K_BODY, fronts=K_FRONTS,
  placement="Fitted along the full 2.40 m wall of a small kitchen, wall to wall; the window is on the side wall; a small dining table for two stands 1.2 m in front of it.",
  mount=None, camera=CAM_KITCHEN,
  ratio="The run is 2.4 m long and 2.2 m high to the cabinet tops: a little longer than high. The base units are 90 cm high (worktop), the wall cabinets 72 cm, with 55 cm of backsplash between.",
  anchors="a 2.05 m interior door or its frame on the side (the wall cabinet tops are 15 cm higher), the ceiling at 2.60 m (40 cm of wall above the cabinets) and the sockets on the backsplash at 1.10 m",
  checklist=K_CHECK, ourRefs=K_REFS, webRefs=[],
  scenes={
   "alb-stejar-natur": ("Small kitchen of a new apartment: a kettle and a wooden chopping board on the worktop, a small herb pot by the window; light grey rectangular backsplash tiles. Worktop: pale grey stone look. Room surfaces: walls painted warm white; large light-grey floor tiles (clearly different from the oak fronts).", "Soft overcast daylight from a window on the left side wall, neutral white balance.", "a tea towel on the oven handle"),
   "alb-total": ("Kitchen of a renovated older apartment: a fruit bowl and a coffee maker on the worktop; white square backsplash tiles with grey grout. Worktop: natural oak look. Room surfaces: walls painted a warm greige so the white cabinets separate from the wall; natural oak laminate floor.", "Bright late-morning daylight from a window on the right side wall.", "a cookbook with a plain cover on the worktop"),
  }),
 "bucatarie-compacta-180": dict(
  kind="kitchen", room="Kitchenette of a studio apartment (garsonieră).",
  piece="Compact fitted kitchen on one wall, 180 cm long, 220 cm high to the top of the wall cabinets. Under the worktop, left to right, three 60 cm modules: the sink cabinet with 1 door; a stack of 3 drawers; the built-in oven with the induction hob above it. Above them two 60 cm wall cabinets with doors and a stainless chimney hood above the hob. Doors and drawers closed.",
  body=K_BODY, fronts=K_FRONTS,
  placement="In the kitchen niche of a studio, wall to wall on a 1.80 m wall; the living area with a sofa edge is visible at the frame edge.",
  mount=None, camera=CAM_KITCHEN.replace("it fills about 70–80% of the frame width", "it fills about 60% of the frame width"),
  ratio="The run is 1.8 m long and 2.2 m high: a little taller than long. Base units 90 cm high to the worktop, wall cabinets 72 cm, 55 cm of backsplash between.",
  anchors="a 2.05 m door frame on the side, the ceiling at 2.60 m and the sockets on the backsplash at 1.10 m",
  checklist=K_CHECK, ourRefs=K_REFS, webRefs=[],
  scenes={
   "alb-total": ("Studio kitchenette: a toaster and a small jar of utensils on the worktop; pale sage square backsplash tiles. Worktop: light oak look. Room surfaces: walls painted warm white; natural oak laminate floor continuing into the living area.", "Soft daylight from the living-room window on the left.", "a mug next to the sink"),
  }),
 "bucatarie-frigider-300": dict(
  kind="kitchen", room="Kitchen of a Romanian apartment (bucătărie).",
  piece="Fitted kitchen on one wall, 300 cm long, 220 cm high. Left: a 60 cm tall column hiding the fridge behind two fronts (a tall lower door and a short top door). Then under the worktop, four 60 cm modules: 3 drawers; the sink cabinet with 2 doors; the integrated dishwasher; the built-in oven with the induction hob above. Wall cabinets with doors above, a stainless chimney hood above the hob. Everything closed.",
  body=K_BODY, fronts=K_FRONTS,
  placement="Along the full 3 m wall of a kitchen, the fridge column tight to the left wall; a dining table for four 1.2 m in front.",
  mount=None, camera=CAM_KITCHEN,
  ratio="The run is 3 m long and 2.2 m high, about 1.4 times longer than high; the fridge column rises to the same top line as the wall cabinets.",
  anchors="the 2.05 m interior door on the right wall (the cabinet tops are 15 cm higher), the ceiling at 2.60 m and the sockets on the backsplash at 1.10 m",
  checklist=K_CHECK, ourRefs=K_REFS, webRefs=[],
  scenes={
   "gri-casmir": ("Warm family kitchen: a wooden bread board, a stoneware jar and a small radio-free shelf of spices on the worktop; white zellige-look backsplash tiles. Worktop: natural oak look. Room surfaces: walls painted warm white; mid-brown oak laminate floor.", "Cloudy-afternoon daylight from a window on the right side wall.", "a tea towel on the oven handle"),
   "alb-total": ("Bright modern kitchen: an espresso machine and a bowl of lemons on the worktop; light grey large-format backsplash. Worktop: white marble look. Room surfaces: walls painted pale greige so the white cabinets separate from the wall; light oak laminate floor.", "Soft overcast daylight from a window on the left side wall.", "a cutting board with a knife beside the sink"),
  }),
 "bucatarie-coloane-360": dict(
  kind="kitchen", room="Large kitchen open to the dining area.",
  piece="Fitted kitchen on one wall, 380 cm long, 230 cm high. Left two 60 cm tall columns: the fridge column (tall lower door, short top door) and the oven column (2 drawers below, a built-in oven and a microwave above it at eye level, a small door on top). Then under the worktop: 3 drawers (60 cm); the sink cabinet with 2 doors (80 cm); the integrated dishwasher (60 cm); the induction hob over a stack of drawers (60 cm). Wall cabinets with doors above, a stainless chimney hood over the hob. Everything closed.",
  body=K_BODY, fronts=K_FRONTS,
  placement="Along a 3.8 m wall of a kitchen open to the dining room; the two columns tight to the left wall; a dining table with chairs 1.3 m in front.",
  mount=None, camera=CAM_KITCHEN,
  ratio="The run is 3.8 m long and 2.3 m high, about 1.65 times longer than high; both columns rise to the same top line as the wall cabinets.",
  anchors="the 2.05 m door to the hall on the right, the ceiling at 2.60–2.70 m and the sockets on the backsplash at 1.10 m",
  checklist=K_CHECK, ourRefs=K_REFS, webRefs=[],
  scenes={
   "stejar-alb": ("Open kitchen-dining room: a fruit-free ceramic bowl, a kettle and an olive-oil bottle without label on the worktop; white rectangular metro backsplash. Worktop: white stone look. Room surfaces: walls painted warm white; light grey large floor tiles (clearly different from the oak body).", "Soft daylight from a large window on the right side wall.", "an apron hanging from the oven column handle"),
   "alb-total": ("Calm modern kitchen-dining room: two stools at the dining table; a coffee machine on the worktop; pale grey backsplash. Worktop: dark concrete look. Room surfaces: walls painted pale greige; natural oak laminate floor.", "Overcast daylight from a window on the left side wall.", "a glass of water by the sink"),
  }),
 "bucatarie-l-270": dict(
  kind="kitchen", room="Kitchen of a Romanian apartment (bucătărie).",
  piece="L-shaped fitted kitchen, 220 cm high. Main wall 270 cm: a 110 cm corner unit in the corner on the left (one door plus a fixed blind panel), the sink cabinet with 2 doors (100 cm), the integrated dishwasher (60 cm). Left wall 180 cm from the corner: a stack of 3 drawers (60 cm) and the built-in oven with the induction hob above (60 cm). Wall cabinets with doors along both walls, a stainless chimney hood above the hob. The worktop runs continuously around the corner. Everything closed.",
  body=K_BODY, fronts=K_FRONTS,
  placement="Fitted in the corner of a kitchen: 2.70 m along the main wall and 1.80 m along the left wall; the window is on the right side wall; a round dining table stands in the open part of the room.",
  mount=None, camera=CAM_KITCHEN_L,
  ratio="Main wall 2.7 m and left wall 1.8 m (two thirds of the main wall), both 2.2 m high; the corner unit is wider than the other modules.",
  anchors="the 2.05 m door to the hall (the cabinet tops are 15 cm higher), the ceiling at 2.60 m and the sockets on the backsplash at 1.10 m",
  checklist=K_CHECK + ["L shape: both walls visible, the worktop continuous around the corner"], ourRefs=K_REFS, webRefs=[],
  scenes={
   "alb-casmir": ("Cosy apartment kitchen: a wooden chopping board and a jar of wooden spoons on the worktop; white square backsplash tiles. Worktop: light oak look. Room surfaces: walls painted warm white; mid-brown oak laminate floor.", "Soft overcast daylight from a window on the right side wall.", "a tea towel over the oven handle"),
   "alb-stejar-natur": ("Bright kitchen of a new block: a kettle and a small herb pot on the worktop; pale grey backsplash tiles. Worktop: white stone look. Room surfaces: walls painted light warm grey; large light-grey floor tiles (clearly different from the oak fronts).", "Bright late-morning daylight from a window on the right side wall.", "a cookbook with a plain cover on the worktop"),
  }),
 "bucatarie-l-frigider-300": dict(
  kind="kitchen", room="Kitchen of a Romanian apartment (bucătărie).",
  piece="L-shaped fitted kitchen, 220 cm high. Main wall 300 cm: on the left a 60 cm tall fridge column (tall lower door, short top door), a 50 cm stack of 3 drawers, the sink cabinet with 2 doors (80 cm) and a 110 cm corner unit in the corner on the right. Right wall 240 cm from the corner: the integrated dishwasher, the built-in oven with the induction hob above and a stack of 3 drawers (60 cm each). Wall cabinets with doors on both walls, a stainless chimney hood above the hob. Continuous worktop around the corner. Everything closed.",
  body=K_BODY, fronts=K_FRONTS,
  placement="Fitted in the corner of a kitchen: 3 m along the main wall and 2.4 m along the right wall; a dining table for four in the open part of the room.",
  mount=None, camera=CAM_KITCHEN_L,
  ratio="Main wall 3 m and right wall 2.4 m, both 2.2 m high; the fridge column rises to the same top line as the wall cabinets.",
  anchors="the 2.05 m door to the hall, the ceiling at 2.60 m and the sockets on the backsplash at 1.10 m",
  checklist=K_CHECK + ["L shape: both walls visible, the worktop continuous around the corner"], ourRefs=K_REFS, webRefs=[],
  scenes={
   "bardolino-gri": ("Family kitchen: a bread board, a ceramic jug with utensils and a coffee maker on the worktop; white rectangular backsplash tiles. Worktop: white stone look. Room surfaces: walls painted warm white; light grey large floor tiles.", "Soft overcast daylight from a window on the left side wall.", "a tea towel on the dishwasher front"),
  }),
 "bucatarie-rafturi-240": dict(
  kind="kitchen", room="Kitchen of a Romanian apartment (bucătărie).",
  piece="Fitted kitchen on one wall, 240 cm long. Under the worktop four 60 cm modules: 3 drawers; the sink cabinet with 2 doors; the integrated dishwasher; the built-in oven with the induction hob above. Above: open shelves (2 levels) over the drawers and over the dishwasher, wall cabinets with doors over the sink, a stainless chimney hood over the hob. Doors and drawers closed.",
  body=K_BODY + " and the open shelves", fronts=K_FRONTS,
  placement="Along the full 2.40 m wall of a small kitchen; the window on the side wall; a small table in front.",
  mount=None, camera=CAM_KITCHEN,
  ratio="The run is 2.4 m long and 2.2 m high. Base units 90 cm high, open shelves and wall cabinets on the same top line.",
  anchors="the 2.05 m door frame on the side, the ceiling at 2.60 m and the sockets on the backsplash at 1.10 m",
  checklist=K_CHECK + ["Open shelves exactly where the render has them, lightly filled (plates, glasses, two jars without labels)"], ourRefs=K_REFS, webRefs=[],
  scenes={
   "salvie-stejar": ("Airy kitchen: plates, glasses and two jars without labels on the open shelves; a wooden chopping board on the worktop; white square zellige-look backsplash. Worktop: light oak look. Room surfaces: walls painted warm white; pale grey-beige laminate floor.", "Soft daylight from a window on the right side wall.", "a linen tea towel on the oven handle"),
  }),
 "bucatarie-ridicabile-300": dict(
  kind="kitchen", room="Modern kitchen open to the living room.",
  piece="Handle-less fitted kitchen on one wall, 300 cm long, 230 cm high. Left a 60 cm tall fridge column. Under the worktop four 60 cm modules: 3 drawers; the sink cabinet; the integrated dishwasher; the built-in oven with the induction hob above. Above them wall cabinets with lift-up fronts (one wide flap each) and a stainless chimney hood above the hob. All fronts completely flat, push-to-open, closed.",
  body=K_BODY, fronts=K_FRONTS,
  placement="Along a 3 m wall of a kitchen open to the living room; the fridge column tight to the left wall; a dining table 1.3 m in front.",
  mount=None, camera=CAM_KITCHEN,
  ratio="The run is 3 m long and 2.3 m high; each wall cabinet has one flat lift-up front, a little taller than wide, exactly as in the render.",
  anchors="the 2.05 m door to the hall, the ceiling at 2.60–2.70 m and the sockets on the backsplash at 1.10 m",
  checklist=K_CHECK + ["Completely flat fronts, no handles or grooves", "No visible LED glow (lights off)"], ourRefs=K_REFS, webRefs=[],
  scenes={
   "grafit-total": ("Modern open kitchen: a white ceramic vase with no flowers and an espresso machine on the worktop; the backsplash is a slab in the worktop's decor. Worktop: white marble look (so the graphite fronts contrast). Room surfaces: walls painted warm white; natural oak laminate floor.", "Soft overcast daylight from a large window on the left side wall.", "a bowl of green apples on the dining table"),
   "alb-total": ("Calm minimalist kitchen: a single plant and a kettle on the worktop; pale grey large-format backsplash. Worktop: natural oak look. Room surfaces: walls painted pale greige so the white kitchen separates from the wall; light grey large floor tiles.", "Bright overcast daylight from a window on the right side wall.", "a cutting board leaning on the backsplash"),
  }),
})

# ───────────────────────── existing products still to photograph ─────────────────────────
KIND_OLD = {"comoda-mixta-180": "chest", "comoda-inalta-80": "chest", "comoda-nisa-140": "chest",
            "separator-biblioteca-120": "divider", "separator-sertare-160": "divider", "separator-usi-180": "divider",
            "separator-inalt-240": "divider", "separator-scund-200": "divider", "separator-ingust-90": "divider",
            "suspendat-clasic-120": "wall", "suspendat-tv-180": "tv", "suspendat-tv-240": "tv", "suspendat-baie-60": "wall",
            "suspendat-aventos-180": "wall", "suspendat-etajera-150": "wall", "suspendat-mixt-200": "lowwall", "suspendat-hol-90": "wall"}
BATH_OLD = {"suspendat-baie-60"}
RATIO_OLD = {
 "comoda-mixta-180": ("The sideboard is 2.1 times as long as it is high (180 × 85 cm). The three sections are equal thirds of 60 cm.", "a 2.05 m interior door or its frame, the ceiling at 2.60 m and a socket at 30 cm; the top (85 cm) is a hand's width below the room-door handle"),
 "comoda-inalta-80": ("The chest is 1.5 times as tall as it is wide (80 × 120 cm): as wide as an interior door leaf. All 5 drawer fronts have the same height.", "a 2.05 m interior door (the chest is as wide as the door leaf and its top is 15 cm above the door handle and the light switch), the ceiling at 2.60 m and a socket at 30 cm"),
 "comoda-nisa-140": ("The chest is 1.75 times as long as it is high (140 × 80 cm). The drawer section is 80 cm wide, the open niche 60 cm.", "a 2.05 m interior door or its frame, the ceiling at 2.60 m and a socket at 30 cm; the top (80 cm) is a hand's width below the room-door handle"),
 "separator-biblioteca-120": ("The unit is 1.7 times as tall as it is wide (120 × 200 cm). Every compartment is the same size, slightly wider than high.", "a 2.05 m interior door (the unit is 5 cm lower than the door), the ceiling at 2.60 m (60 cm of air above the unit) and a socket at 30 cm"),
 "separator-sertare-160": ("The unit is 1.25 times as tall as it is wide (160 × 200 cm). The drawer base is the bottom third (70 cm); the open shelves are the upper two thirds.", "a 2.05 m interior door (the unit is 5 cm lower than the door), the ceiling at 2.60 m (60 cm above the unit) and a socket at 30 cm"),
 "separator-usi-180": ("The unit is 1.2 times as tall as it is wide (180 × 220 cm). The door base is 80 cm high, a little over one third; each base door is 60 cm wide and 80 cm high.", "a 2.05 m interior door (the unit is 15 cm taller), the ceiling at 2.60 m (40 cm above the unit) and a socket at 30 cm"),
 "separator-inalt-240": ("The unit is almost square, slightly taller than wide (240 × 260 cm). All 28 compartments are the same size.", "a 2.05 m interior door (the unit is 55 cm taller), the ceiling at 2.65–2.70 m (only a 5–10 cm gap above the unit) and a socket at 30 cm"),
 "separator-scund-200": ("The unit is 1.7 times as long as it is high (200 × 120 cm). Its top is just above the sofa back and 15 cm above a light switch.", "a 2.05 m interior door (the unit is less than 60% of its height), the ceiling at 2.60 m (140 cm of air above the unit) and a socket at 30 cm"),
 "separator-ingust-90": ("The unit is 2.4 times as tall as it is wide (90 × 220 cm): only slightly wider than a door leaf. The drawer base is 50 cm high, less than a quarter of the height.", "the 2.05 m entrance door (the unit is 15 cm taller and about as wide as the door leaf), the ceiling at 2.60 m (40 cm above the unit) and a socket at 30 cm"),
 "suspendat-clasic-120": ("The cabinet is exactly twice as long as it is high (120 × 60 cm). Each door is a 60 × 60 cm square.", "the desk at 75 cm or the washing machine at 85 cm below it, a 2.05 m door frame (the cabinet top is level with it) and the ceiling at 2.60 m"),
 "suspendat-tv-180": ("The unit's front is a chunky box: 180 cm long and 35 cm high, five times longer than high. Each flap front is 90 cm wide and 35 cm high, about 2.5 times wider than high. Do not make it thinner or longer than the render.", "a socket at 30 cm (the unit's 35 cm height is slightly more than the socket's height above the floor), a light switch at 1.05 m and the ceiling at 2.60 m"),
 "suspendat-tv-240": ("The unit is 240 cm long and 35 cm high, about seven times longer than high, in three equal sections of 80 cm. Each flap front is 80 × 35 cm, about 2.3 times wider than high. Do not make it thinner or longer than the render.", "a socket at 30 cm (the unit's 35 cm height is slightly more than the socket's height above the floor), a light switch at 1.05 m and the ceiling at 2.60 m"),
 "suspendat-baie-60": ("The cabinet is a little taller than wide (60 × 70 cm), exactly as wide as a washing machine or a washbasin, and only 25 cm deep.", "the basin rim or washing machine at 85 cm, the 2.05 m door frame (the cabinet top is 10 cm below it) and the ceiling at 2.60 m"),
 "suspendat-aventos-180": ("The cabinet is a slim band: 180 cm long and 40 cm high, 4.5 times longer than high. Each lift-up front is 90 × 40 cm.", "the desk at 75 cm or the bed below it, a 2.05 m door frame (the cabinet top is 10 cm below it) and the ceiling at 2.60 m"),
 "suspendat-etajera-150": ("The shelf unit is 150 cm long and 35 cm high, a little over four times longer than high, and only 25 cm deep (the depth of a book). Each niche is 50 × 35 cm.", "the sofa back, desk or worktop below it, a 2.05 m door frame (the top of the shelf is 25 cm below it) and the ceiling at 2.60 m"),
 "suspendat-mixt-200": ("The unit is 3.3 times as long as it is high (200 × 60 cm). Each door is a 60 × 60 cm square; the open niche between them is 80 cm wide.", "a socket at 30 cm (level with the unit's underside), a light switch at 1.05 m (15 cm above the unit's top) and the ceiling at 2.60 m"),
 "suspendat-hol-90": ("The front is a square: 90 × 90 cm, with two doors of 45 cm each, each twice as tall as wide.", "the shoe bench or washing machine below it, the 2.05 m entrance door (the cabinet top is 25 cm above the door top) and the ceiling at 2.60 m"),
}
MOUNT_REL = {
 "suspendat-clasic-120": "underside 140 cm above the floor: 65 cm above the 75 cm desk (55 cm above an 85 cm washing machine), top at 200 cm level with the door frame, 60 cm of wall between its top and the ceiling",
 "suspendat-tv-180": "underside 30 cm above the floor (level with the wall sockets), top at 65 cm; the TV's lower edge is 20–25 cm above the top; floor and skirting clearly visible under the unit",
 "suspendat-tv-240": "underside 30 cm above the floor (level with the wall sockets), top at 65 cm; the TV's lower edge is 20–25 cm above the top; floor and skirting clearly visible under the unit",
 "suspendat-baie-60": "underside 125 cm above the floor: 40 cm above the 85 cm vanity top (135 cm, i.e. 50 cm above the machine, when it hangs over a washing machine), top at 195 cm, 10 cm below the door-frame top",
 "suspendat-aventos-180": "underside 155 cm above the floor: 80 cm above the 75 cm desk (or about 60 cm above the headboard), top at 195 cm, 65 cm of wall between its top and the ceiling",
 "suspendat-etajera-150": "underside 145 cm above the floor: about 60 cm above the sofa back, 70 cm above a desk or 55 cm above a 90 cm worktop; top at 180 cm, 80 cm of wall between its top and the ceiling",
 "suspendat-mixt-200": "underside 30 cm above the floor (level with the wall sockets), top at 90 cm, 15 cm below the light switch; floor and skirting clearly visible under the unit",
 "suspendat-hol-90": "underside 140 cm above the floor: about 95 cm above a 45 cm shoe bench (55 cm above an 85 cm washing machine), top at 230 cm, 30 cm of wall between its top and the ceiling",
 "suspendat-bucatarie-180": "underside 145 cm above the floor: 55 cm above the 90 cm worktop, top at 217 cm, about 43 cm of wall between its top and the ceiling",
 "suspendat-baie-nisa-90": "underside 135 cm above the floor: 50 cm above the 85 cm washing machine (20 cm above a 115 cm cistern panel), top at 205 cm level with the door-frame top, 55 cm of wall between its top and the ceiling",
}
TV_RULE = {
 "suspendat-tv-180": "The TV is 55 inch, 123 cm wide, 16:9: two thirds as long as the unit, leaving about 28 cm of unit visible on each side. The unit's front is half as high as the TV screen is high. The unit is short: only about 3 times as long as the distance from its top to the floor (65 cm). The unit spans no more than 50% of the frame width.",
 "suspendat-tv-240": "The TV is 65 inch, 145 cm wide, 16:9: 60% as long as the unit, leaving about 48 cm of unit visible on each side. The unit's front is less than half as high as the TV screen is high. The unit spans no more than 60% of the frame width.",
}
# (scene text override, personal object) per old variant; None keeps the v2 scene text
OLD_SCENE = {
 ("comoda-mixta-180", "nuc-crem"): ("Dining area: edge of an oak dining table and two chairs in the foreground; a table lamp (switched off), a ceramic jug and a stack of plates on top; one round mirror above, fully visible. Room surfaces: warm white walls; light oak laminate floor (clearly lighter than the walnut).", "a tea towel on a chair back"),
 ("comoda-mixta-180", "salvie-stejar"): ("Living room wall beside the balcony door: a plain wall clock without numerals above; a candle holder and a bread basket on top; a sofa arm at the frame edge. Room surfaces: plain white walls; warm mid-brown laminate floor.", "a folded blanket on the sofa arm"),
 ("comoda-inalta-80", "gri-casmir"): ("In the bedroom corner beside the room door; a plant and a small tray on top; bed corner at lower left. Room surfaces: plain white walls (so the cashmere chest separates from the wall); mid-brown oak laminate floor.", "a book on the bed"),
 ("comoda-inalta-80", "alb-stejar-natur"): ("On the narrow wall between the room door and the bed in a child's room; a table lamp (switched off) and a small box on top; bed corner at lower right. Room surfaces: walls painted light warm grey; pale grey-beige laminate floor (clearly different from the oak fronts).", "a toy on the floor"),
 ("comoda-nisa-140", "salvie-stejar"): (None, "a folded blanket on the sofa"),
 ("comoda-nisa-140", "alb-total"): ("Home office: next to a desk; plain binders and a storage box in the niche, a compact printer on top. Room surfaces: walls painted a warm greige so the white furniture separates clearly from the wall; natural oak laminate floor.", "a mug on the desk"),
 ("separator-biblioteca-120", "alb-total"): (None, "a folded blanket on the bed"),
 ("separator-sertare-160", "stejar-alb"): (None, "reading glasses on the desk"),
 ("separator-sertare-160", "gri-casmir"): ("Home office, against the wall behind the desk chair; plain binders, a compact printer on a shelf, a trailing plant. Room surfaces: plain white walls (so the cashmere unit separates from the wall); mid-brown oak laminate floor.", "a mug on the desk"),
 ("separator-usi-180", "alb-stejar-natur"): (None, "a folded blanket on the armchair"),
 ("separator-usi-180", "nuc-crem"): ("Against the wall of a home-library corner with a reading chair and a floor lamp (switched off); half the shelves with books with plain spines. Room surfaces: warm white walls; light oak laminate floor (clearly lighter than the walnut).", "reading glasses on the chair arm"),
 ("separator-inalt-240", "bardolino-gri"): (None, "a plant on the floor at the free end"),
 ("separator-inalt-240", "antracit-stejar"): (None, "a folded blanket on a shelf"),
 ("separator-scund-200", "antracit-stejar"): ("Directly behind a grey sofa, separating it from the dining table; two plants and a table lamp (switched off) on top. Room surfaces: plain white walls; light oak laminate floor.", "a mug on the top"),
 ("separator-scund-200", "stejar-natur"): (None, "a folded blanket on the sofa back"),
 ("separator-ingust-90", "salvie-stejar"): (None, "an umbrella leaning by the entrance door"),
 ("separator-ingust-90", "alb-total"): (None, "a pair of sneakers on the mat"),
 ("suspendat-clasic-120", "alb-total"): ("Home office: above a 140 cm desk with a laptop, a desk lamp (switched off) and a plain pin board in the gap; office chair; walls painted a warm greige so the white furniture separates clearly from the wall; natural oak laminate floor.", "a mug on the desk"),
 ("suspendat-clasic-120", "stejar-natur"): ("Laundry niche in the bathroom: above a front-loading washing machine and a dryer side by side under a white laminate worktop (120 cm together); a laundry basket and two plain bottles (no labels); matte light-grey tiles.", "a folded towel on the worktop"),
 ("suspendat-tv-180", "stejar-natur"): ("Two books and a small speaker on top; a robot vacuum docked under the unit; rug in front. Window on the right wall, no door frame in the picture. Room surfaces: plain white walls; light grey laminate floor (so the oak furniture does not merge with the floor).", "a plant on the floor at the left end"),
 ("suspendat-tv-240", "alb-total"): ("A game console in the niche, a small plant and a remote control on top; sofa back and a coffee table at the lower frame edge. No soundbar. Room surfaces: walls painted a warm greige so the white furniture separates clearly from the wall; natural oak laminate floor.", "a folded blanket on the sofa back"),
 ("suspendat-tv-240", "nuc-crem"): ("A record player on top at one end, plain record sleeves in the niche; grey sofa corner in the foreground; window on the right wall. Room surfaces: warm white walls; light oak laminate floor (clearly lighter than the walnut).", "reading glasses on the coffee table"),
 ("suspendat-baie-60", "alb-casmir"): ("On the wall beside the mirror, above the end of an 80 cm vanity with a white basin and chrome tap; large-format matte light-grey tiles (so the cashmere door separates from the wall); towel on a hook.", "a folded towel on the vanity"),
 ("suspendat-baie-60", "alb-stejar-natur"): (None, "a small plant on the cistern panel"),
 ("suspendat-aventos-180", "supermat-alb"): ("Above a 180 cm desk with two monitors, a desk lamp (switched off) and a keyboard; two office chairs; a window with a roller blind on the adjacent wall. Room surfaces: walls painted light greige; natural oak laminate floor.", "reading glasses on the desk"),
 ("suspendat-aventos-180", "gri-casmir"): ("Above the head of a single bed in a teenager's room; two plain framed prints (no text, no people) in the gap below; a small bedside table that is not a cabinet (open metal frame). Room surfaces: plain white walls (so the cashmere band separates from the wall); mid-brown oak laminate floor.", "a book on the bed"),
 ("suspendat-etajera-150", "stejar-natur"): ("Above a grey three-seater sofa; paperbacks with plain spines in one niche, a trailing plant in another, a small ceramic bowl in the third. Room surfaces: plain white walls; light grey laminate floor (so the oak furniture does not merge with the floor).", "a folded blanket on the sofa"),
 ("suspendat-etajera-150", "alb-total"): ("Kitchen coffee corner: above a 150 cm counter (90 cm high) with an espresso machine; cups in one niche, glass jars without labels in another, a small herb pot in the third. Room surfaces: walls painted a warm greige so the white shelf separates clearly from the wall; matt light-grey floor tiles.", "a tea towel on the counter edge"),
 ("suspendat-mixt-200", "casmir-alb"): ("Living room: one large plain abstract print above; books with plain spines and a speaker in the niche; a table lamp (switched off) and a plant on top; sofa arm at the frame edge. Room surfaces: plain white walls; warm oak laminate floor.", "reading glasses on the top"),
 ("suspendat-mixt-200", "stejar-natur"): ("Entrance hall as a floating console: a round mirror above, fully visible; a key bowl on top, two baskets in the niche; the entrance door at the frame edge. Room surfaces: plain white walls; light grey floor tiles (so the oak furniture does not merge with the floor).", "a tote bag on the floor by the entrance door"),
 ("suspendat-hol-90", "alb-stejar-natur"): ("Entrance hall: above a low open shoe bench (45 cm high, black metal frame with a wooden seat, clearly not a cabinet); three hooks at 1.70 m on the free wall beside it; walls painted light warm grey; doormat.", "an umbrella leaning beside the bench"),
}

RULES = {
 "note": "The review file (scripts/shop-photo-review-pilot.md) numbers its rules only loosely (\"A1–A7\", \"A8–A10\", \"rules for the remaining comode\"). This is the full list as applied in every v3 prompt, numbered so a review can cite them.",
 "A": {
  "A1": "Keep the exact height-to-width ratio of the render and state it in words; never slimmer, longer or taller than the render.",
  "A2": "Anchor the scale with three references in the frame (2.05 m door or frame, 2.60 m ceiling, socket at 30 cm; in a bathroom the 85 cm washing machine or basin rim replaces the socket).",
  "A3": "TV size as a fraction of the furniture length, 16:9.",
  "A4": "Each photo is a different apartment: wall colour, floor, window side and decor vary; no ribbed vase, no olive branch, no soundbar-plus-curtain-left set.",
  "A5": "No lettering anywhere: plain book spines, no labels on jars or bottles, no markings on appliances.",
  "A6": "Props usable where they are: hooks at 1.70 m on a free wall, appliances centred under worktops, nothing hung above a mirror.",
  "A7": "Wall-hung pieces: mounting height twice, as a number and as a relation to what is below and to the ceiling.",
  "A8": "No ceiling lamp in the frame.",
  "A9": "35 mm lens from far enough back; the far end of the piece at least 80% as high in the picture as the near end; no wide-angle stretching.",
  "A10": "Exactly one personal object, picked per photo so it never repeats within a product; no slippers; coats, bags and umbrellas only in a hall; no fruit bowl in a bedroom or hall.",
  "A11": "The fronts cover the entire front of the piece: no frame, header, stile or rail around or between doors and drawers.",
  "A12": "Floor-standing pieces: a 10 cm plinth set back 3 cm, visible along the whole bottom; never a flush block or legs.",
  "A13": "Access and placement: clear floor in front (85 cm for cupboards), nothing within 90 cm of the fronts, window and radiator on another wall or at least 1 m away, tall cupboards tight to a side wall with a 15–20 cm strip of wall below the ceiling; a piece as wide as its wall touches both side walls.",
  "A14": "No lighting inside or under the furniture: no LED strips, no glowing lines; table and desk lamps switched off.",
 },
 "mirror": {
  "M1": "A mirror reflects only this room, in correct perspective, with straight wall and ceiling lines.",
  "M2": "Every object in the reflection also exists in the room; nothing appears only in the mirror.",
  "M3": "No camera, photographer or person in the reflection; no doorway to a second room; no framed photographs of people.",
  "M4": "Mirror doors: white body, the mirror covers the whole door with a 1 cm edge. (No v3 photo has mirror doors; M1–M3 apply to the wall mirrors of the bathroom and hall scenes.)",
 },
 "C": {
  "C1": "The chest is the only cabinet furniture in the photo: no wardrobe, no second chest, no shelving unit; no TV on a bedroom chest.",
  "C2": "The top of the chest relates to the room-door handle at 1.05 m (below it for chests up to 95 cm; the 120 cm tallboy 15 cm above it).",
  "C3": "GOLA: one straight metal channel above each drawer front, full width, same thickness on every drawer; nothing else on the fronts.",
  "C4": "Knobs: one small round 3 cm knob centred on each drawer front, all identical.",
  "C5": "Body, plinth and fronts in exactly the light colours named; no black or dark grey panels anywhere on a chest or wall unit.",
 },
}

# ── bathroom furniture (vanity + mirror cabinet) ──
CAM_VANITY = "Camera at 1.4 m height, 28–35 mm full-frame equivalent, from the bathroom doorway 2–2.5 m back, about 15–20° off the vanity wall; verticals perfectly straight, no fisheye. 4:3 landscape. The whole piece is visible from the floor (or its plinth) to the top of the mirror cabinet, with the floor in front and a strip of wall above; it fills about 45–60% of the frame width."
V_REFS = ["public/portfolio/petrol-bathroom-vanity-cover.webp", "public/portfolio/mustard-bathroom-vanity-cover.webp", "public/portfolio/cappuccino-bathroom-v2.webp"]
V_CHECK = ["Modules exactly as in the render, in the same order and widths", "Worktop at 85 cm (90 cm with the washer) with a white countertop basin and a chrome tap only where the render shows them", "Mirror cabinet doors are real mirror with thin edges, 30 cm above the worktop; reflections show only this room", "Real Romanian bathroom: tiles, a shower or bath edge at the frame side, a towel"]
V_BODY = "visible sides, the underside of the wall-hung vanity, the sides and underside of the mirror cabinet"
V_FRONTS = "the drawer fronts and cabinet doors (not the mirror doors)"
HUNG = "Wall-hung: the vanity body hangs on the wall with its underside about 31 cm above the floor; the floor and skirting tiles are visible under it."

NEW.update({
 "baie-lavoar-coloana-120": dict(
  kind="vanity", bath=True, room="Bathroom of a Romanian apartment (baie).",
  piece="Bathroom furniture on one wall, 120 cm wide, 190 cm high to the top. Left: an 80 cm wall-hung vanity with 2 drawers under a 38 mm worktop with a white countertop basin and a chrome single-lever tap; above it, 30 cm over the worktop, an 80 cm mirror cabinet with 2 mirror doors up to 1.90 m. Right: a 40 cm wall-hung tall column with 2 doors from 30 cm above the floor up to 1.90 m. Everything closed.",
  body=V_BODY, fronts=V_FRONTS,
  placement="On the long wall of a bathroom, the column tight to the side wall; a walk-in shower with a glass screen at the other end of the room. " + HUNG,
  mount=31, camera=CAM_VANITY,
  ratio="The piece is 1.2 m wide and 1.9 m high: clearly taller than wide. The worktop is at 85 cm; the mirror cabinet is 75 cm high.",
  anchors="the 2.05 m bathroom door or its frame, the ceiling at 2.60 m and the tap / light switch at their normal heights",
  checklist=V_CHECK, ourRefs=V_REFS, webRefs=BATH_WEB,
  scenes={
   "alb-stejar-natur": ("Bright bathroom: large-format matt light-grey wall tiles, warm grey floor tiles (clearly different from the oak fronts); a walk-in shower with clear glass at the right edge of the frame.", "Even neutral light from a frosted window on the left, about 4000 K.", "a folded white towel on the worktop"),
   "alb-total": ("Calm bathroom: walls with pale sage vertical tiles up to 1.20 m and warm white paint above (so the white furniture separates from the wall); light oak-look floor tiles; the edge of a bathtub at the left of the frame.", "Soft daylight from a small window on the right, neutral white balance.", "a soap dispenser without label beside the basin"),
  }),
 "baie-lavoar-60": dict(
  kind="vanity", bath=True, room="Small bathroom of a Romanian apartment (baie).",
  piece="Wall-hung vanity 60 cm wide with 2 drawers under a 38 mm worktop with a white countertop basin and a chrome tap; above it, 30 cm over the worktop, a 60 cm mirror cabinet with one mirror door up to 1.90 m. Everything closed.",
  body=V_BODY, fronts=V_FRONTS,
  placement="On the short wall of a small bathroom, between the toilet (at the left frame edge) and the side wall. " + HUNG,
  mount=31, camera=CAM_VANITY,
  ratio="The piece is 60 cm wide and 1.9 m high: three times as tall as wide; the worktop at 85 cm, the mirror cabinet 75 cm high.",
  anchors="the 2.05 m bathroom door frame, the ceiling at 2.60 m and the toilet beside it (40 cm seat height)",
  checklist=V_CHECK, ourRefs=V_REFS, webRefs=BATH_WEB,
  scenes={
   "alb-total": ("Small bathroom of a renovated block flat: warm beige stone-look wall tiles (so the white piece separates from the wall); darker taupe floor tiles; a white toilet at the left frame edge.", "Even neutral ceiling light (the lamp out of frame), about 4000 K.", "a small hand towel on a ring beside the vanity"),
  }),
 "baie-lavoar-80": dict(
  kind="vanity", bath=True, room="Bathroom of a Romanian apartment (baie).",
  piece="Wall-hung vanity 80 cm wide with 2 drawers under a 38 mm worktop with a white countertop basin and a chrome tap; above it, 30 cm over the worktop, an 80 cm mirror cabinet with 2 mirror doors up to 1.90 m. Everything closed.",
  body=V_BODY, fronts=V_FRONTS,
  placement="Centred on the wall of a bathroom between the bathtub (left frame edge) and a towel radiator on the right wall. " + HUNG,
  mount=31, camera=CAM_VANITY,
  ratio="The piece is 80 cm wide and 1.9 m high: more than twice as tall as wide; the worktop at 85 cm, the mirror cabinet 75 cm high.",
  anchors="the 2.05 m door frame, the ceiling at 2.60 m and the bathtub rim at 55 cm",
  checklist=V_CHECK, ourRefs=V_REFS, webRefs=BATH_WEB,
  scenes={
   "alb-casmir": ("Warm bathroom: white matt wall tiles in a vertical stack bond with light grey grout (so the cashmere fronts stand out); concrete-look grey floor tiles; a white bathtub at the left edge.", "Soft daylight from a window on the right, neutral white balance.", "a folded grey towel on the bathtub rim"),
  }),
 "baie-dubla-140": dict(
  kind="vanity", bath=True, room="Family bathroom of a Romanian house or large apartment (baie).",
  piece="Double wall-hung vanity 140 cm wide: two 70 cm units, each with 2 drawers and its own white countertop basin and chrome tap, under one continuous 38 mm worktop; above each a 70 cm mirror cabinet with one mirror door, 30 cm over the worktop, up to 1.90 m. Everything closed.",
  body=V_BODY, fronts=V_FRONTS,
  placement="On the long wall of a family bathroom; a walk-in shower at the right edge of the frame. " + HUNG,
  mount=31, camera=CAM_VANITY,
  ratio="The piece is 1.4 m wide and 1.9 m high: a little taller than wide; the worktop at 85 cm, the two mirror cabinets 75 cm high.",
  anchors="the 2.05 m door frame, the ceiling at 2.60 m and the shower glass at 2.00 m",
  checklist=V_CHECK, ourRefs=V_REFS, webRefs=BATH_WEB,
  scenes={
   "alb-stejar-deschis": ("Light Scandinavian bathroom: white wall tiles with soft grey grout up to the ceiling; mid-grey terrazzo-look floor tiles (clearly different from the pale oak fronts); a walk-in shower at the right edge.", "Even daylight from a frosted window on the left, slightly cool.", "two toothbrush cups without labels, one on each side"),
  }),
 "baie-masina-140": dict(
  kind="vanity", bath=True, room="Bathroom of a Romanian apartment with the washing machine (baie).",
  piece="Bathroom furniture 140 cm wide, 195 cm high. Left: a 65 cm niche holding a white front-loading washing machine, with the continuous 38 mm worktop over it at 90 cm and a 65 cm wall cabinet with one door above. Right: a 75 cm wall-hung vanity with 2 drawers, a white countertop basin and a chrome tap, and a 75 cm mirror cabinet with 2 mirror doors above. Everything closed.",
  body=V_BODY, fronts=V_FRONTS,
  placement="On the long wall of a bathroom, the washer niche tight to the left side wall; a bathtub on the opposite wall, out of frame. The vanity is wall-hung, the washer stands on the floor.",
  mount=31, camera=CAM_VANITY,
  ratio="The piece is 1.4 m wide and 1.95 m high: a little taller than wide; the worktop at 90 cm, the cabinets above 75 cm high.",
  anchors="the 2.05 m door frame, the ceiling at 2.60 m and the 85 cm washing machine under the worktop",
  checklist=V_CHECK, ourRefs=V_REFS, webRefs=BATH_WEB,
  scenes={
   "alb-antracit": ("Modern bathroom: warm white large-format wall tiles (so the white body and the anthracite fronts both read); light oak-look floor tiles; a laundry basket beside the washer on the floor.", "Soft neutral ceiling light (out of frame) and daylight from the doorway on the right.", "a folded towel on the worktop above the washer"),
  }),
 "baie-picioare-100": dict(
  kind="vanity", bath=True, room="Bathroom of a Romanian apartment (baie).",
  piece="Bathroom furniture 100 cm wide on a 10 cm plinth. Left: a 60 cm vanity with 2 drawers under a 38 mm worktop with a white countertop basin and a chrome tap, and a 60 cm mirror cabinet with one mirror door above. Right: a 40 cm unit with 3 drawers and an open shelf unit (2 shelves) above it at the mirror cabinet's height. Everything closed.",
  body=V_BODY, fronts=V_FRONTS,
  placement="On the wall of a bathroom between the bathtub and the side wall; it stands on the floor on its recessed plinth.",
  mount=None, camera=CAM_VANITY,
  ratio="The piece is 1.0 m wide and 1.9 m high: almost twice as tall as wide; the worktop at 85 cm, the mirror cabinet and the shelf 75 cm high.",
  anchors="the 2.05 m door frame, the ceiling at 2.60 m and the bathtub rim at 55 cm",
  checklist=V_CHECK, ourRefs=V_REFS, webRefs=BATH_WEB,
  scenes={
   "alb-gri-matase": ("Classic bathroom: white subway wall tiles up to 1.20 m and warm greige paint above; black-and-white hexagon floor tiles; a white bathtub at the left edge.", "Soft daylight from a window on the right, neutral white balance.", "two rolled towels on the open shelf"),
  }),
})

def colours_line(pal_id, body_part, fronts_part, open_piece=False):
    name, b, f = PAL[pal_id]
    if open_piece:
        return f"Colours: body ({body_part}) in {DECOR[b]}. Wood grain direction as in the render. (Colour combination „{name}\".)"
    if b == f:
        return f"Colours: one colour everywhere. Body ({body_part}) and fronts ({fronts_part}) all in {DECOR[b]}. The fronts are still distinct panels with visible gaps and edges. (Colour combination „{name}\".)"
    return f"Colours: body ({body_part}) in {DECOR[b]}. Fronts ({fronts_part}) in {DECOR[f]}. Wood grain direction as in the render. (Colour combination „{name}\".)"

def rule_lines(slug, kind, bath, handle, ratio, anchors, obj, idx, has_fronts=True, mirror_in_scene=False):
    L = []
    L.append(f"Proportion (must hold): {ratio} Keep the exact height-to-width ratio of the render; never make the piece slimmer, longer, taller or bulkier than the render.")
    L.append(f"Scale anchors: three references are visible in the frame and the piece has its real size against all three: {anchors}. The room is not compressed: full-height doors are 2.05 m, the ceiling is at 2.60 m or higher.")
    if kind == "tv":
        L.append("TV: " + TV_RULE[slug])
    if kind in ("wall", "tv", "lowwall"):
        L.append(f"Mounting height, as a number and as a relation: {MOUNT_REL[slug]}.")
    cam_side = "left" if idx == 0 else "right"
    L.append(f"Camera rule: 35 mm lens from far enough back that the far end of the piece is at least 80% as high in the picture as the near end; no wide-angle stretching. Camera on the {cam_side} side of the room. No ceiling lamp in the frame.")
    if has_fronts:
        L.append("Fronts: the doors and drawer fronts cover the entire front of the piece from the top edge down to the plinth (or underside) and from side to side. No frame, header, stile or rail is visible around or between them.")
    if kind in ("tall", "chest", "divider"):
        L.append("Base: the piece stands on a 10 cm high plinth set back 3 cm behind the fronts, visible along the whole bottom; no legs, no flush block.")
    if kind == "kitchen":
        L.append("Kitchen build: base units 90 cm high to the top of the 38 mm worktop, on a 15 cm plinth set back 5 cm in the body colour; 55 cm of backsplash between the worktop and the wall cabinets; every wall cabinet and tall column ends at the same top line, exactly as in the render. The worktop is one continuous slab in the named decor, 38 mm thick, flush with the front of the base units plus 2 cm overhang.")
        L.append("Appliances: built in exactly where the render shows them and nowhere else: a stainless-steel inset sink with a single-lever tap; a black glass induction hob flush in the worktop above the oven; a built-in oven with a dark glass door; the dishwasher and the fridge hidden behind fronts in the kitchen colour. No freestanding fridge, no range cooker, no visible brand names or displays with text.")
        L.append("Access: at least 1.10 m of clear floor in front of the kitchen; a dining table or chairs only beyond that; a window may be on the side wall but never behind the wall cabinets.")
    if kind == "vanity":
        L.append("Bathroom build: the vanity worktop is one continuous 38 mm slab in the body colour at 85 cm (90 cm over a washing machine); the basin is a white ceramic countertop basin sitting on it, with a chrome single-lever tap behind it; the mirror cabinet hangs 30 cm above the worktop, its doors are real silver mirror on a thin body edge; open shelves only where the render shows them.")
        L.append("Access: at least 80 cm of clear floor in front of the vanity; the shower, bath or toilet only at the frame edge, never in front of the piece.")
    if kind == "tall":
        L.append("Access: a clear strip of floor at least 85 cm wide runs along the whole front; no furniture within 90 cm of the doors. The window and radiator are on another wall or at least 1 m from the cupboard's end. One side of the cupboard touches the side wall; nothing stands between the cupboard and that wall. The strip of wall between its top and the ceiling is clearly visible, exactly as stated.")
    elif kind == "chest":
        L.append("Access: the floor in front of the piece is clear for 90 cm; it is not in front of a window, radiator or door, and plain wall is visible on both sides of it for at least 40 cm (or the stated neighbour on one side).")
    elif kind == "divider":
        L.append("Access: a walkway of at least 85 cm stays free at the unit's open end and along its front; not in front of a window or radiator.")
    if kind == "chest":
        L.append("Chest rules: this piece is the only cabinet furniture in the photo: no wardrobe, no second chest, no shelving unit in the same decor; no TV on it or above it. On top only the objects named. Above it at most one mirror OR one picture OR one short shelf, fully visible, nothing in front of it.")
    if kind in ("chest", "wall", "tv", "lowwall"):
        L.append("Light colours only: body, plinth and fronts exactly in the colours named; no black or dark grey panels anywhere on the piece.")
    if handle and handle["type"] == "GOLA":
        L.append("GOLA detail: one straight metal channel, full width, the same thickness everywhere: above each drawer front and along the opening edge of each door or flap; nothing else on the fronts.")
    if handle and handle["type"] == "BUTON":
        L.append("Knob detail: one small round knob per front, 3 cm, all identical: centred on each drawer front, near the opening edge on each door.")
    L.append("No lighting inside, under or on the furniture: no LED strips, no glowing lines; table and desk lamps are switched off. Open compartments are lit only by daylight from the room.")
    if bath or mirror_in_scene:
        L.append("Mirror in the room: any wall mirror reflects only this same room in correct perspective with straight lines; every object in the reflection also exists in the room; no camera, photographer or person, no doorway to a second room.")
    hall_ok = "Coats, bags and umbrellas appear only in an entrance hall."
    L.append(f"Styling: this is a different apartment from every other photo of the shop (own wall colour, floor, window side and decor). Exactly one personal object: {obj}. No slippers, no fruit bowl, no ribbed vase, no olive branch, no soundbar. {hall_ok} No framed photographs of people. Props are usable where they are: hooks at 1.70 m on a free wall, appliances centred under worktops, nothing hung above a mirror.")
    L.append("No lettering anywhere: plain book spines, no labels on jars or bottles, no markings or displays with text on appliances.")
    return L

def extra_checks(kind, handle, bath, mount):
    c = ["Proportion as stated in the prompt (ratio measured in the photo within 10% of the render)", "Scale anchors present and consistent: door 2.05 m, ceiling 2.60 m, socket 30 cm (bathroom: 85 cm fixture)"]
    if kind == "tv": c.append("TV 16:9 and the stated fraction of the unit's length; unit not stretched")
    if mount is not None: c.append(f"Mounting height: underside about {mount} cm above the floor and the stated gap to the item below")
    if kind == "vanity": c.append("Worktop 85/90 cm, basin and tap only where the render shows them, mirror cabinet 30 cm above; wall-hung pieces show the floor under them")
    if kind == "kitchen": c.append("Worktop 90 cm, 55 cm backsplash, one top line; built-in sink/hob/oven exactly where the render shows them; fridge and dishwasher behind fronts")
    if kind in ("tall", "chest", "divider"): c.append("10 cm recessed plinth along the whole bottom; fronts cover the whole front (no frame or header)")
    if kind == "tall": c.append("Clear floor in front, tight to a side wall, stated strip of wall below the ceiling")
    if kind == "chest": c.append("Only cabinet in the photo; no TV; at most one mirror/picture/shelf above; no dark panels")
    if handle and handle["type"] == "GOLA": c.append("GOLA: one straight channel per drawer / door edge, nothing else on the fronts")
    if handle and handle["type"] == "BUTON": c.append("Knobs: one identical 3 cm knob per front")
    c.append("No ceiling lamp, no interior/LED lighting, no lettering; exactly one personal object, not repeated within the product")
    if bath: c.append("Any wall mirror reflects this same room; no camera or person")
    return c

products, variants, renders_needed = {}, [], []
todo = []
for p in shop:
    for i, pid in enumerate(p["photoColours"]):
        if pid not in photos.get(p["slug"], []):
            todo.append((p, i, pid))

for p, idx, pid in todo:
    slug = p["slug"]
    handle = p["handle"]
    render = f"public/magazin/randari/{slug}/{pid}.webp"
    if pid not in renders.get(slug, []):
        renders_needed.append(f"{slug}/{pid}")
    if slug in NEW:
        n = NEW[slug]
        kind, bath = n["kind"], n.get("bath", False)
        if slug not in products:
            products[slug] = {
                "room": n["room"], "placement": n["placement"], "mountHeightCm": n["mount"], "handle": handle,
                "ourRefs": n["ourRefs"], "webRefs": n["webRefs"], "camera": n["camera"],
                "checklist": n["checklist"] + [COLOUR_CHECK, REALISM_CHECK] + extra_checks(kind, handle, bath, n["mount"]),
                "critiqueOfCurrentPhoto": None, "isNew": True, "rooms": p["rooms"], "photoColours": p["photoColours"],
            }
        scene, light, obj = n["scenes"][pid]
        w, h, d = (x // 10 for x in p["size"])
        open_piece = handle is None
        hk = (handle["type"], handle.get("finish")) if handle else None
        lines = [INTRO,
                 f"Piece: {n['piece']} Real size {w} × {h} × {d} cm (width × height × depth).",
                 colours_line(pid, n["body"], n["fronts"], open_piece=open_piece),
                 "Handles: " + (HANDLE_TXT[hk] if hk else "none; this model has no doors or drawers."),
                 f"Room: {n['room']} {n['placement']} Ceiling height 2.60–2.70 m. " + (f"Mounting height is critical: underside {n['mount']} cm above the finished floor." if n["mount"] is not None else "The piece stands on the floor on its plinth, tight against the wall, never floating."),
                 f"Scene for this photo: {scene} Light: {light}",
                 "Camera: " + n["camera"]]
        lines += rule_lines(slug, kind, bath, handle, n["ratio"], n["anchors"], obj, idx, has_fronts=not open_piece, mirror_in_scene="mirror" in scene)
        lines += [PHOTOREAL, (AVOID_WALL if n["mount"] is not None else AVOID + ".")]
        variants.append({"slug": slug, "paletteId": pid, "render": render, "out": f"public/magazin/foto/{slug}/{pid}.webp", "refs": n["ourRefs"], "webRefs": n["webRefs"], "prompt": "\n".join(lines)})
    else:
        old = v2["products"][slug]
        v = V2V[(slug, pid)]
        kind, bath = KIND_OLD[slug], slug in BATH_OLD
        ratio, anchors = RATIO_OLD[slug]
        camera = re.sub(r"2[48]–(?:28|35) mm|28 mm", "35 mm", old["camera"]) if not bath else old["camera"]
        has_fronts = handle is not None
        if slug == "suspendat-tv-180": camera = camera.replace("the unit spans about 60–65% of the frame width", "the unit spans about 45–50% of the frame width")
        if slug not in products:
            products[slug] = {
                "room": old["room"], "placement": old["placement"], "mountHeightCm": old["mountHeightCm"], "handle": old["handle"],
                "ourRefs": old["ourRefs"], "webRefs": old["webRefs"], "camera": camera,
                "checklist": old["checklist"] + extra_checks(kind, handle, bath, old["mountHeightCm"]),
                "critiqueOfCurrentPhoto": old.get("critiqueOfCurrentPhoto"), "isNew": False, "rooms": p["rooms"], "photoColours": p["photoColours"],
            }
            assert (old["handle"] or None) == (handle or None), (slug, old["handle"], handle)
        scene_override, obj = OLD_SCENE[(slug, pid)]
        out_lines = []
        for line in v["prompt"].split("\n"):
            if line.startswith("Scene for this photo:"):
                m = re.match(r"Scene for this photo: (.*?) Light: (.*)$", line)
                scene, light = m.group(1), m.group(2)
                if scene_override: scene = scene_override
                if idx == 1:
                    light = light.replace("window on the left", "window on the right")
                    if "window" not in light and "window on the right" not in scene: light += " Window on the right side."
                line = f"Scene for this photo: {scene} Light: {light}"
                mirror_in_scene = "mirror" in scene.lower()
            elif line.startswith("Camera:"):
                line = "Camera: " + camera
            elif line.startswith("Photorealism:"):
                out_lines += rule_lines(slug, kind, bath, handle, ratio, anchors, obj, idx, has_fronts=has_fronts, mirror_in_scene=mirror_in_scene)
            elif line.startswith("Avoid:"):
                line = line.replace("no olive-branch vase,", "no olive-branch vase, no ribbed vase,")
            out_lines.append(line)
        variants.append({"slug": slug, "paletteId": pid, "render": render, "out": v["out"], "refs": v["refs"], "webRefs": v["webRefs"], "prompt": "\n".join(out_lines)})

out = {
 "meta": {
  "version": 3,
  "status": "Final for the range of 2026-11-21 (shaped by the bestseller research: eMAG, IKEA RO, Mobexpert, Jysk, Vivre). If the range, the photo colours or the accepted photos change, regenerate with python3 scripts/shop-art-direction-v3.py.",
  "date": "2026-11-21",
  "scope": "Only the photo colours (PHOTO_COLOURS in lib/shop/products.ts) that have no accepted photo in lib/shop/photos.json. One or two colours per model, not every combination.",
  "variants": len(variants),
  "rendersNeeded": sorted(set(renders_needed)),
  "rendersNeededSlugs": sorted({r.split("/")[0] for r in renders_needed}),
  "webRefsNote": "New models reuse the web references of the closest existing model; the kitchen pieces and the office cupboard have none (use our own portfolio photos).",
  "rules": RULES,
 },
 "products": products,
 "variants": variants,
}
json.dump(out, open(ROOT + "scripts/shop-art-direction-v3.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(len(products), len(variants), out["meta"]["rendersNeededSlugs"], len(renders_needed))
