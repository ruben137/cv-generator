import assert from "node:assert/strict";
import test from "node:test";

// Run against a production build: npm run start -- --port 3100
// Then: node --test tests/home-seo.test.mjs
const baseUrl = process.env.SEO_TEST_BASE_URL || "http://localhost:3100";

function link(html, rel, language) {
  const tags = html.match(/<link\b[^>]*>/g) || [];
  const tag = tags.find((value) => value.includes(`rel="${rel}"`)
    && (!language || value.includes(`hrefLang="${language}"`) || value.includes(`hreflang="${language}"`)));
  assert.ok(tag, `Missing ${rel} link ${language || ""}`);
  return tag.match(/href="([^"]+)"/)[1];
}

test("the root permanently redirects to Spanish and preserves editor parameters", async () => {
  for (const locale of ["es", "en"]) {
    const response = await fetch(`${baseUrl}/?cv=sample-id&openEditor=1`, {
      redirect: "manual",
      headers: { "Accept-Language": locale, Cookie: `locale=${locale}` },
    });
    assert.equal(response.status, 308);
    const destination = new URL(response.headers.get("location"), baseUrl);
    assert.equal(destination.pathname, "/es");
    assert.equal(destination.searchParams.get("cv"), "sample-id");
    assert.equal(destination.searchParams.get("openEditor"), "1");
  }
});

test("localized homepages serve stable, indexable content and reciprocal language links", async () => {
  const documents = {};
  for (const locale of ["es", "en"]) {
    const opposite = locale === "es" ? "en" : "es";
    const response = await fetch(`${baseUrl}/${locale}?openEditor=1`, {
      headers: { "Accept-Language": opposite, Cookie: `locale=${opposite}` },
    });
    assert.equal(response.status, 200);
    const html = await response.text();
    documents[locale] = html;
    assert.match(html, new RegExp(`<html[^>]*lang="${locale}"`));
    assert.equal((html.match(/<h1\b/g) || []).length, 1);
    assert.match(html, /<title>[^<]*CV Simple[^<]*<\/title>/);
    assert.match(html, /<meta name="robots" content="index, follow"/);
    const canonical = new URL(link(html, "canonical"));
    assert.equal(canonical.pathname, `/${locale}`);
    assert.equal(canonical.search, "");
    assert.equal(link(html, "alternate", locale), canonical.href);
    assert.equal(link(html, "alternate", "x-default"), `${canonical.origin}/es`);
    assert.match(html, /<figure[^>]*aria-labelledby="simple-cv-example-title"/);
    assert.match(html, /id="generator"/);
    assert.match(html, /href="#generator"/);
    const brandLinks = (html.match(/<a\b[^>]*>/g) || []).filter((tag) => /class="[^"]*\bbrand-logo\b/.test(tag));
    assert.ok(brandLinks.length > 0);
    assert.ok(brandLinks.every((tag) => tag.includes(`href="/${locale}"`)));
    assert.ok(html.includes(locale === "es" ? "Ejemplo de currículum sencillo" : "Simple resume example"));
    assert.ok(html.includes(locale === "es" ? "Empresa Ejemplo" : "Example Company"));
  }
  assert.equal(link(documents.es, "alternate", "en"), link(documents.en, "canonical"));
  assert.equal(link(documents.en, "alternate", "es"), link(documents.es, "canonical"));

  const sitemap = await fetch(`${baseUrl}/sitemap.xml`).then((response) => response.text());
  for (const locale of ["es", "en"]) {
    const canonical = link(documents[locale], "canonical");
    assert.ok(sitemap.includes(`<loc>${canonical}</loc>`));
    assert.ok(sitemap.includes(`hreflang="${locale}" href="${canonical}"`));
  }
  const spanishHome = link(documents.es, "canonical");
  assert.ok(sitemap.includes(`hreflang="x-default" href="${spanishHome}"`));
  assert.ok(!sitemap.includes(`<loc>${new URL(spanishHome).origin}</loc>`));
  assert.ok(!sitemap.includes(`<loc>${new URL(spanishHome).origin}/</loc>`));
});
