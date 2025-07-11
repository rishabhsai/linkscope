import { useState } from "react";
import { Plus, ExternalLink, Settings, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

interface AnalyzedLink {
  id: string;
  url: string;
  summary: string;
  tags: string[];
  context?: string;
  createdAt: Date;
}

const LinkAnalyzer = () => {
  const [url, setUrl] = useState("");
  const [context, setContext] = useState("");
  const [apiKey, setApiKey] = useState(localStorage.getItem("openai-api-key") || "");
  const [isLoading, setIsLoading] = useState(false);
  const [analyzedLinks, setAnalyzedLinks] = useState<AnalyzedLink[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const saveApiKey = () => {
    localStorage.setItem("openai-api-key", apiKey);
    toast.success("API key saved securely!");
  };

  const analyzeLink = async () => {
    if (!url) {
      toast.error("Please enter a URL");
      return;
    }

    if (!apiKey) {
      toast.error("Please set your OpenAI API key first");
      return;
    }

    setIsLoading(true);

    try {
      // Validate URL
      new URL(url);

      const prompt = `Analyze this website URL: ${url}

${context ? `Additional context: ${context}` : ""}

Please provide:
1. A single word that best describes what this website/service does
2. 3-5 relevant tags that would help categorize this link (like "productivity tool", "free resource", "design tool", etc.)

Respond in this exact JSON format:
{
  "summary": "single-word-description",
  "tags": ["tag1", "tag2", "tag3"]
}`;

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant that analyzes websites and provides concise summaries and relevant tags. Always respond with valid JSON."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          max_tokens: 200,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const result = JSON.parse(data.choices[0].message.content);

      const newLink: AnalyzedLink = {
        id: Date.now().toString(),
        url,
        summary: result.summary,
        tags: result.tags,
        context,
        createdAt: new Date(),
      };

      setAnalyzedLinks(prev => [newLink, ...prev]);
      setUrl("");
      setContext("");
      toast.success("Link analyzed successfully!");
    } catch (error) {
      console.error("Error analyzing link:", error);
      toast.error("Failed to analyze link. Please check your API key and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLinks = analyzedLinks.filter(link =>
    link.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
    link.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
    link.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-8 w-8 text-notion-blue" />
            <h1 className="text-4xl font-bold tracking-tight">LinkScope</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Instantly analyze any website with AI. Get one-word summaries and smart tags to organize your digital discoveries.
          </p>
        </div>

        {/* Main Input Card */}
        <Card className="mb-8 shadow-notion-md border-0 bg-gradient-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Analyze New Link
              </CardTitle>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>OpenAI Settings</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        OpenAI API Key
                      </label>
                      <Input
                        type="password"
                        placeholder="sk-..."
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Your API key is stored locally and never sent to our servers.
                      </p>
                    </div>
                    <Button onClick={saveApiKey} className="w-full">
                      Save API Key
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Input
                placeholder="Paste your link here (e.g., https://example.com)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="text-base"
              />
            </div>
            <div>
              <Textarea
                placeholder="Optional: Add context to help AI understand what you're looking for..."
                value={context}
                onChange={(e) => setContext(e.target.value)}
                className="min-h-20 resize-none"
              />
            </div>
            <Button 
              onClick={analyzeLink} 
              disabled={isLoading || !url}
              className="w-full transition-all duration-200 hover:scale-105"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Analyzing...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Analyze Link
                </div>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Search */}
        {analyzedLinks.length > 0 && (
          <div className="mb-6">
            <Input
              placeholder="Search your links, summaries, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>
        )}

        {/* Results */}
        <div className="space-y-4">
          {filteredLinks.map((link) => (
            <Card key={link.id} className="shadow-notion-sm border-0 bg-gradient-card hover:shadow-notion-md transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge variant="secondary" className="font-medium">
                        {link.summary}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {link.createdAt.toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="mb-3">
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-notion-blue hover:underline break-all text-sm font-medium flex items-center gap-1"
                      >
                        {link.url}
                        <ExternalLink className="h-3 w-3 flex-shrink-0" />
                      </a>
                    </div>

                    {link.context && (
                      <p className="text-sm text-muted-foreground mb-3 italic">
                        "{link.context}"
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {link.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {analyzedLinks.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-notion-gray-light rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-8 w-8 text-notion-gray" />
            </div>
            <h3 className="text-lg font-medium mb-2">No links analyzed yet</h3>
            <p className="text-muted-foreground">
              Add your first link above to get started with AI-powered analysis!
            </p>
          </div>
        )}

        {filteredLinks.length === 0 && analyzedLinks.length > 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No links match your search. Try a different term.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LinkAnalyzer;