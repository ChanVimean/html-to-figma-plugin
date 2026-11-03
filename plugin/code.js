figma.showUI(__html__, { width: 480, height: 800, themeColors: true });

const FONT_FALLBACK = { family: "Inter", style: "Regular" };
const fontCache = new Set();

async function useFont(requested) {
  const key = `${requested.family}/${requested.style}`;
  if (fontCache.has(key)) return requested;
  try {
    await figma.loadFontAsync(requested);
    fontCache.add(key);
    return requested;
  } catch (_) {
    const fallbackKey = `${FONT_FALLBACK.family}/${FONT_FALLBACK.style}`;
    if (!fontCache.has(fallbackKey)) {
      await figma.loadFontAsync(FONT_FALLBACK);
      fontCache.add(fallbackKey);
    }
    return FONT_FALLBACK;
  }
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}
function num(v, fallback = 0) {
  const n = typeof v === "number" ? v : parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}

function cssColor(value) {
  if (!value || value === "transparent") return null;
  const hex = String(value)
    .trim()
    .match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    let h = hex[1];
    if (h.length === 3)
      h = h
        .split("")
        .map((x) => x + x)
        .join("");
    return {
      color: {
        r: parseInt(h.slice(0, 2), 16) / 255,
        g: parseInt(h.slice(2, 4), 16) / 255,
        b: parseInt(h.slice(4, 6), 16) / 255,
      },
      opacity: 1,
    };
  }
  const rgb = String(value).match(
    /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)/i,
  );
  if (!rgb) return null;
  let a = rgb[4] == null ? 1 : parseFloat(rgb[4]);
  if (rgb[4] && rgb[4].includes("%")) a /= 100;
  return {
    color: {
      r: clamp(num(rgb[1]) / 255, 0, 1),
      g: clamp(num(rgb[2]) / 255, 0, 1),
      b: clamp(num(rgb[3]) / 255, 0, 1),
    },
    opacity: clamp(a, 0, 1),
  };
}

function paints(value) {
  const c = cssColor(value);
  return c ? [{ type: "SOLID", color: c.color, opacity: c.opacity }] : [];
}

function mapAxisAlign(value) {
  if (value === "center") return "CENTER";
  if (value === "flex-end" || value === "end") return "MAX";
  if (value === "space-between") return "SPACE_BETWEEN";
  return "MIN";
}
function mapCounterAlign(value) {
  if (value === "center") return "CENTER";
  if (value === "flex-end" || value === "end") return "MAX";
  if (value === "baseline") return "BASELINE";
  return "MIN";
}

function applyEffects(node, style) {
  const shadow = style.boxShadow;
  if (!shadow || shadow === "none") return;
  const layers = shadow.split(/,(?![^(]*\))/);
  const effects = [];
  for (const layer of layers) {
    const colorMatch = layer.match(/rgba?\([^)]+\)|#[0-9a-f]{3,8}/i);
    const c = colorMatch
      ? cssColor(colorMatch[0])
      : cssColor("rgba(0,0,0,.18)");
    const lengths = layer.match(/-?\d*\.?\d+px/g) || [];
    if (!c || lengths.length < 2) continue;
    effects.push({
      type: "DROP_SHADOW",
      color: { ...c.color, a: c.opacity },
      offset: { x: num(lengths[0]), y: num(lengths[1]) },
      radius: Math.max(0, num(lengths[2])),
      spread: num(lengths[3]),
      visible: true,
      blendMode: "NORMAL",
    });
  }
  if (effects.length) node.effects = effects;
}

function applyAppearance(node, style = {}) {
  node.fills = paints(style.backgroundColor);
  const borderWidth = num(style.borderTopWidth);
  const borderPaint = paints(style.borderTopColor);
  if (borderWidth > 0 && borderPaint.length) {
    node.strokes = borderPaint;
    node.strokeWeight = borderWidth;
  }

  if (node.type === "FRAME") {
    const radii = [
      num(style.borderTopLeftRadius),
      num(style.borderTopRightRadius),
      num(style.borderBottomRightRadius),
      num(style.borderBottomLeftRadius),
    ];
    try {
      if (radii.every((v) => v === radii[0])) node.cornerRadius = radii[0];
      else {
        node.topLeftRadius = radii[0];
        node.topRightRadius = radii[1];
        node.bottomRightRadius = radii[2];
        node.bottomLeftRadius = radii[3];
      }
    } catch (_) {}
    node.clipsContent =
      style.overflow === "hidden" || style.overflow === "clip";
  }
  if (style.opacity !== undefined)
    node.opacity = clamp(num(style.opacity, 1), 0, 1);
  applyEffects(node, style);
}

