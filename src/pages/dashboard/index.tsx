import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { BotPreview } from "@/components/bot/BotPreview";
import { Card } from "@/components/ui/card";
import { SEO } from "@/components/SEO";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, X, Save, RotateCcw } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

interface MenuButton {
  id: string;
  text: string;
  url: string;
}

export default function BotSettingsPage() {
  const [welcomeMessage, setWelcomeMessage] = useState("Selamat datang! 👋\n\nSaya adalah bot automation untuk membantu anda.");
  const [menuButtons, setMenuButtons] = useState<MenuButton[]>([
    { id: "1", text: "🏠 Menu Utama", url: "https://example.com" },
    { id: "2", text: "📞 Hubungi Kami", url: "https://example.com/contact" }
  ]);

  const addMenuButton = () => {
    if (menuButtons.length >= 6) return;
    const newButton: MenuButton = {
      id: Date.now().toString(),
      text: "",
      url: ""
    };
    setMenuButtons([...menuButtons, newButton]);
  };

  const removeMenuButton = (id: string) => {
    setMenuButtons(menuButtons.filter(btn => btn.id !== id));
  };

  const updateMenuButton = (id: string, field: "text" | "url", value: string) => {
    setMenuButtons(menuButtons.map(btn => 
      btn.id === id ? { ...btn, [field]: value } : btn
    ));
  };

  const handleSave = () => {
    console.log("Saving settings:", { welcomeMessage, menuButtons });
    // TODO: Save to Supabase
  };

  const handleReset = () => {
    setWelcomeMessage("Selamat datang! 👋\n\nSaya adalah bot automation untuk membantu anda.");
    setMenuButtons([
      { id: "1", text: "🏠 Menu Utama", url: "https://example.com" },
      { id: "2", text: "📞 Hubungi Kami", url: "https://example.com/contact" }
    ]);
  };

  return (
    <ProtectedRoute>
      <SEO title="Bot Settings - Telegram Bot Admin" />
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground">Bot Settings</h1>
            <p className="mt-2 text-muted-foreground">Configure your Telegram bot settings and appearance</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-6">
              <Card className="p-6">
                <Tabs defaultValue="welcome" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="welcome">Welcome Message</TabsTrigger>
                    <TabsTrigger value="buttons">Menu Buttons</TabsTrigger>
                  </TabsList>

                  <TabsContent value="welcome" className="mt-6 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="welcome">Welcome Message</Label>
                      <Textarea
                        id="welcome"
                        placeholder="Enter your welcome message..."
                        value={welcomeMessage}
                        onChange={(e) => setWelcomeMessage(e.target.value)}
                        className="min-h-[200px] font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        This message will be sent when users start the bot
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="buttons" className="mt-6 space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>Custom Menu Buttons</Label>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={addMenuButton}
                          disabled={menuButtons.length >= 6}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Button
                        </Button>
                      </div>

                      {menuButtons.length === 0 && (
                        <div className="rounded-lg border border-dashed p-8 text-center">
                          <p className="text-sm text-muted-foreground">
                            No buttons added yet. Click "Add Button" to create one.
                          </p>
                        </div>
                      )}

                      {menuButtons.map((button, index) => (
                        <div key={button.id} className="space-y-2 rounded-lg border p-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">
                              Button {index + 1}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeMenuButton(button.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <Input
                            placeholder="Button text (e.g., 🏠 Menu Utama)"
                            value={button.text}
                            onChange={(e) => updateMenuButton(button.id, "text", e.target.value)}
                          />
                          <Input
                            placeholder="URL (e.g., https://example.com)"
                            value={button.url}
                            onChange={(e) => updateMenuButton(button.id, "url", e.target.value)}
                          />
                        </div>
                      ))}

                      <p className="text-xs text-muted-foreground">
                        Maximum 6 buttons. Buttons will appear below the welcome message.
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </Card>

              <div className="flex gap-3">
                <Button onClick={handleSave} className="flex-1">
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
                <Button onClick={handleReset} variant="outline">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset
                </Button>
              </div>
            </div>

            <div>
              <BotPreview 
                welcomeMessage={welcomeMessage}
                menuButtons={menuButtons}
              />
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}