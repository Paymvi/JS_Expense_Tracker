// =========================================================
// BRAND LOGOS
//
// Connects the brand registry (brands.js) to the logo files
// bundled in src/assets/brands/<id>.png|svg. Everything is
// local: nothing is fetched and no expense data leaves the
// device. See brands.js for how to add a brand.
// =========================================================

import {
  findBrand,
} from "./brands";


// "../assets/brands/walmart.png" -> bundled URL
const LOGO_FILES =
  import.meta.glob(
    "../assets/brands/*.{png,svg}",
    {
      eager: true,
      import: "default",
    }
  );


const LOGO_BY_ID =
  new Map(
    Object.entries(LOGO_FILES).map(
      ([path, url]) => [
        path.split("/").pop().replace(/\.(png|svg)$/, ""),
        url,
      ]
    )
  );


// Per-brand display tweaks, for logos the shared sizing rule
// gets wrong.
//   scale       optical size (1 = default)
//   background  chip color, for marks drawn on their own color
//   monogram    show these initials (in `color`, taken from the
//               logo) instead of the image: for wordmarks 8x+
//               wider than tall, which shrink to an unreadable
//               line in a round chip and have no compact mark.
const LOGO_STYLE = {
  // Solid filled tiles read heavier than open marks.
  aldi: { scale: 0.92 },
  boxlunch: { scale: 0.92 },
  dollargeneral: { scale: 0.92 },
  homedepot: { scale: 0.92 },
  microsoft: { scale: 0.92 },
  miniso: { scale: 0.92 },
  tacobell: { scale: 0.92 },
  temu: { scale: 0.92 },
  // Brand color behind the mark, as in the brand's app icon.
  walmart: { background: "#0071dc" },
  // Thin strokes need a little more size.
  bathandbodyworks: { scale: 1.1 },

  americaneagle: { monogram: "AE", color: "#383838" },
  barnesandnoble: { monogram: "B&N", color: "#3c3c3c" },
  brooks: { monogram: "B", color: "#0858b8" },
  dollartree: { monogram: "DT", color: "#089848" },
  familydollar: { monogram: "FD", color: "#e84838" },
  hobbylobby: { monogram: "HL", color: "#e84828" },
  marketbasket: { monogram: "MB", color: "#e81838" },
  officedepot: { monogram: "OD", color: "#b81818" },
  traderjoes: { monogram: "TJ", color: "#d81848" },
};


// Descriptions repeat across renders; match each one once.
const logoCache =
  new Map();


// Returns { src, scale?, background?, monogram?, color? } for an expense
// description, or null when no known brand is mentioned
// (caller shows the category icon instead).
export function getBrandLogo(description) {

  const key =
    String(description ?? "");

  if (!logoCache.has(key)) {

    const brand =
      findBrand(key);

    const src =
      brand && LOGO_BY_ID.get(brand.id);

    logoCache.set(
      key,
      src
        ? { src, ...LOGO_STYLE[brand.id] }
        : null
    );

  }

  return logoCache.get(key);

}
