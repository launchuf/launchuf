import { createFileRoute, redirect } from "@tanstack/react-router";

// Gammal URL från den förra sajten → permanent omdirigering (behåller SEO-värde).
export const Route = createFileRoute("/uf-foretag")({
  beforeLoad: () => { throw redirect({ to: "/uf", statusCode: 301 }); },
});
