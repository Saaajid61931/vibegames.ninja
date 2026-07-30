"use client";

import Link from "next/link";
import { ArrowLeft, Maximize2, Flag, Heart } from "lucide-react";
import { useState } from "react";

export default function SkeuoGamePage() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [coinsInserted, setCoinsInserted] = useState(0);

    const handleInsertCoin = () => {
        setCoinsInserted(prev => prev + 1);
    };

    const handleStart = () => {
        if (coinsInserted > 0) {
            setCoinsInserted(prev => prev - 1);
            setIsPlaying(true);
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center bg-[#111] px-4 py-8 font-sans text-white">

            <div className="w-full max-w-5xl mb-6">
                <Link href="/skeuo" className="skeuo-button inline-flex items-center gap-2 px-4 py-2 text-sm text-[#333]">
                    <ArrowLeft size={16} /> Back to Arcade
                </Link>
            </div>

            {/* Main Arcade Cabinet Structure */}
            <div className="w-full max-w-4xl skeuo-wood-panel p-4 sm:p-8 rounded-t-3xl rounded-b-xl shadow-[0_30px_60px_rgba(0,0,0,0.9)] relative flex flex-col items-center">

                {/* Marquee (Top Sign) */}
                <div className="w-[90%] h-24 sm:h-32 mb-8 rounded-lg overflow-hidden border-8 border-[#333] shadow-[inset_0_0_20px_rgba(0,0,0,1)] relative flex items-center justify-center bg-black">
                    <div className="absolute inset-y-0 left-0 w-2 bg-[#ff0040]" aria-hidden="true" />
                    <h1 className="z-10 text-4xl font-black italic tracking-tighter text-white sm:text-6xl" style={{ fontFamily: "impact, sans-serif" }}>
                        NEON LOOP
                    </h1>
                </div>

                {/* Screen Bezel (The angled plastic around the screen) */}
                <div className="w-full max-w-3xl skeuo-plastic-dark p-6 sm:p-12 rounded-2xl shadow-[inset_0_20px_40px_rgba(0,0,0,0.8)] border-b-8 border-[#1a1a1a] relative">

                    {/* The Actual Screen */}
                    <div className="w-full aspect-video skeuo-screen rounded-lg border-4 border-black relative z-10 group flex items-center justify-center">

                        {/* If playing, show iframe, else show "Insert Coin" screen */}
                        {isPlaying ? (
                            <iframe
                                src="/sample-games/index.html"
                                className="w-full h-full bg-[#0d1117] border-none"
                                title="Neon Loop Game"
                            />
                        ) : (
                            <div className="text-center animate-pulse">
                                {coinsInserted > 0 ? (
                                    <div className="cursor-pointer font-mono text-2xl font-bold tracking-widest text-[#00ffcc]" onClick={handleStart}>
                                        PRESS START
                                    </div>
                                ) : (
                                    <div className="font-mono text-2xl font-bold tracking-widest text-[#ff0040]">
                                        INSERT COIN
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Embedded Screen Controls (Volume/Focus/Brightness knobs) */}
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity z-40">
                            <button className="w-6 h-6 rounded-full skeuo-metal-brushed border border-black shadow-md flex items-center justify-center cursor-pointer hover:rotate-45 transition-transform">
                                <div className="w-4 h-[2px] bg-black/50"></div>
                            </button>
                            <button className="w-6 h-6 rounded-full skeuo-metal-brushed border border-black shadow-md flex items-center justify-center cursor-pointer hover:-rotate-45 transition-transform">
                                <div className="w-4 h-[2px] bg-black/50"></div>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Control Panel (The slanted part where buttons are) */}
                <div className="relative -mx-8 mt-4 flex w-[105%] items-end justify-between overflow-hidden rounded-lg border-t-4 border-b-8 border-[#444] border-b-black bg-[#1a1a1a] p-6 shadow-[0_15px_30px_rgba(0,0,0,0.9)] sm:w-[110%] sm:p-8">

                    <div className="pointer-events-none absolute inset-y-0 left-0 w-2 bg-[#ff0040]" aria-hidden="true" />

                    {/* Left Controls (Joystick Area Placeholder) */}
                    <div className="flex gap-4 relative z-10 p-4 skeuo-metal rounded-xl border-4 border-gray-600 bg-gray-400">
                        <div className="relative flex h-20 w-20 cursor-pointer items-center justify-center rounded-full border border-red-400 bg-red-700 shadow-[5px_15px_20px_rgba(0,0,0,0.8)] transition-all hover:-translate-y-1 hover:shadow-[5px_20px_25px_rgba(0,0,0,0.8)]">
                            <div className="absolute bottom-[-30px] h-8 w-2 bg-gray-600 shadow-lg"></div>
                        </div>
                    </div>

                    {/* Center Area (Coin Slots & Start Button) */}
                    <div className="flex flex-col items-center gap-6 relative z-10 skeuo-plastic-dark p-6 border-2 border-black rounded-lg">

                        <div className="flex items-center gap-4">
                            {/* The Coin Slot */}
                            <div className="w-16 h-24 skeuo-metal-brushed rounded flex flex-col items-center justify-center gap-2 border-4 border-gray-600 shadow-inner">
                                <div className="text-[8px] font-black uppercase text-gray-800">25¢</div>
                                <div className="w-2 h-10 bg-black rounded-full shadow-inner cursor-pointer hover:bg-gray-900" onClick={handleInsertCoin}></div>
                            </div>

                            {/* Start Button */}
                            <button className="skeuo-button skeuo-button-red w-16 h-16 rounded-full flex items-center justify-center" onClick={handleStart} disabled={coinsInserted === 0}>
                                <span className="text-white font-bold text-xs uppercase leading-tight mt-1 opacity-80 mix-blend-overlay">START</span>
                            </button>
                        </div>

                        {/* Coins Display */}
                        <div className="skeuo-mechanical-counter rounded px-3 py-1 text-3xl text-[#ff0000]">
                            {coinsInserted.toString().padStart(2, '0')}
                        </div>
                    </div>

                    {/* Right Controls (Action Buttons) */}
                    <div className="flex gap-4 relative z-10 p-4 skeuo-metal rounded-xl border-4 border-gray-600 bg-gray-400">
                        <button className="skeuo-button skeuo-button-blue w-16 h-16 rounded-full uppercase text-xs font-bold leading-tight"></button>
                        <button className="skeuo-button skeuo-button-green w-16 h-16 rounded-full uppercase text-xs font-bold leading-tight mt-6"></button>
                    </div>
                </div>

            </div>

            {/* Meta Info Panel below the cabinet */}
            <div className="w-full max-w-4xl mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="skeuo-wood-panel p-6 rounded-lg col-span-2">
                    <h2 className="text-2xl font-bold skeuo-embossed-text mb-4">About this Cabinet</h2>
                    <p className="font-mono text-sm text-[#ddd] leading-relaxed mb-4">
                        Neon Loop: Cyber Hunt is a fast-paced arcade action game. Draw boundaries to capture viruses and defend the mainframe. Designed by @arcade_master.
                    </p>
                    <div className="flex gap-4 mt-6">
                        <button className="skeuo-button px-4 py-2 flex items-center gap-2 text-sm">
                            <Heart size={16} className="text-red-500 fill-current" />
                            1,205
                        </button>
                        <button className="skeuo-button px-4 py-2 flex items-center gap-2 text-sm">
                            <Maximize2 size={16} /> Maximize
                        </button>
                    </div>
                </div>

                <div className="skeuo-metal p-6 rounded-lg flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b-2 border-gray-400 pb-2">
                        <span className="font-bold text-[#333] skeuo-engraved-text">Current Highscore</span>
                        <span className="font-mono text-xl text-[#0080ff] font-bold shadow-sm">94,500</span>
                    </div>
                    <div className="flex items-center justify-between border-b-2 border-gray-400 pb-2">
                        <span className="font-bold text-[#333] skeuo-engraved-text">Your Rank</span>
                        <span className="font-mono text-xl text-[#0080ff] font-bold">#42</span>
                    </div>
                    <div className="mt-auto">
                        <button className="w-full skeuo-button skeuo-button-red py-2 flex items-center justify-center gap-2 text-sm mt-4">
                            <Flag size={16} /> Report Issue
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
