# Render Showcase Hero Design

## Context

The home page currently starts with `ImmersiveHero`, followed by `MaterialPinnedScene`. On mobile, the immersive hero already has a custom dismissal transition after the last slide: the center card expands to full screen, the page scrolls past the hero, and the next section becomes visible. The next section is currently a pinned scroll scene with one kitchen detail image.

The new direction is to keep the immersive hero flow, then make the following section feel like a second hero rather than another scroll-controlled sequence.

## Goal

Replace the current material pinned scene with a full-screen render showcase hero. It should show one render at a time, cycling through bathroom, kitchen, and living room renders. Each active render should fade in and zoom out gently, creating a premium reveal without pinning the section or tying the animation to scroll progress.

## Assets

Use existing render assets from `public/portfolio/schite`:

- Bathroom: `/portfolio/schite/baie_randare1.jpg`
- Kitchen: `/portfolio/schite/bucatarie_randare1.jpg`
- Living: `/portfolio/schite/living_randare1.jpg`

The sequence order is bathroom, kitchen, living.

## User Experience

The section fills the viewport with a full-bleed image. The active slide starts slightly enlarged and eases outward to normal scale while remaining full screen. The next slide crossfades in with the same zoom-out treatment. Page scrolling remains normal; there is no pinned section, scroll scrub, or scroll snapping in this section.

Overlay copy should be minimal and directly on the image, supported by a gradient for readability. Suggested copy:

- Kicker: `Randari interioare`
- Heading: `Vezi camera inainte sa intre in productie.`
- Active room labels: `Baie`, `Bucatarie`, `Living`

Small progress indicators may show the active render, but they should not become the main visual element.

## Component Design

Rewrite `components/home/material-pinned-scene.tsx` or replace its export with the new render showcase implementation so `app/page.tsx` can keep the same import during the first implementation pass. This keeps the change scoped and avoids unnecessary page composition churn.

The component should:

- Be a client component.
- Store the active slide index in React state.
- Advance automatically on a timer.
- Render all slides stacked absolutely, with only the active slide visible.
- Use CSS transitions/keyframes for fade and zoom-out animation.
- Avoid `ScrollTrigger` and remove all pinning behavior from this section.

## Styling

Add focused CSS classes in `app/globals.css` for the render showcase. The layout should be `min-height: 100svh`, full-bleed, and overflow hidden. Image layers should be stable and cover the viewport. Text should be positioned near the lower-left area on desktop and remain compact on mobile.

The main visual should not sit inside a decorative card. Any overlay should be transparent text and controls on top of the render.

## Reduced Motion

When reduced motion is preferred, the section should avoid continuous zoom animation. It may keep the first slide static or use simple opacity changes without transform animation.

## Acceptance Criteria

- After the immersive mobile hero is dismissed, the next visible section is a full-screen render hero.
- The render hero cycles through bathroom, kitchen, and living room renders.
- Each slide uses a zoom-out reveal, not a scroll-scrubbed animation.
- The section is not pinned and does not block normal page scrolling.
- Existing immersive hero behavior remains intact.
- Desktop and mobile layouts keep text readable without covering the room render unnecessarily.

## Verification

Run the project lint/build command available in `package.json`. Then visually check the home page at desktop and mobile widths to confirm the render section appears after the immersive hero, cycles correctly, and scrolls normally.
