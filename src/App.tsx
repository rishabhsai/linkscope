import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LinkScope from "@/components/LinkScope";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SettingsProvider } from "@/contexts/SettingsContext";

const queryClient = new QueryClient();

function UsernameDialog({ open, onSave }: { open: boolean; onSave: (username: string) => void }) {
  const [username, setUsername] = useState("");
  return (
    <Dialog open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enter your username</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={e => {
            e.preventDefault();
            if (username.trim()) {
              onSave(username.trim());
            }
          }}
          className="space-y-4"
        >
          <Input
            autoFocus
            placeholder="Your username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
          <Button type="submit" className="w-full bg-purple-primary hover:bg-purple-secondary">
            Continue
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const App = () => {
  const [username, setUsername] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("username");
    if (stored) {
      setUsername(stored);
    } else {
      setShowDialog(true);
    }
  }, []);

  const handleSaveUsername = (uname: string) => {
    localStorage.setItem("username", uname);
    setUsername(uname);
    setShowDialog(false);
  };

  return (
    <SettingsProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <UsernameDialog open={showDialog} onSave={handleSaveUsername} />
          {username && (
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<LinkScope username={username} />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          )}
        </TooltipProvider>
      </QueryClientProvider>
    </SettingsProvider>
  );
};

export default App;
