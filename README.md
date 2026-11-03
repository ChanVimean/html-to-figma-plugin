<div align="center">

# HTML to Figma

**Turn HTML and CSS into editable native Figma layers.**

A small, local Figma development plugin for translating browser-rendered layouts into Figma frames, text layers, fills, borders, and Auto Layout where supported.

[Download plugin ZIP](downloads/html-to-figma-plugin.zip) · [Install in Figma](#install-in-figma) · [Troubleshooting](#troubleshooting)

</div>

---

## What’s included

| File | Purpose |
|---|---|
| `plugin/manifest.json` | Tells Figma how to load the development plugin |
| `plugin/code.js` | Creates editable native Figma nodes |
| `plugin/ui.html` | Plugin interface, HTML/CSS input, preview, and layout measurement |

This is the **UI and layout-only** build. It does not include prototype navigation wiring.

## Quick start

Choose either way to get the files.

### Option A — Download the ZIP

1. [Download the three-file plugin ZIP](downloads/html-to-figma-plugin.zip).
2. Extract it anywhere on your computer.
3. Keep `manifest.json`, `code.js`, and `ui.html` together in the same folder.
4. Follow the [Figma installation steps](#install-in-figma).

### Option B — Clone with Git

Open Terminal on macOS, or Git Bash / PowerShell on Windows:

```bash
git clone <YOUR-REPOSITORY-URL>
cd <YOUR-REPOSITORY-FOLDER>
```

Then locate the `plugin` folder. It should contain exactly these three files:

```text
plugin/
├── manifest.json
├── code.js
└── ui.html
```

> Replace `<YOUR-REPOSITORY-URL>` with the HTTPS or SSH URL of the Git repository. If you downloaded the source ZIP instead, extract it and open the `plugin` folder.

---

## Install in Figma

You only need **Figma Desktop** to import and run a local development plugin.

### macOS

1. Download and install [Figma for macOS](https://www.figma.com/downloads/) if you have not already.
2. Open **Figma Desktop** and open any design file.
3. In the top menu, open **Plugins → Development → Import plugin from manifest…**.
4. In the file picker, navigate to the folder containing the three plugin files.
5. Select **`manifest.json`** and click **Open**.
6. Run it from **Plugins → Development → HTML to Figma**.

### Windows

1. Download and install [Figma for Windows](https://www.figma.com/downloads/) if you have not already.
2. Open **Figma Desktop** and open any design file.
3. Open **Plugins → Development → Import plugin from manifest…**.
4. Browse to the folder containing the three plugin files.
5. Select **`manifest.json`** and click **Open**.
6. Run it from **Plugins → Development → HTML to Figma**.

> **Important:** Import the manifest from the extracted plugin folder. Do not select the ZIP file itself. Keep all three files together; Figma loads `code.js` and `ui.html` using the paths declared in the manifest.

### After changing the code

Save your edited files, then return to Figma and run the development plugin again. If an older instance is still open, close it first. If Figma does not pick up the changes, use the development plugin menu to reload it or re-import the manifest.

---

## Use the plugin

1. Open **HTML to Figma** from Figma’s Development plugins.
2. Paste your markup into the **HTML** field.
3. Paste your styles into the **CSS** field.
4. Click **Preview** to check the browser rendering.
5. Click **Generate Figma** to create editable layers on the current page.

The plugin creates a top-level frame named **HTML Design**. Your generated elements appear inside it.

### A tiny test

**HTML**

```html
<div class="card">
  <span class="badge">NEW</span>
  <h1>Welcome back</h1>
  <p>Your workspace is ready.</p>
  <button class="button">Continue</button>
</div>
```

**CSS**

```css
body {
  margin: 0;
  background: #f3f4f6;
  font-family: Inter, Arial, sans-serif;
}

.card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
  margin: 48px;
  padding: 24px;
  width: 420px;
  background: white;
  border-radius: 16px;
}

h1 {
  margin: 0;
  color: #111827;
  font-size: 28px;
}

p {
  margin: 0;
  color: #6b7280;
  font-size: 15px;
}

.badge {
  color: #2563eb;
  font-size: 12px;
  font-weight: 700;
}

.button {
  padding: 12px 20px;
  color: white;
  background: #2563eb;
  border: 0;
  border-radius: 8px;
}
```

---

## What it converts

The plugin measures the rendered HTML in an embedded browser preview and uses that information to create native Figma layers.

Supported styling includes common layout and appearance properties such as:

- Flexbox rows and columns, gaps, alignment, and padding
- Measured-position layouts for CSS Grid
- Text content, font size, weight, color, alignment, and line height
- Background colors, borders, corner radii, opacity, and basic shadows
- A small set of common Tailwind utility classes

### Current limitations

This is a practical converter, not a complete browser-to-Figma engine.

- Complex CSS Grid layouts are positioned from measured browser coordinates; they are not rebuilt as native Figma Grid.
- Browser-specific effects, pseudo-elements, advanced selectors, and some CSS properties may not translate.
- Web fonts may fall back to Inter if the requested font family/style is unavailable in Figma.
- Responsive behavior is captured at the preview viewport size; it does not create responsive breakpoints in Figma.
- Some text wrapping and sizing may need manual adjustment after generation.
- Images, SVGs, and complex interactive elements may require separate handling.

For the cleanest results, start with a fixed desktop viewport, explicit widths for important columns, and simple Flexbox layouts.

---

## Troubleshooting

**“Import plugin from manifest” is missing**

Make sure you are using Figma Desktop and have a design file open. The browser version of Figma cannot load a local development plugin from your computer.

**Figma says it cannot find `code.js` or `ui.html`**

Check that all three files are in the same folder and that the manifest has not been moved away from them.

**The preview looks right, but the Figma output is misaligned**

The browser preview and Figma use different layout engines. Check parent widths, flex sizing, text wrapping, and nested layout constraints. Simplify the affected section and regenerate to isolate the problem.

**Text is clipped, wrapped strangely, or overlaps**

Try giving the text container a clear width, avoiding unnecessary nested inline elements, and checking the font is available in Figma. Some text may need manual resizing after generation.

**The plugin does not appear in the Development menu**

Re-import `manifest.json` using **Plugins → Development → Import plugin from manifest…** and check that the import completed successfully.

---

## Project structure

```text
html-to-figma/
├── README.md
├── downloads/
│   └── html-to-figma-plugin.zip
└── plugin/
    ├── manifest.json
    ├── code.js
    └── ui.html
```

## Local and privacy notes

The plugin runs as a local Figma development plugin. It does not require a Node server, npm install, or a separate backend. Your HTML and CSS are processed in the plugin's embedded preview and sent to the plugin code to build Figma layers.

---

<div align="center">

**Made for quick HTML/CSS layout experiments in Figma.**

</div>
