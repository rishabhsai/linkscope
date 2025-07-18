import React, { useState } from 'react';
import { Settings, Eye, EyeOff, Save, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useSettings } from "@/contexts/SettingsContext";
import { toast } from "sonner";

interface SettingsDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function SettingsDialog({ trigger, open, onOpenChange }: SettingsDialogProps) {
  const { apiKey, setApiKey, hasApiKey, clearApiKey } = useSettings();
  const [tempApiKey, setTempApiKey] = useState(apiKey);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      setApiKey(tempApiKey);
      toast.success(tempApiKey ? "API key saved successfully!" : "API key removed");
    } catch (error) {
      toast.error("Failed to save API key");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = () => {
    clearApiKey();
    setTempApiKey('');
    toast.success("API key removed");
  };

  const handleDialogOpen = (isOpen: boolean) => {
    if (isOpen) {
      setTempApiKey(apiKey);
    }
    onOpenChange?.(isOpen);
  };

  const isValidApiKey = (key: string) => {
    return key.startsWith('sk-') && key.length > 20;
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm" className="gap-2">
      <Settings className="h-4 w-4" />
      Settings
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={handleDialogOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Settings
          </DialogTitle>
          <DialogDescription>
            Configure your OpenAI API key to enable AI-powered link analysis.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* API Key Status */}
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">OpenAI API Key Status</Label>
            <Badge variant={hasApiKey ? "default" : "destructive"}>
              {hasApiKey ? "Configured" : "Not Set"}
            </Badge>
          </div>

          {/* API Key Input */}
          <div className="space-y-3">
            <Label htmlFor="apiKey" className="text-sm font-medium">
              OpenAI API Key
            </Label>
            <div className="relative">
              <Input
                id="apiKey"
                type={showApiKey ? "text" : "password"}
                placeholder="sk-..."
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                className={`pr-10 ${tempApiKey && !isValidApiKey(tempApiKey) ? 'border-red-500' : ''}`}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {tempApiKey && !isValidApiKey(tempApiKey) && (
              <p className="text-sm text-red-500">
                Please enter a valid OpenAI API key (starts with 'sk-')
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              Get your API key from{" "}
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                OpenAI Platform
              </a>
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={handleSave}
              disabled={isSaving || (tempApiKey && !isValidApiKey(tempApiKey))}
              className="flex-1 gap-2"
            >
              <Save className="h-4 w-4" />
              {isSaving ? "Saving..." : "Save"}
            </Button>
            {hasApiKey && (
              <Button
                variant="outline"
                onClick={handleClear}
                className="gap-2 text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
                Clear
              </Button>
            )}
          </div>

          {/* Info */}
          <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>Privacy:</strong> Your API key is stored locally in your browser and never sent to our servers.
              All AI analysis requests are made directly from your browser to OpenAI.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 