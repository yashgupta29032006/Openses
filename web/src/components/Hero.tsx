"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

export default function Hero() {
    const shouldReduceMotion = useReducedMotion();

    const fadeUpVariants = {
        hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
        visible: (delay: number) => ({
            opacity: 1,
            y: 0,
            transition: {
                delay,
                duration: 0.8,
                ease: [0.21, 0.47, 0.32, 0.98] as const, // Apple-like ease-out
            },
        }),
    };

    return (
        <section className="min-h-[90vh] flex flex-col items-center justify-center text-center px-4 relative">
            <div className="max-w-4xl space-y-8">
                <motion.h1
                    custom={0}
                    initial="hidden"
                    animate="visible"
                    variants={fadeUpVariants}
                    className="text-5xl md:text-7xl lg:text-8xl font-serif tracking-tight leading-[1.1]"
                >
                    Your work is <br className="hidden md:block" />
                    <span className="text-white/90">more than apps.</span>
                </motion.h1>

                <motion.p
                    custom={0.2}
                    initial="hidden"
                    animate="visible"
                    variants={fadeUpVariants}
                    className="text-xl md:text-2xl text-white/60 font-serif italic"
                >
                    It’s a state of mind.
                </motion.p>

                <motion.div
                    custom={0.4}
                    initial="hidden"
                    animate="visible"
                    variants={fadeUpVariants}
                    className="pt-12"
                >
                    <Link
                        href="#download"
                        className="group relative inline-flex items-center justify-center px-8 py-3 overflow-hidden font-mono font-medium tracking-tighter text-white transition duration-300 ease-out border border-white/20 rounded-full hover:bg-white hover:text-black hover:border-transparent active:scale-95"
                    >
                        <span className="absolute inset-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                        <span className="relative">Download yg-arm64</span>
                    </Link>
                </motion.div>
            </div>

            <motion.div
                custom={0.8}
                initial="hidden"
                animate="visible"
                variants={fadeUpVariants}
                className="absolute bottom-12"
            >
                <p className="text-xs text-white/20 font-mono uppercase tracking-widest">
                    v1.0.0
                </p>
            </motion.div>
        </section>
    );
}
