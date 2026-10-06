import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/tjanster")({
  beforeLoad: () => { throw redirect({ to: "/paket", statusCode: 301 }); },
});
