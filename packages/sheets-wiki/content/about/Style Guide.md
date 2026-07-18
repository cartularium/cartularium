> [!INFO]
> sheets.wiki is—as its name implies—a wiki, and thus follows similar principles. The formatting and structural rules below apply across all content. The voice and tone rules apply with allowances per content kind: blog posts and guides have more latitude than function reference and concept pages.

Generally, this wiki follows Wikipedia's [Manual of Style](https://en.wikipedia.org/wiki/Wikipedia:Manual_of_Style). However, there are a number of differences, outlined below.

### Voice and tone

The voice across sheets.wiki is direct, specific, and substantive. The reader is a spreadsheet practitioner who came here looking for something concrete: a function's behavior, a concept's mental model, a technique they can apply. They didn't come for orientation prose, taglines, or a tour of what's available.

Match the register to the content kind, but never reach for marketing.

#### Per content kind

| Content kind | Register | Notes |
| --- | --- | --- |
| Function reference (`/<FUNC>`) | terse, factual, present-tense, third-person | "Returns the sum of a range." Not "The SUM function will return." Reads like an encyclopedia entry. |
| Concept reference (`/concept/<x>`) | academic, definitional, impersonal | Can be longer than a function reference. Defines the term, explains the model, gives examples. No second person. |
| Index / catalogue (`_index.md`) | scope-noun + contents, no preamble | The shortest content kind. One sentence is often enough. No "Welcome to…", no "These are the pages you…", no comparative taglines. |
| Guide (`/guide/<x>`) | instructional, second-person OK | "You can target specific elements with XPath." Examples-first. Steps are explicit. |
| Blog (`/blog/<x>`) | opinion permitted, first-person OK | Editorial register. Voice is encouraged. Still no marketing tropes. |
| Meta (about, people) | tight, declarative | Like reference, but for site policy and contributors. |

#### Anti-patterns

The patterns below show up most often on catalogue and index pages but appear elsewhere too. The list isn't exhaustive.

The canonical example of comparative tagline gloss is "Longer than a function reference, more focused than a blog post." Defining a content kind by reference to other content kinds is rarely useful; the reader can click into a guide and see what it is.

Tricolon listicles, three scope nouns lined up for cadence, read as taglines rather than information. "Anti-patterns, stylistic debates, war stories" is the marker. Listing scope nouns functionally is fine. Listing them for rhythm is the issue.

Mood-setting prose on catalogue pages tries to pre-explain what reading them will feel like ("These are the pages you read once to understand what's actually happening, then refer back to when something behaves unexpectedly"). Catalogue pages are navigation, not reading material.

Meta-explanatory padding tells the reader things they could see for themselves: "Each entry has its own page covering installation, usage, and source." Of course it does.

Friendly-onboarder voice assumes a reader who needs to be led by the hand. Phrases like "Welcome to..." and "If you're just getting started..." address a homepage visitor, but most readers landed here from a search result.

Marketing words signal that the page is selling rather than describing. Words to watch: powerful, seamless, intuitive, effortless, blazing-fast, modern, the future of, robust, comprehensive, elegant. Replace with verbs and nouns that describe what the thing does.

Page-announcing openings ("This page covers...", "In this article we'll discuss...") are the prose equivalent of throat-clearing. Just start with the content.

Hedging filler ("It's worth noting that...", "It should be mentioned that...", "One important thing to keep in mind is...") drains assertion. Make the claim directly.

The bullet-and-bold structure is itself an anti-pattern. Paragraphs of "Bolded label." bullets read as machine-formatted reference material; the structure does the work prose should be doing. Use prose with examples in it. When bulleting is genuinely the right form, don't lead each item with a bolded phrase that ends in a period. (This section was caught using that pattern in a draft.)

#### Before and after

A concept-index page that reads:

> "These are the pages you read once to understand what's actually happening, then refer back to when something behaves unexpectedly."

becomes:

> "Mental model behind spreadsheet practice: data types, references, calculation behavior, error handling, naming conventions."

The original is mood-setting prose. The rewrite states the scope and lists the contents.

A guide-index page that reads:

> "Step-by-step techniques. Longer than a function reference, more focused than a blog post."

becomes:

> "Step-by-step techniques."

The comparative gloss adds nothing the reader couldn't infer from clicking into a guide.

A blog-index page that reads:

> "Opinion, history, and longer-form writing on spreadsheet practice. Anti-patterns, stylistic debates, war stories."

becomes:

> "Opinion and longer-form writing on spreadsheet practice."

The tricolon was rhythm, not signal.

A function reference (hypothetical) that opens:

> "The QUERY function in Google Sheets is a powerful tool that allows you to run SQL-like queries against ranges of cells, making it ideal for advanced data manipulation tasks."

