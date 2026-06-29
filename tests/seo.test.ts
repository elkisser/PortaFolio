import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  SITE_NAME,
  DEFAULT_TITLE,
  buildTitle,
  canonicalURL,
  absoluteUrl,
  ogLocale,
  openGraphTags,
  twitterTags,
  bcp47,
  buildPersonJsonLd,
  personJsonLdString,
  buildCreativeWorkJsonLd,
  creativeWorkJsonLdString,
  PERSON,
  type ResolvedSeo,
  type CaseStudySeoInput,
} from '../src/lib/seo';

const SITE = 'https://elkisser.github.io';

describe('seo: buildTitle', () => {
  it('returns the default title when no page title is given', () => {
    expect(buildTitle()).toBe(DEFAULT_TITLE);
    expect(buildTitle('   ')).toBe(DEFAULT_TITLE);
  });

  it('appends the site name as a suffix for a page title', () => {
    expect(buildTitle('Work')).toBe(`Work — ${SITE_NAME}`);
  });

  it('does not duplicate the suffix for the site name or default title', () => {
    expect(buildTitle(SITE_NAME)).toBe(SITE_NAME);
    expect(buildTitle(DEFAULT_TITLE)).toBe(DEFAULT_TITLE);
  });

  it('never produces a doubled separator (property)', () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        const out = buildTitle(s);
        // El sufijo aparece a lo sumo una vez.
        const occurrences = out.split(`— ${SITE_NAME}`).length - 1;
        return occurrences <= 1;
      }),
    );
  });
});

describe('seo: URL helpers', () => {
  it('builds a canonical URL from site + pathname', () => {
    expect(canonicalURL('/work', SITE)).toBe('https://elkisser.github.io/work');
    expect(canonicalURL('/', SITE)).toBe('https://elkisser.github.io/');
  });

  it('normalizes a path to always start with "/"', () => {
    expect(absoluteUrl('img/foto.png', SITE)).toBe('https://elkisser.github.io/img/foto.png');
  });

  it('degrades to a normalized path when site is undefined', () => {
    expect(absoluteUrl('img/foto.png', undefined)).toBe('/img/foto.png');
    expect(canonicalURL('/work', undefined)).toBe('/work');
  });

  it('always yields an absolute URL on the configured origin (property)', () => {
    // Rutas internas realistas: segmentos no vacíos y codificados, sin "//"
    // protocol-relative (encodeURIComponent nunca produce "/" ni cadena vacía).
    const internalPath = fc
      .array(fc.string({ minLength: 1, maxLength: 8 }).map((s) => encodeURIComponent(s)))
      .map((segs) => `/${segs.join('/')}`);
    fc.assert(
      fc.property(internalPath, (path) => {
        const url = absoluteUrl(path, SITE);
        return url.startsWith('https://elkisser.github.io/');
      }),
    );
  });
});

describe('seo: ogLocale', () => {
  it('maps known languages and falls back to the code itself', () => {
    expect(ogLocale('es')).toBe('es_AR');
    expect(ogLocale('en')).toBe('en_US');
    expect(ogLocale('fr')).toBe('fr');
  });
});

describe('seo: bcp47', () => {
  it('derives a BCP 47 language tag from the og:locale mapping', () => {
    expect(bcp47('es')).toBe('es-AR');
    expect(bcp47('en')).toBe('en-US');
  });

  it('falls back to the language code itself when unmapped', () => {
    expect(bcp47('fr')).toBe('fr');
  });
});

const baseSeo: ResolvedSeo = {
  title: 'Work — Sebastián Kisser',
  description: 'desc',
  canonical: 'https://elkisser.github.io/work',
  image: 'https://elkisser.github.io/img/foto-perfil.png',
  ogType: 'website',
  siteName: SITE_NAME,
  locale: 'es_AR',
  localeAlternate: ['en_US'],
  twitterCard: 'summary_large_image',
};

describe('seo: tag builders', () => {
  it('produces the expected Open Graph tags including the alternate locale', () => {
    const tags = openGraphTags(baseSeo);
    const map = Object.fromEntries(tags.map((t) => [t.property, t.content]));
    expect(map['og:type']).toBe('website');
    expect(map['og:title']).toBe(baseSeo.title);
    expect(map['og:url']).toBe(baseSeo.canonical);
    expect(map['og:image']).toBe(baseSeo.image);
    expect(map['og:locale']).toBe('es_AR');
    expect(tags.some((t) => t.property === 'og:locale:alternate' && t.content === 'en_US')).toBe(true);
  });

  it('produces the expected Twitter tags', () => {
    const tags = twitterTags(baseSeo);
    const map = Object.fromEntries(tags.map((t) => [t.name, t.content]));
    expect(map['twitter:card']).toBe('summary_large_image');
    expect(map['twitter:title']).toBe(baseSeo.title);
    expect(map['twitter:image']).toBe(baseSeo.image);
  });
});

