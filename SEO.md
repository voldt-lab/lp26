# SEO & AI Discoverability — Notes

Target market for this effort: **contractors, facilities managers, and individual owners needing small-batch custom repair / reproduction work** (the discontinued-latch case study is the anchor proof point).

Status: **recommendations only — nothing implemented yet.**

## 1. Core problem: page-intent mismatch

The reproduction/repair service currently exists as two sentences in the entire codebase — one bullet in `trade.html` ("Reverse engineering and reproduction of discontinued hardware") and the Commercial Hardware Reconstruction case study paragraph.

Everything else on `trade.html` is framed for design professionals ("Precision fabrication for design professionals"). A contractor searching for replacement parts won't rank into it, and won't self-identify if they land there.

**Highest-leverage move:** give reproduction work its own dedicated page (e.g. `hardware-reproduction.html`). One page, one search intent. `trade.html` keeps its design-professional framing and cross-links. Nothing gets deleted.

## 2. Vocabulary gap

The site uses vendor language; the buyer searches in pain language. None of *discontinued, obsolete, replacement, repair, no longer made, out of production, one-off* appear anywhere except those two lines.

| Buyer searches | Site currently says |
|---|---|
| manufacturer out of business replacement parts | reverse engineering and reproduction of discontinued hardware |
| custom latch small quantity | project quantities by quote |
| 3d print replacement part from sample | SLS/FDM printing |
| obsolete panel hardware where to get made | parametric models to accommodate dimensional variation |

Lead with buyer language; keep technical credibility underneath, not in the headline.

## 3. Technical SEO — currently none site-wide

Verified by grep: **zero** meta descriptions, JSON-LD blocks, canonical tags, or Open Graph tags across all HTML files. No `robots.txt`, no `sitemap.xml`.

- `<title>` tags have no keyword value ("Studio & Trade -- VOLDT" — nobody searches that)
- Add meta descriptions to every page
- Add `sitemap.xml` + `robots.txt`. `robots.txt` is also where AI crawlers (GPTBot, ClaudeBot, PerplexityBot) are explicitly allowed — currently allowed by default, so the risk is accidentally blocking them later, not the reverse
- Add JSON-LD: `LocalBusiness` (Michigan location matters for contractor searches), `Service` for the reproduction offering, `FAQPage`
- Fix alt text on the latch photos — the best credibility asset on the site currently reads "Original hardware -- front". Should name the part and the service.
- The case study `<section>` has no `id` — not deep-linkable, not citable

## 4. AI / LLM visibility

Separating mechanism from hype:

- **Training data is not a lever.** Multi-year lag, no feedback loop, a small site won't shift model weights. Ignore it.
- **Retrieval at inference time is the real mechanism.** LLMs run a web search and read the results, so classic SEO is *upstream* of AI recommendations — not a separate program. Ranking well is most of the work.
- **Citability beats polish.** LLMs extract self-contained factual passages. "Minimum order: 1 unit for prototypes, 10+ for production. Works from a physical sample or dimensioned photos. 6–8 week turnaround. Materials: polyamide, aluminum, brass." is quotable. "Authored algorithmic variation" cannot be turned into a useful answer for someone with a broken latch.
- **The highest-leverage AI play is off-site.** LLM opinions on "who does small-batch repro work" come largely from third-party sources: Reddit (r/Contractors, r/electricians, r/HomeImprovement, r/machinists), industry directories, trade press. Genuine participation — answer the technical question, mention the capability. Astroturfing gets detected and burns the signal.
- Worth listing on Thomasnet and fabrication/sourcing directories — heavily represented in retrieval results for sourcing queries.
- There is no mechanism to buy an LLM recommendation. The path is being the best-documented, most specific answer a search surfaces.

## 5. Conversion blockers on the trade form

Both directly contradict targeting individual owners / small jobs:

- **Budget dropdown starts at "Under $2,000."** A homeowner needing six latches is a sub-$1,000 job; the dropdown reads as "you're too small for us."
- **No "Repair / Reproduction" option** in Inquiry Type — the target market has to select "Other," which is bad UX and destroys segmentation data.

## 6. FAQ section does double duty

Unanswered anywhere on the site, and exactly what this buyer asks:

- Can you work from photos, or do you need the physical part?
- Do I get my sample back?
- What's the minimum quantity? Can I order just one?
- Can you match a specific finish?
- What about load-bearing or safety-rated parts?

Answering these yields `FAQPage` schema for Google **and** the most extractable content on the site for LLMs — same work, both channels.

## 7. Suggested sequencing

1. New dedicated reproduction page (anchored on the latch case study)
2. Site-wide technical SEO baseline — meta descriptions, `sitemap.xml`, `robots.txt`, JSON-LD
3. FAQ block with `FAQPage` schema
4. Fix trade form budget ranges + add Repair/Reproduction inquiry type
5. Ongoing off-site presence (Reddit, directories) — slow burn, highest AI-visibility payoff
