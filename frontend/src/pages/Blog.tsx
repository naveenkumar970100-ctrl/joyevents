import { motion } from "framer-motion";
import { Calendar, Clock, User, ArrowRight, Tag, Search } from "lucide-react";
import { useState } from "react";
import Layout from "@/components/Layout";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const BLOG_POSTS = [
  {
    id: 1,
    title: "10 Tips for Planning the Perfect Corporate Event",
    excerpt:
      "From venue selection to catering and entertainment — here's everything you need to know to pull off a seamless corporate event that impresses clients and energizes your team.",
    category: "Corporate Events",
    author: "Sophia Mitchell",
    date: "February 28, 2026",
    readTime: "7 min read",
    image: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&q=80",
    featured: true,
  },
  {
    id: 2,
    title: "How to Choose the Right Venue for Your Wedding",
    excerpt:
      "The venue sets the tone for your entire wedding day. Discover how to evaluate capacity, ambience, catering options, and hidden costs before you sign the contract.",
    category: "Wedding Planning",
    author: "James Harrington",
    date: "February 20, 2026",
    readTime: "6 min read",
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80",
    featured: true,
  },
  {
    id: 3,
    title: "The Ultimate Guide to Event Photography",
    excerpt:
      "Great event photography preserves your memories for a lifetime. Learn what to look for in a photographer, how to brief them, and how to get the best shots on the day.",
    category: "Photography",
    author: "Aiden Clarke",
    date: "February 14, 2026",
    readTime: "5 min read",
    image: "https://images.unsplash.com/photo-1452802447250-470a88ac82bc?w=800&q=80",
    featured: false,
  },
  {
    id: 4,
    title: "Trending Decor Ideas for 2026 Events",
    excerpt:
      "From sustainable floral arrangements to immersive lighting experiences, discover the decor trends that are defining events this year and how to incorporate them on any budget.",
    category: "Decor",
    author: "Priya Nair",
    date: "February 7, 2026",
    readTime: "4 min read",
    image: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&q=80",
    featured: false,
  },
  {
    id: 5,
    title: "Catering for Large Events: What Every Planner Should Know",
    excerpt:
      "Managing food and beverage for hundreds of guests is a logistical challenge. Here's how to coordinate with caterers, handle dietary needs, and ensure a smooth service.",
    category: "Catering",
    author: "Sophia Mitchell",
    date: "January 30, 2026",
    readTime: "6 min read",
    image: "https://images.unsplash.com/photo-1555244162-803834f70033?w=800&q=80",
    featured: false,
  },
  {
    id: 6,
    title: "Brand Activations That Actually Work: Case Studies",
    excerpt:
      "Brand activations are more than a stunt — they're an opportunity to build lasting emotional connections. We break down 5 successful activations and the strategies behind them.",
    category: "Brand Activations",
    author: "Marcus Webb",
    date: "January 22, 2026",
    readTime: "8 min read",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80",
    featured: false,
  },
];

const CATEGORIES = ["All", "Corporate Events", "Wedding Planning", "Photography", "Decor", "Catering", "Brand Activations"];

const categoryColors: Record<string, string> = {
  "Corporate Events": "bg-blue-500/20 text-blue-400",
  "Wedding Planning": "bg-pink-500/20 text-pink-400",
  "Photography": "bg-purple-500/20 text-purple-400",
  "Decor": "bg-green-500/20 text-green-400",
  "Catering": "bg-orange-500/20 text-orange-400",
  "Brand Activations": "bg-yellow-500/20 text-yellow-400",
};

const Blog = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = BLOG_POSTS.filter((p) => {
    const matchCat = activeCategory === "All" || p.category === activeCategory;
    const matchSearch =
      search === "" ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.excerpt.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const featured = BLOG_POSTS.filter((p) => p.featured);

  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-secondary/30 to-background py-24 pt-32">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <Tag className="h-3.5 w-3.5" /> JoyEvents Blog
            </span>
            <h1 className="font-display mt-4 text-2xl font-bold leading-tight sm:text-5xl md:text-6xl">
              Insights &amp; <span className="text-primary">Inspiration</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
              Expert tips, industry trends, and behind-the-scenes stories to help you plan extraordinary events with confidence.
            </p>
          </motion.div>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mx-auto mt-8 flex max-w-md items-center gap-2"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search articles..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Posts */}
      {activeCategory === "All" && search === "" && (
        <section className="container mx-auto py-16">
          <h2 className="font-display mb-8 text-2xl font-bold">
            Featured <span className="text-primary">Articles</span>
          </h2>
          <div className="grid grid-cols-2 gap-3 md:gap-8 md:grid-cols-2">
            {featured.map((post, i) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card"
              >
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <span className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-semibold ${categoryColors[post.category]}`}>
                    {post.category}
                  </span>
                </div>
                <div className="p-6">
                  <h3 className="font-display mb-2 text-xl font-bold leading-snug group-hover:text-primary transition-colors">
                    {post.title}
                  </h3>
                  <p className="mb-4 text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1"><User className="h-3 w-3" />{post.author}</span>
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{post.date}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{post.readTime}</span>
                    </div>
                    <span className="flex items-center gap-1 text-primary font-medium">
                      Read more <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </section>
      )}

      {/* Category Filter */}
      <section className="container mx-auto pb-4">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${
                activeCategory === cat
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-secondary text-muted-foreground hover:border-primary hover:text-primary"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* All Posts Grid */}
      <section className="container mx-auto py-10">
        {filtered.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">No articles found matching your search.</div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((post, i) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="group overflow-hidden rounded-2xl border border-border bg-card flex flex-col"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <span className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold ${categoryColors[post.category] || "bg-primary/20 text-primary"}`}>
                    {post.category}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-display mb-2 text-base font-bold leading-snug group-hover:text-primary transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="mb-4 flex-1 text-sm text-muted-foreground line-clamp-3">{post.excerpt}</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><User className="h-3 w-3" />{post.author}</span>
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{post.date}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{post.readTime}</span>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </section>

      {/* Newsletter CTA */}
      <section className="container mx-auto py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-3xl bg-gradient-to-br from-primary/20 via-secondary to-background border border-primary/20 p-10 text-center"
        >
          <h2 className="font-display mb-3 text-3xl font-bold">Stay in the Loop</h2>
          <p className="mx-auto mb-6 max-w-md text-muted-foreground">
            Get the latest event planning tips, trends, and exclusive offers delivered straight to your inbox.
          </p>
          <div className="mx-auto flex max-w-sm flex-col gap-3 sm:flex-row">
            <Input placeholder="Enter your email" className="flex-1" />
            <Button className="bg-gradient-primary text-primary-foreground hover:opacity-90">
              Subscribe
            </Button>
          </div>
        </motion.div>
      </section>
    </Layout>
  );
};

export default Blog;


