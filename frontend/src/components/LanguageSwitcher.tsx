import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Globe, Check, Loader2 } from "lucide-react";
import { SUPPORTED_LANGUAGES } from "@/lib/i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language?.split("-")[0] || "en";
  const [loading, setLoading] = useState(false);

  const handleLanguageChange = async (code: string) => {
    if (code === currentLang) return;
    setLoading(true);
    i18n.changeLanguage(code);
    localStorage.setItem("app_language", code);
    const langLabel = SUPPORTED_LANGUAGES.find(l => l.code === code)?.label;
    toast.success(`Language changed to ${langLabel}`);
    // Give translate hook time to finish
    setTimeout(() => setLoading(false), 2000);
  };

  const currentLanguage = SUPPORTED_LANGUAGES.find(l => l.code === currentLang);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary/80 transition-colors"
          title="Change language"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
          <span className="hidden sm:inline">{currentLanguage?.flag}</span>
          <span className="hidden md:inline text-xs">{currentLanguage?.label}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-background/95 backdrop-blur-md border-border text-foreground">
        {SUPPORTED_LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className="flex items-center justify-between cursor-pointer hover:bg-secondary"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">{lang.flag}</span>
              <span className="text-sm">{lang.label}</span>
            </div>
            {currentLang === lang.code && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
