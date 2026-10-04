// Renders JSON-LD structured data as <script type="application/ld+json"> tags.
// Safe for both server and client components. `data` is always generated
// internally (never user input), so dangerouslySetInnerHTML is fine here.
export default function JsonLd({
  data,
}: {
  data: Record<string, unknown> | Record<string, unknown>[];
}) {
  const blocks = Array.isArray(data) ? data : [data];
  return (
    <>
      {blocks.map((block, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }}
        />
      ))}
    </>
  );
}
