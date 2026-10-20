# MONOLITH

A standalone architectural scrollytelling study. Open through an HTTP server, then use native scrolling to lift the pavilion apart, move around the glazing and bring the composition together again.

## Run

Serve this folder using any static HTTP server. The project has no build step, package installation, backend, analytics, external fonts or remote asset dependencies. Opening index.html directly as a file may block the ES module import, depending on the browser.

For GitHub Pages, publish this folder as the repository root. Every asset path is relative. The included .nojekyll keeps the release static.

## Controls

1. Scroll or use the chapter links to navigate the architectural story.
2. Drag the canvas with a mouse to adjust the viewing angle.
3. Select Whole house, Living or Roof to separate the architectural planes.
4. Change Daylight to move the real scene light and shadow.
5. Open Project notes to inspect the current view and time, then download a text specification.

The native dialog supports Escape, focus containment and return to the opening button. Reduced motion replaces continuous chapter transitions with discrete chapter states. A static local SVG appears if WebGL cannot initialize, with notes and downloads still available.

## Scope

This is an independent architectural concept. The building, location and area are design study information, not an actual property listing, construction commission or offer for sale. Browser and physical-device verification must be reported separately from source syntax checks.

## Files

- index.html: semantic content, controls, specification dialog and fallback drawing.
- styles.css: editorial limestone art direction and separate narrow-screen composition.
- app.js: authored procedural model, scroll timeline and control behavior.
- DESIGN.md: scene map and implementation rationale.
- assets/LICENSES.md: local dependency and asset provenance.

Independent concept by BlackStack Studio, 2026.
