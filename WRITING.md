# Documentation Style Guide

How to write the documents of chassis-icons: the repository docs (`README.md`, `.github/CONTRIBUTING.md`, `docs/`), the changeset entries, and the pages of the docs site. It follows the language and voice of the [chassis-tokens guide](https://github.com/chassis-ui/tokens/blob/main/WRITING.md) and of the [chassis-assets guide](https://github.com/chassis-ui/assets/blob/main/WRITING.md), adapted to an icon library creator.

**The guide is the reference, not the existing pages.** Don't copy a convention from a document because the document does it; check it here. Migrate a document when editing it, and don't gate unrelated PRs on the migration.

**The site has no documentation pages yet.** It shows one generated page per icon. Phase 5 of [ref/ROADMAP.md](ref/ROADMAP.md) writes the pages of `getting-started/`, `icon-design/` and `use-in-project/` by this guide. Until then the language and accuracy rules apply to the repository docs, and the structure rules are the plan for those pages.

## How this guide is organized

- **Language (§1–6)**: voice, tone, vocabulary, icon names and code references in prose.
- **Accuracy (§7–8)**: names and paths that must exist, what stays out, counts, versions and configuration.
- **Structure (§9–12)**: frontmatter, section order per doc type, headings.
- **Components and conventions (§13–16)**: tables and trees, callouts, troubleshooting entries, cross-references.
- **Code blocks and doc length (§17–20)**: language tags, output vs hand-written code, when to split a doc.
- **Lint checklist**: what to verify before opening a PR.
- **Appendix A**: MDX component reference.

The language and accuracy rules apply to every document. The structure rules are for site pages only.

---

## Language

### 1. Voice by doc type

The right prose voice depends on the doc category. There are two conventions, and mixing them in the wrong context produces prose that either feels like a marketing page or sounds robotic.

| Doc type                                               | Voice       | Second-person `you/your` | First-person `we/our` |
| ------------------------------------------------------ | ----------- | ------------------------ | --------------------- |
| Icon design (`icon-design/*.mdx`)                      | Instructive | ✗ Avoid                  | ✗ Avoid               |
| `docs/architecture.md`, `AGENTS.md`, changeset entries | Instructive | ✗ Avoid                  | ✗ Avoid               |
| Getting Started (`getting-started/*.mdx`)              | Tutorial    | ✓ Appropriate            | ✗ Avoid               |
| Use in Project (`use-in-project/*.mdx`)                | Tutorial    | ✓ Appropriate            | ✗ Avoid               |
| `README.md`, `.github/CONTRIBUTING.md`                 | Tutorial    | ✓ Appropriate            | ✗ Avoid               |

---

**Instructive voice** avoids `you`, `your`, `yours`, `we`, `our`, `ours`, and `us` in prose. The reader is consulting these docs to find a rule of the set or what the build does with a file, not following a guided procedure. Removing the narrator keeps prose focused on the icons and reads as reference documentation rather than marketing copy.

**Good:** "Draw an icon on the frame of the set, in one color. The build removes every `fill`, so the icon takes the color of the text around it."

**Bad:** "You can draw your icons on our frame. We remove the fills for you."

**Imperative vs descriptive.** Both are correct instructive voice: imperative ("Draw an icon on the frame") for what the reader does; descriptive ("The build removes every `fill`") for what the build does. A typical paragraph mixes both.

**Exceptions:** direct quotes keep their original voice; callouts may use imperative voice as direct guidance; code comments and command output aren't prose and are unaffected.

---

**Tutorial voice** allows second-person "you"/"your". They read naturally in a step-by-step guide where the reader clones the repository, replaces the source, or adds a stylesheet to a page. Reference sections inside a guide (a table of settings, a list of checks) still read better without a pronoun.

**Good:** "If you build your own set, use the name of your font in place of this one."

**Bad (still avoid even in tutorial docs):** "We've now built the icons. Our next step is to add them to the page."

**First-person plural is discouraged across all doc types.** "We"/"us"/"our" imply a narrator who is neither the project nor the reader. There's always a clearer alternative ("the previous step" instead of "what we built"). Universal imperative steps ("Run the build") don't need a pronoun at all.

### 2. Every heading earns its paragraph

Every `##`, `###`, and `####` heading must be followed by at least one explanatory sentence before any code example, table, bullet list, or sub-heading, naming what the section is about and why it matters. A bare heading followed by a table tells readers _what_ exists but not _when to reach for it_.

**Floor:** one full sentence is enough. Don't pad.

**No exception for list sections.** `## Best practices`, `## Troubleshooting`, and `## Next steps` open with a sentence too, before the first entry. `## Best practices` gets a sentence of its page, which says what the practices of the page protect; one that would fit any page ("Follow these best practices") is filler. The entries of the other two have the same shape on every page, so their sentence is fixed: "Each entry gives the message or the symptom, then the cause and the fix." for `## Troubleshooting` ([§15](#15-troubleshooting-entries)), and "Continue with one of these pages:" for `## Next steps`.

**Good:**

````mdx
## The sprite

The sprite holds every icon of the set as a `<symbol>` whose `id` is the name of the icon. One request loads the set, and a `<use>` draws an icon.

```html
<svg width="24" height="24" fill="currentcolor">
  <use href="/static/icons/chassis-icons.svg#bell-outline"></use>
</svg>
```
````

**Bad:**

````mdx
## The sprite

```html
<svg width="24" height="24" fill="currentcolor">
  <use href="/static/icons/chassis-icons.svg#bell-outline"></use>
</svg>
```
````

**Anti-pattern: container phrases.** Intro sentences starting with "The following…" or "Below is…" announce content without describing it. State what the content does instead. **Bad:** "The following table lists the settings." **Good:** "The settings of `chassis.build` name the font and say what an icon of the set looks like." Exception: a colon-terminated sentence introducing a bullet list is fine, since the colon signals enumeration rather than vague pointing.

**Anti-pattern: label paragraphs.** A bold label on its own line (`**How it works:**`, `**Benefits:**`, `**Example:**`) is a heading in disguise. Promote it to a real heading with an intro sentence, or fold it into the paragraph.

### 3. Describe behavior, not benefits

Documentation explains what a file can hold and what the build writes; it does not sell the toolkit. Skip adjectives like "comprehensive", "powerful", "seamless", "smart", "production-ready". State the behavior and let it demonstrate the value.

**Good:** "An icon keeps its code point for as long as it is in the set, so a stylesheet that a browser has cached draws the right icon after another is added."

**Bad:** "Our powerful automated pipeline delivers production-ready icon fonts with seamless updates."

**Exception:** the frontmatter `description` field may include a light positioning phrase (it's the SEO meta description) under 160 characters and free of superlatives. **Use-case lists are permitted**: "for buttons, menus and links" names concrete use cases rather than qualitative adjectives.

**Generic advice is not documentation.** A guideline that would be true of any icon set ("keep your icons consistent", "optimize your SVG files") says nothing about Chassis Icons. Keep a guideline only when it names a setting, a rule of the source lint, a file of the output or a command.

### 4. Active voice over passive where natural

Prefer active voice, with the actor named: the build, the step, the source lint, the designer, the browser. Passive is acceptable when the subject is genuinely unknown or unimportant.

**Good:** "The build retires the code point of a removed icon, and gives it to no later icon."

**Bad (when avoidable):** "The code point is retired when an icon is removed and is not reused."

### 5. Vocabulary

The project has one word for each concept. Using a synonym makes the reader wonder whether it's a second concept.

| Use             | For                                                                                        | Not                                           |
| --------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------- |
| set             | The icons of one repository: the files of `source/` and what the build writes from them    | library (for the files), collection, pack     |
| default set     | The set this repository ships with, published as `@chassis-ui/icons`                       | the icons (as if there were no other set)     |
| icon            | One file of `source/`, and everything the build writes for it                              | glyph (except inside the font), asset, image  |
| name            | The name of an icon: its file name without `.svg`                                          | id, key, slug                                 |
| style           | The last part of a name, one of `chassis.build.styles`: `outline`, `solid`, `brand`        | variant, type, weight                         |
| pair            | The styles an icon comes in together, an entry of `chassis.build.pairs`                    | group, family                                 |
| frame           | The square an icon is drawn on, `chassis.build.frame`                                      | canvas, artboard, grid, size                  |
| source          | The files under `source/`                                                                  | input, originals, raw icons                   |
| output          | What the build writes: `svgs/`, `icons/`, the registry, the README and the manifest fields | dist, distribution, generated assets          |
| sprite          | `icons/<font>.svg`, one `<symbol>` per icon                                                | spritesheet, symbol file                      |
| font, icon font | `icons/<font>.woff2` and the other formats                                                 | webfont, typeface                             |
| prefix          | What a class of the font starts with, `chassis.build.prefix`                               | namespace, class name                         |
| code point      | The character of an icon in the font, in the Private Use Area                              | unicode, codepoint (in prose), character code |
| registry        | `packages/icons/codepoints.json`                                                           | map, manifest, lock file                      |
| retired         | A code point of a removed icon, which no later icon gets                                   | deleted, freed, reserved                      |
| step            | One part of the build: `svgs`, `sprite`, `font`, `package`                                 | stage, phase, task                            |
| the build       | The build in `packages/icons/build/`, `pnpm icons`                                         | the pipeline, the generator, the script       |
| source lint     | `pnpm icons:lint:source`                                                                   | validation, the linter                        |
| consumer        | A site, a package or an app that reads the output                                          | client, user                                  |
| contract        | The icons a consumer reads by name, in `chassis.checks.json`; also the shape of the output | requirements, dependencies                    |
| adopt, adopter  | A team that builds its own set from a clone, and that team                                 | fork (as a verb for this), customer           |

**The build optimizes, and draws nothing.** It optimizes the SVG files, builds the sprite and the font, and writes stylesheets. It does not draw, resize or recolor an icon, and it does not outline a stroke: the source lint refuses a file it cannot use.

**Owned and customized.** Chassis Icons is meant to be owned by the team that adopts it. Don't present the default set, its font name `chassis-icons`, its prefix `cx` or its styles as the only ones; see [§8](#8-counts-versions-and-configuration). A document about the toolkit says "the set" and "your set"; a document about the package `@chassis-ui/icons` may say "the Chassis set".

**Phases are for the roadmap.** "Phase" names a phase of `ref/ROADMAP.md`. A part of the build is a step.

Product names keep their spelling: Chassis Icons, Chassis Tokens, Chassis Assets, Chassis CSS, Chassis React, Figma, Font Awesome, SVGO, svg-sprite, Fantasticon, Sass, Node.js, npm, pnpm, Vite, Git LFS. Formats are uppercase in prose (SVG, WOFF2, WOFF, TTF, CSS, SCSS) and an extension in code (`.woff2`).

Write in American English (`color`, `behavior`, `customize`, `optimize`), which is the spelling of the other Chassis docs.

### 6. Icon names and code references in prose

Backtick every code reference. An icon has one name and several forms in the output; which one to write depends on what the sentence is about.

| Referring to             | Form                                   | Example                                                       |
| ------------------------ | -------------------------------------- | ------------------------------------------------------------- |
| The icon itself          | Its name                               | `` `bell-outline` ``                                          |
| Its source file          | Path from the repository root          | `` `source/bell-outline.svg` ``                               |
| Its optimized file       | Path from the package                  | `` `svgs/bell-outline.svg` ``                                 |
| Its class of the font    | With the dot only in a selector        | `` `cx-bell-outline` ``, `` `.cx-bell-outline` ``             |
| Its symbol of the sprite | With the hash, as an address           | `` `#bell-outline` ``, `` `chassis-icons.svg#bell-outline` `` |
| A group of icons         | A pattern with `*`                     | `` `bell-*` ``, `` `*-brand` ``                               |
| A code point             | Four hexadecimal digits, as in the CSS | `` `f101` ``, `` `"\f101"` ``                                 |
| A file of the font name  | With `<font>` for any set              | `` `icons/<font>.css` ``, `` `icons/chassis-icons.css` ``     |
| A folder                 | With a trailing slash                  | `` `source/` ``, `` `packages/icons/icons/` ``                |
| A setting                | As a path from `chassis`               | `` `chassis.build.prefix` ``                                  |

**Placeholders** go in angle brackets, lowercase: `` `svgs/<name>.svg` ``, `` `<prefix>-<name>` ``, `` `icons/<font>.woff2` ``. Don't use square brackets or braces for placeholders. A document about any set uses the placeholders; an example may use the names of the default set and say so.

**Other references:** file paths relative to the repository root (`` `packages/icons/build/cli.js` ``), or to the installed package when the reader has only that (`` `node_modules/@chassis-ui/icons/icons/` ``); commands in full (`` `pnpm icons --only font` ``); units and values in code (`` `24` ``, `` `currentcolor` ``). Interface labels of Figma are bold, not code: **Export → SVG**.

---

## Accuracy

### 7. Names are facts, icons are examples

Chassis Icons is a toolkit that its adopters own and customize. The layout of the repository, the shape of the output, the settings, the rules of the source lint and the commands are its structure. The icons are not: an icon belongs to one set, is renamed or removed with a release, and does not exist in the set of an adopter. Document the structure, and use the icons as examples.

**Names must exist.** Every path, file name, command, option, setting and icon name in a doc must exist in the repository, in the output of a build, or in the build as written. Don't write a name from memory, and don't invent a flag: a reader will run it. Before adding a name, find it:

```bash
node packages/icons/build/cli.js --help
pnpm icons --dry-run
ls source | grep bell
```

**Output is copied from a build.** A line of a stylesheet, a symbol of the sprite or a tree of `packages/icons/` in a doc is what a build wrote. Shorten it by leaving lines out, never by editing a line.

**A statement about the build is checked by running it.** "A whole build removes a file whose source is gone", "`pnpm icons:verify` fails when a contract icon is missing": run the command, read what it prints, then write the sentence. The quick start of the `README.md` is walked in a fresh clone before it is changed.

**What stays out of prose and tables:**

- **Counts of icons, files, tests or checks.** They change with every commit. See [§8](#8-counts-versions-and-configuration).
- **Code points of particular icons.** A doc explains how code points are given and kept; `codepoints.json` holds the values.
- **The source of the artwork.** The default set is a collection of icons modified from free libraries, and of originals. Don't credit an icon to a library in a doc.
- **Features the build does not have.** A planned feature is named as planned ([§8](#8-counts-versions-and-configuration)), and nowhere described as if the build had it.
- **Sizes of files.** They change with every icon.

**Usage code is run where it is used.** An HTML, CSS or Sass sample is tried against a build or against the published package before it is written down. A React or Chassis CSS sample names props and variables that exist in that project today; check its source, and link its docs.

### 8. Counts, versions, and configuration

A doc that states a number makes a promise the next commit can break. Don't count icons, files, tests or checks ("503 icons", "146 tests", "eight checks"); name the things or their pattern instead. `packages/icons/README.md` states the number of icons because the build writes it.

**Versions.** Write "Node.js 22.12 or later", not "the latest Node.js", and "the version named by `packageManager`" for pnpm. For the version of the set, use the `[[config:currentVersion]]` token ([§16](#16-cross-references)) on a site page instead of a number typed by hand. The badge of `README.md` is written by `pnpm changeset:version`.

**Configuration.** The font name, the prefix, the frame, the styles and the pairs in `chassis.build` of `packages/icons/package.json` are the committed configuration, not the system. Name them as such ("the default set has the styles `outline`, `solid` and `brand`"), and use them in examples, not in definitions, so an adopter with another configuration can follow. The same goes for `chassis.checks.json`: its contracts are those of the Chassis sites and Chassis React.

**Planned features.** A feature the build does not have is named as planned, in one place, and nowhere described as if the build had it. The optional features are Phase 6 of [ref/ROADMAP.md](ref/ROADMAP.md).

**The output contract is in [docs/architecture.md](docs/architecture.md#output-contract).** A document that describes what the build writes must agree with it. When they disagree, run the build, then fix the one that is wrong.

---

## Structure

### 9. Frontmatter

Every site page starts with YAML frontmatter. Required fields:

```yaml
---
title: The Icon Font
description: One-sentence summary, under 160 characters.
toc: true
---
```

Optional fields and their accepted values:

| Field      | Values                                    | Effect                                                |
| ---------- | ----------------------------------------- | ----------------------------------------------------- |
| `added`    | `version` (string), `showBadge` (boolean) | Marks the version that introduced the page's subject. |
| `aliases`  | A path or a list of paths                 | Redirects old URLs to the page.                       |
| `sections` | List of `{title, description, slug}`      | Renders the cards of an index page.                   |

`description` follows the body rules for behavior over benefits ([§3](#3-describe-behavior-not-benefits)). Start with what the page covers, not with "Comprehensive guide to" or "Learn how to".

**Titles.** Page titles are in title case. `packages/site/data/sidebar.yml` finds a page by the slug of its sidebar title: the entry `Quick Start` loads `quick-start.mdx`. A new page needs a sidebar entry whose slug is its file name.

**Icon pages** have `title`, which is the name of the icon, `description`, `categories` and `tags`, and no body. They are written by a command and not by hand.

### 10. Standard section order

Each doc type has a section order. Skip sections that don't apply; don't reorder them.

**Icon design docs** (`icon-design/*.mdx`) state a rule of the set, then show how a file follows it and what happens when it does not:

```text
## Introduction              (what the rule is for, and which setting of chassis.build holds it)
## The rule                  (named after its subject: the frame, the color, the names, the styles)
## Exporting                 (how a design tool writes a file that follows the rule)
## Source lint               (the message of pnpm icons:lint:source for a file that breaks it)
## Best practices
## Next steps                (always last)
```

**Use in project docs** (`use-in-project/*.mdx`) follow the order in which a developer meets the output. The pages of the font, the sprite, the SVG files and Sass share this order, so a section added to one usually belongs in the others:

```text
## Introduction              (what the page uses, and when to choose it over the other ways)
## Installation              (the package, the archive of a release, or the two folders of a build)
## Basic usage               (the minimal working example: one file loaded, one icon drawn)
## Size and color            (how the icon takes the size and the color of its context)
## Accessibility             (a decorative icon, and an icon that carries meaning)
## Customization             (one ### each: the folder of the font, the Sass map, a set of your own)
## Best practices
## Troubleshooting           (see §15)
## Next steps                (always last)
```

**Guides** (`getting-started/*.mdx`) use a looser structure but still lead with an intro paragraph under `## Introduction`, list requirements under `## Prerequisites`, order their sections as the reader performs them, and close with `## Troubleshooting` and `## Next steps`.

**Canonical section names.** Use `## Introduction`, `## Basic usage`, `## Best practices`, `## Troubleshooting` and `## Next steps`, not "Overview", "Getting Started", "Tips", "FAQ" or "See Also".

### 11. Heading hierarchy

Don't skip levels. `##` → `###` → `####`, never `##` → `####`. Use `####` sparingly: three levels of nesting usually signals a section that wants to be promoted to its own `###` or split into a sibling page.

### 12. Heading length, case, and punctuation

**Length.** Keep `##` and `###` headings under **~25 characters**. The ToC sidebar is ~200px wide and longer titles wrap, which makes it hard to scan. **Good:** `Code points`, `Source lint`, `Size and color`. **Bad:** `How the build assigns and preserves code points`. Shorten and push the longer phrasing into the intro paragraph.

**Sentence case, no trailing punctuation.** Capitalize only the first word and proper nouns (`### Code points`, not `### Code Points`; `### Chassis React` stays); no `.`, `:`, `?`, or `!` at the end. Write "and", not `&`. Fix title-case slips opportunistically.

**Code in headings.** A heading that names code keeps the code's spelling without backticks (`### chassis.build`, `### startCodepoint`), so the anchor stays readable. Don't put an icon name in a heading; name the group ("Brand icons") and show the icons in the body.

---

## Components and conventions

### 13. Tables and trees

Tables on a site page are Markdown tables wrapped in `<CxTable>`, which makes them scroll on narrow viewports. A repository doc uses a plain Markdown table. A table that maps one thing to another, such as settings to what they set or consumers to what they read, names its columns after what it maps.

**Setting and option tables** have the setting or the option in the first column, in backticks, its default in the second, and what it does in the last, as a phrase without a trailing period. Copy the options from `node packages/icons/build/cli.js --help` and the defaults from `packages/icons/build/config.js`.

**Columns that say the same in every row** move into the intro sentence of the table.

**Trees** are `text` blocks, with a comment after `->` where a line needs one. A tree of `packages/icons/` shows what a build wrote ([§7](#7-names-are-facts-icons-are-examples)), with `<font>` and `<name>` for a document about any set. Keep a tree to the lines that show the layout.

**Icons are shown, not listed.** A page that needs to show icons draws them from the sprite of the set. A table of icon names goes stale with the next icon.

### 14. Callouts

Use `<Callout>` for asides that interrupt the reading flow but are important enough to highlight. Types and intent:

- **`<Callout type="info">`**: helpful but non-essential context, such as a tip, an alternative or a related page.
- **`<Callout type="warning">`**: real gotchas, such as a file the source lint refuses, a name that breaks consumers, or an address the font is loaded from.
- **`<Callout name="…" />`**: named callouts reuse content from `packages/site/content/callouts/`.

**Good warning:** "A stroke is not drawn by the font. `pnpm icons:lint:source` refuses a file with a `stroke`: outline the stroke in the design tool, and export again."

**Bad warning (this should be prose, not a callout):** "Note that the prefix can be customized."

**No `title` attribute.** `<Callout>` has no `title` prop and ignores one. Titles like "Note", "Important", and "Key Concept" add nothing; when a callout needs a lead-in, start its body with a bold phrase.

**No emoji** in headings or prose, no emoji as a substitute for a callout (`⚠️`), and no `✅` or `❌` as the marker of an entry.

**Best practices are two lists.** After the intro sentence of the section ([§2](#2-every-heading-earns-its-paragraph)), the entries of a `## Best practices` section are a bullet list of what to do, then the sentence "Avoid the habits that undo this:" and a bullet list of what to avoid, whose entries start with "Do not". Each item is a bold imperative phrase, a colon, and one or two sentences that name a setting, a file or a command.

```mdx
## Best practices

The build draws what the source holds. These practices cover what to export and how to name it.

- **Export on the frame:** a file whose `viewBox` is not the frame of the set is refused by `pnpm icons:lint:source`.

Avoid the habits that undo this:

- **Do not fix a file in `svgs/`:** the next build writes it again from `source/`.
```

### 15. Troubleshooting entries

Each entry of `## Troubleshooting` is a `###` heading that names the symptom in a few words, followed by the exact message in backticks, the cause, and the fix in imperative voice.

**Good:**

```mdx
### Icon shows as a square

The page shows an empty square in place of the icon, and the browser logs a `404` for the `.woff2` file. The stylesheet loads the font from its own folder, and the font was not copied with it. Copy the whole `icons/` folder, or set `$<font>-font-dir` in Sass.
```

**Bad:**

```mdx
### "404 Not Found" Error When Loading Your Icon Fonts

You may run into this error if something is wrong with your setup. Check your files.
```

Quote the message as the tool prints it, so a search for the error finds the page. Keep the heading to the symptom; the full message belongs in the body. Write the variable parts of a message as placeholders in angle brackets. A problem without a message, such as an icon in the wrong color, starts with the symptom as the reader sees it.

### 16. Cross-references

**Within the site.** Use the `[[docsref:/path/to/doc]]` token inside Markdown link syntax. The build resolves it against the configured docs path at compile time, so the link stays correct across deployments. Append a heading slug to link a sub-section:

```mdx
[the icon font]([[docsref:/use-in-project/icon-font]])
[the settings]([[docsref:/getting-started/build-system#configuration]])
```

**Within the same doc.** Use plain `#anchor` links. IDs are auto-generated from heading text by slugifying (`### Code points` becomes `#code-points`). Don't create two headings with the same slug in a doc, and re-verify anchors after renaming a heading: internal links to the old slug silently break.

**Configuration values.** `[[config:<key>]]` prints a value of `packages/site/config.yml`, in prose, links, and code blocks: `[[config:currentVersion]]`, `[[config:repo]]`.

**Other Chassis docs.** Use a standard Markdown link to the page on chassis-ui.com. Chassis CSS owns `svg-icon()` and `$icon-url-prefix`, Chassis React owns `Icon` and `IconProvider`, and Chassis Assets owns the names of the icons on iOS and Android. Link their docs rather than describing them here.

**External references.** Standard Markdown links. Prefer MDN, the specifications and the official docs of Sass, npm, SVGO and Figma over blog posts.

**Repository files.** From a site page, link the file on GitHub with `[[config:repo]]`. From a repository doc, use a relative link: `[docs/architecture.md](docs/architecture.md)`.

---

## Code blocks and doc length

### 17. Fenced code language tags

Always tag fenced code blocks with the source language. Untagged blocks display without highlighting. Conventions in use:

| Block kind      | Language tag             | Notes                                                   |
| --------------- | ------------------------ | ------------------------------------------------------- |
| Shell commands  | ` ```bash `              | Clone, build and copy commands. No `$` prompt.          |
| Configuration   | ` ```json `              | The `chassis.build` block, `chassis.checks.json`.       |
| Directory trees | ` ```text `              | Anything that is not code.                              |
| Markup          | ` ```html `              | The font class, the sprite, an `<img>`.                 |
| Stylesheets     | ` ```css ` / ` ```scss ` | `css` for output and plain CSS, `scss` for Sass.        |
| SVG             | ` ```svg `               | A source file, a file of `svgs/`.                       |
| React           | ` ```jsx `               | `Icon` and `IconProvider` of Chassis React.             |
| JavaScript      | ` ```js `                | Bundler configuration, the build.                       |
| CI workflows    | ` ```yaml `              |                                                         |
| MDX/Markdown    | ` ```mdx ` / ` ```md `   | When this guide or a meta-doc shows authoring patterns. |

### 18. Output vs hand-written code

A doc shows two kinds of blocks, and the reader must be able to tell them apart. Introduce each block with a sentence that says which it is: "The build writes…" for output, "Use…" or "Add…" for code the reader writes.

- **Output** is a file or a part of a file that the build wrote, copied as it is ([§7](#7-names-are-facts-icons-are-examples)). It can be partial: show the lines under discussion.
- **Usage code** is standalone: a reader copying it into a page with the files in place should see the icon. Use the paths of the package, or say where the files were copied to.
- **Configuration** shows the key inside its parent, and the intro sentence names the file: "In `chassis.build` of `packages/icons/package.json`:".
- **Commands** are run before they are written. A comment after a command says what it does, not what it should do.

When a setting changes the output, show the setting, then the output, in that order. Commands run from the repository root unless the sentence before them says otherwise. Prefer working code over comment-only placeholders.

### 19. Inline code vs code blocks

- **Inline backticks** for single identifiers, icon names, file names, paths, and short literal values. `` `--only font` ``, `` `svgs/` ``, `` `currentcolor` ``.
- **Fenced blocks** for anything that spans multiple lines, or for single lines that the reader will copy and run.

If a one-liner is _demonstrating syntax_ rather than something to copy, prefer an inline-code form. If it's _something to run_, prefer a fenced block.

### 20. Document length and splitting

A doc is too long when a `##` section has more than three `###` sub-sections on distinct topics, the doc exceeds ~600 lines of MDX, or the ToC requires scrolling to see all top-level sections. Split along the natural axis: **by concern** (the commands, the configuration and the release of the build become sibling docs) or **by way of use** (the font, the sprite, the files, Sass). Sections that are lists are the exception: the entries of `## Troubleshooting` and the settings of the configuration are scanned, not read, so many `###` sub-sections there are fine. Don't split for size alone: a 700-line doc that reads end-to-end beats three 200-line stubs that force the reader to chase context across pages.

---

## Lint checklist

Before opening a PR with a doc change, verify:

- [ ] **Voice check ([§1](#1-voice-by-doc-type)):**
  - _Icon design docs, `docs/architecture.md`, changeset entries:_ No second-person or first-person plural in prose. Quick check: `grep -niE "\b(you|your|yours|we|our|ours|us)\b" <file>` returns nothing relevant.
  - _Getting-started and use-in-project docs, `README.md`, `CONTRIBUTING.md`:_ "you/your" are acceptable; confirm "we/us/our" are absent.
- [ ] Every `##`/`###`/`####` heading has an explanatory sentence before the next block, `## Best practices`, `## Troubleshooting` and `## Next steps` included ([§2](#2-every-heading-earns-its-paragraph)).
- [ ] No container phrases ("The following…", "Below is…") and no bold label paragraphs ([§2](#2-every-heading-earns-its-paragraph)).
- [ ] No marketing adjectives and no generic advice in prose ([§3](#3-describe-behavior-not-benefits)).
- [ ] Project vocabulary: set, icon, name, style, pair, frame, source, output, prefix, code point, registry, step, the build ([§5](#5-vocabulary)).
- [ ] The default set, its font name and its prefix are examples, not definitions ([§5](#5-vocabulary), [§8](#8-counts-versions-and-configuration)).
- [ ] Icon names use the form of their context, and placeholders use angle brackets ([§6](#6-icon-names-and-code-references-in-prose)).
- [ ] Every path, file name, command, option, setting and icon name exists as written, and every block of output is copied from a build ([§7](#7-names-are-facts-icons-are-examples)).
- [ ] Every statement about what the build does was checked by running it ([§7](#7-names-are-facts-icons-are-examples)).
- [ ] No counts, no code points of particular icons, no file sizes, no version typed by hand, and no planned feature described as present ([§7](#7-names-are-facts-icons-are-examples), [§8](#8-counts-versions-and-configuration)).
- [ ] Frontmatter `description` is under 160 characters and describes the page ([§9](#9-frontmatter)).
- [ ] A new page has an entry in `packages/site/data/sidebar.yml` whose slug is its file name ([§9](#9-frontmatter)).
- [ ] Section order matches the doc type ([§10](#10-standard-section-order)).
- [ ] A change to one use-in-project doc was considered for the others ([§10](#10-standard-section-order)).
- [ ] Heading levels don't skip (`##` → `####`) ([§11](#11-heading-hierarchy)).
- [ ] All `##` / `###` headings under ~25 characters, sentence case, no trailing punctuation, no `&` ([§12](#12-heading-length-case-and-punctuation)).
- [ ] Every table of a site page is wrapped in `<CxTable>` ([§13](#13-tables-and-trees)).
- [ ] Callouts have no `title`, there is no emoji, and the entries of `## Best practices` are two bullet lists ([§14](#14-callouts)).
- [ ] Troubleshooting entries name the symptom, quote the message, give the cause and the fix ([§15](#15-troubleshooting-entries)).
- [ ] Cross-references use `[[docsref:/...]]` for internal links and Markdown for external ([§16](#16-cross-references)).
- [ ] All fenced code blocks have a language tag ([§17](#17-fenced-code-language-tags)).
- [ ] `pnpm lint:prettier` and `pnpm spellcheck` pass, and for a site page `pnpm site:build` too.

---

## What's not in this guide (yet)

These conventions haven't been formalized here. To propose one: write the section, apply it to at least one doc in the same PR as evidence, and link contested proposals in an issue for discussion before merging.

Currently unwritten:

- The pages of `getting-started/`, `icon-design/` and `use-in-project/` themselves. Their section orders in [§10](#10-standard-section-order) are a plan, and the first page of each section may correct it.
- The text of an icon page, when the pages come from the output of the build and no longer from committed files.
- Screenshot conventions for Figma: when to embed images, alt text rules, where to store source files.
- Conventions for changeset entries beyond what [CONTRIBUTING.md](.github/CONTRIBUTING.md#changesets) says.

---

## Appendix A: MDX component reference

The docs site uses two MDX components and two text tokens. The components come from [`@chassis-ui/docs`](https://www.npmjs.com/package/@chassis-ui/docs) and are imported automatically; a doc needs no `import` line for them.

### `<CxTable>`

Wraps a Markdown table in a responsive scroll container and gives the table its styling. Use for every table of a site page. Write the table directly inside the tags, with no blank line between a tag and the table.

| Prop    | Type     | Default | Purpose                                                        |
| ------- | -------- | ------- | -------------------------------------------------------------- |
| `class` | `string` | `table` | CSS class applied to the inner `<table>` by the rehype plugin. |

### `<Callout>`

Highlighted aside. See [§14](#14-callouts) for when to use each type.

| Prop     | Type                              | Default  | Purpose                                                                                              |
| -------- | --------------------------------- | -------- | ---------------------------------------------------------------------------------------------------- |
| `type`   | `'info' \| 'warning' \| 'danger'` | `'info'` | Visual treatment.                                                                                    |
| `name`   | `string`                          | (none)   | Render a shared callout from `packages/site/content/callouts/<name>.md`. Overrides the slot content. |
| `class`  | `string`                          | (none)   | Classes added to the callout wrapper.                                                                |
| _(slot)_ | MDX content                       | (none)   | Inline callout body. Ignored when `name` is set.                                                     |

### Text tokens

Replaced at build time in prose, link targets, code blocks, and frontmatter.

| Token                 | Replaced with                                                | Example                                             |
| --------------------- | ------------------------------------------------------------ | --------------------------------------------------- |
| `[[docsref:/<path>]]` | The URL of a doc of this site, with an optional `#anchor`    | `[[docsref:/use-in-project/icon-font#basic-usage]]` |
| `[[config:<key>]]`    | A value of `packages/site/config.yml`; nested keys with dots | `[[config:currentVersion]]`                         |

### Other components

`@chassis-ui/docs` also provides `<Icon>`, which the pages of this site draw icons with, and `<Example>`, `<ResizableExample>`, `<ScssDocs>`, `<JsDocs>`, `<AddedIn>`, `<DeprecatedIn>`, and `<InFigma>`, which the Chassis CSS docs use. Their props are in Appendix A of the [chassis-css guide](https://github.com/chassis-ui/css/blob/main/WRITING.md). Propose a convention here ([What's not in this guide](#whats-not-in-this-guide-yet)) before the first use on a documentation page.
