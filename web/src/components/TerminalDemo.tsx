"use client";

import FadeIn from "./FadeIn";

export default function TerminalDemo() {
    return (
        <section className="py-32 px-4 flex justify-center">
            <FadeIn className="w-full max-w-2xl bg-[#111] rounded-xl border border-white/10 shadow-2xl overflow-hidden font-mono text-sm md:text-base">
                {/* Window controls */}
                <div className="bg-white/5 px-4 py-3 flex items-center gap-2 border-b border-white/5">
                    <div className="w-3 h-3 rounded-full bg-[#FF5F56] opacity-80" />
                    <div className="w-3 h-3 rounded-full bg-[#FFBD2E] opacity-80" />
                    <div className="w-3 h-3 rounded-full bg-[#27C93F] opacity-80" />
                    <div className="ml-4 text-xs text-white/30 font-sans">Openses — -zsh</div>
                </div>

                {/* Terminal Content */}
                <div className="p-6 md:p-8 space-y-4 text-white/90">
                    <div className="flex">
                        <span className="text-emerald-400 mr-3">➜</span>
                        <span className="text-blue-400 mr-3">~</span>
                        <span className="typing-effect">yg save work</span>
                    </div>

                    <div className="text-white/50 pl-4 space-y-1">
                        <p>Scanning open windows...</p>
                        <p>Found VS Code, Chrome, Terminal.</p>
                        <p className="text-emerald-400">✓ Session 'work' saved.</p>
                    </div>

                    <div className="h-4" />

                    <div className="flex">
                        <span className="text-emerald-400 mr-3">➜</span>
                        <span className="text-blue-400 mr-3">~</span>
                        <span>yg restore work</span>
                    </div>

                    <div className="text-white/50 pl-4 space-y-1">
                        <p>Restoring windows positions...</p>
                        <p>Opening files...</p>
                        <p className="text-emerald-400">✓ Welcome back.</p>
                    </div>
                    <div className="flex">
                        <span className="text-emerald-400 mr-3">➜</span>
                        <span className="text-blue-400 mr-3">~</span>
                        <span className="w-2.5 h-5 bg-white/50 block"></span>
                    </div>
                </div>
            </FadeIn>
        </section>
    );
}
