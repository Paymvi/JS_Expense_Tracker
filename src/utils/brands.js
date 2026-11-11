// =========================================================
// BRAND REGISTRY + MATCHING
//
// Pure data and logic (no asset imports) so it can be tested
// with `npm test`. Logos live in src/assets/brands/<id>.png
// (or .svg) and are wired up in brandLogos.js.
//
// ADDING A BRAND
//   1. Save the logo as src/assets/brands/<id>.png or .svg
//      and note its source + license in SOURCES.md there.
//   2. Add an entry below.
//
// ENTRY FIELDS
//   id       stable id, same as the logo file name
//   name     display name (docs/tests only)
//   kind     "merchant" (default) or "product". A product
//            logo is used only when no merchant matches.
//   aliases  distinctive names, matched anywhere in the
//            description on whole-word boundaries.
//   exact    ambiguous names ("Target", "Shell", "Gap") that
//            only count when they ARE the merchant part of
//            the description: everything before the first
//            ":" or "(", or the whole description.
//
// Matching ignores case, apostrophes (straight or curly),
// punctuation, hyphens and extra spaces. "&" reads as "and",
// "+" as "plus". There is no fuzzy matching: misspellings
// are listed explicitly.
//
// ASSUMPTION: "Platoes" is this app's shorthand for
// Plato's Closet.
// =========================================================

