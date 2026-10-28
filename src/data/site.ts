// All copy is drawn from context.md and the shipped app — real facts only.
// No fabricated testimonials, logos, or metrics.
//
// Claims are checked against App/consented-cart/docs/app-store-listing.md, whose
// "Do not claim" list governs this file too. In particular: no back-in-stock
// (built but not enabled), no named third-party apps, no "all data in the EU"
// (email is processed by Resend in the US), no legal review or certification,
// and no reviewed Dutch/German consent wording.

export const site = {
  name: "Kukis",
  tagline: "The yes cookie tools can't get.",
  taglinePlayful: "No cookies? No problem.",
  demoHref: "#demo", // opens the demo request modal
  // The public App Store listing. Its handle still carries "staging" because the
  // listed app was first created as "Kukis (staging)", and Shopify keeps a
  // listing's first handle.
  installHref: "https://apps.shopify.com/kukis-staging",
  installLabel: "Install on Shopify",
  // The recorded walkthrough — the same film the App Store reviewers get.
  videoHref: "/demo/",
  legalHref: "/legal/",
  // Order mirrors the page's section order.
  nav: [
    { label: "Widgets", href: "#widgets" },
    { label: "How it works", href: "#how" },
    { label: "In the app", href: "#app" },
    { label: "Calculator", href: "#calculator" },
    { label: "Pricing", href: "#pricing" },
    { label: "FAQ", href: "#faq" },
  ],
};

export const hero = {
  eyebrow: "EU Shopify · consent after cookies",
  headlinePre: "The ",
  headlineEm: "yes",
  headlinePost: " cookie tools can't get.",
  sub: "Kukis captures a shopper's email and marketing consent even after they decline your cookies. That's the roughly half of EU traffic cookie-based tools can't see or reach. No popups. No cookies.",
  primary: "Install on Shopify",
  secondary: "Book a demo",
};

// Order matters: the unique problem (cookie rejection) leads, cart abandonment is
// its consequence, and 2 ≠ 1 lands last as the hint that a fix exists.
export const stats = [
  {
    big: "~50%",
    label: "reject the cookie banner",
    body: "of EU shoppers reject cookies. Cookie-based tools then can't track them or show a form.",
  },
  {
    big: "~70%",
    label: "of carts abandoned",
    body: "of shopping carts are abandoned, and most of those shoppers never left you an email.",
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
    title: "Email + one optional tickbox",
    body: "They enter their email and get their cart either way. Marketing is a separate box, unchecked by default. Explicit, timestamped, scoped.",
  },
  {
    n: 3,
    tag: "Deliver",
    title: "One clean email arrives",
    body: "Their cart, item, or list plus a link back, and a discount only if they opted in to marketing. No sequence, unless they ask for price-drop alerts.",
  },
];

