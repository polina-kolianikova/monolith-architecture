# MONOLITH design direction

## Object and atmosphere

The Stone House is a crafted pavilion, composed of three horizontal planes, actual thick stone volumes, slender columns, continuous glazing, timber fins, furniture, pool water, garden beds and clustered olive-like trees. It is a complete procedural volume that tolerates a limited user orbit. It is not a rotating box, video or set of unrelated renders.

The pale paper background, graphite typography and serif italic create an architectural publication. The initial model sits to the right of the reading column. At the structural chapter it moves to the left, letting the exploded construction occupy space beside the text. The later light chapter lowers the camera toward the glazing. The final chapter returns to the full composition.

## Spatial story

| Chapter | Meaning | Model event | Action |
| --- | --- | --- | --- |
| Overview | Three quiet planes become a home | Full pavilion and landscape in a high oblique view | Enter the architecture |
| Structure | Each plane has a purpose | Upper floor and roof lift on independent groups | Floor selection |
| Light | Light changes the rooms | Camera descends toward glazing, pavilion closes | Move the sun slider |
| The whole | Detail serves a coherent place | House returns to a calm full view | Read and save project notes |

The model and DOM use the same native document position. No wheel events are intercepted and no compulsory playback timer advances the story. Scroll reversal brings the same structural groups back together. User floor selection is a deliberate override of the automatic exploded state.

## Materials and budget

Stone bump and color detail are generated in a local canvas texture. Glass is transparent, tinted geometry with metal framing. The water is a low roughness physical material. The model uses ordinary meshes and a single renderer. Directional shadows, warm sunlight, cool fill and hemisphere illumination establish depth without postprocessing. Device pixel ratio is capped, with a lower cap on narrow screens. Hidden documents skip rendering work.

## Accessibility and fallbacks

Visible controls use real buttons, labels, a range input and native dialog. Each floor has a meaningful description that also appears in the saved notes. The viewport has a separate narrow-screen arrangement, with a smaller lower-positioned model and a compact control bar. Reduced motion uses discrete spatial chapter states. The fallback SVG is locally authored and does not need a remote image.

## References and authorship

The transferable reference principle is one object revealing its structure through scroll. Marcelo Design X's published architectural and 3D product work informed the ambition and pacing. This model, typography, copy, textures and scene choreography are independently authored. No reference code, models, logos or photography are embedded.

## Verification boundaries

Syntax, asset presence and source behavior can be inspected without a browser. Visual composition, real pointer and scroll behavior, GPU performance and physical mobile behavior require actual browser/device observations. Do not describe a static source check as proof of animation quality.
