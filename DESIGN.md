# MONOLITH design direction

## Object and atmosphere

The Stone House is a crafted pavilion, composed of three horizontal planes, actual thick stone volumes, slender columns, continuous glazing, timber fins, furniture, pool water, garden beds and clustered olive-like trees. It is a complete procedural volume that tolerates a limited user orbit. It is not a rotating box, video or set of unrelated renders.

The pale paper background, graphite typography and serif italic create an architectural publication. The pavilion now occupies the centre beneath a huge architectural wordmark. The camera approaches the open structure, lifts its floor and roof, then physically crosses the front glazing into the living space. The final passage emerges on the other side of the house. This is a spatial route, rather than one model parked beside a reading column.

## Spatial story

| Chapter | Meaning | Model event | Action |
| --- | --- | --- | --- |
| Overview | Three quiet planes become a home | Centred pavilion and landscape beneath oversized type | Enter the architecture |
| Structure | Each plane has a purpose | Upper floor and roof lift and slightly peel on independent groups | Floor selection |
| Light | Light changes the rooms | Camera passes through the front glazing into the furnished living space | Move the sun slider |
| The whole | Detail serves a coherent place | Camera emerges toward the opposite exterior | Read and save project notes |

The model and DOM use the same native document position. No wheel events are intercepted and no compulsory playback timer advances the story. Scroll reversal brings the same structural groups back together. User floor selection is a deliberate override of the automatic exploded state.

## Materials and budget

Stone grain and long travertine bands are generated in a local canvas texture. Glass is transparent, tinted geometry with metal framing. The water is a low roughness physical material. Detailed olive-like branches and individual leaves replace the former rounded clumps, including a garden visible from inside the room.

Immutable opaque geometry is batched by material within each moving storey. Hundreds of source parts become a small set of submitted meshes, while the floor and roof retain independent transforms. Directional shadow resolution is 1024, down from 2048. Shadow maps update only when the light or structure changes. Camera motion does not trigger a new shadow pass. There is no postprocessing stack.

Rendering is event-driven. Scroll, configuration, resize and pointer changes request frames. Once the progress and view settle, RAF stops entirely. Hidden documents cancel RAF before returning, and intersection state stops offscreen work. The initial DPR cap is 1.5 on desktop and 1.15 on narrow screens. Sustained expensive CPU render submissions may lower it to 0.8. This adaptive heuristic is not a GPU time or FPS measurement.

Hidden DOM diagnostics are available as documentElement.dataset.renderFrames, drawCalls, triangles, renderDpr and renderMode. They report actual render calls and active, idle, hidden or offscreen state without adding interface noise.

## Accessibility and fallbacks

Visible controls use real buttons, labels, a range input and native dialog. Each floor has a meaningful description that also appears in the saved notes. The viewport has a separate narrow-screen arrangement, with a smaller lower-positioned model and a compact control bar. Reduced motion uses discrete spatial chapter states. The fallback SVG is locally authored and does not need a remote image.

## References and authorship

The transferable reference principle is one object revealing its structure through scroll. Marcelo Design X's published architectural and 3D product work informed the ambition and pacing. This model, typography, copy, textures and scene choreography are independently authored. No reference code, models, logos or photography are embedded.

## Verification boundaries

Syntax, asset presence and source behavior can be inspected without a browser. Visual composition, real pointer and scroll behavior, GPU performance and physical mobile behavior require actual browser/device observations. Do not describe a static source check as proof of animation quality.
