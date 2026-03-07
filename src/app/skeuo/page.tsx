import Link from "next/link";
import { Gamepad2, Upload, Trophy, Zap, ChevronRight, Star, Heart } from "lucide-react";

// Mock Data for the prototype
const mockGames = [
    { id: "1", title: "Neon Loop", category: "ARCADE", likes: 1205, plays: 45000, creator: "@arcade_master", color: "#0080ff" },
    { id: "2", title: "Dojo Slash", category: "ACTION", likes: 890, plays: 32000, creator: "@ninja_dev", color: "#ff0040" },
    { id: "3", title: "Cyber Slicer", category: "ACTION", likes: 2100, plays: 85000, creator: "@synth_wave", color: "#00ff40" },
    { id: "4", title: "Puzzle Box", category: "PUZZLE", likes: 450, plays: 12000, creator: "@brain_genius", color: "#ffff00" },
    { id: "5", title: "Space Trek", category: "ADVENTURE", likes: 3400, plays: 110000, creator: "@star_captain", color: "#9900ff" },
    { id: "6", title: "Retro Racer", category: "RACING", likes: 780, plays: 25000, creator: "@speed_demon", color: "#ff6600" },
];

export default function SkeuoHomePage() {
    return (
        <div className="min-h-screen skeuo-wood py-8 px-4 sm:px-8">

            {/* Main Arcade Cabinet Housing */}
            <div className="max-w-6xl mx-auto skeuo-metal-brushed rounded-2xl p-2 sm:p-4 shadow-[0_20px_50px_rgba(0,0,0,0.8)] border-b-8 border-r-8 border-[#5c5c5c]">

                {/* Inner Wood Bezel */}
                <div className="skeuo-wood-panel rounded-xl p-4 sm:p-8">

                    {/* Header Row (Marquee) */}
                    <header className="flex flex-col sm:flex-row items-center justify-between mb-8 pb-6 border-b-4 border-[#3b230d] gap-4">
                        <div className="flex items-center gap-4 skeuo-plastic-dark p-3 rounded-lg">
                            <Gamepad2 className="w-10 h-10 text-[#ffff00] drop-shadow-[0_0_8px_rgba(255,255,0,0.8)]" />
                            <div>
                                <h1 className="text-3xl font-black tracking-widest text-[#e6e6e6] skeuo-engraved-text font-serif leading-none">
                                    VIBEGAMES
                                </h1>
                                <p className="text-[#a6a6a6] text-xs font-bold uppercase tracking-wider">Ninja Arcade System</p>
                            </div>
                        </div>

                        <nav className="flex gap-4">
                            <Link href="/skeuo/game/1" className="skeuo-button skeuo-button-blue px-6 py-3 uppercase tracking-wider text-sm flex items-center gap-2">
                                <Gamepad2 size={16} /> Play Demo
                            </Link>
                            <button className="skeuo-button skeuo-button-red px-6 py-3 uppercase tracking-wider text-sm flex items-center gap-2">
                                <Upload size={16} /> Insert Coin
                            </button>
                        </nav>
                    </header>

                    {/* Main "Screen" Area (Hero) */}
                    <section className="skeuo-screen rounded-xl border-8 border-[#1a1a1a] p-8 sm:p-12 mb-10 min-h-[400px] flex flex-col justify-center items-center text-center relative">
                        <div className="absolute top-4 left-4 flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_#ff0000]"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_10px_#00ff00]"></div>
                        </div>

                        <h2 className="text-5xl sm:text-7xl font-bold text-white mb-6 drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]" style={{ fontFamily: "monospace", textShadow: "0 0 10px rgba(255,255,255,0.8), 0 0 20px rgba(0,128,255,0.8)" }}>
                            EXPLORE CREATIVITY
                        </h2>
                        <p className="text-xl text-[#00ffcc] font-mono max-w-2xl mb-10 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                            Build, play, and remix games created with AI. Skills shouldn&apos;t be an issue to explore creativity.
                        </p>

                        <div className="flex gap-6">
                            <button className="px-8 py-4 bg-transparent border-4 border-[#ffff00] text-[#ffff00] font-bold font-mono text-xl uppercase hover:bg-[#ffff00] hover:text-black transition-colors shadow-[0_0_15px_rgba(255,255,0,0.5)]">
                                Start Exploring
                            </button>
                        </div>
                    </section>

                    {/* Stats Bar (Mechanical Counters) */}
                    <section className="skeuo-metal p-6 rounded-lg mb-10 flex flex-col sm:flex-row justify-around items-center gap-6 shadow-inner">
                        <div className="flex flex-col items-center gap-2">
                            <span className="text-[#333] font-bold uppercase tracking-wider text-xs skeuo-engraved-text">Total Games</span>
                            <div className="skeuo-mechanical-counter text-4xl px-4 py-2 rounded">
                                0 0 5 4 2 1
                            </div>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <span className="text-[#333] font-bold uppercase tracking-wider text-xs skeuo-engraved-text">Active Creators</span>
                            <div className="skeuo-mechanical-counter text-4xl px-4 py-2 rounded">
                                0 0 1 8 9 4
                            </div>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <span className="text-[#333] font-bold uppercase tracking-wider text-xs skeuo-engraved-text">Global Plays</span>
                            <div className="skeuo-mechanical-counter text-4xl px-4 py-2 rounded">
                                2 4 5 0 9 9
                            </div>
                        </div>
                    </section>

                    {/* Categories Grid (Physical Buttons) */}
                    <section className="mb-10">
                        <div className="flex items-center gap-3 mb-6">
                            <Zap className="text-[#d6d6d6]" />
                            <h3 className="text-xl font-bold skeuo-embossed-text uppercase tracking-widest">Select Mode</h3>
                            <div className="h-1 flex-1 bg-gradient-to-r from-[#d6d6d6] to-transparent opacity-50 ml-4"></div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                            {['Action', 'Puzzle', 'RPG', 'Adventure', 'Arcade', 'Racing'].map(cat => (
                                <button key={cat} className="skeuo-button py-4 px-2 text-center text-sm">
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Featured Games (Physical Cartridges) */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <Trophy className="text-[#d6d6d6]" />
                            <h3 className="text-xl font-bold skeuo-embossed-text uppercase tracking-widest">Featured Cartridges</h3>
                            <div className="h-1 flex-1 bg-gradient-to-r from-[#d6d6d6] to-transparent opacity-50 ml-4"></div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {mockGames.map((game, i) => (
                                <Link href={`/skeuo/game/${game.id}`} key={game.id} className="block group">
                                    {/* Cartridge Base */}
                                    <div className="skeuo-cartridge pt-8 pb-4 px-4 h-full transition-transform group-hover:-translate-y-2">
                                        {/* Game Label (Sticker) */}
                                        <div className="skeuo-cartridge-label p-1 h-full flex flex-col">
                                            {/* Label Art Header */}
                                            <div
                                                className="h-32 mb-3 rounded-sm border-b-4 flex items-center justify-center relative overflow-hidden"
                                                style={{ backgroundColor: `${game.color}22`, borderColor: game.color }}
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent"></div>
                                                <h4 className="text-2xl font-black italic text-gray-800 tracking-tighter mix-blend-multiply" style={{ textShadow: `2px 2px 0 ${game.color}66` }}>
                                                    {game.title}
                                                </h4>
                                                <div className="absolute bottom-1 right-2 text-[10px] font-bold text-gray-500 uppercase">Seal of Quality</div>
                                            </div>

                                            {/* Label Info */}
                                            <div className="px-2 flex-1 flex flex-col justify-between pb-2">
                                                <div>
                                                    <div className="text-[10px] font-bold text-gray-500 mb-1">{game.category}</div>
                                                    <div className="text-sm font-bold text-gray-800 leading-tight mb-2">{game.title}</div>
                                                </div>

                                                <div className="flex items-center justify-between mt-4 pt-2 border-t border-gray-200">
                                                    <div className="text-xs text-gray-600 font-mono">{game.creator}</div>
                                                    <div className="flex items-center gap-1 text-[#ff0040]">
                                                        <Heart size={12} className="fill-current" />
                                                        <span className="text-xs font-bold">{game.likes}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>

                </div>
            </div>

            {/* Vents/Speaker Grills at bottom of the main page */}
            <div className="max-w-4xl mx-auto mt-8 flex justify-between px-8">
                <div className="w-32 h-16 skeuo-plastic-dark rounded-lg flex flex-col justify-center gap-2 p-2">
                    <div className="w-full h-2 bg-black rounded-full shadow-inner"></div>
                    <div className="w-full h-2 bg-black rounded-full shadow-inner"></div>
                    <div className="w-full h-2 bg-black rounded-full shadow-inner"></div>
                </div>
                <div className="w-32 h-16 skeuo-plastic-dark rounded-lg flex flex-col justify-center gap-2 p-2">
                    <div className="w-full h-2 bg-black rounded-full shadow-inner"></div>
                    <div className="w-full h-2 bg-black rounded-full shadow-inner"></div>
                    <div className="w-full h-2 bg-black rounded-full shadow-inner"></div>
                </div>
            </div>
        </div>
    );
}
