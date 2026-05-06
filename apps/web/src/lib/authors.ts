import { SITE_NAME, SITE_URL } from "./seo";

/**
 * Canonical author entities. Each is a complete Person schema fragment
 * with a stable ``@id`` so other JSON-LD blocks can reference it instead
 * of duplicating fields. Centralizing keeps E-E-A-T signals (sameAs,
 * jobTitle, worksFor) consistent across blog posts, About, and any
 * future Article/HowTo emitters.
 *
 * Only verified URLs go into ``sameAs``. Adding an unverified profile
 * pollutes the entity graph and can hurt rather than help.
 */

export const SAAD_AUTHOR_ID = `${SITE_URL}#person/saad-kadri`;

export const SAAD_AUTHOR = {
  "@type": "Person",
  "@id": SAAD_AUTHOR_ID,
  name: "Saad Kadri",
  url: "https://saadkadri.dev",
  jobTitle: "Founder",
  sameAs: [
    "https://saadkadri.dev",
    "https://www.linkedin.com/in/saad-kadri-58b8bb205/",
  ],
  worksFor: {
    "@type": "Organization",
    "@id": `${SITE_URL}#organization`,
    name: SITE_NAME,
    url: SITE_URL,
  },
} as const;