// Back-in-stock was the fourth card. It is built but switched off in the app
// ("Coming soon"), so it came out rather than be advertised; Rejection Recovery,
// which is live, took its place.
export type WidgetKey = "cart" | "later" | "wishlist" | "recovery";

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
    body: "Build a list with no account, keep it across visits, and opt in to price-drop alerts.",
  },
  {
    key: "recovery",
    where: "After a cookie decline",
    title: "Rejection Recovery",
    body: "Two seconds after a shopper declines cookies, a small note offers to save the item by email instead.",
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
      // "EU-native" used to stand here. The app and database are in
      // Frankfurt, but email is processed by Resend in the US, so the precise
      // claim is about hosting, not about every byte.
      "Hosted in the EU, in Frankfurt",
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
    a: "No. Kukis sends the emails shoppers ask for on its own. If you already use an email tool, you can export your marketing contacts as a CSV, or switch on the optional Shopify customer sync, which adds each new marketing yes to your Shopify customers so any tool that syncs from Shopify picks them up.",
  },
  {
    // Deliberately not a flat "Yes": whether a store is compliant depends on
    // how it is run, and the legal documents have not been reviewed by a
    // lawyer yet. What Kukis does is stated as fact instead.
    q: "Is this GDPR / AVG compliant?",
    a: "Kukis is built for it, and it records the evidence. The marketing box is unticked by default, and a shopper gets their cart or product email without ticking it. Each consent record keeps the exact wording shown, its version and language, the time, the widget, and the shopper's cookie choice, and a box left unticked is recorded as a no. The widgets set no cookies; the wishlist keeps one strictly necessary identifier in local storage. Your own obligations still depend on how you run your store, so our data processing agreement is published for you to review.",
  },
  {
    q: "How can you email someone who rejected cookies?",
    a: "Because cookie consent and marketing consent are legally separate decisions. A shopper can decline your cookies and still give a clean, explicit yes to your emails, and that yes is exactly what Kukis captures.",
  },
  {
    q: "Which widgets are included?",
    a: "Save my cart on the cart page, Save this for later on product pages, and a Wishlist with a heart in your header. Rejection Recovery is the fourth: a small note that appears only after a shopper declines cookies, offering to save the item by email. Each is a Shopify app block or embed you add in the theme editor, with no code.",
  },
  {
    q: "Do I need my own email domain?",
    a: "Yes, to send. Kukis emails from your own verified domain, so you need access to its DNS settings. A store on a bare .myshopify.com address can capture consent straight away, but its emails are held until a domain is verified, then sent.",
  },
  {
    q: "Does it work with my cookie banner?",
    a: "It works with any banner that passes the shopper's choice to Shopify's Customer Privacy API, which the common Shopify banners do. Kukis reads the choice from there and keeps it with the consent record.",
  },
  {
    q: "Does Save my cart work with a cart drawer?",
    a: "Not yet. The Save my cart block shows on your cart page. If your theme opens the cart as a drawer, set it to open the cart page instead, or link shoppers to /cart. Drawer support is planned.",
  },
  {
    q: "Which languages does it support?",
    a: "The storefront widgets, forms and emails are in English, Dutch and German, following the language the shopper browses in. The consent wording itself stays in English until a native speaker has reviewed the Dutch and German versions.",
  },
  {
    q: "What happens when a shopper asks to be deleted?",
    a: "Shopify's data and deletion requests are answered by Kukis and logged in the app. Erasure removes the email address, IP, cart and wishlist, and keeps a hashed address with the consent wording and its timestamp, so the proof that consent was given survives. Every email also carries a one-click unsubscribe.",
  },
  {
    q: "Will it slow down my store?",
    a: "The widgets are small buttons in the page, not heavy popups or trackers, so there's nothing running in the background weighing your storefront down.",
  },
  {
    q: "What does it cost?",
    a: "One plan: $49.99 a month after a 30-day free trial, billed through your Shopify invoice. You can cancel from Shopify at any time.",
  },
];

/**
 * The merchant's side, which the page otherwise never showed: what lands in
 * the admin after a shopper clicks. Every item is a shipped screen, in the
 * order a merchant would meet them.
 */
export type AppFeatureIcon =
  | "proof"
  | "no"
  | "rejected"
  | "orders"
  | "export"
  | "domain"
  | "sync"
  | "privacy"
  | "languages";

export const appFeatures: { icon: AppFeatureIcon; title: string; body: string }[] = [
  {
    icon: "proof",
    title: "Proof for every record",
    body: "The exact wording shown, its version and language, the time, the widget and the shopper's cookie choice. One page per contact, printable to PDF.",
  },
  {
    icon: "no",
    title: "A no is kept too",
    body: "A marketing box left unticked is recorded as a no, not a gap in your log. A refusal on record is proof as well.",
  },
  {
    icon: "rejected",
    title: "The yes you'd have lost",
    body: "A dashboard panel for shoppers who declined cookies and still left an email, with the marketing yeses and orders that followed.",
  },
  {
    icon: "orders",
    title: "Orders traced back",
    body: "See which saved carts came back as orders, and what they were worth, as Shopify reported them.",
  },
  {
    icon: "export",
    title: "Exports that respect opt-outs",
    body: "A CSV of everyone who said yes to marketing, leaving out anyone who unsubscribed, bounced or asked to be erased.",
  },
  {
    icon: "domain",
    title: "Your own sending domain",
    body: "Email goes out from your verified domain, not a shared one. Kukis shows the DNS records to add and re-checks them for you.",
  },
  {
    icon: "sync",
    title: "Optional Shopify customer sync",
    body: "New marketing yeses can be added to your Shopify customers as subscribed and tagged, with the date they agreed.",
  },
  {
    icon: "privacy",
    title: "Privacy requests, answered",
    body: "Shopify's data and deletion requests are handled for you and logged, and erasure keeps the proof that consent was given.",
  },
  {
    icon: "languages",
    title: "English, Dutch and German",
    body: "Widgets, forms and emails follow the language your shopper browses your store in.",
  },
];

