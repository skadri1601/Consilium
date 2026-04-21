"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Calendar, Clock } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/shared/lib/utils";
import { blogPosts, type BlogCategory } from "./blog-data";

const categories: Array<"All" | BlogCategory> = ["All","Benchmarks","Engineering","Product","Research",
];

const categoryColors: Record<BlogCategory, string> = {
  Benchmarks: "bg-agree/14 text-agree border-agree/30",
  Research: "bg-warm/12 text-warm border-warm/20",
  Product: "bg-warm/12 text-warm-bright border-warm/20",
  Engineering: "bg-agree/14 text-agree border-agree/30",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState<"All" | BlogCategory>("All");

  const filtered =
    activeCategory === "All"
      ? blogPosts
      : blogPosts.filter((p) => p.category === activeCategory);

  const featured = filtered.find((p) => p.featured);
  const rest = filtered.filter((p) => !p.featured);

  return (
    <div className="min-h-screen">
      <section className="pt-28 pb-16 border-b border-white/[0.08]">
        <div className="container-narrow">
          <div className="eyebrow mb-5">Blog</div>
          <h1 className="display text-[clamp(40px,6vw,72px)] leading-[1.02] max-w-[900px]">
            Notes from the <em>council.</em>
          </h1>
          <p className="mt-6 max-w-[560px] text-[17px] leading-[1.55] text-ink-secondary">
            Benchmarks, engineering posts, and research write-ups on multi-agent deliberation.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-24">
        <div className="flex flex-wrap gap-2 mb-12 justify-center">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn("px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
                activeCategory === cat
                  ? "bg-white text-black"
                  : "bg-white/[0.06] text-muted-foreground hover:bg-white/[0.1]"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {featured && (
          <Link
            href={`/blog/${featured.slug}`}
            className="group block mb-8 rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 md:p-10 transition-all hover:border-white/[0.12] hover:bg-white/[0.04]"
          >
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex-1">
                <Badge className={cn("mb-4", categoryColors[featured.category])}>
                  {featured.category}
                </Badge>
                <h2 className="text-2xl md:text-3xl font-bold mb-3 group-hover:text-primary transition-colors">
                  {featured.title}
                </h2>
                <p className="text-muted-foreground mb-4 max-w-2xl">
                  {featured.excerpt}
                </p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(featured.date)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {featured.readingTime}
                  </span>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors hidden md:block" />
            </div>
          </Link>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rest.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 transition-all hover:border-white/[0.12] hover:scale-[1.01]"
            >
              <Badge className={cn("mb-4", categoryColors[post.category])}>
                {post.category}
              </Badge>
              <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                {post.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                {post.excerpt}
              </p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3 w-3" />
                  {formatDate(post.date)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  {post.readingTime}
                </span>
              </div>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-20">
            No posts in this category yet.
          </p>
        )}
      </section>
    </div>
  );
}