describe('seo: Person JSON-LD', () => {
  it('builds a valid schema.org Person with resolved url/image', () => {
    const ld = buildPersonJsonLd(SITE);
    expect(ld['@context']).toBe('https://schema.org');
    expect(ld['@type']).toBe('Person');
    expect(ld.name).toBe(PERSON.name);
    expect(ld.url).toBe('https://elkisser.github.io/');
    expect(ld.image).toBe('https://elkisser.github.io/img/foto-perfil.png');
    expect(ld.sameAs).toContain('https://github.com/elkisser');
  });

  it('serializes to parseable JSON', () => {
    const json = personJsonLdString(SITE);
    const parsed = JSON.parse(json);
    expect(parsed['@type']).toBe('Person');
    expect(parsed.knowsAbout).toEqual(PERSON.knowsAbout);
  });
});

describe('seo: CreativeWork JSON-LD (Req 8.3)', () => {
  const input: CaseStudySeoInput = {
    title: 'Chromora',
    summary: 'IA que traduce lenguaje natural a paletas de color.',
    lang: 'es',
    year: 2024,
    stack: ['Next.js', 'TypeScript', 'Chroma.js'],
    path: '/es/work/chromora',
    imagePath: '/img/chromora/cover.webp',
    links: { demo: 'https://chromora.app', repo: 'https://github.com/elkisser/chromora' },
  };

  it('builds a localized schema.org CreativeWork with resolved url/image', () => {
    const ld = buildCreativeWorkJsonLd(input, SITE);
    expect(ld['@context']).toBe('https://schema.org');
    expect(ld['@type']).toBe('CreativeWork');
    expect(ld.name).toBe('Chromora');
    expect(ld.description).toBe(input.summary);
    expect(ld.inLanguage).toBe('es-AR');
    expect(ld.url).toBe('https://elkisser.github.io/es/work/chromora');
    expect(ld.datePublished).toBe('2024');
    expect(ld.keywords).toEqual(['Next.js', 'TypeScript', 'Chroma.js']);
    expect(ld.image).toBe('https://elkisser.github.io/img/chromora/cover.webp');
  });

  it('embeds the Person author pointing at the site home', () => {
    const ld = buildCreativeWorkJsonLd(input, SITE);
    expect(ld.author['@type']).toBe('Person');
    expect(ld.author.name).toBe(PERSON.name);
    expect(ld.author.url).toBe('https://elkisser.github.io/');
  });

  it('lists demo and repo as sameAs links', () => {
    const ld = buildCreativeWorkJsonLd(input, SITE);
    expect(ld.sameAs).toEqual(['https://chromora.app', 'https://github.com/elkisser/chromora']);
  });

  it('omits image and sameAs when no media/links are provided', () => {
    const minimal: CaseStudySeoInput = {
      title: 'Untitled',
      summary: 's',
      lang: 'en',
      year: 2023,
      stack: ['Astro'],
      path: '/en/work/untitled',
      links: {},
    };
    const ld = buildCreativeWorkJsonLd(minimal, SITE);
    expect(ld.inLanguage).toBe('en-US');
    expect('image' in ld).toBe(false);
    expect('sameAs' in ld).toBe(false);
  });

  it('serializes to parseable JSON', () => {
    const parsed = JSON.parse(creativeWorkJsonLdString(input, SITE));
    expect(parsed['@type']).toBe('CreativeWork');
    expect(parsed.url).toBe('https://elkisser.github.io/es/work/chromora');
  });

  it('always yields an absolute CreativeWork url on the configured origin (property)', () => {
    const slugArb = fc
      .array(fc.string({ minLength: 1, maxLength: 8 }).map((s) => encodeURIComponent(s)), {
        minLength: 1,
      })
      .map((segs) => `/${segs.join('/')}`);
    fc.assert(
      fc.property(slugArb, fc.constantFrom('es', 'en'), fc.integer({ min: 2015, max: 2100 }), (path, lang, year) => {
        const ld = buildCreativeWorkJsonLd(
          { title: 't', summary: 's', lang, year, stack: ['Astro'], path, links: {} },
          SITE,
        );
        return ld.url.startsWith('https://elkisser.github.io/') && ld.datePublished === String(year);
      }),
    );
  });
});
