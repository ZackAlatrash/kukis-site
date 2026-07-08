import { useState } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useMotionTemplate,
} from "framer-motion";
import {
  ShoppingCart,
  Bookmark,
  Heart,
  Bell,
  type LucideIcon,
} from "lucide-react";
import { Section, SectionHead } from "../ui/Section";
import { Reveal } from "../ui/Reveal";
import { usePrefersReducedMotion } from "../../lib/useReducedMotion";
import { publicAsset } from "../../lib/publicAsset";
import { widgets, type WidgetKey } from "../../data/site";

type CardConfig = {
  key: WidgetKey;
  img: string;
  chip: string; // the real storefront button label
  blurb: string; // short copy sized to fit the image's negative space
  Icon: LucideIcon;
  rot: number; // base "dropped on the counter" rotation
};

const CARDS: CardConfig[] = [
  {
    key: "cart",
    img: publicAsset("widgets/cart.jpg"),
    chip: "Save my cart",
    blurb: "Your cart and a checkout link, emailed to you.",
    Icon: ShoppingCart,
    rot: -3,
  },
  {
    key: "later",
    img: publicAsset("widgets/later.jpg"),
    chip: "Save this for later",
    blurb: "One product, emailed so you can come back to it.",
    Icon: Bookmark,
    rot: 2.5,
  },
  {
    key: "wishlist",
    img: publicAsset("widgets/wishlist.jpg"),
    chip: "Add to wishlist",
    blurb: "A saved list, emailed, with gentle reminders.",
    Icon: Heart,
    rot: 2,
  },
  {
    key: "stock",
    img: publicAsset("widgets/stock.jpg"),
    chip: "Notify me when back",
    blurb: "One email the moment it's back in stock.",
    Icon: Bell,
    rot: -2.5,
  },
];

const byKey = Object.fromEntries(widgets.map((w) => [w.key, w])) as Record<
  WidgetKey,
  (typeof widgets)[number]
>;

/** The four capture surfaces, as photos scattered on a bakery counter. */
export function Widgets() {
  return (
    <Section id="widgets">
      <Reveal>
        <SectionHead
          eyebrow="The widgets"
          title="Four small buttons. One way to ask."
          sub="Each widget sits on a different part of the store and trades a useful service for a consented email."
        />
      </Reveal>

      <div className="mt-12 grid gap-7 sm:grid-cols-2 sm:gap-9">
        {CARDS.map((c, i) => (
          <div key={c.key} className={i % 2 === 1 ? "sm:mt-16" : ""}>
            <Reveal delay={i * 0.06}>
              <WidgetCard card={c} w={byKey[c.key]} />
            </Reveal>
          </div>
        ))}
      </div>
    </Section>
  );
}

function WidgetCard({ card, w }: { card: CardConfig; w: (typeof widgets)[number] }) {
  const reduced = usePrefersReducedMotion();
  const [hover, setHover] = useState(false);

  // cursor position (-0.5 .. 0.5) drives the 3D tilt and the glare highlight
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const spring = { stiffness: 180, damping: 16 };
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [6, -6]), spring);
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-7, 7]), spring);
  const gx = useTransform(mx, (v) => `${(v + 0.5) * 100}%`);
  const gy = useTransform(my, (v) => `${(v + 0.5) * 100}%`);
  const glare = useMotionTemplate`radial-gradient(420px circle at ${gx} ${gy}, rgba(255,255,255,0.32), transparent 55%)`;

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => {
    mx.set(0);
    my.set(0);
    setHover(false);
  };

  const content = (glareLayer?: React.ReactNode) => (
    <>
      {/* base photo (warm placeholder shows until the real image drops in) */}
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-amber/50 via-crumb/25 to-chip/50">
        <card.Icon size={44} className="text-cocoa/20" aria-hidden />
      </div>
      <img
        src={card.img}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover"
        style={{ filter: "saturate(1.14) contrast(1.07)" }}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = "none";
        }}
      />

      {/* scrim: only a light cream veil behind the copy, photo stays clear */}
      <div className="absolute inset-0 bg-gradient-to-l from-cream/90 from-[42%] via-cream/45 via-[56%] to-transparent" />

      {glareLayer}

      {/* copy, floated forward in 3D, sitting in the image's empty space */}
      <div
        className="absolute inset-y-0 right-0 flex w-[48%] flex-col justify-center pl-1 pr-5"
        style={{ transform: "translateZ(32px)" }}
      >
        <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-blueberry">
          {w.where}
        </div>
        <h3 className="mt-1 font-display text-[19px] font-semibold leading-tight text-cocoa">
          {w.title}
        </h3>
        <p className="mt-1.5 text-[13px] leading-snug text-cocoa-soft">{card.blurb}</p>
      </div>

      {/* the real storefront button, lifting off the cookie */}
      <div
        className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-full bg-cocoa px-3.5 py-2 text-[12px] font-semibold text-milk shadow-[0_12px_26px_rgba(46,28,16,0.5)]"
        style={{ transform: "translateZ(62px)" }}
      >
        <card.Icon size={14} aria-hidden />
        {card.chip}
      </div>
    </>
  );

  const cardClass =
    "relative aspect-[3/2] w-full overflow-hidden rounded-[22px] border border-chip/15 bg-cream shadow-[0_22px_50px_-20px_rgba(90,52,32,0.42)] ring-1 ring-inset ring-white/50";

  if (reduced) {
    return <div className={cardClass}>{content()}</div>;
  }

  return (
    <motion.div
      onMouseMove={onMove}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={onLeave}
      initial={{ rotate: card.rot }}
      animate={{ rotate: hover ? 0 : card.rot, y: hover ? -12 : 0, scale: hover ? 1.03 : 1 }}
      transition={{ type: "spring", stiffness: 220, damping: 20 }}
      className="[transform-style:preserve-3d]"
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformPerspective: 1000,
          transformStyle: "preserve-3d",
        }}
        className={cardClass}
      >
        {content(
          <motion.div
            className="pointer-events-none absolute inset-0 mix-blend-soft-light"
            style={{ background: glare }}
            animate={{ opacity: hover ? 1 : 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </motion.div>
    </motion.div>
  );
}
