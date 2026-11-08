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


// Descriptions repeat across renders; match each one once.
const logoCache =
  new Map();


// Returns the logo URL for an expense description, or null
// when no known brand is mentioned (caller shows the
// category icon instead).
export function getBrandLogo(description) {

  const key =
    String(description ?? "");

  if (!logoCache.has(key)) {

    const brand =
      findBrand(key);

    logoCache.set(
      key,
      (brand && LOGO_BY_ID.get(brand.id)) ?? null
    );

  }

  return logoCache.get(key);

}
