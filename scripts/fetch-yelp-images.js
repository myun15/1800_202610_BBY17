// ============================================================
// This script runs with Node.js (NOT in the browser).
// It reads food-vendors.json, asks Yelp for an image for each
// vendor, and saves the image URLs back into the same file.
//
// Run it once:  node scripts/fetch-yelp-images.js
// ============================================================

// --- Node.js built-in modules for reading/writing files ---
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// __dirname doesn't exist in ES modules, so we recreate it
const __dirname = dirname(fileURLToPath(import.meta.url));

// --- Read the API key from the .env file ---
// We can't use import.meta.env (that's Vite-only, browser-side).
// Instead we read the .env file as plain text and grab the key.
const envPath = resolve(__dirname, "..", ".env");
const envContent = readFileSync(envPath, "utf-8");
const apiKeyMatch = envContent.match(/VITE_YELP_API_KEY=(.+)/);

if (!apiKeyMatch) {
  console.error("Could not find VITE_YELP_API_KEY in .env file");
  process.exit(1);
}

const API_KEY = apiKeyMatch[1].trim();

// --- Path to the JSON file we want to update ---
const vendorsPath = resolve(__dirname, "..", "public", "data", "food-vendors.json");

// --- Read the JSON file from disk (not a URL fetch!) ---
const vendors = JSON.parse(readFileSync(vendorsPath, "utf-8"));


/**
 * Ask Yelp for 1 business matching `name` near the given lat/lon.
 * Returns the image URL string, or "" if nothing was found.
 */
async function fetchYelpImage(name, lat, lon) {
  // Build the query string, e.g. ?term=Japadog&latitude=49.28&longitude=-123.11&limit=1
  const params = new URLSearchParams({
    term: name,
    latitude: String(lat),
    longitude: String(lon),
    limit: "1",
  });

  // Call the Yelp API (Node 18+ has built-in fetch)
  const response = await fetch(
    `https://api.yelp.com/v3/businesses/search?${params}`,
    { headers: { Authorization: `Bearer ${API_KEY}` } },
  );

  if (!response.ok) {
    console.error(`  Yelp error ${response.status} for "${name}"`);
    return "";
  }

  const data = await response.json();

  // Yelp returns { businesses: [ { image_url: "...", ... }, ... ] }
  if (data.businesses && data.businesses.length > 0) {
    return data.businesses[0].image_url || "";
  }

  return "";
}


/**
 * Loop through every vendor, fetch an image, and save results.
 */
async function main() {
  console.log(`Processing ${vendors.length} vendors...\n`);

  let fetched = 0;
  let skipped = 0;

  for (const vendor of vendors) {
    // Skip vendors that have no name — we can't search Yelp without one
    if (!vendor.business_name) {
      console.log(`  SKIP (no name) - key: ${vendor.key}`);
      skipped++;
      continue;
    }

    // Get the coordinates from the vendor data
    const lat = vendor.geo_point_2d?.lat;
    const lon = vendor.geo_point_2d?.lon;

    if (!lat || !lon) {
      console.log(`  SKIP (no coords) - ${vendor.business_name}`);
      skipped++;
      continue;
    }

    // Fetch the image from Yelp
    console.log(`  Fetching image for "${vendor.business_name}"...`);
    const imageUrl = await fetchYelpImage(vendor.business_name, lat, lon);

    // Save the URL directly on the vendor object (we'll write it all at the end)
    vendor.image_url = imageUrl;
    fetched++;

    if (imageUrl) {
      console.log(`    Found: ${imageUrl}`);
    } else {
      console.log(`    No image found`);
    }

    // Wait 200ms between requests so we don't hit Yelp's rate limit
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  // Write the updated array back to food-vendors.json (pretty-printed)
  writeFileSync(vendorsPath, JSON.stringify(vendors, null, 2), "utf-8");

  console.log(`\nDone! ${fetched} fetched, ${skipped} skipped.`);
  console.log(`Updated: ${vendorsPath}`);
}

main().catch(console.error);
