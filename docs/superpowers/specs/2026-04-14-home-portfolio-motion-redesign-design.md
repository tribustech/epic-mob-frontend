# Home And Portfolio Motion Redesign

## Context

The current home page is built around an immersive animated sequence. That sequence has strong visual ambition, but it is doing too much work on the main landing page. The user wants the home page to remain image-led and premium while becoming calmer, more cinematic, and easier to absorb.

At the same time, the existing immersive hero should not be discarded. It should move to `Portofoliu`, where a more controlled and theatrical experience is a better fit.

Two external references define the target direction:

- `throttlehaus.ca` for the feeling of a large cinematic hero image with restrained zooming motion
- `bmadb.fr` for richer color handling and subtle line-based motion accents

These references are taste inputs only. The implementation must not copy their layouts, content structure, or animations literally.

## Goals

1. Simplify `Acasa` so it feels premium and cinematic instead of mechanically complex.
2. Keep the existing full-photo home identity rather than replacing it with a completely new page concept.
3. Move the current immersive hero system from home to `Portofoliu`.
4. Make `Portofoliu` a dedicated immersive route with fully controlled scroll on desktop and mobile.
5. Preserve the current mobile menu behavior.
6. Remove copy that conflicts with the presence of renders, especially phrases such as `Proiecte reale, nu randari.`

## Non-Goals

- Do not redesign the mobile navigation pattern.
- Do not build a conventional portfolio gallery underneath the immersive portfolio experience.
- Do not introduce a site-wide styling rewrite in this pass.
- Do not apply the `bmadb.fr` styling influence globally yet; it is limited to `Acasa` for now.

## Page Roles

### Acasa

`Acasa` remains the primary conversion and brand page. Its job is to balance three outcomes:

- premium first impression
- confidence in the quality of execution
- a clear path toward inquiry or deeper exploration

The page should still feel substantial, with a similar amount of copy to the current version, but the hero motion should become calmer and more atmospheric.

### Portofoliu

`Portofoliu` becomes a dedicated immersive showcase. The current immersive hero system moves here and becomes the entire route experience. This page is no longer a scannable grid or mixed-content page. It is a guided, choreographed visual sequence with controlled scroll.

## User Experience

### Home Experience

The home page keeps the current full-photo foundation. The redesign changes the behavior rather than the underlying intent:

- the hero uses slow automatic motion
- the motion feels cinematic, not gadget-like
- if more than one image is involved, transitions are soft and editorial
- the copy remains present and substantial
- the current mobile menu remains unchanged

The emotional goal is composure. The hero should feel alive, but it should not ask the user to decode a sequence.

### Portfolio Experience

The portfolio route starts directly inside the immersive experience. The current immersive hero system becomes the page rather than the prelude to another section.

Key expectations:

- the route is fully controlled to preserve timing and transitions
- desktop and mobile both use the same full immersive logic
- the sequence remains visually precise across breakpoints
- there is no project grid or standard content section underneath

The emotional goal is dramatic guided viewing rather than browsing.

## Motion Design

### Home Motion

Home motion should be rebuilt around restraint:

- slow automatic zooming as the primary effect
- optional gentle drift or pan if it supports the composition
- soft transitions between images if multiple images are used
- no complex staged scroll choreography in the hero
- line animation inspired by `bmadb.fr`, but only as a secondary accent

The home hero should read as one elegant photographic scene, not a layered interaction demo.

### Portfolio Motion

The existing immersive motion system migrates to `Portofoliu` with controlled scroll preserved as the main interaction model.

Requirements:

- scroll pacing remains intentional and tightly managed
- the full sequence works on both desktop and mobile
- responsiveness may adjust sizing and spacing, but not the core choreography
- the route should feel like a finished cinematic sequence from entry to exit

## Styling Direction

The main styling refinement applies to `Acasa`.

Desired qualities:

- stronger photography-first presentation
- cleaner overlay balance for text readability
- richer color rhythm influenced by `bmadb.fr`
- subtle smooth line accents used sparingly
- rounded supporting imagery where appropriate below the hero
- more deliberate spacing and transition polish

Guardrails:

- do not reproduce the reference sites directly
- do not turn the home page into a clone of another studio site
- keep Epic Mob's tone, content, and navigation structure recognizable

## Content And Copy

### Home Copy

Home should keep roughly the same copy density as today, but the wording should shift toward a premium-first, approachable tone. It should emphasize custom furniture, design support, materials, and execution quality without relying on contrast claims about renders versus real work.

### Portfolio Copy

Portfolio copy should stay lighter and more atmospheric. The visuals carry the sequence. Text exists to frame the experience, not to explain every step.

## Architecture

The redesign should separate the home hero and portfolio immersive experience into distinct page-level systems rather than continuing to share one oversized interaction model.

Recommended structure:

- `Acasa` owns a simplified cinematic hero implementation
- `Portofoliu` owns the immersive controlled-scroll implementation
- shared code is limited to data, animation utilities, and only the helpers that clearly reduce duplication

This keeps each route aligned with its job:

- home favors clarity and atmosphere
- portfolio favors precision and spectacle

## Accessibility And Resilience

- preserve readable contrast for text over imagery
- maintain the current mobile menu behavior without regression
- support reduced-motion preferences with a calmer fallback on home and a reasonable non-disorienting version of portfolio where possible
- ensure controlled scroll does not create dead ends or trap users awkwardly

Reduced motion does not need to replicate the full immersive feeling, but it must remain usable and coherent.

## Testing Strategy

Verification should focus on motion quality and route behavior:

- confirm the home hero feels cinematic rather than busy
- confirm automatic motion does not interfere with readability
- confirm the portfolio immersive route controls scroll consistently on desktop and mobile
- confirm entry and exit behavior on `Portofoliu` feels intentional
- confirm the mobile menu still behaves exactly as it does now
- check key viewport sizes visually because framing is critical to the design

## Acceptance Criteria

- `Acasa` no longer uses the current complicated immersive hero choreography
- `Acasa` keeps a full-photo premium hero and upgrades it with calmer automatic cinematic motion
- `Acasa` keeps a similar amount of copy and the existing mobile menu behavior
- `Acasa` removes copy that conflicts with showing renders
- `Acasa` lightly adopts richer color and line-motion influence from `bmadb.fr`
- `Portofoliu` replaces its current content with the migrated immersive hero experience
- `Portofoliu` contains no grid or additional content underneath the immersive sequence
- `Portofoliu` uses fully controlled scroll on both desktop and mobile
- the two routes are implemented as distinct experiences with only minimal shared motion infrastructure
