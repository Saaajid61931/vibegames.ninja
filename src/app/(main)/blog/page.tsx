"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  Calendar, 
  Clock, 
  ArrowRight, 
  BookOpen, 
  Search, 
  BookOpenCheck,
  Tag
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BLOG_POSTS } from "@/lib/blog-data";

export default function BlogPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("ALL");

  const categories = [
    { value: "ALL", label: "ALL POSTS" },
    { value: "TIPS_AND_TRICKS", label: "TIPS & TRICKS" },
    { value: "AI_UPDATES", label: "AI UPDATES" },
    { value: "DEVLOGS", label: "DEVLOGS" }
  ];

  // Filter posts based on category and search query
  const filteredPosts = BLOG_POSTS.filter((post) => {
    const matchesCategory = activeCategory === "ALL" || post.category === activeCategory;
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Find the featured post (latest post, for example post-1)
  const featuredPost = BLOG_POSTS.find(post => post.id === "post-1") || BLOG_POSTS[0];

  // Filter out featured post from the grid if we are showing all
  const gridPosts = activeCategory === "ALL" && !searchQuery
    ? filteredPosts.filter(post => post.id !== featuredPost.id)
    : filteredPosts;

  return (
    <div className="min-h-screen flex flex-col bg-[#0d0d15] text-white">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 sm:py-12">
        <div className="max-w-6xl mx-auto">
          
          {/* Page Title Header */}
          <div className="mb-10 border-b-2 border-[#4a4a6a] pb-8 text-center sm:text-left">
            <div className="mb-2 flex items-center justify-center sm:justify-start gap-2">
              <BookOpenCheck className="h-5 w-5 text-[#ffff00]" />
              <span className="text-[#ffff00] font-arcade text-sm uppercase tracking-wider">VIBE_LOG // Dev & AI Hub</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold font-arcade uppercase text-white tracking-wide">
              Arcade Logs & Guides
            </h1>
            <p className="text-[#8b93a6] mt-2 font-arcade text-xs uppercase max-w-xl">
              Master the craft of building, styling, and optimizing web games with LLMs, prompt engineering, and platform integrations.
            </p>
          </div>

          {/* Search and Category Filter Controls */}
          <div className="mb-10 flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Category tabs */}
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setActiveCategory(cat.value)}
                  className={`px-4 py-2 border-2 text-xs font-bold font-pixel tracking-wider transition-all uppercase ${
                    activeCategory === cat.value
                      ? "border-[var(--color-arcade-yellow)] bg-[var(--color-arcade-yellow)] text-black shadow-[2px_2px_0_#000]"
                      : "border-[#4a4a6a] bg-[#11111d] text-white hover:border-[var(--color-arcade-yellow)] hover:text-[var(--color-arcade-yellow)]"
                  }`}
                  id={`tab-${cat.value.toLowerCase()}`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8b93a6] pointer-events-none" />
              <Input
                variant="arcade"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="SEARCH POSTS..."
                className="pl-9 font-arcade uppercase text-xs"
                id="search-blog-input"
              />
            </div>
          </div>

          {/* Featured Post Card (only show if viewing ALL and not searching) */}
          {activeCategory === "ALL" && !searchQuery && featuredPost && (
            <div className="mb-12">
              <Card variant="arcade">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 sm:p-6">
                  {/* Featured Image */}
                  <div className="lg:col-span-7 relative aspect-video w-full overflow-hidden border-3 border-[#4a4a6a]">
                    <Image
                      src={featuredPost.coverImage}
                      alt={featuredPost.title}
                      fill
                      unoptimized
                      priority
                      className="object-cover transition-transform duration-500 hover:scale-102"
                    />
                    <div className="absolute top-3 left-3">
                      <Badge variant="arcade">FEATURED LOG</Badge>
                    </div>
                  </div>

                  {/* Featured Info */}
                  <div className="lg:col-span-5 flex flex-col justify-between py-2">
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 text-xs font-arcade text-[#8b93a6]">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-[#ffff00]" />
                          {featuredPost.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-[#00ff40]" />
                          {featuredPost.readTime}
                        </span>
                      </div>

                      <h2 className="text-xl sm:text-2xl font-bold font-arcade uppercase text-white hover:text-[var(--color-arcade-yellow)] transition-colors leading-tight">
                        <Link href={`/blog/${featuredPost.slug}`}>
                          {featuredPost.title}
                        </Link>
                      </h2>

                      <p className="text-[#8b93a6] text-xs font-arcade leading-relaxed">
                        {featuredPost.excerpt}
                      </p>

                      <div className="flex flex-wrap gap-2 pt-2">
                        {featuredPost.tags.map((tag) => (
                          <span key={tag} className="inline-flex items-center gap-1 text-[10px] font-pixel text-[var(--color-arcade-yellow)] border border-[var(--color-arcade-yellow)]/30 px-2 py-0.5 bg-[var(--color-arcade-yellow)]/5">
                            <Tag className="h-2.5 w-2.5" />
                            {tag.toUpperCase()}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-6 lg:pt-0">
                      <Link href={`/blog/${featuredPost.slug}`} className="block">
                        <Button variant="arcade" className="w-full sm:w-auto gap-2 font-arcade uppercase">
                          READ LOG ENTRY
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Posts Grid */}
          {filteredPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gridPosts.map((post) => (
                <Card variant="arcade" key={post.id} className="flex flex-col h-full">
                  {/* Card Thumbnail */}
                  <div className="relative aspect-video w-full overflow-hidden border-b-3 border-[#4a4a6a]">
                    <Image
                      src={post.coverImage}
                      alt={post.title}
                      fill
                      unoptimized
                      className="object-cover transition-transform duration-500 hover:scale-102"
                    />
                    <div className="absolute top-2 right-2">
                      <span className="bg-[#0d0d15] border-2 border-[#4a4a6a] px-2 py-0.5 text-[8px] font-pixel font-bold text-white tracking-wider uppercase">
                        {post.category.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <CardHeader variant="arcade" className="p-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-3">
                      {/* Meta */}
                      <div className="flex items-center gap-3 text-[10px] font-arcade text-[#8b93a6]">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-[#ffff00]" />
                          {post.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-[#00ff40]" />
                          {post.readTime}
                        </span>
                      </div>

                      {/* Title */}
                      <CardTitle className="font-arcade text-sm text-white hover:text-[var(--color-arcade-yellow)] transition-colors leading-snug line-clamp-2 uppercase">
                        <Link href={`/blog/${post.slug}`}>
                          {post.title}
                        </Link>
                      </CardTitle>

                      {/* Excerpt */}
                      <CardDescription className="font-arcade text-xs text-[#8b93a6] leading-relaxed line-clamp-3">
                        {post.excerpt}
                      </CardDescription>
                    </div>

                    <div className="pt-4 flex flex-col gap-3">
                      {/* Tags */}
                      <div className="flex flex-wrap gap-1.5">
                        {post.tags.slice(0, 2).map((tag) => (
                          <span key={tag} className="text-[9px] font-pixel text-[var(--color-arcade-yellow)]/80">
                            #{tag.toUpperCase()}
                          </span>
                        ))}
                      </div>
                      
                      <Link href={`/blog/${post.slug}`} className="block">
                        <Button variant="arcade-outline" className="w-full text-xs font-arcade uppercase h-10">
                          READ LOG
                          <ArrowRight className="h-3.5 w-3.5 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : (
            /* No Results State */
            <div className="text-center py-16 border-2 border-dashed border-[#4a4a6a] bg-[#11111d]">
              <BookOpen className="h-12 w-12 text-[#ff0040] mx-auto mb-4" />
              <h3 className="font-arcade text-lg text-white mb-2 uppercase">No Logs Found</h3>
              <p className="font-arcade text-xs text-[#8b93a6] uppercase max-w-sm mx-auto">
                No articles match your search or filter criteria. Try checking another category or clearing your search.
              </p>
              <Button 
                variant="arcade-outline" 
                className="mt-6 font-arcade uppercase text-xs"
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("ALL");
                }}
              >
                RESET FILTERS
              </Button>
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}
