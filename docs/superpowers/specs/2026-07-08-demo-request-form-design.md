# Demo Request Form Design

## Context

Kukis is a static Vite React landing page deployed on GitHub Pages. The current `Book a demo` CTA points to `site.demoHref`, which is `#demo`, and resolves to the final CTA section. The new feature replaces that dead-end CTA with a request-demo form for early SaaS launch validation.

The site must remain low-cost. GitHub Pages cannot process form submissions server-side, so the design uses a static form that posts to a free or low-cost hosted form endpoint. The endpoint should be provider-agnostic so Kukis can start on a free plan and switch providers without redesigning the form.

## Design Read

Reading this as a B2B SaaS landing page for EU Shopify merchants, with a playful trust-first Milk and Cookie brand language. The form should feel like part of the existing Kukis page, not a generic SaaS contact form.

Design dials:

- Design variance: 6. Preserve the existing centered, soft brand system while giving the form a stronger two-column CTA composition.
- Motion intensity: 5. Reuse existing crumb drift and mascot motion, with reduced-motion fallbacks.
- Visual density: 4. Keep the form complete but scannable.

## Visual Design

The final CTA remains a full-width dark cocoa canvas. It keeps the existing warm glow and floating cookie crumb background from `FinalCta`.

The content becomes a two-column layout:

- Left column: Gabarito headline, short Inter body copy, three short trust/expectation notes, and the Kukis mascot.
- Right column: Cream request-demo form panel with Cocoa text, Choc Chip hairline border, 20-24px radius, and Cherry Deep submit button.

The form uses the typography from `design.md`:

- Gabarito for headings and the `K` mark.
- Inter for labels, inputs, helper text, buttons, and form status messages.

The mascot is reused from the `BuiltFor` section instead of creating a new visual. It keeps:

- Idle bob animation.
- Speech bubble.
- Eye-following effect.
- Reduced-motion static fallback.

The mascot copy should be short and practical, for example: `Send me the good stores.`

## Form Fields

Required fields:

- Name
- Work email
- Shopify store URL
- Country
- Message

Optional field:

- Store size, using ranges that match the target customer profile.

Country options should focus on the launch region first:

- Netherlands
- Belgium
- Germany
- Other EU
- Outside EU

Store size options:

- Under EUR 100k GMV
- EUR 100k-EUR 500k GMV
- EUR 500k-EUR 2M GMV
- Over EUR 2M GMV
- Not sure

The form includes helper text under the store URL field: `Helps us make the reply specific instead of generic.`

The privacy note says: `Only used to reply to this demo request. No newsletter opt-in.`

## Behavior

All `Book a demo` buttons should continue to route through `site.demoHref`. `site.demoHref` stays `#demo`, and the final section becomes the form destination.

Submission states:

- Idle: submit button says `Send request`.
- Submitting: button says `Sending...` and is disabled.
- Success: show a clear inline confirmation and keep the page on the form section.
- Error: show a clear inline error with a fallback email path.

Client validation:

- Required fields must be present.
- Email must look like an email address.
- Store URL must look like a URL or domain.

Validation errors appear below the relevant input. Placeholders are not labels.

## Technical Design

Add a focused form component rather than embedding all logic in `FinalCta`.

Recommended component split:

- `src/components/sections/FinalCta.tsx`: keeps the section canvas, crumb background, and footer composition.
- `src/components/sections/DemoRequestForm.tsx`: owns form fields, validation, submission, and status rendering.
- `src/components/ui/CookieMascot.tsx`: extracted from `BuiltFor` so both `BuiltFor` and the demo CTA use the same mascot implementation.
- `src/data/site.ts`: owns demo copy and endpoint configuration.

The static form endpoint should be configurable:

- `VITE_DEMO_FORM_ENDPOINT` for production deployments.
- If no endpoint is configured, show a disabled submit state with setup guidance in development, or use a visible fallback email link if a public contact email is configured.

For the first launch, use a hosted static-form endpoint. Formspree is the default recommendation because it is simple and supports static sites; its current free tier starts at 50 submissions per month. If lead volume or spam pressure exceeds that, the endpoint can be replaced without changing the form UI.

## Accessibility

- Labels are visible and above inputs.
- Errors are associated with fields.
- Form status uses `aria-live="polite"`.
- Disabled and loading states are visible.
- Focus rings use the existing Blueberry focus style.
- Reduced motion disables crumb drift and mascot animation.

## Testing

Verification before deployment:

- `npm run build`
- Manual local preview of `/kukis-site/#demo`
- Submit validation with empty fields.
- Submit validation with invalid email and invalid store URL.
- Success state using a configured endpoint or mocked response.
- Error state using a forced failing endpoint.
- Mobile layout check below 768px.

## External Setup Requirement

The only external value needed before the live form can receive leads is the actual form endpoint. Recommended setup is a hosted static-form endpoint that forwards submissions to the founder's inbox. Formspree is the first option to try for simplicity; alternatives can be swapped in through the same endpoint setting.
