import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/docs/batch-image")({
  beforeLoad: () => {
    throw redirect({ to: "/batch-image" })
  },
})
