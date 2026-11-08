// =========================================================
// BRAND LOGOS
//
// Maps the merchant written before the first colon in an
// expense description ("Hannaford: groceries") to a logo
// bundled with the app. Nothing is fetched or sent anywhere.
//
// To add a brand: put its logo in src/assets/brands/,
// import it below and add one entry. Names and aliases are
// matched ignoring case, spaces and punctuation, so
// "TJ Maxx", "t.j. maxx" and "tjmaxx" are the same.
// =========================================================

import chickfila from "../assets/brands/chickfila.png";
import dunkin from "../assets/brands/dunkin.svg";
import fivebelow from "../assets/brands/fivebelow.svg";
import hannaford from "../assets/brands/hannaford.svg";
import marshalls from "../assets/brands/marshalls.svg";
import starbucks from "../assets/brands/starbucks.png";
import tacobell from "../assets/brands/tacobell.svg";
import texasroadhouse from "../assets/brands/texasroadhouse.png";
import tjmaxx from "../assets/brands/tjmaxx.svg";


const BRANDS = [
  { logo: chickfila, names: ["Chick-fil-A", "Chik fil a", "Chickfila", "Chick fila"] },
  { logo: dunkin, names: ["Dunkin", "Dunkin'", "Dunkin Donuts", "Dunks", "Dunkies"] },
  { logo: fivebelow, names: ["Five Below", "5 Below"] },
  { logo: hannaford, names: ["Hannaford", "Hannafords", "Haniford", "Hanniford", "Hannaford Supermarket"] },
  { logo: marshalls, names: ["Marshalls", "Marshall's"] },
  { logo: starbucks, names: ["Starbucks", "Starbuck's", "Sbux"] },
  { logo: tacobell, names: ["Taco Bell"] },
  { logo: texasroadhouse, names: ["Texas Roadhouse"] },
  { logo: tjmaxx, names: ["TJ Maxx", "TJMaxx", "T.J. Maxx", "TJ Max"] },
];


function normalizeBrandName(name) {

  return String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

}


const LOGO_BY_NAME =
  new Map(
    BRANDS.flatMap(
      ({ logo, names }) =>
        names.map(
          (name) => [
            normalizeBrandName(name),
            logo,
          ]
        )
    )
  );


// Returns the logo URL for the merchant before the first
// colon, or null when there is no colon or no known brand.
export function getBrandLogo(description) {

  const text =
    String(description ?? "");

  const colonIndex =
    text.indexOf(":");

  if (colonIndex === -1) {
    return null;
  }

  return (
    LOGO_BY_NAME.get(
      normalizeBrandName(
        text.slice(0, colonIndex)
      )
    ) ?? null
  );

}