function configureAutoLayout(frame, layout, data) {
  if (!layout || !["HORIZONTAL", "VERTICAL"].includes(layout.mode)) {
    frame.layoutMode = "NONE";
    return;
  }

  frame.layoutMode = layout.mode;
  frame.primaryAxisSizingMode = "FIXED";
  frame.counterAxisSizingMode = "FIXED";
  frame.primaryAxisAlignItems = layout.primaryAlign || "MIN";
  frame.counterAxisAlignItems = layout.counterAlign || "MIN";
  frame.itemSpacing = Math.max(0, num(layout.gap));
  frame.paddingTop = Math.max(0, num(layout.paddingTop));
  frame.paddingRight = Math.max(0, num(layout.paddingRight));
  frame.paddingBottom = Math.max(0, num(layout.paddingBottom));
  frame.paddingLeft = Math.max(0, num(layout.paddingLeft));

  try {
    frame.layoutWrap = layout.wrap ? "WRAP" : "NO_WRAP";
    if (layout.wrap)
      frame.counterAxisSpacing = Math.max(
        0,
        num(layout.rowGap, num(layout.gap)),
      );
  } catch (_) {}

  try {
    if (layout.primarySizing === "HUG") frame.primaryAxisSizingMode = "AUTO";
    if (layout.counterSizing === "HUG") frame.counterAxisSizingMode = "AUTO";
  } catch (_) {}

  try {
    if (data.minWidth != null) frame.minWidth = data.minWidth;
    if (data.maxWidth != null) frame.maxWidth = data.maxWidth;
    if (data.minHeight != null) frame.minHeight = data.minHeight;
    if (data.maxHeight != null) frame.maxHeight = data.maxHeight;
  } catch (_) {}
}

function setPositionAndSizing(node, data, parentData) {
  const parentLayout = parentData && parentData.layout;
  const inAutoLayout =
    parentLayout && ["HORIZONTAL", "VERTICAL"].includes(parentLayout.mode);

  if (inAutoLayout && data.positioning !== "ABSOLUTE") {
    try {
      node.layoutPositioning = "AUTO";
      node.layoutSizingHorizontal =
        data.sizing?.horizontal ||
        (data.textSizing === "HUG" ? "HUG" : "FIXED");
      node.layoutSizingVertical =
        data.sizing?.vertical || (data.textSizing === "HUG" ? "HUG" : "FIXED");
    } catch (_) {}
  } else {
    if (inAutoLayout && data.positioning === "ABSOLUTE") {
      try {
        node.layoutPositioning = "ABSOLUTE";
      } catch (_) {}
    }
    node.x = num(data.x);
    node.y = num(data.y);
  }
}

async function createText(data, parent, parentData) {
  const text = figma.createText();
  text.name = data.name || "Text";
  const style = data.style || {};
  const requested = {
    family: style.fontFamily || "Inter",
    style:
      style.fontStyle === "italic"
        ? num(style.fontWeight, 400) >= 600
          ? "Bold Italic"
          : "Italic"
        : num(style.fontWeight, 400) >= 700
          ? "Bold"
          : num(style.fontWeight, 400) >= 600
            ? "Semi Bold"
            : num(style.fontWeight, 400) >= 500
              ? "Medium"
              : "Regular",
  };
  text.fontName = await useFont(requested);
  text.characters = data.text || "";
  text.fontSize = Math.max(1, num(data.fontSize, num(style.fontSize, 16)));
  text.fills = paints(style.color);
  const align = String(style.textAlign || "left").toUpperCase();
  if (["LEFT", "CENTER", "RIGHT", "JUSTIFIED"].includes(align))
    text.textAlignHorizontal = align;
  const lineHeight = num(style.lineHeight);
  if (lineHeight > 0) text.lineHeight = { unit: "PIXELS", value: lineHeight };
  const letterSpacing = num(style.letterSpacing);
  if (Number.isFinite(letterSpacing))
    text.letterSpacing = { unit: "PIXELS", value: letterSpacing };
  const isHug = data.textSizing === "HUG" || data.sizing?.horizontal === "HUG";
  // Set the measured box first, then let Figma apply the requested text resizing mode.
  text.resize(
    Math.max(1, num(data.width, 100)),
    Math.max(1, num(data.height, 24)),
  );
  text.textAutoResize = isHug ? "WIDTH_AND_HEIGHT" : "HEIGHT";
  parent.appendChild(text);
  setPositionAndSizing(text, data, parentData);
  return text;
}

async function createNode(data, parent, parentData) {
  if (!data || data.hidden) return null;
  if (data.type === "TEXT") return createText(data, parent, parentData);

  const frame = figma.createFrame();
  frame.name = data.name || "Frame";
  frame.resize(
    Math.max(1, num(data.width, 1)),
    Math.max(1, num(data.height, 1)),
  );
  frame.fills = [];
  frame.clipsContent = false;
  applyAppearance(frame, data.style);
  configureAutoLayout(frame, data.layout, data);
  parent.appendChild(frame);
  setPositionAndSizing(frame, data, parentData);

  for (const child of data.children || []) {
    await createNode(child, frame, data);
  }
  return frame;
}

figma.ui.onmessage = async (msg) => {
  if (msg.type !== "generate") return;
  let root = null;
  try {
    await useFont(FONT_FALLBACK);
    root = figma.createFrame();
    root.name = msg.name || "HTML Design";
    root.resize(
      Math.max(1, num(msg.width, 1440)),
      Math.max(1, num(msg.height, 900)),
    );
    root.layoutMode = "NONE";
    root.fills = paints(msg.backgroundColor);
    root.clipsContent = false;
    figma.currentPage.appendChild(root);

    const rootData = { layout: { mode: "NONE" } };
    for (const child of msg.children || [])
      await createNode(child, root, rootData);

    figma.currentPage.selection = [root];
    figma.viewport.scrollAndZoomIntoView([root]);
    figma.ui.postMessage({
      type: "success",
      message: "Native Figma design generated.",
    });
  } catch (error) {
    console.error(error);
    if (root && root.parent) root.remove();
    figma.ui.postMessage({
      type: "error",
      message: error.message || "Generation failed.",
    });
  }
};
