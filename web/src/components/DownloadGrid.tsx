"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import FadeIn from "./FadeIn";

export default function DownloadGrid() {
    return (
        <section id="download" className="py-32 px-4 border-t border-white/5 bg-gradient-to-b from-transparent to-white/5">
            <div className="max-w-4xl mx-auto text-center space-y-16">

                {/* Trust Indicators */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-white/40 font-mono text-sm uppercase tracking-widest">
                    <FadeIn delay={0.1}>
                        <div className="flex flex-col items-center gap-4">
                            <span className="text-2xl text-white/80">🔒</span>
                            <span>Runs Locally</span>
                        </div>
                    </FadeIn>
                    <FadeIn delay={0.2}>
                        <div className="flex flex-col items-center gap-4">
                            <span className="text-2xl text-white/80">☁️</span>
                            <span>No Cloud</span>
                        </div>
                    </FadeIn>
                    <FadeIn delay={0.3}>
                        <div className="flex flex-col items-center gap-4">
                            <span className="text-2xl text-white/80">🛡️</span>
                            <span>No Telemetry</span>
                        </div>
                    </FadeIn>
                </div>

                <div className="space-y-8 pt-12">
                    <FadeIn yOffset={20}>
                        <h2 className="text-4xl md:text-5xl font-serif text-white/90">
                            Your work deserves continuity.
                        </h2>
                    </FadeIn>

                    <FadeIn delay={0.2} yOffset={10}>
                        <div className="pt-8 flex flex-col items-center gap-4">
                            <Link href="/download/yg-arm64">
                                <motion.div
                                    whileHover={{ scale: 1.02, backgroundColor: "#f5f5f5" }}
                                    whileTap={{ scale: 0.98 }}
                                    className="relative inline-flex items-center justify-center px-10 py-4 bg-white text-black font-medium text-lg rounded-full overflow-hidden"
                                >
                                    <span className="relative z-10">Download Openses</span>
                                    <div className="absolute inset-0 bg-white/50 opacity-0 hover:opacity-100 transition-opacity duration-300 blur-xl" />
                                </motion.div>
                            </Link>
                            <p className="text-sm text-white/30 font-mono">macOS Apple Silicon only</p>
                        </div>
                    </FadeIn>
                </div>

                <FadeIn delay={0.4}>
                    <footer className="pt-32 pb-8 text-white/20 text-sm">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                            <p>© {new Date().getFullYear()} Yash Gupta</p>
                            <div className="flex gap-6">
                                <a href="https://twitter.com" target="_blank" className="hover:text-white/40 transition-colors">Twitter</a>
                                <a href="https://github.com" target="_blank" className="hover:text-white/40 transition-colors">GitHub</a>
                            </div>
                        </div>
                    </footer>
                </FadeIn>

            </div>
        </section>
    );
}
