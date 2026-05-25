import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Mail, Phone, MapPin, Clock, Send, MessageSquare } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { STATIC_IMAGES } from "@/lib/staticImages";
import { useState } from "react";
import { toast } from "sonner";
import { usePlatformName, useSupportEmail } from "@/hooks/usePlatformName";
import { sanitizeEmailInput, validateEmail, EMAIL_HINT, EMAIL_MAX_LENGTH } from "@/lib/validation";

const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);
  const platformName = usePlatformName();
  const supportEmail = useSupportEmail();

  const CONTACT_INFO = [
    { icon: Mail,    title: "Email Us",       value: supportEmail,           desc: "For proposals, event planning questions, and project discussions." },
    { icon: Phone,   title: "Call Us",        value: "+1 (555) 123-4567",    desc: "Fast communication on timelines, budgets, and availability." },
    { icon: MapPin,  title: "Visit Us",       value: "San Francisco, CA",    desc: "In-person planning sessions and creative reviews by appointment." },
    { icon: Clock,   title: "Business Hours", value: "Mon–Fri, 9am–6pm PST", desc: "Average response time under 2 hours during business hours." },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error("Please fill in all required fields");
      return;
    }
    const emailErr = validateEmail(form.email);
    if (emailErr) {
      toast.error(emailErr);
      return;
    }
    setSending(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 800));
    toast.success("Message sent! We'll get back to you within 24 hours.");
    setForm({ name: "", email: "", subject: "", message: "" });
    setSending(false);
  };

  return (
    <Layout>
      {/* ── Hero ─────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden">
        <img src={STATIC_IMAGES.contactHero} alt="Event planning consultation" className="h-[75vh] w-full object-cover" loading="eager" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
        <div className="absolute inset-0 flex items-center">
          <div className="container mx-auto">
            <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }} className="max-w-xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Contact Us</p>
              <h1 className="mt-4 font-display text-lg sm:text-2xl font-bold leading-tight text-white sm:text-5xl md:text-6xl">
                Let's plan your next event with <span className="text-primary">clarity</span>
              </h1>
              <p className="mt-5 text-lg text-white/75">
                Tell us what you're planning and we'll help shape the right event workflow, service package, and execution path.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/services">
                  <Button className="bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-90">
                    Explore Services <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/events">
                  <Button variant="outline">Browse Events</Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Stats ───────────────────────────────────── */}
      <section className="border-y border-border bg-secondary/30 py-10">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
            {[
              { value: "< 2 hrs", label: "Avg. Response Time" },
              { value: "1,800+",  label: "Events Supported" },
              { value: "98%",    label: "Client Satisfaction" },
              { value: "24/7",   label: "On-Event Support" },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <div className="font-display text-xl sm:text-4xl font-bold text-primary">{s.value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact Info + Form ─────────────────────── */}
      <section className="container mx-auto py-20">
        <div className="grid gap-12 lg:grid-cols-2">
          {/* Left: Contact info */}
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">Get in Touch</p>
            <h2 className="font-display mt-3 text-4xl font-bold leading-tight">
              We're here to help, <span className="text-primary">every step of the way</span>
            </h2>
            <p className="mt-5 text-muted-foreground leading-relaxed">
              Whether you're planning an intimate gathering or a large-scale celebration, our team is ready to guide you through every decision. Reach out — we typically respond within 2 hours.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-1">
              {CONTACT_INFO.map((item) => (
                <div key={item.title} className="flex items-start gap-2 sm:gap-4 rounded-xl border border-border bg-card p-3 sm:p-4">
                  <div className="flex h-7 w-7 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <item.icon className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-foreground text-[11px] sm:text-sm">{item.title}</div>
                    <div className="text-[10px] sm:text-sm text-muted-foreground line-clamp-2">{item.desc}</div>
                    <div className="mt-0.5 font-medium text-primary text-[10px] sm:text-sm truncate">{item.value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Second image - placed below contact info */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }} className="relative mt-8 overflow-hidden rounded-3xl shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=900&q=80"
                alt="Our team ready to assist"
                className="h-[320px] w-full object-cover"
              />
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-black/40 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 rounded-xl border border-white/20 bg-black/30 p-4 backdrop-blur">
                <div className="font-semibold text-white text-sm">Ready when you are</div>
                <div className="text-xs text-white/80">Let's make your event unforgettable</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right: Contact form */}
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <div className="rounded-3xl border border-border bg-card p-8 shadow-xl">
              <div className="mb-6 flex items-center gap-3">
                <MessageSquare className="h-6 w-6 text-primary" />
                <h3 className="font-display text-lg sm:text-2xl font-bold">Send us a message</h3>
              </div>
              <form onSubmit={handleSubmit} className="grid gap-4">
                <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Your Name *</label>
                    <Input placeholder="John Doe" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-secondary" required />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Your Email *</label>
                    <Input type="text" inputMode="email" maxLength={EMAIL_MAX_LENGTH} placeholder="user@gmail.com" value={form.email} onChange={(e) => setForm({ ...form, email: sanitizeEmailInput(e.target.value) })} className="bg-secondary" required />
                    <p className="mt-1 text-xs text-muted-foreground">{EMAIL_HINT}</p>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Subject</label>
                  <Input placeholder="Wedding enquiry" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="bg-secondary" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Message *</label>
                  <Textarea placeholder="Tell us about your event..." rows={6} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="bg-secondary resize-none" required />
                </div>
                <Button type="submit" className="w-full bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-90" disabled={sending}>
                  {sending ? (
                    <>Sending…</>
                  ) : (
                    <>
                      Send Message <Send className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  By submitting, you agree to our Privacy Policy. We'll never share your information.
                </p>
              </form>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────── */}
      <section className="container mx-auto pb-20">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="rounded-3xl bg-gradient-to-br from-primary/20 via-secondary to-background border border-primary/20 p-12 text-center">
          <h2 className="font-display text-xl sm:text-4xl font-bold">Still have questions?</h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Our support team is available Monday–Friday, 9am–6pm. We typically respond within 2 hours.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a href="tel:+15551234567">
              <Button className="gap-2 bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-90">
                <Phone className="h-4 w-4" /> Call Now
              </Button>
            </a>
            <Link to="/about">
              <Button variant="outline">Learn More About Us</Button>
            </Link>
          </div>
        </motion.div>
      </section>
    </Layout>
  );
};

export default Contact;


