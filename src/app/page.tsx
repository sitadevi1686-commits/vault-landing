import { DownloadSection } from "@/components/landing/download-section";
import { Features } from "@/components/landing/features";
import { Footer } from "@/components/landing/footer";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Nav } from "@/components/landing/nav";
import { TrustBar } from "@/components/landing/trust-bar";

export default function Home() {
  return (
    <>
      <div aria-hidden="true" className="grain pointer-events-none fixed inset-0 z-50 opacity-[0.06] mix-blend-overlay" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[900px] bg-[radial-gradient(ellipse_60%_50%_at_70%_0%,rgb(255_77_28/0.12),transparent)]"
      />
      <Nav />
      <main className="relative flex-1">
        <Hero />
        <TrustBar />
        <Features />
        <HowItWorks />
        <DownloadSection />
      </main>
      <Footer />
    </>
  );
}
