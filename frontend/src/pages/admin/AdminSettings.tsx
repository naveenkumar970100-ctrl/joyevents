import { useState } from "react";
import { motion } from "framer-motion";
import { Settings, Shield, Bell, Globe, Database, Mail, Check } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { getPlatformName, setPlatformName, getSupportEmail, setSupportEmail as saveSupportEmailLocal } from "@/lib/platformName";
import { apiSavePlatformSettings } from "@/lib/api";
import { toast } from "sonner";

const AdminSettings = () => {
  const { user, token } = useAuth() as any;
  const [platformName, setPlatformNameState] = useState(getPlatformName());
  const [supportEmail, setSupportEmail] = useState(getSupportEmail());
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!platformName.trim()) { toast.error("Platform name cannot be empty"); return; }
    try {
      await apiSavePlatformSettings({ platformName: platformName.trim(), supportEmail: supportEmail.trim() }, token);
      // Also update localStorage so current tab updates immediately
      setPlatformName(platformName.trim());
      saveSupportEmailLocal(supportEmail.trim());
      setSaved(true);
      toast.success("Settings saved — all devices will now show the updated name");
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      toast.error(e?.message || "Failed to save settings");
    }
  };

  return (
    <AdminLayout>
      <section className="py-2 sm:py-8 lg:py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-1">
            <span className="text-muted-foreground text-sm">Welcome back,</span>
            <span className="font-display text-lg font-bold text-gradient ml-2">{user?.name || 'Admin'}</span>
          </div>
          <h1 className="font-display text-xs sm:text-3xl font-bold flex items-center gap-2">
            <Settings className="h-7 w-7 text-primary" />
            Platform <span className="text-gradient">Settings</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Configure platform behavior and preferences</p>
        </motion.div>

        <div className="mt-8 space-y-6">
          {/* General */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl border border-border bg-card p-3 sm:p-6">
            <h2 className="font-display text-lg font-bold flex items-center gap-2 mb-4">
              <Globe className="h-4 w-4 text-primary" /> General
            </h2>
            <div className="space-y-4">
              <div>
                <Label className="text-sm text-muted-foreground">Platform Name</Label>
                <p className="text-xs text-muted-foreground mt-0.5 mb-1.5">This name appears in the navbar, sidebar, footer, and browser title.</p>
                <div className="flex gap-2">
                  <Input
                    value={platformName}
                    onChange={e => setPlatformNameState(e.target.value)}
                    className="bg-secondary border-border"
                    placeholder="e.g. JoyEvents"
                  />
                </div>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Support Email</Label>
                <Input
                  value={supportEmail}
                  onChange={e => setSupportEmail(e.target.value)}
                  className="mt-1 bg-secondary border-border"
                  placeholder="support@example.com"
                />
              </div>
            </div>
          </motion.div>

          {/* Notifications */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-xl border border-border bg-card p-3 sm:p-6">
            <h2 className="font-display text-lg font-bold flex items-center gap-2 mb-4">
              <Bell className="h-4 w-4 text-primary" /> Notifications
            </h2>
            <div className="space-y-4">
              {[
                { label: "Email notifications for new users" },
                { label: "Alert on flagged events" },
                { label: "Weekly platform report" },
                { label: "Merchant verification alerts" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-sm text-foreground">{item.label}</span>
                  <Switch defaultChecked />
                </div>
              ))}
            </div>
          </motion.div>

          {/* Security */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="rounded-xl border border-border bg-card p-3 sm:p-6">
            <h2 className="font-display text-lg font-bold flex items-center gap-2 mb-4">
              <Shield className="h-4 w-4 text-primary" /> Security
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Two-factor authentication</span>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Force password reset every 90 days</span>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">IP whitelist for admin access</span>
                <Switch />
              </div>
            </div>
          </motion.div>

          <div className="flex gap-3">
            <Button
              onClick={handleSave}
              className="bg-gradient-primary text-primary-foreground hover:opacity-90 gap-2"
            >
              {saved ? <><Check className="h-4 w-4" /> Saved</> : "Save Changes"}
            </Button>
            <Button variant="outline" onClick={() => { setPlatformNameState("JoyEvents"); setSupportEmail("hello@joyevents.com"); }}>
              Reset Defaults
            </Button>
          </div>
        </div>
      </section>
    </AdminLayout>
  );
};

export default AdminSettings;

