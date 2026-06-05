// app/council/page.tsx — The Council landing.
// The door: Orbital Sigils (Influence · Sovereignty · Craftsmanship), with the
// constellation shooting-star field behind it. Renders the same component as
// the /council/p5 prototype route.
import Door from "./p5/page";

export const dynamic = "force-static";

export default function CouncilLanding() {
  return <Door />;
}
