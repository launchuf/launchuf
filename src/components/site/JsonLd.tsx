export function JsonLd({ data }: { data: Record<string, unknown> }) {
  // Säkert: innehållet är vår egen JSON; "<" escapas så att </script> aldrig kan avsluta taggen.
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
