import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function read(relativePath) {
  return readFile(new URL(relativePath, root), "utf8");
}

test("keeps the public shell metadata complete in both languages", async () => {
  const [layout, spanishMessages, englishMessages, manifest] = await Promise.all([
    read("app/layout.tsx"),
    read("messages/es.json").then(JSON.parse),
    read("messages/en.json").then(JSON.parse),
    read("app/manifest.ts"),
  ]);

  for (const messages of [spanishMessages, englishMessages]) {
    assert.match(messages.Metadata.title, /CV Simple/i);
    assert.ok(messages.Metadata.description.length > 80);
    assert.ok(Array.isArray(messages.Metadata.featureList));
    assert.ok(messages.Metadata.featureList.length >= 3);
  }

  assert.match(layout, /export async function generateMetadata/);
  assert.match(layout, /manifest:\s*"\/manifest\.webmanifest"/);
  assert.match(layout, /icons:\s*\{[^}]*"\/favicon\.svg"/s);
  assert.match(layout, /type="application\/ld\+json"/);
  assert.match(layout, /<Analytics \/>/);
  assert.match(manifest, /name:\s*"CV Simple/);
  assert.match(manifest, /start_url:\s*"\/"/);
  assert.match(manifest, /src:\s*"\/favicon\.svg"/);

  await access(new URL("public/favicon.svg", root));
  await access(new URL("public/og.png", root));
});

test("uses the real application shell and leaves no starter preview scaffold", async () => {
  const [page, layout] = await Promise.all([
    read("app/page.tsx"),
    read("app/layout.tsx"),
  ]);

  assert.match(page, /export default function Home/);
  assert.match(page, /id="generator"/);
  assert.match(page, /<BrandLogo \/>/);
  assert.match(layout, /<NextIntlClientProvider/);
  assert.match(layout, /<html lang=\{locale\}>/);
  assert.doesNotMatch(page, /SkeletonPreview|codex-preview|Your site is taking shape/);
  assert.doesNotMatch(layout, /SkeletonPreview|codex-preview|Starter Project/);

  assert.deepEqual(await readdir(new URL("app/_sites-preview", root)), []);
});
