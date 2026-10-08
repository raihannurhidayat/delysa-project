import { createFileRoute } from "@tanstack/react-router";
import SignInPage from "~/features/auth/view/sign-in-page";

export const Route = createFileRoute("/_auth/sign-in")({
  component: SignInPage,
});
