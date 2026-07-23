import Link from "next/link"
import { Eye, Gamepad2, Heart, Play, Sparkles, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GameThumbnailSlideshow } from "@/components/games/game-thumbnail-slideshow"

type FeaturedGame = {
  slug: string
  title: string
  description: string
  thumbnail?: string | null
  thumbnailSlides?: string[]
  category: string
  plays: number
  likes: number
  aiModel?: string | null
}

type HomeHeroSectionProps = {
  featuredGame: FeaturedGame | null
}

export function HomeHeroSection({ featuredGame }: HomeHeroSectionProps) {
  const playHref = featuredGame ? `/play/${featuredGame.slug}` : "/games"

  return (
    <section className="relative overflow-hidden border-b-2 border-[#4a4a6a] sm:border-b-4">
      <div className="absolute inset-0 pixel-bg" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_30%,rgba(0,128,255,0.18),transparent_34%),radial-gradient(circle_at_15%_80%,rgba(255,0,64,0.14),transparent_30%)]" />

      <div className="container relative mx-auto px-4 py-16 md:py-20 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 border border-[#00d1ff]/60 bg-[#00d1ff]/10 px-3 py-2 font-pixel text-[9px] text-[#80e8ff] shadow-[3px_3px_0_rgba(255,0,64,0.6)]">
              <Sparkles className="h-3.5 w-3.5" />
              PLAYABLE AI EXPERIMENTS · NO INSTALLS
            </div>

            <h1 className="font-pixel text-[clamp(2rem,5.8vw,4.65rem)] leading-[1.08] tracking-[-0.04em] text-white">
              PLAY SOMETHING
              <span className="mt-3 block text-[#ffff00] drop-shadow-[4px_4px_0_#ff0040]">
                YOU&apos;VE NEVER SEEN
              </span>
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-relaxed text-[#b9c3d9] md:text-xl">
              Instant browser games made by AI-powered creators. Jump into a featured experiment,
              discover unexpected ideas, or publish one of your own.
            </p>

            <div className="mt-8 flex max-w-xl flex-col gap-3 sm:flex-row">
              <Link href={playHref} prefetch={false} className="block flex-1 sm:flex-none">
                <Button variant="arcade" size="xl" className="w-full gap-3 sm:w-auto">
                  <Play className="h-5 w-5 fill-current" />
                  {featuredGame ? "PLAY FEATURED GAME" : "ENTER THE ARCADE"}
                </Button>
              </Link>
              <Link href="/upload" prefetch={false} className="block flex-1 sm:flex-none">
                <Button variant="outline" size="xl" className="w-full gap-3 sm:w-auto">
                  <Upload className="h-5 w-5" />
                  PUBLISH A GAME
                </Button>
              </Link>
            </div>

            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 border-t border-[#4a4a6a] pt-6 text-xs font-medium text-[#8f9bb3]">
              <span className="flex items-center gap-2"><Gamepad2 className="h-4 w-4 text-[#00d1ff]" /> Instant play</span>
              <span className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-[#ffff00]" /> Creator-made</span>
              <span className="flex items-center gap-2"><Heart className="h-4 w-4 text-[#ff4f7a]" /> Free to explore</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-2xl lg:max-w-none">
            <div className="absolute -inset-3 bg-[#0080ff]/20 blur-2xl" />
            <div className="relative border-2 border-[#6670ff] bg-[#11111d] p-2 shadow-[10px_10px_0_#ff0040]">
              <div className="flex items-center justify-between border-b border-[#31384e] px-2 py-2">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 bg-[#ff0040]" />
                  <span className="h-2.5 w-2.5 bg-[#ffff00]" />
                  <span className="h-2.5 w-2.5 bg-[#00d1ff]" />
                </div>
                <span className="font-pixel text-[8px] text-[#9ba6bd]">FEATURED CARTRIDGE</span>
              </div>

              {featuredGame ? (
                <Link href={`/play/${featuredGame.slug}`} prefetch={false} className="group block">
                  <div className="relative aspect-[16/10] overflow-hidden bg-[#090b12]">
                    {featuredGame.thumbnail ? (
                      <GameThumbnailSlideshow
                        title={featuredGame.title}
                        thumbnail={featuredGame.thumbnail}
                        thumbnailSlides={featuredGame.thumbnailSlides}
                        sizes="(max-width: 1024px) 100vw, 45vw"
                        priority
                        animateSlides={false}
                        imageClassName="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="absolute inset-0 grid place-items-center bg-[linear-gradient(135deg,#15192b,#0d0d15)]">
                        <Gamepad2 className="h-20 w-20 text-[#4a4a6a]" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#080910] via-transparent to-black/20" />
                    <div className="absolute inset-0 grid place-items-center opacity-0 transition-opacity group-hover:opacity-100">
                      <span className="grid h-16 w-16 place-items-center rounded-full bg-[#ffff00] text-[#0d0d15] shadow-[4px_4px_0_#ff0040]">
                        <Play className="ml-1 h-8 w-8 fill-current" />
                      </span>
                    </div>
                    <span className="absolute left-3 top-3 border border-[#ffff00] bg-black/80 px-2 py-1 font-pixel text-[8px] text-[#ffff00]">
                      {featuredGame.category.toUpperCase()}
                    </span>
                  </div>

                  <div className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h2 className="truncate font-pixel text-sm text-white sm:text-base">{featuredGame.title}</h2>
                        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[#9ba6bd]">{featuredGame.description}</p>
                      </div>
                      <span className="shrink-0 bg-[#6670ff] px-3 py-2 font-pixel text-[8px] text-white transition-colors group-hover:bg-[#ffff00] group-hover:text-[#0d0d15]">
                        PLAY NOW
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-[#2d3448] pt-3 text-[11px] text-[#7f8aa3]">
                      <span className="flex items-center gap-1.5"><Eye className="h-3.5 w-3.5" /> {featuredGame.plays} plays</span>
                      <span className="flex items-center gap-1.5"><Heart className="h-3.5 w-3.5" /> {featuredGame.likes}</span>
                      {featuredGame.aiModel ? <span className="truncate">Built with {featuredGame.aiModel}</span> : null}
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="grid aspect-[16/10] place-items-center bg-[linear-gradient(135deg,#15192b,#0d0d15)] p-8 text-center">
                  <div>
                    <Gamepad2 className="mx-auto h-16 w-16 text-[#6670ff]" />
                    <p className="mt-5 font-pixel text-xs text-white">THE ARCADE IS WARMING UP</p>
                    <p className="mt-3 text-sm text-[#8f9bb3]">Browse every published game while the featured cartridge loads.</p>
                    <Link href="/games" prefetch={false} className="mt-5 inline-flex font-pixel text-[9px] text-[#ffff00] hover:underline">
                      BROWSE ALL GAMES →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
