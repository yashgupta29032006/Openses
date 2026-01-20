import Hero from "@/components/Hero";
import Philosophy from "@/components/Philosophy";
import TerminalDemo from "@/components/TerminalDemo";
import DownloadGrid from "@/components/DownloadGrid";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#050505]">
      <Hero />
      <Philosophy />
      <TerminalDemo />
      <DownloadGrid />
    </main>
  );
}
