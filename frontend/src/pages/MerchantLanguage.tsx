import { useState } from "react";
import { motion } from "framer-motion";
import { Globe, Plus, Save, Trash2, ChevronDown } from "lucide-react";
import MerchantLayout from "@/components/MerchantLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SUPPORTED_LANGUAGES, defaultTranslations } from "@/lib/i18n";
import { toast } from "sonner";
import i18n from "@/lib/i18n";

const STORAGE_KEY = "merchant_custom_translations";

const loadCustom = (): Record<string, Record<string, string>> => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; }
};

const MerchantLanguage = () => {
  const [activeLang, setActiveLang] = useState("en");
  const [custom, setCustom] = useState<Record<string, Record<string, string>>>(loadCustom);
  const [newKey, setNewKey] = useState("");
  const [newVal, setNewVal] = useState("");

  const merged = (lang: string): Record<string, string> => ({
    ...(defaultTranslations[lang] || {}),
    ...(custom[lang] || {}),
  });

  const handleEdit = (lang: string, key: string, value: string) => {
    setCustom(prev => {
      const updated = { ...prev, [lang]: { ...(prev[lang] || {}), [key]: value } };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      // Update i18n live
      i18n.addResourceBundle(lang, "translation", updated[lang], true, true);
      return updated;
    });
  };

  const handleAddKey = () => {
    if (!newKey.trim() || !newVal.trim()) { toast.error("Key and value are required"); return; }
    const key = newKey.trim().toLowerCase().replace(/\s+/g, "_");
    handleEdit(activeLang, key, newVal.trim());
    setNewKey(""); setNewVal("");
    toast.success(`Added "${key}" to ${activeLang.toUpperCase()}`);
  };

  const handleDelete = (lang: string, key: string) => {
    setCustom(prev => {
      const updated = { ...prev };
      if (updated[lang]) {
        delete updated[lang][key];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        i18n.addResourceBundle(lang, "translation", updated[lang] || {}, true, true);
      }
      return { ...updated };
    });
    toast.success("Key removed");
  };

  const handleSaveAll = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(custom));
    Object.entries(custom).forEach(([lang, keys]) => {
      i18n.addResourceBundle(lang, "translation", keys, true, true);
    });
    toast.success("All translations saved and applied!");
  };

  const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === activeLang);
  const allKeys = Object.keys(merged(activeLang));
  const customKeys = Object.keys(custom[activeLang] || {});

  return (
    <MerchantLayout>
      <section className="py-2 sm:py-8 lg:py-10">
        <div className="container mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground">
                  <Globe className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="font-display text-2xl font-bold">
                    Language <span className="text-gradient">Management</span>
                  </h1>
                  <p className="text-sm text-muted-foreground">Manage translations for all supported languages</p>
                </div>
              </div>
              <Button onClick={handleSaveAll} className="bg-gradient-primary text-primary-foreground">
                <Save className="h-4 w-4 mr-2" /> Save All
              </Button>
            </div>
          </motion.div>

          {/* Language tabs */}
          <div className="flex gap-2 flex-wrap mb-6">
            {SUPPORTED_LANGUAGES.map(lang => (
              <button key={lang.code} onClick={() => setActiveLang(lang.code)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeLang === lang.code
                    ? "bg-gradient-primary text-primary-foreground shadow-md"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}>
                <span>{lang.flag}</span> {lang.label}
                {customKeys.length > 0 && activeLang === lang.code && (
                  <span className="bg-white/20 text-xs px-1.5 rounded-full">{customKeys.length}</span>
                )}
              </button>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Translation table */}
            <div className="lg:col-span-2 rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <span className="font-semibold text-sm">{currentLang?.flag} {currentLang?.label} Translations</span>
                <span className="text-xs text-muted-foreground">{allKeys.length} keys</span>
              </div>
              <div className="overflow-y-auto max-h-[500px]">
                <table className="w-full text-sm min-w-[600px]">
                  <thead className="sticky top-0 bg-secondary/80 backdrop-blur-sm">
                    <tr>
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground w-1/3">Key</th>
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Translation</th>
                      <th className="w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {allKeys.map(key => {
                      const isCustom = !!(custom[activeLang]?.[key]);
                      const val = merged(activeLang)[key];
                      return (
                        <tr key={key} className={`border-b border-border last:border-0 ${isCustom ? "bg-primary/5" : ""}`}>
                          <td className="px-4 py-2.5">
                            <code className="text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded">{key}</code>
                            {isCustom && <span className="ml-1 text-[10px] text-primary font-bold">custom</span>}
                          </td>
                          <td className="px-4 py-2.5">
                            <Input
                              value={val}
                              onChange={e => handleEdit(activeLang, key, e.target.value)}
                              className="h-7 text-xs border-transparent bg-transparent hover:border-border focus:border-primary"
                            />
                          </td>
                          <td className="px-2 py-2.5">
                            {isCustom && (
                              <button onClick={() => handleDelete(activeLang, key)}
                                className="text-muted-foreground hover:text-red-500 transition-colors">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Add new key */}
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                  <Plus className="h-4 w-4 text-primary" /> Add Custom Key
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Key (e.g. book_event)</label>
                    <Input placeholder="key_name" value={newKey} onChange={e => setNewKey(e.target.value)} className="h-9 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Value in {currentLang?.label}</label>
                    <Input placeholder="Translation..." value={newVal} onChange={e => setNewVal(e.target.value)} className="h-9 text-sm" />
                  </div>
                  <Button onClick={handleAddKey} className="w-full bg-gradient-primary text-primary-foreground" size="sm">
                    <Plus className="h-4 w-4 mr-1" /> Add Key
                  </Button>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-semibold text-sm mb-3">Stats</h3>
                <div className="space-y-2 text-sm">
                  {SUPPORTED_LANGUAGES.map(lang => (
                    <div key={lang.code} className="flex items-center justify-between">
                      <span className="text-muted-foreground">{lang.flag} {lang.label}</span>
                      <span className="font-medium text-xs">
                        {Object.keys(defaultTranslations[lang.code] || {}).length} default
                        {(custom[lang.code] && Object.keys(custom[lang.code]).length > 0) && (
                          <span className="text-primary ml-1">+{Object.keys(custom[lang.code]).length} custom</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </MerchantLayout>
  );
};

export default MerchantLanguage;

