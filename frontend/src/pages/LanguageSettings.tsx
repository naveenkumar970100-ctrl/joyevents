import { useState } from "react";
import { motion } from "framer-motion";
import { Globe, Check } from "lucide-react";
import CustomerLayout from "@/components/CustomerLayout";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES } from "@/lib/i18n";
import { toast } from "sonner";

const LanguageSettings = () => {
  const { i18n, t } = useTranslation();
  const [selected, setSelected] = useState(i18n.language?.split("-")[0] || "en");

  const handleSelect = (code: string) => {
    setSelected(code);
    i18n.changeLanguage(code);
    localStorage.setItem("app_language", code);
    toast.success(`Language changed to ${SUPPORTED_LANGUAGES.find(l => l.code === code)?.label}`);
  };

  return (
    <CustomerLayout>
      <section className="py-2 sm:py-8 lg:py-10">
        <div className="container mx-auto max-w-2xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-8">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold">
                  {t("language")} <span className="text-gradient">Settings</span>
                </h1>
                <p className="text-sm text-muted-foreground">Choose your preferred display language</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {SUPPORTED_LANGUAGES.map((lang, idx) => (
                <motion.button
                  key={lang.code}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.06 }}
                  onClick={() => handleSelect(lang.code)}
                  className={`flex items-center gap-4 rounded-xl border p-4 text-left transition-all ${
                    selected === lang.code
                      ? "border-primary bg-primary/10 shadow-md shadow-primary/10"
                      : "border-border bg-card hover:border-primary/40 hover:bg-secondary/50"
                  }`}
                >
                  <span className="text-3xl">{lang.flag}</span>
                  <div className="flex-1">
                    <p className={`font-semibold text-sm ${selected === lang.code ? "text-primary" : "text-foreground"}`}>
                      {lang.label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{lang.code.toUpperCase()}</p>
                  </div>
                  {selected === lang.code && (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                  )}
                </motion.button>
              ))}
            </div>

            <div className="mt-8 rounded-xl border border-border bg-card p-5">
              <p className="text-sm font-semibold mb-3 text-muted-foreground">Preview</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Overview</span>
                  <span className="font-medium">{t("overview")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">My Bookings</span>
                  <span className="font-medium">{t("my_bookings")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Welcome back</span>
                  <span className="font-medium">{t("welcome_back")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Book Now</span>
                  <span className="font-medium">{t("book_now")}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </CustomerLayout>
  );
};

export default LanguageSettings;

