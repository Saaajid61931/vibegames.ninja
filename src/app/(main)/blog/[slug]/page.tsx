import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { 
  Calendar, 
  Clock, 
  ChevronLeft, 
  ArrowRight,
  BookOpenCheck,
  Tag,
  User,
  Share2
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BLOG_POSTS, getBlogPostBySlug } from "@/lib/blog-data";
import { CopyButton } from "@/components/blog/copy-button"; // Simple Client-side Copy Button

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const post = getBlogPostBySlug(resolvedParams.slug);
  if (!post) {
    return {
      title: "Log Entry Not Found - VibeGames",
    };
  }

  return {
    title: `${post.title} - VibeGames Blog`,
    description: post.excerpt,
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
    openGraph: {
      title: `${post.title} - VibeGames Blog`,
      description: post.excerpt,
      type: "article",
      authors: [post.author],
    },
    twitter: {
      card: "summary_large_image",
      title: `${post.title} - VibeGames Blog`,
      description: post.excerpt,
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const resolvedParams = await params;
  const post = getBlogPostBySlug(resolvedParams.slug);

  if (!post) {
    notFound();
  }

  // Find related posts (other posts in the catalog)
  const relatedPosts = BLOG_POSTS.filter((p) => p.slug !== post.slug).slice(0, 2);

  // Structured schema for Google Rich Results
  const blogJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image: post.coverImage,
    datePublished: new Date(post.date).toISOString(),
    author: {
      "@type": "Person",
      name: post.author,
    },
    publisher: {
      "@type": "Organization",
      name: "VibeGames.Ninja",
      logo: {
        "@type": "ImageObject",
        url: "https://www.vibegames.ninja/icon.svg",
      },
    },
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0d0d15] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }} />
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto">
          {/* Back Navigation */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-[#8b93a6] hover:text-[#ffff00] mb-6 transition-colors font-arcade text-xs uppercase"
          >
            <ChevronLeft className="h-4 w-4" />
            BACK_TO_LOGS
          </Link>

          {/* Article Header Card */}
          <Card variant="arcade" className="mb-8">
            <div className="p-4 sm:p-6 space-y-4">
              <div className="flex items-center gap-2">
                <BookOpenCheck className="h-4 w-4 text-[#ffff00]" />
                <span className="text-[#ffff00] font-arcade text-xs uppercase tracking-wider">
                  VIBE_LOG // CATEGORY: {post.category.replace(/_/g, " ")}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold font-arcade uppercase text-white leading-tight">
                {post.title}
              </h1>

              <p className="text-[#8b93a6] text-xs font-arcade leading-relaxed border-l-3 border-[#ffff00] pl-3">
                {post.excerpt}
              </p>

              {/* Author & Date metadata bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-t-2 border-[#4a4a6a]/60 pt-4 text-xs font-arcade text-[#8b93a6]">
                <div className="flex items-center gap-6">
                  <span className="flex items-center gap-1.5">
                    <User className="h-4 w-4 text-[#ffff00]" />
                    BY: {post.author.toUpperCase()}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-[#00ff40]" />
                    DATE: {post.date.toUpperCase()}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-[#00ff40]" />
                    TIME: {post.readTime.toUpperCase()}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[9px] font-pixel text-[var(--color-arcade-yellow)] border border-[var(--color-arcade-yellow)]/30 px-2 py-0.5"
                    >
                      #{tag.toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Cover Image */}
          <div className="relative aspect-video w-full mb-8 border-3 border-[#4a4a6a] overflow-hidden">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              unoptimized
              className="object-cover"
            />
          </div>

          {/* Blog Content Section */}
          <div className="border-2 border-[#4a4a6a] bg-[#11111d] p-6 sm:p-8 mb-12">
            <article className="space-y-6">
              {post.content.map((block, index) => {
                switch (block.type) {
                  case "paragraph":
                    return (
                      <p key={index} className="font-arcade text-xs leading-relaxed text-[#c3cddf] whitespace-pre-wrap">
                        {block.text}
                      </p>
                    );
                  case "heading":
                    return (
                      <h3 key={index} className="font-arcade text-sm sm:text-base text-white font-bold uppercase tracking-wide mt-8 mb-4 border-b-2 border-[#4a4a6a] pb-2">
                        {block.text}
                      </h3>
                    );
                  case "code":
                    return (
                      <div key={index} className="relative my-6 border-3 border-[#4a4a6a] bg-[#050508] p-4 font-mono text-xs leading-relaxed text-[#ffff00]">
                        <div className="absolute top-2 right-2 flex items-center gap-3">
                          <span className="text-[9px] font-pixel text-[#8b93a6] uppercase tracking-wider">
                            {block.language}
                          </span>
                          {block.code && <CopyButton code={block.code} />}
                        </div>
                        <pre className="overflow-x-auto pr-16 pt-3 select-all"><code className="block whitespace-pre">{block.code}</code></pre>
                      </div>
                    );
                  case "list":
                    return (
                      <ul key={index} className="list-disc pl-5 font-arcade text-xs text-[#c3cddf] space-y-2 uppercase my-4">
                        {block.items?.map((item, idx) => (
                          <li key={idx} className="leading-relaxed">{item}</li>
                        ))}
                      </ul>
                    );
                  default:
                    return null;
                }
              })}
            </article>
          </div>

          {/* Related Articles Footer */}
          {relatedPosts.length > 0 && (
            <div className="border-t-2 border-[#4a4a6a] pt-10">
              <h2 className="text-lg font-bold font-arcade uppercase text-white mb-6 tracking-wide">
                RECOMMENDED LOG ENTRIES
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {relatedPosts.map((rPost) => (
                  <Card variant="arcade" key={rPost.id} className="flex flex-col h-full">
                    {/* Thumbnail */}
                    <div className="relative aspect-video w-full overflow-hidden border-b-3 border-[#4a4a6a]">
                      <Image
                        src={rPost.coverImage}
                        alt={rPost.title}
                        fill
                        unoptimized
                        className="object-cover transition-transform duration-500 hover:scale-102"
                      />
                    </div>
                    {/* Details */}
                    <CardHeader variant="arcade" className="p-4 flex-1 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 text-[9px] font-arcade text-[#8b93a6]">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-[#ffff00]" />
                            {rPost.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-[#00ff40]" />
                            {rPost.readTime}
                          </span>
                        </div>
                        <CardTitle className="font-arcade text-xs text-white leading-snug line-clamp-2 uppercase">
                          <Link href={`/blog/${rPost.slug}`}>
                            {rPost.title}
                          </Link>
                        </CardTitle>
                      </div>
                      <Link href={`/blog/${rPost.slug}`} className="block pt-4">
                        <Button variant="arcade-outline" className="w-full text-xs font-arcade uppercase h-10">
                          READ LOG
                          <ArrowRight className="h-3.5 w-3.5 ml-2" />
                        </Button>
                      </Link>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}
