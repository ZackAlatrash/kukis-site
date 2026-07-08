// All copy is drawn from context.md — real facts only, nothing invented.
// No fabricated testimonials, logos, or metrics. No legal-review / DPA / hosting claims.

export const site = {
  name: "Kukis",
  tagline: "The yes cookie tools can't get.",
  taglinePlayful: "No cookies? No problem.",
  demoHref: "#demo", // routes to the dedicated demo-booking page (TODO: real URL)
  nav: [
    { label: "How it works", href: "#how" },
    { label: "Widgets", href: "#widgets" },
    { label: "Why Kukis", href: "#why" },
    { label: "FAQ", href: "#faq" },
  ],
};

export const hero = {
  eyebrow: "EU Shopify · consent after cookies",
  headlinePre: "The ",
  headlineEm: "yes",
  headlinePost: " cookie tools can't get.",
  sub: "Kukis captures a shopper's email and marketing consent even after they decline your cookies. That's the roughly half of EU traffic cookie-based tools can't see or reach. No popups. No cookies.",
  primary: "Book a demo",
  secondary: "See how it works",
};

export const stats = [
  {
    big: "~70%",
    label: "of carts abandoned",
    body: "of shopping carts are abandoned, and most of those shoppers never left you an email.",
  },
  {
    big: "~50%",
    label: "reject the cookie banner",
    body: "of EU shoppers reject cookies. Cookie-based tools then can't track them or show a form.",
  },
  {
    big: "2 ≠ 1",
    label: "consent is two things",
    body: "Cookie consent and marketing consent are legally separate. A shopper can reject one and still say yes to the other.",
  },
];

export const steps = [
  {
    n: 1,
    tag: "Click",
    title: "Shopper clicks a widget",
    body: "A small button on the page, never a popup. They tap it because they actually want to come back.",
  },
  {
    n: 2,
    tag: "Consent",
    title: "Email + one tickbox",
    body: "They enter their email and see one box, unchecked by default: consent to marketing. Explicit, timestamped, scoped.",
  },
  {
    n: 3,
    tag: "Deliver",
    title: "One clean email arrives",
    body: "Their cart, item, or list plus a checkout link, and a discount only if they opted in. No sequence unless they ask for reminders.",
  },
];

export type WidgetKey = "cart" | "later" | "wishlist" | "stock";

export const widgets: {
  key: WidgetKey;
  where: string;
  title: string;
  body: string;
}[] = [
  {
    key: "cart",
    where: "Cart page",
    title: "Save my cart",
    body: "Email yourself your cart contents and a checkout link, with an optional discount.",
  },
  {
    key: "later",
    where: "Product pages",
    title: "Save this for later",
    body: "Email yourself a single product to come back to, no commitment required.",
  },
  {
    key: "wishlist",
    where: "Storefront-wide",
    title: "Wishlist",
    body: "Build a list, get it emailed, and opt in to gentle reminders over time.",
  },
  {
    key: "stock",
    where: "Sold-out pages",
    title: "Back-in-stock",
    body: "Leave an email on out-of-stock items and get one message the moment it returns.",
  },
];

export const compare = {
  them: {
    who: "The usual tools",
    title: "Built for cookies",
    points: [
      "Need cookies to track a visitor or show a form",
      "Lose the ~50% who reject the banner",
      "Treat consent as a checkbox to dismiss",
      "US-built, often dependent on another platform",
    ],
  },
  us: {
    who: "Kukis",
    title: "Consent after cookies",
    points: [
      "No cookies, just small buttons in the page",
      "Reaches shoppers who declined the banner",
      "Explicit, timestamped, scoped consent",
      "EU-native and fully standalone",
    ],
  },
};

export const consentPoints = [
  { strong: "Unchecked by default", rest: "on every widget's marketing box." },
  { strong: "Explicit, timestamped, scoped", rest: "and recorded cleanly." },
  { strong: "No cookies used", rest: "by the widgets, at any point." },
  { strong: "No popups, no dark patterns", rest: "and no follow-up spam." },
];

export const builtFor = {
  for: {
    title: "Built for",
    items: [
      "EU Shopify merchants, NL / BE / DE first",
      "Small-to-mid DTC brands (~€100k-€2M GMV)",
      "Teams without a legal department",
      "Stores that want recovery without a heavy email stack",
    ],
  },
  not: {
    title: "Not for",
    items: [
      "Enterprise stores running deep marketing-automation flows",
      "Non-EU stores with no compliance pressure",
      "Anyone wanting a full email-marketing platform",
      "Stores that just want spammier abandoned-cart emails",
    ],
  },
};

export const faqs = [
  {
    q: "Do I still need my email platform?",
    a: "No. Kukis is fully standalone. It captures consented emails on its own. And if you do use another email tool, Kukis reaches the shoppers it can't (the ones who declined cookies).",
  },
  {
    q: "Is this GDPR / AVG compliant?",
    a: "Kukis is built consent-first: the marketing checkbox is unchecked by default, and every consent is explicit, timestamped, and scoped. The widgets use no cookies at all. The shopper actively clicks and opts in.",
  },
  {
    q: "How can you email someone who rejected cookies?",
    a: "Because cookie consent and marketing consent are legally separate decisions. A shopper can decline your cookies and still give a clean, explicit yes to your emails, and that yes is exactly what Kukis captures.",
  },
  {
    q: "Will it slow down my store?",
    a: "The widgets are small buttons in the page, not heavy popups or trackers, so there's nothing running in the background weighing your storefront down.",
  },
  {
    q: "Which widgets are included?",
    a: "Four: Save my cart, Save this for later, Wishlist, and Back-in-stock. Each one is a small, click-to-use capture surface on a different part of your store.",
  },
];

export const finalCta = {
  title: "See Kukis on your store.",
  body: "Book a short demo and we'll show you how much of your EU traffic you're currently leaving unreachable, and how Kukis brings it back with consent.",
  cta: "Book a demo",
  note: "EU Shopify merchants · NL / BE / DE first · English",
};

export const footer = {
  blurb: "Consent after cookies.",
  location: "Based in the Netherlands",
  lang: "English",
  year: 2026,
};
