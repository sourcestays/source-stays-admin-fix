const SUPABASE_URL = "https://mrvckkzwhuoylxlycaim.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_uUXmE9iowCIwbbiyZe3Jcw_IJELZpKG";
const SITE_URL = "https://sourcestays.com.ng";

function xmlEscape(value) {
  return String(value).replace(/[<>&'"]/g, function (char) {
    return ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[char];
  });
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    return res.status(405).send("Method not allowed");
  }

  try {
    const propertyIds = [];
    const pageSize = 1000;

    for (let offset = 0; ; offset += pageSize) {
      const endpoint = new URL("/rest/v1/properties", SUPABASE_URL);
      endpoint.searchParams.set("select", "id");
      endpoint.searchParams.set("published", "eq.true");
      endpoint.searchParams.set("order", "id.asc");
      endpoint.searchParams.set("limit", String(pageSize));

      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          apikey: SUPABASE_PUBLISHABLE_KEY,
          Authorization: "Bearer " + SUPABASE_PUBLISHABLE_KEY,
          Range: offset + "-" + (offset + pageSize - 1)
        }
      });

      if (!response.ok) {
        const detail = await response.text();
        console.error("Supabase sitemap query failed:", response.status, detail);
        return res.status(502).send("Unable to load published property URLs");
      }

      const rows = await response.json();
      for (const row of rows) {
        if (row && row.id !== null && row.id !== undefined) {
          propertyIds.push(String(row.id));
        }
      }
      if (rows.length < pageSize) break;
    }

    const urls = [
      SITE_URL + "/",
      SITE_URL + "/about.html",
      SITE_URL + "/recb.html"
    ].concat(propertyIds.map(function (id) {
      return SITE_URL + "/property.html?id=" + encodeURIComponent(id);
    }));

    const body = '<?xml version="1.0" encoding="UTF-8"?>\\n' +
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\\n' +
      urls.map(function (url) {
        return "  <url><loc>" + xmlEscape(url) + "</loc></url>";
      }).join("\\n") +
      "\\n</urlset>";

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    res.setHeader("X-Robots-Tag", "noindex");
    return res.status(200).send(req.method === "HEAD" ? "" : body);
  } catch (error) {
    console.error("Sitemap generation failed:", error);
    return res.status(500).send("Sitemap generation failed");
  }
}
