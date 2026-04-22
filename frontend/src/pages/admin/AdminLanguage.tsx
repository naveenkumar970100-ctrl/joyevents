import { motion } from "framer-motion";
import { Globe, Eye } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { SUPPORTED_LANGUAGES, defaultTranslations } from "@/lib/i18n";
import { useState } from "react";

const STORAGE_KEY = "merchant_custom_translations";

const loadCustom = (): Record<string, Record<string, string>> => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; }
};

const AdminLanguage = () => {
  const [activeLang, setActiveLang] = useState("en");
  const custom = loadCustom();

  const merged = (lang: string): Record<string, string> => ({
    ...(defaultTranslations[lang] || {}),
    ...(custom[lang] || {}),
  });

  const allKeys = Object.keys(merged(activeLang));
  const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === activeLang);

  return (
    <AdminLayout>
      <section className="py-2 sm:py-8 lg:py-10">
        <div className="container mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <h1 className="font-display text-xs sm:text-2xl font-bold truncate">
                  Language <span className="text-gradient">Overview</span>
                </h1>
                <p className="text-sm text-muted-foreground">View all language translations across the platform</p>
              </div>
            </div>
          </motion.div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 mb-6">
            <div className="rounded-xl border border-border bg-card p-5 flex items-center gap-4">
              <Globe className="h-8 w-8 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Supported Languages</p>
                <p className="font-display text-xs sm:text-2xl font-bold truncate">{SUPPORTED_LANGUAGES.length}</p>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-5 flex items-center gap-4">
              <Eye className="h-8 w-8 text-blue-400" />
              <div>
                <p className="text-xs text-muted-foreground">Default Keys</p>
                <p className="font-display text-xs sm:text-2xl font-bold truncate">{Object.keys(defaultTranslations.en || {}).length}</p>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-5 flex items-center gap-4">
              <Globe className="h-8 w-8 text-green-400" />
              <div>
                <p className="text-xs text-muted-foreground">Custom Keys (all langs)</p>
                <p className="font-display text-xs sm:text-2xl font-bold truncate">
                  {Object.values(custom).reduce((s, v) => s + Object.keys(v).length, 0)}
                </p>
              </div>
            </div>
          </div>

          {/* Language tabs */}
          <div className="flex gap-2 flex-wrap mb-6">
            {SUPPORTED_LANGUAGES.map(lang => (
              <button key={lang.code} onClick={() => setActiveLang(lang.code)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeLang === lang.code
                    ? "bg-gradient-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}>
                <span>{lang.flag}</span> {lang.label}
              </button>
            ))}
          </div>

          {/* Read-only table */}
          <div className="rounded-xl border border-border bg-card overflow-hidden overflow-x-auto">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <span className="font-semibold text-sm">{currentLang?.flag} {currentLang?.label} — {allKeys.length} keys</span>
              <span className="text-xs text-muted-foreground">Read-only view</span>
            </div>
            <div className="overflow-y-auto max-h-[500px]">
              <table className="w-full text-sm min-w-[600px]">
                <thead className="sticky top-0 bg-secondary/80 backdrop-blur-sm">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground w-1/3">Key</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Translation</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground w-20">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {allKeys.map(key => {
                    const isCustom = !!(custom[activeLang]?.[key]);
                    return (
                      <tr key={key} className={`border-b border-border last:border-0 ${isCustom ? "bg-primary/5" : ""}`}>
                        <td className="px-4 py-2.5">
                          <code className="text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded">{key}</code>
                        </td>
                        <td className="px-4 py-2.5 text-foreground">{merged(activeLang)[key]}</td>
                        <td className="px-4 py-2.5">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            isCustom ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"
                          }`}>
                            {isCustom ? "custom" : "default"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </AdminLayout>
  );
};

export default AdminLanguage;
