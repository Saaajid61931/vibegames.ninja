"use client";

import Link from "next/link";
import { ArrowLeft, Maximize2, Flag, Heart } from "lucide-react";
import { useEffect, useState } from "react";

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
        <div className="min-h-screen bg-[#111] flex flex-col items-center py-8 px-4 font-sans text-white" style={{ backgroundImage: 'radial-gradient(circle at center, #2a2a2a 0%, #000 100%)' }}>

            <div className="w-full max-w-5xl mb-6">
                <Link href="/skeuo" className="skeuo-button inline-flex items-center gap-2 px-4 py-2 text-sm text-[#333]">
                    <ArrowLeft size={16} /> Back to Arcade
                </Link>
            </div>

            {/* Main Arcade Cabinet Structure */}
            <div className="w-full max-w-4xl skeuo-wood-panel p-4 sm:p-8 rounded-t-3xl rounded-b-xl shadow-[0_30px_60px_rgba(0,0,0,0.9)] relative flex flex-col items-center">

                {/* Marquee (Top Sign) */}
                <div className="w-[90%] h-24 sm:h-32 mb-8 rounded-lg overflow-hidden border-8 border-[#333] shadow-[inset_0_0_20px_rgba(0,0,0,1)] relative flex items-center justify-center bg-black">
                    {/* Backlight effect */}
                    <div className="absolute inset-0 bg-gradient-to-b from-[#ff0040]/20 via-[#ff0040]/40 to-[#ff0040]/20 blur-md"></div>
                    <h1 className="text-4xl sm:text-6xl font-black text-white italic tracking-tighter mix-blend-screen drop-shadow-[0_0_15px_#ff0040] z-10" style={{ fontFamily: "impact, sans-serif" }}>
                        NEON LOOP
                    </h1>
                </div>

                {/* Screen Bezel (The angled plastic around the screen) */}
                <div className="w-full max-w-3xl skeuo-plastic-dark p-6 sm:p-12 rounded-2xl shadow-[inset_0_20px_40px_rgba(0,0,0,0.8)] border-b-8 border-[#1a1a1a] relative">

                    {/* Glare effect on the bezel */}
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent pointer-events-none rounded-2xl z-20"></div>

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
                                    <div className="text-2xl text-[#00ffcc] font-mono tracking-widest font-bold drop-shadow-[0_0_8px_#00ffcc] cursor-pointer" onClick={handleStart}>
                                        PRESS START
                                    </div>
                                ) : (
                                    <div className="text-2xl text-[#ff0040] font-mono tracking-widest font-bold drop-shadow-[0_0_8px_#ff0040]">
                                        INSERT COIN
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Screen Glare (Glass Reflection) OVER the iframe */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none z-30"></div>

                        {/* Scanlines inside the screen are handled by .skeuo-screen::before in globals.css */}

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
                <div className="w-[105%] sm:w-[110%] mt-4 bg-gradient-to-b from-[#222] to-[#111] p-6 sm:p-8 rounded-lg shadow-[0_15px_30px_rgba(0,0,0,0.9)] border-t-4 border-[#444] border-b-8 border-black relative overflow-hidden -mx-8 flex justify-between items-end">

                    {/* Control Panel Artwork Background */}
                    <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #ff0040, #ff0040 10px, transparent 10px, transparent 20px)' }}></div>

                    {/* Left Controls (Joystick Area Placeholder) */}
                    <div className="flex gap-4 relative z-10 p-4 skeuo-metal rounded-xl border-4 border-gray-600 bg-gray-400">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-red-800 shadow-[inset_-5px_-5px_15px_rgba(0,0,0,0.5),_5px_15px_20px_rgba(0,0,0,0.8)] border border-red-400 relative flex items-center justify-center cursor-pointer hover:-translate-y-1 hover:shadow-[5px_20px_25px_rgba(0,0,0,0.8)] transition-all">
                            <div className="absolute w-2 h-8 bg-gradient-to-b from-gray-400 to-gray-800 bottom-[-30px] shadow-lg"></div>
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
                        <div className="skeuo-mechanical-counter text-[#ff0000] text-3xl px-3 py-1 rounded shadow-[0_0_10px_rgba(255,0,0,0.2)]">
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
