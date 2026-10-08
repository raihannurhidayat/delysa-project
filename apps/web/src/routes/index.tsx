import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <div className="p-2">
      <h3 className="text-2xl font-semibold">Welcome Home!!!</h3>
      <Button render={<Link to="/sign-up" />} nativeButton={false}>
        Sign In
      </Button>
    </div>
  );
}