export const pricing = {
  plan: "Standard",
  price: "$49.99",
  period: "a month",
  trial: "30-day free trial",
  // Shopify App Pricing bills in USD on the merchant's own Shopify invoice.
  billing: "Billed through your Shopify invoice. Cancel from Shopify at any time.",
  includes: [
    "Save my cart, Save this for later and Wishlist",
    "Rejection Recovery after a cookie decline",
    "Consent log and a proof page per contact",
    "CSV exports and optional Shopify customer sync",
    "Email from your own verified domain",
    "English, Dutch and German",
  ],
  note: "Emails send once your domain is verified. Until then Kukis records consent and holds the mail.",
};

export const finalCta = {
  title: "See Kukis on your store.",
  body: "Install Kukis from the Shopify App Store and try it free for 30 days. Prefer a walkthrough first? Book a short demo and we'll show you how much of your EU traffic you're leaving unreachable.",
  cta: "Install on Shopify",
  demo: "Book a demo",
  video: "Or watch the 7-minute walkthrough",
  live: "Live on the Shopify App Store · 30-day free trial",
  note: "EU Shopify merchants · NL / BE / DE first · English, Dutch, German",
};

export const footer = {
  blurb: "Consent after cookies.",
  location: "Based in the Netherlands",
  // Dutch Chamber of Commerce registration. Dutch law expects a business site
  // to show it; the legal pages carry it too.
  kvk: "42138940",
  linkedin: "https://www.linkedin.com/company/kukisapp/",
  lang: "English",
  year: 2026,
  // The site had no links here at all — not even a privacy policy, on a page
  // with a form that collects a name and an email.
  links: [
    { label: "Shopify App Store", href: site.installHref },
    { label: "Watch the demo", href: "/demo/" },
    { label: "Legal", href: "/legal/" },
    { label: "Terms", href: "/legal/terms" },
    { label: "Privacy", href: "/legal/privacy" },
    { label: "DPA", href: "/legal/dpa" },
    { label: "Sub-processors", href: "/legal/subprocessors" },
  ],
};

export const demoRequest = {
  endpoint: import.meta.env.VITE_DEMO_FORM_ENDPOINT || "",
  // Public by design — the site key is meant to ship in the page. The secret
  // lives server-side as TURNSTILE_SECRET_KEY. Blank locally, which disables
  // the widget so dev works without it.
  turnstileSiteKey: import.meta.env.VITE_TURNSTILE_SITE_KEY || "",
  // Public (ships in the bundle): the mailto: shown if /api/demo ever fails, so a
  // demo request is never silently lost. Must be a receiving address on the root
  // domain — contact.kukis.nl is send-only and has no inbox.
  fallbackEmail: "hello@kukis.nl",
  heading: "Request a demo",
  intro: "For EU Shopify merchants in NL, BE, and DE first.",
  replyNote: "Reply in 1-2 days",
  helper: "Helps us make the reply specific instead of generic.",
  privacy: "Only used to reply to this demo request. No newsletter opt-in.",
  successTitle: "Request sent.",
  successBody: "We'll take a look at your store and get back to you within 1-2 days.",
  successClose: "Close",
  mailtoTitle: "Opening your email app.",
  mailtoBody: "Send the pre-filled email to finish the request.",
  errorTitle: "The request did not send.",
  errorBody: "Please try again, or use the fallback email link.",
  countries: ["Netherlands", "Belgium", "Germany", "Other EU", "Outside EU"],
  storeSizes: [
    "Under EUR 100k GMV",
    "EUR 100k-EUR 500k GMV",
    "EUR 500k-EUR 2M GMV",
    "Over EUR 2M GMV",
    "Not sure",
  ],
};