export const BRANDS = [

  // ---------------- Groceries ----------------
  { id: "walmart", name: "Walmart", aliases: ["Walmart", "Wal-Mart", "Wal Mart"] },
  { id: "traderjoes", name: "Trader Joe's", aliases: ["Trader Joe's", "Trader Joes", "Trader Joe"], exact: ["TJs", "TJ's"] },
  { id: "hannaford", name: "Hannaford", aliases: ["Hannaford", "Hannafords", "Haniford", "Hanniford"] },
  { id: "target", name: "Target", aliases: ["Target.com"], exact: ["Target"] },
  { id: "marketbasket", name: "Market Basket", aliases: ["DeMoulas Market Basket"], exact: ["Market Basket"] },
  { id: "aldi", name: "Aldi", aliases: ["Aldi", "Aldis"] },
  { id: "costco", name: "Costco", aliases: ["Costco"] },
  { id: "samsclub", name: "Sam's Club", aliases: ["Sam's Club", "Sams Club"] },
  { id: "bjs", name: "BJ's Wholesale Club", aliases: ["BJ's Wholesale", "BJs Wholesale"], exact: ["BJs", "BJ's"] },
  { id: "wholefoods", name: "Whole Foods Market", aliases: ["Whole Foods"] },
  { id: "shaws", name: "Shaw's", aliases: ["Shaw's", "Shaws"] },
  { id: "stopandshop", name: "Stop & Shop", aliases: ["Stop & Shop", "Stop and Shop", "Stop n Shop"] },
  { id: "pricechopper", name: "Price Chopper", aliases: ["Price Chopper"] },
  { id: "wegmans", name: "Wegmans", aliases: ["Wegmans"] },

  // ---------------- Food and coffee ----------------
  { id: "starbucks", name: "Starbucks", aliases: ["Starbucks", "Starbuck's", "Sbux"] },
  { id: "dunkin", name: "Dunkin'", aliases: ["Dunkin", "Dunkin'", "Dunkin Donuts", "Dunks"] },
  { id: "tacobell", name: "Taco Bell", aliases: ["Taco Bell"] },
  { id: "texasroadhouse", name: "Texas Roadhouse", aliases: ["Texas Roadhouse"] },
  { id: "wendys", name: "Wendy's", aliases: ["Wendy's", "Wendys"] },
  { id: "chickfila", name: "Chick-fil-A", aliases: ["Chick-fil-A", "Chick fil a", "Chik fil a", "Chik fila", "Chick fila", "Chikfila", "Chickfila"] },
  { id: "olivegarden", name: "Olive Garden", aliases: ["Olive Garden"] },
  { id: "dominos", name: "Domino's", aliases: ["Domino's", "Dominos", "Domino's Pizza", "Dominoes Pizza"], exact: ["Dominoes"] },
  { id: "chipotle", name: "Chipotle", aliases: ["Chipotle Mexican Grill"], exact: ["Chipotle"] },
  { id: "mcdonalds", name: "McDonald's", aliases: ["McDonald's", "McDonalds", "Mcds", "Mickey D's"] },
  { id: "burgerking", name: "Burger King", aliases: ["Burger King"], exact: ["BK"] },
  { id: "popeyes", name: "Popeyes", aliases: ["Popeyes", "Popeye's"] },
  { id: "kfc", name: "KFC", aliases: ["KFC", "Kentucky Fried Chicken"] },
  { id: "subway", name: "Subway", exact: ["Subway"] },
  { id: "panera", name: "Panera Bread", aliases: ["Panera", "Panera Bread"] },
  { id: "jerseymikes", name: "Jersey Mike's", aliases: ["Jersey Mike's", "Jersey Mikes"] },
  { id: "fiveguys", name: "Five Guys", aliases: ["Five Guys", "5 Guys"] },
  { id: "dairyqueen", name: "Dairy Queen", aliases: ["Dairy Queen"], exact: ["DQ"] },
  { id: "sonic", name: "Sonic", aliases: ["Sonic Drive-In"], exact: ["Sonic"] },
  { id: "pizzahut", name: "Pizza Hut", aliases: ["Pizza Hut"] },
  { id: "papajohns", name: "Papa Johns", aliases: ["Papa John's", "Papa Johns"] },
  { id: "littlecaesars", name: "Little Caesars", aliases: ["Little Caesars", "Little Caesar's", "Little Ceasars"] },
  { id: "applebees", name: "Applebee's", aliases: ["Applebee's", "Applebees"] },
  { id: "chilis", name: "Chili's", exact: ["Chili's", "Chilis"] },
  { id: "ihop", name: "IHOP", aliases: ["IHOP"] },
  { id: "dennys", name: "Denny's", aliases: ["Denny's", "Dennys"] },
  { id: "crumbl", name: "Crumbl", aliases: ["Crumbl", "Crumbl Cookies"] },

  // ---------------- Shopping ----------------
  { id: "tjmaxx", name: "T.J. Maxx", aliases: ["T.J. Maxx", "TJ Maxx", "TJMaxx", "TJ Max"] },
  { id: "marshalls", name: "Marshalls", aliases: ["Marshalls", "Marshall's"] },
  { id: "fivebelow", name: "Five Below", aliases: ["Five Below", "5 Below", "Fivebelow"] },
  { id: "hollister", name: "Hollister", aliases: ["Hollister", "Hollister Co"] },
  { id: "savers", name: "Savers", aliases: ["Savers Value Village", "Value Village"], exact: ["Savers"] },
  { id: "platoscloset", name: "Plato's Closet", aliases: ["Plato's Closet", "Platos Closet", "Platoes"] },
  { id: "miniso", name: "MINISO", aliases: ["Miniso"] },
  { id: "amazonprime", name: "Amazon Prime", aliases: ["Amazon Prime", "Prime Video"] },
  { id: "amazon", name: "Amazon", aliases: ["Amazon", "Amazon.com", "Amzn"] },
  { id: "ebay", name: "eBay", aliases: ["eBay"] },
  { id: "etsy", name: "Etsy", aliases: ["Etsy"] },
  { id: "temu", name: "Temu", aliases: ["Temu"] },
  { id: "ikea", name: "IKEA", aliases: ["IKEA"] },
  { id: "homegoods", name: "HomeGoods", aliases: ["HomeGoods"], exact: ["Home Goods"] },
  { id: "burlington", name: "Burlington", aliases: ["Burlington Coat Factory"], exact: ["Burlington"] },
  { id: "ross", name: "Ross Dress for Less", aliases: ["Ross Dress for Less"], exact: ["Ross"] },
  { id: "kohls", name: "Kohl's", aliases: ["Kohl's", "Kohls"] },
  { id: "oldnavy", name: "Old Navy", aliases: ["Old Navy"] },
  { id: "gap", name: "Gap", exact: ["Gap"] },
  { id: "hm", name: "H&M", aliases: ["H&M", "H and M"] },
  { id: "uniqlo", name: "Uniqlo", aliases: ["Uniqlo"] },
  { id: "americaneagle", name: "American Eagle", aliases: ["American Eagle"], exact: ["AE"] },
  { id: "forever21", name: "Forever 21", aliases: ["Forever 21", "Forever21"] },
  { id: "primark", name: "Primark", aliases: ["Primark"] },
  { id: "hottopic", name: "Hot Topic", exact: ["Hot Topic"] },
  { id: "boxlunch", name: "BoxLunch", aliases: ["BoxLunch"], exact: ["Box Lunch"] },
  { id: "bathandbodyworks", name: "Bath & Body Works", aliases: ["Bath & Body Works", "Bath and Body Works"], exact: ["BBW"] },
  { id: "ulta", name: "Ulta Beauty", aliases: ["Ulta", "Ulta Beauty"] },
  { id: "sephora", name: "Sephora", aliases: ["Sephora"] },
  { id: "dicks", name: "DICK'S Sporting Goods", aliases: ["Dick's Sporting Goods", "Dicks Sporting Goods"], exact: ["Dick's", "Dicks"] },
  { id: "rei", name: "REI", exact: ["REI"] },
  { id: "michaels", name: "Michaels", exact: ["Michaels", "Michael's"] },
  { id: "joann", name: "JOANN", aliases: ["Joann Fabrics", "Jo-Ann Fabrics"], exact: ["Joann", "Jo-Ann", "Joanns"] },
  { id: "hobbylobby", name: "Hobby Lobby", aliases: ["Hobby Lobby"] },
  { id: "dollartree", name: "Dollar Tree", aliases: ["Dollar Tree"] },
  { id: "dollargeneral", name: "Dollar General", aliases: ["Dollar General"] },
  { id: "familydollar", name: "Family Dollar", aliases: ["Family Dollar"] },
  { id: "goodwill", name: "Goodwill", exact: ["Goodwill"] },
  { id: "salvationarmy", name: "The Salvation Army", aliases: ["Salvation Army"] },
  { id: "barnesandnoble", name: "Barnes & Noble", aliases: ["Barnes & Noble", "Barnes and Noble"] },
  { id: "staples", name: "Staples", exact: ["Staples"] },
  { id: "officedepot", name: "Office Depot", aliases: ["Office Depot", "OfficeMax"] },
  { id: "bestbuy", name: "Best Buy", aliases: ["Best Buy"] },
  { id: "homedepot", name: "The Home Depot", aliases: ["Home Depot"] },
  { id: "lowes", name: "Lowe's", aliases: ["Lowe's", "Lowes"] },

  // Product brands (merchant matches win over these)
  { id: "nike", name: "Nike", kind: "product", aliases: ["Nike"] },
  { id: "adidas", name: "Adidas", kind: "product", aliases: ["Adidas"] },
  { id: "underarmour", name: "Under Armour", kind: "product", aliases: ["Under Armour", "Under Armor"] },
  { id: "newbalance", name: "New Balance", kind: "product", aliases: ["New Balance"] },
  { id: "brooks", name: "Brooks", kind: "product", aliases: ["Brooks Running"], exact: ["Brooks"] },
  { id: "asics", name: "ASICS", kind: "product", aliases: ["ASICS"] },
  { id: "converse", name: "Converse", kind: "product", exact: ["Converse"] },
  { id: "vans", name: "Vans", kind: "product", exact: ["Vans"] },
  { id: "crocs", name: "Crocs", kind: "product", aliases: ["Crocs"] },
  { id: "gatorade", name: "Gatorade", kind: "product", aliases: ["Gatorade"] },
  { id: "v8", name: "V8", kind: "product", aliases: ["V8"] },
  { id: "realgood", name: "Real Good Foods", kind: "product", aliases: ["Realgood", "Real Good Foods", "Real Good Food"] },
  { id: "david", name: "David protein bars", kind: "product", aliases: ["David bars", "David bar", "David protein"] },
  { id: "goodles", name: "Goodles", kind: "product", aliases: ["Goodles"] },

  // ---------------- Pharmacy, gas, convenience ----------------
  { id: "cvs", name: "CVS", aliases: ["CVS"] },
  { id: "walgreens", name: "Walgreens", aliases: ["Walgreens"] },
  { id: "riteaid", name: "Rite Aid", aliases: ["Rite Aid"] },
  { id: "shell", name: "Shell", aliases: ["Shell gas"], exact: ["Shell"] },
  { id: "mobil", name: "Mobil", aliases: ["Mobil"] },
  { id: "exxon", name: "Exxon", aliases: ["Exxon", "ExxonMobil"] },
  { id: "sunoco", name: "Sunoco", aliases: ["Sunoco"] },
  { id: "gulf", name: "Gulf", aliases: ["Gulf gas"], exact: ["Gulf"] },
  { id: "irving", name: "Irving", aliases: ["Irving Oil"], exact: ["Irving"] },
  { id: "cumberlandfarms", name: "Cumberland Farms", aliases: ["Cumberland Farms", "Cumbys", "Cumby's"] },
  { id: "circlek", name: "Circle K", aliases: ["Circle K"] },
  { id: "seveneleven", name: "7-Eleven", aliases: ["7-Eleven", "7 Eleven", "7-11", "Seven Eleven"] },
  { id: "speedway", name: "Speedway", exact: ["Speedway"] },
  { id: "wawa", name: "Wawa", aliases: ["Wawa"] },
  { id: "sheetz", name: "Sheetz", aliases: ["Sheetz"] },

  // ---------------- Digital services ----------------
  { id: "claude", name: "Claude", aliases: ["Claude Code", "Claude Pro", "Claude Max", "Claude AI", "Anthropic"], exact: ["Claude"] },
  { id: "chatgpt", name: "ChatGPT", aliases: ["ChatGPT", "Chat GPT", "ChatGPT Plus", "OpenAI"] },
  { id: "googleone", name: "Google One", aliases: ["Google One", "Google Storage"] },
  { id: "youtubepremium", name: "YouTube Premium", aliases: ["YouTube Premium", "YT Premium", "YouTube Music"] },
  { id: "spotify", name: "Spotify", aliases: ["Spotify"] },
  { id: "netflix", name: "Netflix", aliases: ["Netflix"] },
  { id: "disneyplus", name: "Disney+", aliases: ["Disney+", "Disney Plus", "DisneyPlus"] },
  { id: "hulu", name: "Hulu", aliases: ["Hulu"] },
  { id: "hbomax", name: "HBO Max", aliases: ["HBO Max", "HBO"], exact: ["Max"] },
  { id: "applemusic", name: "Apple Music", aliases: ["Apple Music"] },
  { id: "icloud", name: "iCloud", aliases: ["iCloud", "iCloud+"] },
  { id: "microsoft", name: "Microsoft", aliases: ["Microsoft", "Microsoft 365", "Office 365"] },
  { id: "xbox", name: "Xbox", aliases: ["Xbox", "Game Pass", "Xbox Game Pass"] },
  { id: "playstation", name: "PlayStation", aliases: ["PlayStation", "PS Plus", "PSN"] },
  { id: "nintendo", name: "Nintendo", aliases: ["Nintendo", "Nintendo Switch Online", "Nintendo eShop"] },
  { id: "steam", name: "Steam", aliases: ["Steam Wallet", "Steam Games"], exact: ["Steam"] },
  { id: "discord", name: "Discord Nitro", aliases: ["Discord Nitro"], exact: ["Discord"] },
  { id: "canva", name: "Canva", aliases: ["Canva", "Canva Pro"] },
  { id: "adobe", name: "Adobe", aliases: ["Adobe", "Adobe Creative Cloud", "Photoshop"] },
  { id: "github", name: "GitHub", aliases: ["GitHub", "GitHub Copilot"] },
  { id: "patreon", name: "Patreon", aliases: ["Patreon"] },

  // ---------------- Transportation and delivery ----------------
  { id: "ubereats", name: "Uber Eats", aliases: ["Uber Eats", "UberEats"] },
  { id: "uber", name: "Uber", aliases: ["Uber"] },
  { id: "lyft", name: "Lyft", aliases: ["Lyft"] },
  { id: "doordash", name: "DoorDash", aliases: ["DoorDash", "Door Dash", "DashPass"] },
  { id: "grubhub", name: "Grubhub", aliases: ["Grubhub", "Grub Hub"] },
  { id: "instacart", name: "Instacart", aliases: ["Instacart"] },

];


