import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const ESCO_VERSION = "v1.2.0";
const ESCO_API = "https://ec.europa.eu/esco/api";

const targets = [
  ["software-development", "Java (computer programming)"],
  ["software-development", "CSS"],
  ["industrial-engineering", "supply chain management"],
  ["industrial-engineering", "schedule production"],
  ["industrial-engineering", "adhere to OHSAS 18001"],
  ["administration", "oversee all travel arrangements"],
  ["administration", "office administration"],
  ["marketing", "market research"],
  ["marketing", "supervise brand management"],
  ["sales", "relationship marketing"],
  ["sales", "manage contracts"],
  ["sales", "telemarketing"],
  ["accounting", "budgetary principles"],
  ["accounting", "financial analysis"],
  ["customer-service", "guarantee customer satisfaction"],
  ["customer-service", "perform escalation procedure"],
  ["graphic-design", "usability engineering"],
  ["graphic-design", "create prototype of user experience solutions"],
  ["graphic-design", "motion graphics"],
];

const normalize = (value) => value.toLocaleLowerCase("en").replace(/[^a-z0-9+#.]+/g, " ").trim();

async function requestJson(url) {
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return response.json();
}

async function findSkill([family, query]) {
  const params = new URLSearchParams({
    text: query,
    type: "skill",
    language: "en",
    limit: "10",
    full: "true",
    selectedVersion: ESCO_VERSION,
  });
  const search = await requestJson(`${ESCO_API}/search?${params}`);
  const results = search?._embedded?.results ?? [];
  const match = results.find((item) => normalize(item.title) === normalize(query)) ?? results[0];
  if (!match) return { family, query, status: "not-found" };

  const resourceParams = new URLSearchParams({ uri: match.uri, language: "en", selectedVersion: ESCO_VERSION });
  const resource = await requestJson(`${ESCO_API}/resource/skill?${resourceParams}`);
  return {
    family,
    query,
    status: normalize(match.title) === normalize(query) ? "exact" : "review",
    uri: match.uri,
    preferredLabel: {
      es: resource.preferredLabel?.es ?? null,
      en: resource.preferredLabel?.en ?? match.title,
    },
    alternativeLabel: {
      es: (resource.alternativeLabel?.es ?? []).filter((item) => item.length <= 80),
      en: (resource.alternativeLabel?.en ?? []).filter((item) => item.length <= 80),
    },
  };
}

const candidates = [];
for (const target of targets) {
  candidates.push(await findSkill(target));
  process.stdout.write(".");
}
process.stdout.write("\n");

const output = {
  generatedAt: new Date().toISOString(),
  source: {
    name: "European Skills, Competences, Qualifications and Occupations (ESCO)",
    version: ESCO_VERSION,
    url: "https://esco.ec.europa.eu/en/use-esco/download",
  },
  candidates,
};

const outputPath = resolve("data/job-match/esco-candidates.json");
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.log(`Wrote ${candidates.length} candidates to ${outputPath}`);
