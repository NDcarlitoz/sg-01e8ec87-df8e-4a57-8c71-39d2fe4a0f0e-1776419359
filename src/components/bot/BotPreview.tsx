import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface MenuButton {
  text: string;
  url?: string;
}

interface BotPreviewProps {
  welcomeMessage: string;
  menuButtons: MenuButton[];
}

export function BotPreview({ welcomeMessage, menuButtons }: BotPreviewProps) {
  return (
    <Card className="sticky top-6 overflow-hidden">
      <div className="border-b bg-primary p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white">
            <span className="text-lg">🤖</span>
          </div>
          <div>
            <h3 className="font-heading text-sm font-semibold text-white">Your Bot</h3>
            <p className="text-xs text-white/80">Active now</p>
          </div>
        </div>
      </div>

      <div className="space-y-4 bg-muted/30 p-4">
        {welcomeMessage && (
          <div className="max-w-[80%]">
            <div className="rounded-2xl rounded-tl-none bg-white p-3 shadow-sm">
              <p className="whitespace-pre-wrap text-sm text-foreground">{welcomeMessage}</p>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Just now</p>
          </div>
        )}

        {menuButtons.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Menu Buttons:</p>
            <div className="grid gap-2">
              {menuButtons.map((button, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full justify-start bg-white text-sm"
                  disabled
                >
                  {button.text}
                </Button>
              ))}
            </div>
          </div>
        )}

        {!welcomeMessage && menuButtons.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-sm text-muted-foreground">
              Preview akan muncul di sini
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}