/**
 * Server component that emits a JSON-LD <script> tag without
 * triggering Next's hydration warnings. Use one per schema object so
 * Google's parser sees each schema standalone (Google's docs allow
 * multiple JSON-LD blocks per page; using separate <script> tags
 * makes individual schemas easier to test in the Rich Results tool).
 */

interface JsonLdProps {
  data: Record<string, unknown> | Array<Record<string, unknown>>;
  id?: string;
}

export function JsonLd({ data, id }: JsonLdProps): JSX.Element {
  return (
    <script
      type="application/ld+json"
      id={id}
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  );
}
