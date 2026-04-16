import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Save, Eye, User, AtSign, Type, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface WelcomeMessageEditorProps {
  botId: string;
  initialMessage?: string;
  onSave: (message: string) => Promise<void>;
}

const VARIABLES = [
  { key: "{name}", label: "Full Name", description: "User's first name + last name", example: "John Smith" },
  { key: "{first_name}", label: "First Name", description: "User's first name only", example: "John" },
  { key: "{last_name}", label: "Last Name", description: "User's last name only", example: "Smith" },
  { key: "{username}", label: "Username", description: "User's @username", example: "@johnsmith" },
];

const DEFAULT_MESSAGE = `Welcome {name}! 👋

I'm your Telegram automation assistant.

Available commands:
/start - Show this welcome message
/help - Get help and support
/menu - Show main menu

Feel free to explore!`;

export function WelcomeMessageEditor({ botId, initialMessage, onSave }: WelcomeMessageEditorProps) {
  const [message, setMessage] = useState(initialMessage || DEFAULT_MESSAGE);
  const [previewMessage, setPreviewMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (initialMessage) {
      setMessage(initialMessage);
    }
  }, [initialMessage]);

  useEffect(() => {
    setHasChanges(message !== (initialMessage || DEFAULT_MESSAGE));
    updatePreview();
  }, [message, initialMessage]);

  const updatePreview = () => {
    // Replace variables with example data for preview
    let preview = message;
    preview = preview.replace(/{name}/g, "John Smith");
    preview = preview.replace(/{first_name}/g, "John");
    preview = preview.replace(/{last_name}/g, "Smith");
    preview = preview.replace(/{username}/g, "@johnsmith");
    setPreviewMessage(preview);
  };

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById("welcome-message-textarea") as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newMessage = message.substring(0, start) + variable + message.substring(end);
    
    setMessage(newMessage);
    
    // Set cursor position after variable
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variable.length, start + variable.length);
    }, 0);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(message);
      setHasChanges(false);
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setMessage(initialMessage || DEFAULT_MESSAGE);
    setHasChanges(false);
  };

  return (
    <div className="space-y-6">
      {/* Editor */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Welcome Message</CardTitle>
              <CardDescription>
                Customize the message users see when they start your bot
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
              >
                <Eye className="mr-2 h-4 w-4" />
                {showPreview ? "Hide" : "Show"} Preview
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
              >
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Variable Buttons */}
          <div>
            <Label className="text-sm font-medium">Insert Variables</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {VARIABLES.map((variable) => (
                <Button
                  key={variable.key}
                  variant="outline"
                  size="sm"
                  onClick={() => insertVariable(variable.key)}
                  className="text-xs"
                >
                  <Type className="mr-1 h-3 w-3" />
                  {variable.label}
                </Button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Click to insert variables at cursor position. Variables will be replaced with actual user data.
            </p>
          </div>

          {/* Textarea */}
          <div>
            <Label htmlFor="welcome-message-textarea">Message Content</Label>
            <Textarea
              id="welcome-message-textarea"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your welcome message..."
              className="mt-2 min-h-[200px] font-mono text-sm"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              {message.length} characters
            </p>
          </div>

          {/* Available Variables Info */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">Available Variables:</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {VARIABLES.map((variable) => (
                    <div key={variable.key} className="text-xs">
                      <code className="rounded bg-muted px-1 py-0.5 font-mono">
                        {variable.key}
                      </code>
                      <span className="ml-2 text-muted-foreground">
                        {variable.description}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </AlertDescription>
          </Alert>

          {hasChanges && (
            <div className="flex justify-between">
              <p className="text-sm text-muted-foreground">You have unsaved changes</p>
              <Button variant="ghost" size="sm" onClick={handleReset}>
                Reset to Saved
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview */}
      {showPreview && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Preview
            </CardTitle>
            <CardDescription>
              How the message will appear to users (with example data)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border bg-muted/50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent">
                  <User className="h-4 w-4 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">Your Bot</p>
                  <p className="text-xs text-muted-foreground">Just now</p>
                </div>
              </div>
              <div className="whitespace-pre-wrap text-sm">{previewMessage}</div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Variables will be replaced with actual user data when sent
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}