import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col items-start justify-center gap-4 p-6">
      <h1 className="text-3xl font-semibold tracking-tight">Delysa Florist</h1>
      <p className="text-muted-foreground">
        Katalog, keranjang, dan checkout — fondasi rute bersih siap dibangun.
      </p>
      <div className="flex gap-2">
        <Button render={<Link to="/sign-in" />} nativeButton={false}>
          Masuk
        </Button>
        <Button
          render={<Link to="/sign-up" />}
          nativeButton={false}
          variant="outline"
        >
          Daftar
        </Button>
      </div>
    </main>
  );
}
