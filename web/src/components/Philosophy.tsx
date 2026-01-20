"use client";

import FadeIn from "./FadeIn";

export default function Philosophy() {
    return (
        <section className="py-32 px-6 max-w-2xl mx-auto space-y-40">
            <FadeIn delay={0.2}>
                <div className="space-y-8">
                    <h2 className="text-3xl md:text-4xl font-serif text-white/90">
                        We don't just open files. <br />
                        <span className="italic text-white/50">We open sessions.</span>
                    </h2>
                    <p className="text-lg md:text-xl leading-relaxed text-white/70 font-light">
                        Context is the bridge between thought and execution.
                        Most tools respect your filesystem. Openses respects your flow.
                        It captures the exact state of your mind, so you can leave and return without losing the thread.
                    </p>
                </div>
            </FadeIn>

            <FadeIn>
                <div className="space-y-8">
                    <div className="h-px w-12 bg-white/10" />
                    <h3 className="text-sm font-mono tracking-widest text-white/40 uppercase">
                        The Creator
                    </h3>
                    <p className="text-lg md:text-xl leading-relaxed text-white/70 font-light">
                        <strong className="text-white font-medium">YG</strong> is Yash Gupta.
                        This isn't a startup. It's a craft.
                        Built to solve the chaos of context switching.
                        No boards. No shareholders. Just code.
                    </p>
                </div>
            </FadeIn>

            <FadeIn>
                <div className="space-y-8">
                    <h2 className="text-3xl md:text-4xl font-serif text-white/90">
                        Flow. Continuity. Focus.
                    </h2>
                    <p className="text-lg md:text-xl leading-relaxed text-white/70 font-light">
                        Save your mental state. Restore it instantly.
                        Pick up exactly where you left off.
                    </p>
                </div>
            </FadeIn>
        </section>
    );
}