// ---------------------------------------------------------
// NORMALIZATION
// ---------------------------------------------------------

export function normalizeText(text) {

  return String(text ?? "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['‘’ʼ`´]/g, "")
    .replace(/&/g, " and ")
    .replace(/\+/g, " plus ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

}


// ---------------------------------------------------------
// INDEX (built once)
// ---------------------------------------------------------

// first token -> [{ brand, tokens }]
const ALIAS_INDEX =
  new Map();

// normalized merchant segment -> brand
const EXACT_INDEX =
  new Map();


for (const brand of BRANDS) {

  for (const alias of brand.aliases ?? []) {

    const tokens =
      normalizeText(alias).split(" ");

    const list =
      ALIAS_INDEX.get(tokens[0]) ?? [];

    list.push({ brand, tokens });

    ALIAS_INDEX.set(tokens[0], list);

    // A distinctive alias is also fine as the whole segment.
    EXACT_INDEX.set(tokens.join(" "), brand);

  }

  for (const alias of brand.exact ?? []) {
    EXACT_INDEX.set(normalizeText(alias), brand);
  }

}


// ---------------------------------------------------------
// MATCHING
// ---------------------------------------------------------

// The merchant part: everything before the first ":" or "(".
function merchantSegment(description) {

  return normalizeText(
    String(description ?? "").split(/[:(]/)[0]
  );

}


function compareCandidates(a, b) {

  // Earliest mention first, then the longest (most specific).
  return (
    a.start - b.start ||
    b.length - a.length
  );

}


// Returns the matching brand entry, or null.
export function findBrand(description) {

  const normalized =
    normalizeText(description);

  if (!normalized) {
    return null;
  }

  const tokens =
    normalized.split(" ");

  const candidates = [];


  const segment =
    merchantSegment(description);

  const exactBrand =
    EXACT_INDEX.get(segment);

  if (exactBrand) {

    candidates.push({
      brand: exactBrand,
      start: 0,
      length: segment.split(" ").length,
    });

  }


  tokens.forEach((token, start) => {

    for (const entry of ALIAS_INDEX.get(token) ?? []) {

      const matches =
        entry.tokens.every(
          (aliasToken, offset) =>
            tokens[start + offset] === aliasToken
        );

      if (matches) {

        candidates.push({
          brand: entry.brand,
          start,
          length: entry.tokens.length,
        });

      }

    }

  });


  const best = (kindFilter) =>
    candidates
      .filter(kindFilter)
      .sort(compareCandidates)[0]?.brand ?? null;

  return (
    best((c) => c.brand.kind !== "product") ??
    best((c) => c.brand.kind === "product")
  );

}


// ---------------------------------------------------------
// LOGO SIZING
// ---------------------------------------------------------

// Logos range from square icons to wide wordmarks. Sizing by
// area instead of bounding box makes them look equally heavy;
// the caps keep wide or tall ones inside the round chip.
// Sizes are fractions of the chip, so any chip size works.
const LOGO_SIDE = 0.65;
const LOGO_MAX_WIDTH = 0.86;
const LOGO_MAX_HEIGHT = 0.72;

// ratio = logo width / height. Returns CSS percentages.
export function logoBox(ratio, scale = 1) {

  const side =
    LOGO_SIDE * scale;

  let width =
    side * Math.sqrt(ratio);

  let height =
    width / ratio;

  if (width > LOGO_MAX_WIDTH) {
    width = LOGO_MAX_WIDTH;
    height = width / ratio;
  }

  if (height > LOGO_MAX_HEIGHT) {
    height = LOGO_MAX_HEIGHT;
    width = height * ratio;
  }

  return {
    width: `${(width * 100).toFixed(1)}%`,
    height: `${(height * 100).toFixed(1)}%`,
  };

}
