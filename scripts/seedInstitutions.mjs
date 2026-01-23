import axios from "axios";
import * as cheerio from "cheerio";

const SUPABASE_URL = process.env.SUPABASE_URL;      // server-side only
const SERVICE_ROLE = process.env.SUPABASE_SERVICE;  // server-side only

if (!SUPABASE_URL || !SERVICE_ROLE) {
    console.error("Missing env: SUPABASE_URL / SUPABASE_SERVICE");
    process.exit(1);
}

// Start page rasmi POLYCC (list politeknik & kolej komuniti)
const START = "https://www.mypolycc.edu.my/index.php/hubungi-kami/senarai-politeknik-kolej-komuniti";

function normalizeName(s) {
    return s.replace(/\s+/g, " ").trim();
}

async function fetchHtml(url) {
    const { data } = await axios.get(url, { timeout: 20000 });
    return data;
}

async function collectLinks() {
    const html = await fetchHtml(START);
    const $ = cheerio.load(html);

    const links = new Set();
    $("a").each((_, a) => {
        const href = $(a).attr("href");
        if (!href) return;
        const full = href.startsWith("http") ? href : new URL(href, START).toString();

        // fokus pada halaman senarai POLYCC sahaja
        if (full.includes("mypolycc.edu.my/index.php/hubungi-kami/senarai-politeknik-kolej-komuniti")) {
            links.add(full);
        }
    });

    // termasuk start page
    links.add(START);
    return [...links];
}

function guessCategory(url) {
    const u = url.toLowerCase();
    if (u.includes("senarai-kolej-komuniti")) return "COMMUNITY_COLLEGE";
    if (u.includes("politeknik")) return "POLYTECHNIC";
    return null;
}

function extractNames(html) {
    const $ = cheerio.load(html);

    // Cuba extract nama dari heading/list (selector mungkin berubah ikut page)
    const names = new Set();

    $("h3, h4, h5, a, strong").each((_, el) => {
        const t = normalizeName($(el).text());
        // heuristic: skip text pendek/umum
        if (t.length < 6) return;
        if (/politeknik|kolej komuniti/i.test(t)) {
            // ambil yang nampak macam nama institusi
            if (/^politeknik|^kolej komuniti/i.test(t)) names.add(t);
        }
    });

    return [...names];
}

async function insertRows(rows) {
    // insert via Supabase REST (service role) - server-side only
    const res = await axios.post(
        `${SUPABASE_URL}/rest/v1/institutions`,
        rows,
        {
            headers: {
                apikey: SERVICE_ROLE,
                Authorization: `Bearer ${SERVICE_ROLE}`,
                "Content-Type": "application/json",
                Prefer: "resolution=merge-duplicates",
            },
            params: { on_conflict: "name" },
        }
    );
    return res.status;
}

(async () => {
    const links = await collectLinks();
    console.log("Found pages:", links.length);

    const all = [];
    for (const url of links) {
        const cat = guessCategory(url);
        if (!cat) continue;

        const html = await fetchHtml(url);
        const names = extractNames(html);

        for (const name of names) {
            all.push({ name, category: cat, state: null });
        }
    }

    // de-dup by name+category
    const dedup = new Map();
    for (const r of all) dedup.set(`${r.category}::${r.name}`, r);

    const rows = [...dedup.values()];
    console.log("Rows to upsert:", rows.length);

    // chunk insert
    const chunkSize = 200;
    for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        const status = await insertRows(chunk);
        console.log(`Inserted ${i + chunk.length}/${rows.length} (status ${status})`);
    }

    console.log("Done.");
})();
