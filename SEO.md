# SEO & AI Discoverability

Target market: **contractors, facilities managers, and building owners needing small-batch repair, reproduction, and one-off fabrication.** The discontinued-latch case study is the anchor proof point.

## Done — `trade.html` (2026-07-30)

Integrated the repair/reproduction service into the existing trade page rather than building a dedicated one. Title, meta description, canonical, `Service` + `LocalBusiness` + `FAQPage` JSON-LD, a re-headed and anchored `#hardware-reproduction` section with buyer-language copy, a six-item "What We Take On" list, a six-question buyer Q&A, descriptive image alt text, and form fixes (Repair/Reproduction inquiry type, sub-$2k budget bands).

## Done — technical baseline (2026-07-30)

Complete. All 17 indexable pages now carry a unique title, unique meta description (129–155 chars), self-referencing canonical, 6 Open Graph tags, and 4 Twitter card tags. `og:image` reuses each page's own hero asset; five text-only pages (contact, FAQ, shipping-returns, and two others) fall back to the studio hero.

Also: `robots.txt` (AI crawlers explicitly permitted; `/configurator/` excluded), `sitemap.xml` (17 URLs, git-derived `lastmod`), `noindex, follow` on `cart.html` / `review.html` / `404.html`, `LocalBusiness` on `index.html` at `#organization`, `Product` schema on all 6 product pages, param-less canonicals on the two `?style=` Detroit pages.

**Conventions to keep if adding pages:** title ≤ ~60 rendered chars, description 130–160, canonical absolute, `og:image` absolute. Utility pages get `noindex, follow` and stay out of the sitemap — and stay *crawlable*, since `Disallow` would stop crawlers from ever reading the `noindex`. **Add new pages to `sitemap.xml` manually** — there is no build step to generate it.

**⚠️ Prices now live in three places** — `PRICE_CENTS`, the page's inline `addItem`, and the `Product` JSON-LD. See `CLAUDE.md` → Stripe Checkout for the full note. Stale schema prices mislead search results and can trigger Merchant mismatch warnings.

## Principles worth keeping

- **Integration over a dedicated page.** LLM retrieval is passage-level, so a strong section performs nearly as well as its own page — and a thin unmaintained page is worse than a strong section on one that already has authority. The cost is real but bounded: `<title>`, URL slug, meta description, H1, and JSON-LD primary entity are one-per-page, so head terms like *"custom replacement latch fabrication"* stay out of reach. **Revisit trigger:** if reproduction inquiries gain volume, promote the section to `hardware-reproduction.html` with proven copy.
- **Breadth in the body, specificity in the title.** Nobody searches "custom object production." An explicit list of concrete examples is broad in coverage while every item stays searchable. Abstract labels match no real query.
- **List ad hoc 3D printing, don't lead with it.** Those queries attract price-shoppers comparing per-gram rates; the moat is reverse-engineering, parametric modeling, and finish matching.
- **Citability beats polish.** LLMs extract self-contained factual passages. "Minimum order one unit, works from a sample or dimensioned photos, 6–8 weeks" is quotable; "authored algorithmic variation" answers no one's question.
- **`FAQPage` schema yields no rich results** for commercial sites — Google restricted those to government and health sites in 2023. Still worth including for machine parsing; expect no visual SERP change.

## Outstanding

### Technical baseline (see game plan)
Site-wide state: meta description, canonical, and JSON-LD each on **1 of 20** pages; Open Graph and Twitter cards on **0 of 20**. No `robots.txt`, no `sitemap.xml`. Several titles are weak or redundant ("VOLDT Hardware -- VOLDT", "Products -- VOLDT").

### Off-site — highest AI-visibility leverage
- Training data is not a lever (multi-year lag, no feedback loop). **Retrieval at inference is** — models run a web search and read results, so classic SEO is upstream of AI recommendations, not a separate program.
- Third-party sources shape vendor opinions: Reddit (r/Contractors, r/electricians, r/HomeImprovement, r/machinists), industry directories, trade press. A substantive reply to "manufacturer's gone, need 40 latches" outweighs any on-page tweak. Astroturfing gets detected and burns the signal.
- Worth listing on Thomasnet and fabrication/sourcing directories.
- There is no mechanism to buy an LLM recommendation. The path is being the best-documented, most specific answer a search surfaces.
