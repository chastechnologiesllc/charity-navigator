import { useRouterState } from "@tanstack/react-router";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const focusedDonationPage = pathname === "/donate";

  return (
    <div className="flex min-h-dvh flex-col bg-paper text-ink">
      {focusedDonationPage ? null : <SiteHeader />}
      <main className="flex-1">{children}</main>
      {focusedDonationPage ? null : <SiteFooter />}
    </div>
  );
}
