import { motion } from "framer-motion";
import { Calendar, Trash2, Pencil, Plus, ImageIcon, Loader2, AlertCircle, X, Clock, MapPin, DollarSign, Upload, Ticket } from "lucide-react";
import MerchantLayout from "@/components/MerchantLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiListMyEvents, apiCreateEventWithImage, apiUpdateEventWithImage, apiDeleteEvent, apiListCategories } from "@/lib/api";
import { API_URL } from "@/lib/config";
import { toast } from "sonner";

const imgSrc = (image: string) => !image ? "" : image.startsWith("http") ? image : `${API_URL}${image}`;

const EMPTY_FORM = {
  title: "", description: "", date: "", time: "", location: "", price: "", category: "General", status: "upcoming", maxAttendees: ""
};

const MerchantEvents = () => {
  const { token } = useAuth() as any;
  const [events, setEvents] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [eventType, setEventType] = useState<"ticketed" | "fullService">("fullService");
  const [ticketedType, setTicketedType] = useState<"normal" | "dayNight" | null>(null);
  const [selectedSession, setSelectedSession] = useState<"day" | "night" | null>(null);
  const [ticketTypes, setTicketTypes] = useState<Array<{ name: string; price: string; available: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const loadEvents = async () => {
    try {
      const [eventsRes, catsRes] = await Promise.all([
        apiListMyEvents(token).catch(() => ({ events: [] })),
        apiListCategories("event").catch(() => ({ categories: [] }))
      ]);

      const loadedEvents = eventsRes.events || [];
      const dbCategories = catsRes.categories || [];

      // Events are already filtered by backend to show only merchant's own events
      setEvents(loadedEvents);

      const allCategories = Array.from(new Set([
        ...dbCategories.map((c: any) => c.name),
        ...loadedEvents.map((e: any) => e.category || "General")
      ]));

      setCategories(allCategories);
    } catch {
      toast.error("Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadEvents(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setImageFile(null);
    setImagePreview("");
    setGalleryFiles([]);
    setGalleryPreviews([]);
    setEventType("fullService");
    setTicketedType(null);
    setSelectedSession(null);
    setTicketTypes([]);
    setShowModal(true);
  };

  const openEdit = (ev: any) => {
    setEditingId(ev._id);
    const dt = new Date(ev.datetime);
    setForm({
      title: ev.title || "",
      description: ev.description || "",
      date: dt.toISOString().slice(0, 10),
      time: dt.toTimeString().slice(0, 5),
      location: ev.location || "",
      price: String(ev.price || ""),
      category: ev.category || "General",
      status: ev.status || "upcoming",
      maxAttendees: String(ev.maxAttendees || "")
    });
    setImagePreview(imgSrc(ev.image));
    setImageFile(null);
    setGalleryFiles([]);
    setGalleryPreviews([]);
    
    // Load ticket data if ticketed event
    if (ev.eventType === "ticketed") {
      setEventType("ticketed");
      
      if (ev.hasMultipleSessions && ev.sessions) {
        // Day/Night sessions
        setTicketedType("dayNight");
        setSelectedSession(null);
        setTicketTypes([]);
      } else {
        // Normal tickets
        setTicketedType("normal");
        setSelectedSession(null);
        setTicketTypes(ev.tickets?.map((t: any) => ({
          name: t.type,
          price: String(t.price),
          available: String(t.available)
        })) || []);
      }
    } else {
      setEventType("fullService");
      setTicketedType(null);
      setSelectedSession(null);
      setTicketTypes([]);
    }
    
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    setDeletingId(id);
    try {
      await apiDeleteEvent(id, token);
      toast.success("Event deleted");
      loadEvents();
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete event");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('date', form.date);
      formData.append('time', form.time);
      formData.append('location', form.location);
      formData.append('category', form.category);
      formData.append('status', form.status);
      formData.append('eventType', eventType);
      
      if (eventType === "fullService") {
        formData.append('price', String(form.price));
        if (form.maxAttendees) formData.append('maxAttendees', String(form.maxAttendees));
      } else {
        formData.append('price', '0');
        
        if (ticketedType === "normal") {
          // Normal tickets - single session
          formData.append('hasMultipleSessions', 'false');
          formData.append('tickets', JSON.stringify([
            { type: 'silver', price: parseFloat(ticketTypes[0]?.price || '0'), available: parseInt(ticketTypes[0]?.available || '100') },
            { type: 'gold', price: parseFloat(ticketTypes[1]?.price || '0'), available: parseInt(ticketTypes[1]?.available || '100') },
            { type: 'diamond', price: parseFloat(ticketTypes[2]?.price || '0'), available: parseInt(ticketTypes[2]?.available || '100') }
          ]));
        } else if (ticketedType === "dayNight") {
          // Day/Night sessions - separate tickets for each
          formData.append('hasMultipleSessions', 'true');
          formData.append('sessions', JSON.stringify({
            day: {
              enabled: true,
              time: "09:00 AM",
              tickets: [
                { type: 'silver', price: parseFloat(ticketTypes[0]?.price || '0'), available: parseInt(ticketTypes[0]?.available || '100') },
                { type: 'gold', price: parseFloat(ticketTypes[1]?.price || '0'), available: parseInt(ticketTypes[1]?.available || '100') },
                { type: 'diamond', price: parseFloat(ticketTypes[2]?.price || '0'), available: parseInt(ticketTypes[2]?.available || '100') }
              ]
            },
            night: {
              enabled: true,
              time: "06:00 PM",
              tickets: [
                { type: 'silver', price: parseFloat(ticketTypes[3]?.price || '0'), available: parseInt(ticketTypes[3]?.available || '100') },
                { type: 'gold', price: parseFloat(ticketTypes[4]?.price || '0'), available: parseInt(ticketTypes[4]?.available || '100') },
                { type: 'diamond', price: parseFloat(ticketTypes[5]?.price || '0'), available: parseInt(ticketTypes[5]?.available || '100') }
              ]
            }
          }));
        }
      }
      
      if (imageFile) {
        formData.append('image', imageFile);
      }
      // Add gallery images
      galleryFiles.forEach((file) => {
        formData.append('gallery', file);
      });

      if (editingId) {
        await apiUpdateEventWithImage(editingId, formData, token);
        toast.success("Event updated successfully!");
        // Dispatch custom event to notify other pages about the update
        window.dispatchEvent(new CustomEvent('eventUpdated', { detail: { eventId: editingId } }));
        // Also dispatch a global update event
        window.dispatchEvent(new CustomEvent('globalEventUpdate'));
      } else {
        await apiCreateEventWithImage(formData, token);
        toast.success("Event created successfully!");
        // Dispatch custom event to notify other pages about the new event
        window.dispatchEvent(new CustomEvent('eventCreated'));
        window.dispatchEvent(new CustomEvent('globalEventUpdate'));
      }
      setShowModal(false);
      loadEvents();
    } catch (err: any) {
      toast.error(err?.message || "Operation failed");
    }
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setGalleryFiles(prev => [...prev, ...newFiles].slice(0, 4));
      setGalleryPreviews(prev => [...prev, ...newPreviews].slice(0, 4));
    }
  };

  const removeGalleryImage = (index: number) => {
    setGalleryFiles(prev => prev.filter((_, i) => i !== index));
    setGalleryPreviews(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <MerchantLayout>
      <section className="py-2 sm:py-8 lg:py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-3xl font-bold">
              My <span className="text-gradient">Events</span>
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Manage your created events - edit or delete only what you own</p>
          </div>
          <Button onClick={openCreate} className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow">
            <Plus className="mr-2 h-4 w-4" /> Add Event
          </Button>
        </div>



        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading…
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-10 text-center text-muted-foreground">
            <AlertCircle className="mx-auto mb-3 h-8 w-8 opacity-40" />
            No events yet. Create your first event to get started. Only your events are shown here.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map((ev) => (
              <motion.div
                key={ev._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="group rounded-2xl border border-border bg-card overflow-hidden flex flex-col hover:border-primary/50 transition-colors"
              >
                {/* Image */}
                <div className="relative overflow-hidden bg-secondary flex-shrink-0 aspect-[3/4] sm:aspect-auto sm:h-52">
                  {imgSrc(ev.image) ? (
                    <img src={imgSrc(ev.image)} alt={ev.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <ImageIcon className="h-12 w-12 opacity-30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  <span className="absolute bottom-3 left-3 rounded-full bg-gradient-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                    {ev.category}
                  </span>
                  <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEdit(ev)}
                      className="rounded-full bg-black/60 p-2 hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(ev._id)}
                      disabled={deletingId === ev._id}
                      className="rounded-full bg-black/60 p-2 hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50"
                    >
                      {deletingId === ev._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="p-2 sm:p-5 flex flex-col flex-1">
                  <h3 className="font-display font-semibold text-lg line-clamp-1">{ev.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{ev.location}</p>
                  <p className="text-xs text-muted-foreground">{new Date(ev.datetime).toLocaleString()}</p>

                  {/* Ticket stats */}
                  {ev.eventType === "ticketed" && (
                    <div className="mt-3 border-t border-border pt-2">
                      <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1 mb-1">
                        <Ticket className="h-3 w-3" /> Tickets Booked:
                      </p>
                      {(() => {
                        const allTickets: { type: string; available: number; sold: number }[] = [];
                        if (ev.hasMultipleSessions && ev.sessions) {
                          ["day", "night"].forEach((s) => {
                            if (ev.sessions[s]?.enabled && ev.sessions[s]?.tickets) {
                              ev.sessions[s].tickets.forEach((t: any) => {
                                const existing = allTickets.find(x => x.type === t.type);
                                if (existing) { existing.available += t.available || 0; existing.sold += t.sold || 0; }
                                else allTickets.push({ type: t.type, available: t.available || 0, sold: t.sold || 0 });
                              });
                            }
                          });
                        } else if (ev.tickets?.length) {
                          ev.tickets.forEach((t: any) => allTickets.push({ type: t.type, available: t.available || 0, sold: t.sold || 0 }));
                        }
                        const totalSold = allTickets.reduce((s, t) => s + t.sold, 0);
                        const totalAvailable = allTickets.reduce((s, t) => s + t.available, 0);
                        return (
                          <>
                            <div className="flex items-center gap-1 text-xs mb-1">
                              <span className="font-semibold text-primary">{totalSold}</span>
                              <span className="text-muted-foreground">/ {totalAvailable} total</span>
                              {totalSold >= totalAvailable && totalAvailable > 0 && <span className="ml-1 text-red-500 font-semibold">Sold Out</span>}
                            </div>
                            {allTickets.map((t) => {
                              const remaining = t.available - t.sold;
                              return (
                                <div key={t.type} className="flex items-center justify-between text-xs">
                                  <span className="capitalize text-muted-foreground">{t.type}:</span>
                                  <span className={remaining <= 0 ? "text-red-500 font-semibold" : "text-green-500 font-semibold"}>
                                    {t.sold}/{t.available} {remaining <= 0 ? "· Sold Out" : `· ${remaining} left`}
                                  </span>
                                </div>
                              );
                            })}
                          </>
                        );
                      })()}
                    </div>
                  )}

                  {ev.eventType === "fullService" && (
                    <div className="mt-2 flex items-center gap-1 text-xs">
                      <span className="text-muted-foreground">👥 Attendees:</span>
                      <span className="font-semibold text-primary">{ev.attendeesCount || 0}</span>
                      {ev.maxAttendees > 0 && <span className="text-muted-foreground">/ {ev.maxAttendees}</span>}
                    </div>
                  )}

                  <div className="flex-1" />

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm font-semibold text-primary">
                      {ev.eventType === "ticketed"
                        ? (() => {
                            const allPrices: number[] = [];
                            if (ev.hasMultipleSessions && ev.sessions) {
                              ["day", "night"].forEach((s) => { if (ev.sessions[s]?.enabled) ev.sessions[s].tickets?.forEach((t: any) => { if (t.price > 0) allPrices.push(t.price); }); });
                            } else { (ev.tickets || []).forEach((t: any) => { if (t.price > 0) allPrices.push(t.price); }); }
                            if (!allPrices.length) return "Free";
                            const min = Math.min(...allPrices), max = Math.max(...allPrices);
                            return min === max ? `₹${min}` : `₹${min} – ₹${max}`;
                          })()
                        : `₹${ev.price}`}
                    </span>
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold capitalize ${ev.status === "upcoming" ? "bg-blue-500/15 text-blue-400" : ev.status === "ongoing" ? "bg-green-500/15 text-green-400" : "bg-gray-500/15 text-gray-400"}`}>
                      {ev.status}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="relative w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-xl max-h-[90vh] overflow-y-auto">
              <button
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
                onClick={() => setShowModal(false)}
              >
                <X className="h-5 w-5" />
              </button>

              <h2 className="font-display text-2xl font-bold mb-1">
                {editingId ? "Edit Event" : "Create New Event"}
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                {editingId ? "Update event details" : "Fill in the details to publish your event"}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Image Upload */}
                <div>
                  <Label className="text-sm text-muted-foreground mb-2 block">Event Cover Image</Label>
                  <div
                    className="flex h-48 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-border bg-card transition-colors hover:border-primary"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setImageFile(e.target.files[0]);
                          setImagePreview(URL.createObjectURL(e.target.files[0]));
                        }
                      }}
                      className="hidden"
                    />
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="h-full w-full object-cover rounded-xl" />
                    ) : (
                      <div className="text-center">
                        <ImageIcon className="mx-auto h-8 w-8 text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">Click to upload event cover image</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Gallery Images Upload */}
                <div>
                  <Label className="text-sm text-muted-foreground mb-2 block flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Gallery Images (Up to 4 images)
                  </Label>
                  <div
                    className="flex h-32 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-border bg-card transition-colors hover:border-primary"
                    onClick={() => galleryInputRef.current?.click()}
                  >
                    <input
                      ref={galleryInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleGalleryUpload}
                      className="hidden"
                    />
                    {galleryPreviews.length === 0 ? (
                      <div className="text-center">
                        <ImageIcon className="mx-auto h-8 w-8 text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">Click to upload gallery images (max 4)</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-2 p-2">
                        {galleryPreviews.map((preview, idx) => (
                          <div key={idx} className="relative aspect-square overflow-hidden rounded-lg">
                            <img src={preview} alt={`Gallery ${idx + 1}`} className="h-full w-full object-cover" />
                            <button
                              type="button"
                              onClick={() => removeGalleryImage(idx)}
                              className="absolute top-1 right-1 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                        {galleryPreviews.length < 4 && (
                          <div className="flex h-full items-center justify-center text-muted-foreground">
                            <Plus className="h-6 w-6" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {galleryPreviews.length > 0 && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {galleryPreviews.length} / 4 images selected
                    </p>
                  )}
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground">Event Title</Label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Enter event title"
                    required
                  />
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground">Description</Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Describe your event..."
                    rows={3}
                    required
                  />
                </div>

                {/* Event Type Selection */}
                <div>
                  <Label className="text-sm text-muted-foreground font-semibold mb-2 block">Event Type</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setEventType("fullService");
                        setSelectedSession(null);
                        setTicketTypes([]);
                      }}
                      className={`p-3 rounded-lg border-2 transition-all font-medium ${eventType === "fullService"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card hover:border-primary/50"
                      }`}
                    >
                      <div className="text-lg">🎉</div>
                      Single Ticket Event
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEventType("ticketed");
                        setSelectedSession(null);
                        setTicketTypes([]);
                      }}
                      className={`p-3 rounded-lg border-2 transition-all font-medium ${eventType === "ticketed"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card hover:border-primary/50"
                      }`}
                    >
                      <div className="text-lg">🎫</div>
                      Ticketed Event
                    </button>
                  </div>
                </div>

                {/* Session Type Selection - Show for ticketed events as dropdown */}
                {eventType === "ticketed" && (
                  <div>
                    <Label className="text-sm text-muted-foreground font-semibold mb-2 block">Ticketed Event Type</Label>
                    <select
                      value={ticketedType || ""}
                      onChange={(e) => {
                        const value = e.target.value as "normal" | "dayNight" | "";
                        setTicketedType(value);
                        setTicketTypes([]);
                      }}
                      className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                    >
                      <option value="">Select ticket type...</option>
                      <option value="normal">🎫 Normal Tickets (Single Session)</option>
                      <option value="dayNight">☀️🌙 Day/Night Sessions (Separate Sessions)</option>
                    </select>
                  </div>
                )}

                {/* Ticket Types Section - Show for normal tickets */}
                {eventType === "ticketed" && ticketedType === "normal" && (
                  <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <Label className="text-sm text-muted-foreground font-semibold mb-3 block">
                      🎫 Normal Tickets - Ticket Pricing & Availability
                    </Label>
                    <p className="text-xs text-muted-foreground mb-4">Set prices and available quantity for each ticket tier</p>
                    <div className="grid gap-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-sm text-muted-foreground flex items-center gap-1"><Ticket className="h-3 w-3" /> 🥈 Silver Price (₹)</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={ticketTypes[0]?.price || ""}
                            onChange={(e) => {
                              const updated = [...ticketTypes];
                              if (!updated[0]) updated[0] = { name: "silver", price: "", available: "100" };
                              updated[0].price = e.target.value;
                              setTicketTypes(updated);
                            }}
                            placeholder="Price"
                            className="mt-1 bg-card border-border"
                            required
                          />
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground">Available Tickets</Label>
                          <Input
                            type="number"
                            min="1"
                            value={ticketTypes[0]?.available || "100"}
                            onChange={(e) => {
                              const updated = [...ticketTypes];
                              if (!updated[0]) updated[0] = { name: "silver", price: "", available: "100" };
                              updated[0].available = e.target.value;
                              setTicketTypes(updated);
                            }}
                            placeholder="Quantity"
                            className="mt-1 bg-card border-border"
                            required
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-sm text-muted-foreground flex items-center gap-1"><Ticket className="h-3 w-3" /> 🥇 Gold Price (₹)</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={ticketTypes[1]?.price || ""}
                            onChange={(e) => {
                              const updated = [...ticketTypes];
                              if (!updated[1]) updated[1] = { name: "gold", price: "", available: "100" };
                              updated[1].price = e.target.value;
                              setTicketTypes(updated);
                            }}
                            placeholder="Price"
                            className="mt-1 bg-card border-border"
                            required
                          />
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground">Available Tickets</Label>
                          <Input
                            type="number"
                            min="1"
                            value={ticketTypes[1]?.available || "100"}
                            onChange={(e) => {
                              const updated = [...ticketTypes];
                              if (!updated[1]) updated[1] = { name: "gold", price: "", available: "100" };
                              updated[1].available = e.target.value;
                              setTicketTypes(updated);
                            }}
                            placeholder="Quantity"
                            className="mt-1 bg-card border-border"
                            required
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-sm text-muted-foreground flex items-center gap-1"><Ticket className="h-3 w-3" /> 💎 Diamond Price (₹)</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={ticketTypes[2]?.price || ""}
                            onChange={(e) => {
                              const updated = [...ticketTypes];
                              if (!updated[2]) updated[2] = { name: "diamond", price: "", available: "100" };
                              updated[2].price = e.target.value;
                              setTicketTypes(updated);
                            }}
                            placeholder="Price"
                            className="mt-1 bg-card border-border"
                            required
                          />
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground">Available Tickets</Label>
                          <Input
                            type="number"
                            min="1"
                            value={ticketTypes[2]?.available || "100"}
                            onChange={(e) => {
                              const updated = [...ticketTypes];
                              if (!updated[2]) updated[2] = { name: "diamond", price: "", available: "100" };
                              updated[2].available = e.target.value;
                              setTicketTypes(updated);
                            }}
                            placeholder="Quantity"
                            className="mt-1 bg-card border-border"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Ticket Types Section - Show for day/night sessions */}
                {eventType === "ticketed" && ticketedType === "dayNight" && (
                  <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <Label className="text-sm text-muted-foreground font-semibold mb-3 block">
                      ☀️🌙 Day & Night Sessions - Ticket Pricing & Availability
                    </Label>
                    <p className="text-xs text-muted-foreground mb-4">Set separate prices and quantities for day and night sessions</p>
                    
                    {/* Day Session Tickets */}
                    <div className="mb-6 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <p className="text-sm font-semibold text-blue-600 mb-3">☀️ Day Session (09:00 AM)</p>
                      <div className="grid gap-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-sm text-muted-foreground flex items-center gap-1"><Ticket className="h-3 w-3" /> 🥈 Silver Price (₹)</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={ticketTypes[0]?.price || ""}
                              onChange={(e) => {
                                const updated = [...ticketTypes];
                                if (!updated[0]) updated[0] = { name: "silver", price: "", available: "100" };
                                updated[0].price = e.target.value;
                                setTicketTypes(updated);
                              }}
                              placeholder="Price"
                              className="mt-1 bg-card border-border"
                              required
                            />
                          </div>
                          <div>
                            <Label className="text-sm text-muted-foreground">Available Tickets</Label>
                            <Input
                              type="number"
                              min="1"
                              value={ticketTypes[0]?.available || "100"}
                              onChange={(e) => {
                                const updated = [...ticketTypes];
                                if (!updated[0]) updated[0] = { name: "silver", price: "", available: "100" };
                                updated[0].available = e.target.value;
                                setTicketTypes(updated);
                              }}
                              placeholder="Quantity"
                              className="mt-1 bg-card border-border"
                              required
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-sm text-muted-foreground flex items-center gap-1"><Ticket className="h-3 w-3" /> 🥇 Gold Price (₹)</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={ticketTypes[1]?.price || ""}
                              onChange={(e) => {
                                const updated = [...ticketTypes];
                                if (!updated[1]) updated[1] = { name: "gold", price: "", available: "100" };
                                updated[1].price = e.target.value;
                                setTicketTypes(updated);
                              }}
                              placeholder="Price"
                              className="mt-1 bg-card border-border"
                              required
                            />
                          </div>
                          <div>
                            <Label className="text-sm text-muted-foreground">Available Tickets</Label>
                            <Input
                              type="number"
                              min="1"
                              value={ticketTypes[1]?.available || "100"}
                              onChange={(e) => {
                                const updated = [...ticketTypes];
                                if (!updated[1]) updated[1] = { name: "gold", price: "", available: "100" };
                                updated[1].available = e.target.value;
                                setTicketTypes(updated);
                              }}
                              placeholder="Quantity"
                              className="mt-1 bg-card border-border"
                              required
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-sm text-muted-foreground flex items-center gap-1"><Ticket className="h-3 w-3" /> 💎 Diamond Price (₹)</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={ticketTypes[2]?.price || ""}
                              onChange={(e) => {
                                const updated = [...ticketTypes];
                                if (!updated[2]) updated[2] = { name: "diamond", price: "", available: "100" };
                                updated[2].price = e.target.value;
                                setTicketTypes(updated);
                              }}
                              placeholder="Price"
                              className="mt-1 bg-card border-border"
                              required
                            />
                          </div>
                          <div>
                            <Label className="text-sm text-muted-foreground">Available Tickets</Label>
                            <Input
                              type="number"
                              min="1"
                              value={ticketTypes[2]?.available || "100"}
                              onChange={(e) => {
                                const updated = [...ticketTypes];
                                if (!updated[2]) updated[2] = { name: "diamond", price: "", available: "100" };
                                updated[2].available = e.target.value;
                                setTicketTypes(updated);
                              }}
                              placeholder="Quantity"
                              className="mt-1 bg-card border-border"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Night Session Tickets */}
                    <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                      <p className="text-sm font-semibold text-indigo-600 mb-3">🌙 Night Session (06:00 PM)</p>
                      <div className="grid gap-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-sm text-muted-foreground flex items-center gap-1"><Ticket className="h-3 w-3" /> 🥈 Silver Price (₹)</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={ticketTypes[3]?.price || ""}
                              onChange={(e) => {
                                const updated = [...ticketTypes];
                                if (!updated[3]) updated[3] = { name: "silver", price: "", available: "100" };
                                updated[3].price = e.target.value;
                                setTicketTypes(updated);
                              }}
                              placeholder="Price"
                              className="mt-1 bg-card border-border"
                              required
                            />
                          </div>
                          <div>
                            <Label className="text-sm text-muted-foreground">Available Tickets</Label>
                            <Input
                              type="number"
                              min="1"
                              value={ticketTypes[3]?.available || "100"}
                              onChange={(e) => {
                                const updated = [...ticketTypes];
                                if (!updated[3]) updated[3] = { name: "silver", price: "", available: "100" };
                                updated[3].available = e.target.value;
                                setTicketTypes(updated);
                              }}
                              placeholder="Quantity"
                              className="mt-1 bg-card border-border"
                              required
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-sm text-muted-foreground flex items-center gap-1"><Ticket className="h-3 w-3" /> 🥇 Gold Price (₹)</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={ticketTypes[4]?.price || ""}
                              onChange={(e) => {
                                const updated = [...ticketTypes];
                                if (!updated[4]) updated[4] = { name: "gold", price: "", available: "100" };
                                updated[4].price = e.target.value;
                                setTicketTypes(updated);
                              }}
                              placeholder="Price"
                              className="mt-1 bg-card border-border"
                              required
                            />
                          </div>
                          <div>
                            <Label className="text-sm text-muted-foreground">Available Tickets</Label>
                            <Input
                              type="number"
                              min="1"
                              value={ticketTypes[4]?.available || "100"}
                              onChange={(e) => {
                                const updated = [...ticketTypes];
                                if (!updated[4]) updated[4] = { name: "gold", price: "", available: "100" };
                                updated[4].available = e.target.value;
                                setTicketTypes(updated);
                              }}
                              placeholder="Quantity"
                              className="mt-1 bg-card border-border"
                              required
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-sm text-muted-foreground flex items-center gap-1"><Ticket className="h-3 w-3" /> 💎 Diamond Price (₹)</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={ticketTypes[5]?.price || ""}
                              onChange={(e) => {
                                const updated = [...ticketTypes];
                                if (!updated[5]) updated[5] = { name: "diamond", price: "", available: "100" };
                                updated[5].price = e.target.value;
                                setTicketTypes(updated);
                              }}
                              placeholder="Price"
                              className="mt-1 bg-card border-border"
                              required
                            />
                          </div>
                          <div>
                            <Label className="text-sm text-muted-foreground">Available Tickets</Label>
                            <Input
                              type="number"
                              min="1"
                              value={ticketTypes[5]?.available || "100"}
                              onChange={(e) => {
                                const updated = [...ticketTypes];
                                if (!updated[5]) updated[5] = { name: "diamond", price: "", available: "100" };
                                updated[5].available = e.target.value;
                                setTicketTypes(updated);
                              }}
                              placeholder="Quantity"
                              className="mt-1 bg-card border-border"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> Date</Label>
                    <Input
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Time</Label>
                    <Input
                      type="time"
                      value={form.time}
                      onChange={(e) => setForm({ ...form, time: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> Location</Label>
                  <Input
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="Event venue"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {eventType === "fullService" && (
                    <div>
                      <Label className="text-sm text-muted-foreground flex items-center gap-1"><DollarSign className="h-3 w-3" /> Price (₹)</Label>
                      <Input
                        type="number"
                        value={form.price}
                        onChange={(e) => setForm({ ...form, price: e.target.value })}
                        placeholder="0"
                        required
                      />
                    </div>
                  )}
                  <div>
                    <Label className="text-sm text-muted-foreground">Category</Label>
                    <Input
                      list="category-options"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      placeholder="Type or select category"
                      className="w-full"
                    />
                    <datalist id="category-options">
                      {categories.map((cat: string) => (
                        <option key={cat} value={cat} />
                      ))}
                    </datalist>
                  </div>
                </div>

                {/* Max Attendees - fullService only */}
                {eventType === "fullService" && (
                  <div>
                    <Label className="text-sm text-muted-foreground flex items-center gap-1">
                      👥 Max Attendees <span className="text-xs text-muted-foreground ml-1">(0 = unlimited)</span>
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      value={form.maxAttendees}
                      onChange={(e) => setForm({ ...form, maxAttendees: e.target.value })}
                      placeholder="e.g. 100 (leave 0 for unlimited)"
                    />
                  </div>
                )}

                <div>
                  <Label className="text-sm text-muted-foreground">Status</Label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="flex-1 bg-gradient-primary text-primary-foreground hover:opacity-90" size="lg">
                    {editingId ? "Update Event" : "Create Event"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowModal(false)} size="lg">
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </section>
    </MerchantLayout>
  );
};

export default MerchantEvents;





