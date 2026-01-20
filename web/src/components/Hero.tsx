
import Link from "next/link";

export default function Hero() {
    return (
        <section className="min-h-[90vh] flex flex-col items-center justify-center text-center px-4 relative">
            <div className="max-w-4xl space-y-8">
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif tracking-tight leading-[1.1] animate-fade-in opacity-0">
                    Your work is <br className="hidden md:block" />
                    <span className="text-white/90">more than apps.</span>
                </h1>

                <p className="text-xl md:text-2xl text-white/60 font-serif italic animate-fade-in delay-300 opacity-0">
                    It’s a state of mind.
                </p>

                <div className="pt-12 animate-fade-in delay-500 opacity-0">
                    <Link
                        href="#download"
                        className="group relative inline-flex items-center justify-center px-8 py-3 overflow-hidden font-mono font-medium tracking-tighter text-white transition duration-300 ease-out border border-white/20 rounded-full hover:bg-white hover:text-black hover:border-transparent active:scale-95"
                    >
                        <span className="absolute inset-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                        <span className="relative">Download yg-arm64</span>
                    </Link>
                </div>
            </div>

            <div className="absolute bottom-12 animate-fade-in delay-700 opacity-0">
                <p className="text-xs text-white/20 font-mono uppercase tracking-widest">
                    v1.0.0
                </p>
            </div>
        </section>
    );
}