becomes:

> "Runs a Google Visualization API query against a range of cells. Returns the cells that match the query, with column headers preserved."

Cut: "powerful tool", "allows you to", "making it ideal for", "advanced data manipulation tasks". Each is filler.

#### What to keep

A direct, specific scope statement is fine, even on a catalogue page. "Mental model behind spreadsheet practice: data types, references, calculation behavior, error handling, naming conventions" lists nouns functionally; that isn't a tricolon-as-tagline. The test is whether the page would read worse without this sentence. If yes, keep it. If no, cut it.

### General principles

Wikipedia does not allow [original research](https://en.wikipedia.org/wiki/Wikipedia:No_original_research). sheets.wiki does, provided it has been vetted by a maintainer. This includes original spreadsheets, provided you commit to not deleting them without informing a maintainer. The standard for verification is to either open a pull request containing all relevant information or to raise the matter through the [[Spreadsheets Discord Community]].

Wikipedia has a number of rules around [external linking](https://en.wikipedia.org/wiki/Wikipedia:External_links). sheets.wiki does not, and external linking to reputable sources is encouraged, including in the main text. However, please prioritize references to internal pages (e.g. sheets.wiki pages).

sheets.wiki is not a guidebook. For instructions and advice on how to use functions and techniques, instead write blog posts (which will then be accessible through the function or technique's backlinks). You may link to guides, both external and within the sheets.wiki blog, under a section labeled `Guides`.

Don't be afraid to create dead links. We can always fill them in later.

Articles should generally have at least one wikilink and at least one tag. This makes navigation much easier.

### References and citations

Unlike Wikipedia, which uses [`<ref>` tags](https://en.wikipedia.org/wiki/Wikipedia:Citing_sources), sheets.wiki prefers [Markdown links](https://www.markdownguide.org/basic-syntax/#links).

### Formatting

#### Functions and formulae

Functions, when possible, should be written capitalized and as [inline code](https://help.obsidian.md/syntax#Inline+code) (e.g. `LAMBDA`). Formulae should use [code blocks](https://help.obsidian.md/syntax#Code+blocks) with the `gse` language code.

All formulae should be written using North American syntax (i.e., comma-separated arguments and North American array literals). Similarly, wiki entries should use North American spellings.

Both "formulae" and "formulas" are accepted plural forms of "formula".

#### Errors

Error literals like `#VALUE!` should always be formatted as either inline code or code blocks to prevent them from being interpreted as tags.

#### Headers

The largest header size you should use is `h3` (e.g. ###). Headers should have empty lines before and after in order to separate it from content. This limit exists because Quartz implicitly uses `h1` for the page title and `h2` for certain layout elements; using them explicitly produces visual inconsistencies on the published site.

Similarly to Wikipedia, headers should generally not be in title case. However, for consistency with the official documentation, exceptions are made for "Sample Usage" and "See Also".

#### Callouts

Callouts draw attention to information that warrants special notice. Three types are used across sheets.wiki:

| Callout | Usage |
| --- | --- |
| `> [!INFO]` | Supplementary context, caveats, or open questions that are informational but not warnings. |
| `> [!WARNING]` | Indicates that an article uses [[Unofficial terminology]] not endorsed by Google. All articles using unofficial terminology must include this callout. |
| `> [!ATTENTION]` | Indicates a prerequisite or access condition for an official Google product or feature. |

Callouts should appear at the top of an article, before any body text.

#### Article names

Article names should generally not be in title case. They should also be in singular form. This does not apply to blog posts, meta articles, or other original content like this page.

#### Sections

Here is a list of common sections and what they should contain, in order. This table is based off of the official documentation.

| Name         | Description                                                                         |
| ------------ | ----------------------------------------------------------------------------------- |
| Sample Usage | An example of how a function or technique should be used.                           |
| Syntax       | The exact and full syntax of a function or technique. See below.                    |
| See Also     | Annotated links to related functions and techniques.                                |
| Examples     | Should be followed by lists of examples, and/or an `iframe` to a sheet of examples. |
| Notes        | Any additional information. See below.                                              |

##### Syntax

The syntax section should have a code block with the function or formula, followed by a list of each argument and brief descriptions for each. Optional arguments should be denoted using brackets (e.g. `[optional]`) and repeated arguments should be denoted using an ellipsis.

##### Notes

Notes should contain a list of helpful tidbits that do not warrant a dedicated section and can vary in style and tone.

### Tags

Function pages are generated from official documentation and tagged `#generated`. If you modify a generated article, **replace the `#generated` tag with `#modified`**. If you do not, your edits may be overwritten by future generation runs.

Function pages that document behavior not covered by official documentation should be tagged `#undocumented` in addition to any other applicable tags.