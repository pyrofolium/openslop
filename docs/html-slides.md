# HTML slides

Insert a **Slide** into a scene, describe the animation, and generate it. Slides use
an LLM model to produce HTML, CSS, and JavaScript. With provider keys omitted in
local development, generation returns a labeled mock slide without API credits.
**Edit code** lets you create or change a slide directly; saving adds a pinned
result to generation history. The project stores the source with its results.

The slide plays in the card preview and the video timeline. Duration and trim
controls work like other visual elements. Portrait and landscape videos use the
same responsive source. Remotion uses the same component for export.

## Source contract

A slide is `{ version: 1, html, css, js }`. Each source field is limited to 100,000
characters. HTML is a body fragment, CSS is a stylesheet, and JavaScript defines
`window.renderAt(timeInSeconds)`. That function must synchronously draw any
requested time independently of previous calls, including backward seeks. Hold
the final design after the intended animation ends. The host also pauses and
seeks CSS/Web Animations to the requested time.

Use responsive HTML, CSS, canvas, and inline SVG. Keep scripts and styles in their
separate fields. Avoid timers, animation loops, randomness, and wall-clock time:
they cannot produce reliable video frames. External libraries, fonts, images,
and other network resources are blocked; embed any needed assets as data URLs.

## Isolation and rendering

A sandboxed iframe runs the slide with scripts enabled but without same-origin,
forms, popups, downloads, or top-navigation permissions. A trusted outer sandbox
relays frame requests and acknowledgments, and its Content Security Policy blocks
the inner frame from navigating to network URLs. Both documents deny network
connections and external resources. No application credentials or project state
are sent to the slide.

Rendering waits for the slide's frame acknowledgment. Runtime failures appear in
the preview and fail export; load/frame acknowledgments have a ten-second timeout.
This is browser origin and network isolation, not a CPU or memory quota: a runaway
script can still stall its renderer. Generated code must honor the synchronous,
deterministic frame contract; arbitrary JavaScript is not made deterministic by
the sandbox.

Browser tests cover backward seeking, host DOM/storage isolation, blocked network
requests/navigation, and runtime errors. Local Remotion rendering can verify video
frames without cloud credentials; Lambda deployment requires the usual separate
Remotion setup.
