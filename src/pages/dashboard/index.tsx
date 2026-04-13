import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { BotPreview } from "@/components/bot/BotPreview";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import { Plus, Trash2, Save, RotateCcw } from "lucide-react";

interface MenuButton {
  text: string;
  url: string;
}

export default function BotSettings() {
  const [welcomeMessage, setWelcomeMessage] = useState(
    "Selamat datang! 👋\n\nTerima kasih kerana join bot kami. Kami di sini untuk membantu anda!"
  );
  const [menuButtons, setMenuButtons] = useState<MenuButton[]>([
    { text: "📚 About Us", url: "" },
    { text: "💬 Contact Support", url: "" },
  ]);

  const addMenuButton = () => {
    if (menuButtons.length < 6) {
      setMenuButtons([...menuButtons, { text: "", url: "" }]);
    }
  };

  const updateMenuButton = (index: number, field: keyof MenuButton, value: string) => {
    const updated = [...menuButtons];
    updated[index][field] = value;
    setMenuButtons(updated);
  };

  const removeMenuButton = (index: number) => {
    setMenuButtons(menuButtons.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    // TODO: Save to Supabase when enabled
    console.log("Saving bot settings:", { welcomeMessage, menuButtons });
    alert("Settings akan save ke database bila Supabase enabled!");
  };

  const handleReset = () => {
    setWelcomeMessage("Selamat datang! 👋\n\nTerima kasih kerana join bot kami. Kami di sini untuk membantu anda!");
    setMenuButtons([
      { text: "📚 About Us", url: "" },
      { text: "💬 Contact Support", url: "" },
    ]);
  };

  return (
    <>
      <SEO title="Bot Settings - Telegram Bot Admin" />
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground">Bot Configuration</h1>
            <p className="mt-2 text-muted-foreground">
              Configure welcome message dan menu buttons untuk bot anda
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card className="p-6">
                <Tabs defaultValue="welcome" className="space-y-6">
                  <TabsList>
                    <TabsTrigger value="welcome">Welcome Message</TabsTrigger>
                    <TabsTrigger value="menu">Menu Buttons</TabsTrigger>
                    <TabsTrigger value="commands">Commands</TabsTrigger>
                  </TabsList>

                  <TabsContent value="welcome" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="welcome">Welcome Message</Label>
                      <p className="text-sm text-muted-foreground">
                        Mesej ini akan dihantar automatically bila user start bot atau join group
                      </p>
                      <Textarea
                        id="welcome"
                        value={welcomeMessage}
                        onChange={(e) => setWelcomeMessage(e.target.value)}
                        rows={8}
                        placeholder="Type welcome message here..."
                        className="font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        Tip: Guna emoji untuk make message lebih friendly! 😊
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="menu" className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Menu Buttons</Label>
                          <p className="text-sm text-muted-foreground">
                            Custom button menu untuk bot (max 6 buttons)
                          </p>
                        </div>
                        <Button
                          onClick={addMenuButton}
                          disabled={menuButtons.length >= 6}
                          size="sm"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Button
                        </Button>
                      </div>

                      <div className="space-y-3">
                        {menuButtons.map((button, index) => (
                          <Card key={index} className="p-4">
                            <div className="flex gap-3">
                              <div className="flex-1 space-y-3">
                                <div>
                                  <Label htmlFor={`button-text-${index}`} className="text-xs">
                                    Button Text
                                  </Label>
                                  <Input
                                    id={`button-text-${index}`}
                                    value={button.text}
                                    onChange={(e) => updateMenuButton(index, "text", e.target.value)}
                                    placeholder="e.g., 📚 About Us"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor={`button-url-${index}`} className="text-xs">
                                    URL (optional)
                                  </Label>
                                  <Input
                                    id={`button-url-${index}`}
                                    value={button.url}
                                    onChange={(e) => updateMenuButton(index, "url", e.target.value)}
                                    placeholder="https://example.com"
                                  />
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeMenuButton(index)}
                                className="mt-6"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </Card>
                        ))}

                        {menuButtons.length === 0 && (
                          <div className="rounded-lg border border-dashed p-8 text-center">
                            <p className="text-sm text-muted-foreground">
                              Tiada menu button lagi. Click "Add Button" untuk mula.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="commands" className="space-y-4">
                    <div className="rounded-lg border border-dashed p-8 text-center">
                      <p className="text-sm text-muted-foreground">
                        Custom commands feature coming soon...
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="mt-6 flex gap-3 border-t pt-6">
                  <Button onClick={handleSave} className="flex-1">
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                  <Button onClick={handleReset} variant="outline">
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset
                  </Button>
                </div>
              </Card>
            </div>

            <div>
              <h3 className="mb-3 font-heading text-sm font-semibold">Live Preview</h3>
              <BotPreview 
                welcomeMessage={welcomeMessage} 
                menuButtons={menuButtons.filter(b => b.text.trim())}
              />
            </div>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}