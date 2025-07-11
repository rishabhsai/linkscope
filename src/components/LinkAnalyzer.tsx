import { useState } from "react";
import { Plus, ExternalLink, Settings, Sparkles, Video, Link as LinkIcon, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface AnalyzedLink {
  id: string;
  url: string;
  summary: string;
  tags: string[];
  context?: string;
  createdAt: Date;
  type: 'video' | 'link';
  platform?: 'youtube' | 'instagram' | 'tiktok' | 'other';
}

const LinkAnalyzer = () => {
  const [url, setUrl] = useState("");
  const [context, setContext] = useState("");
  const [apiKey, setApiKey] = useState(localStorage.getItem("openai-api-key") || "");
  const [isLoading, setIsLoading] = useState(false);
  const [analyzedLinks, setAnalyzedLinks] = useState<AnalyzedLink[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const detectLinkType = (url: string): { type: 'video' | 'link', platform: 'youtube' | 'instagram' | 'tiktok' | 'other' } => {
    const lowerUrl = url.toLowerCase();
    
    if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
      return { type: 'video', platform: 'youtube' };
    }
    if (lowerUrl.includes('instagram.com') && (lowerUrl.includes('/reel/') || lowerUrl.includes('/tv/'))) {
      return { type: 'video', platform: 'instagram' };
    }
    if (lowerUrl.includes('tiktok.com')) {
      return { type: 'video', platform: 'tiktok' };
    }
    
    return { type: 'link', platform: 'other' };
  };

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
      
      const linkInfo = detectLinkType(url);

      const prompt = `Analyze this website URL: ${url}

${context ? `Additional context: ${context}` : ""}

${linkInfo.type === 'video' ? 'This is a video link.' : 'This is a regular website link.'}

Please provide:
1. A single word that best describes what this website/service does
2. 3-5 relevant tags that would help categorize this link (like "productivity tool", "free resource", "design tool", "entertainment", "social media", etc.)

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
        type: linkInfo.type,
        platform: linkInfo.platform,
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

  const videoLinks = filteredLinks.filter(link => link.type === 'video');
  const regularLinks = filteredLinks.filter(link => link.type === 'link');

  const getPlatformIcon = (platform?: string) => {
    switch (platform) {
      case 'youtube':
        return <Play className="h-4 w-4 text-red-500" />;
      case 'instagram':
        return <Video className="h-4 w-4 text-pink-500" />;
      case 'tiktok':
        return <Video className="h-4 w-4 text-purple-accent" />;
      default:
        return <LinkIcon className="h-4 w-4" />;
    }
  };

  const renderLinkCard = (link: AnalyzedLink) => (
    <Card key={link.id} className="shadow-notion-sm border-0 bg-gradient-card hover:shadow-purple transition-all duration-200 group">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-2">
                {getPlatformIcon(link.platform)}
                <Badge variant="secondary" className="font-medium bg-purple-muted/20 text-purple-accent border-purple-muted">
                  {link.summary}
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground">
                {link.createdAt.toLocaleDateString()}
              </span>
            </div>
            
            <div className="mb-3">
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-accent hover:text-purple-primary hover:underline break-all text-sm font-medium flex items-center gap-1 transition-colors duration-200"
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
                <Badge key={index} variant="outline" className="text-xs border-purple-muted/30 hover:bg-purple-muted/10 transition-colors duration-200">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="relative">
              <Sparkles className="h-10 w-10 text-purple-accent" />
              <div className="absolute inset-0 h-10 w-10 text-purple-accent animate-ping opacity-20">
                <Sparkles className="h-10 w-10" />
              </div>
            </div>
            <h1 className="text-5xl font-bold tracking-tight bg-gradient-purple bg-clip-text text-transparent">
              LinkScope
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Instantly analyze any website or video with AI. Get one-word summaries and smart tags to organize your digital discoveries.
          </p>
        </div>

        {/* Main Input Card */}
        <Card className="mb-8 shadow-notion-md border border-purple-muted/20 bg-gradient-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Plus className="h-5 w-5 text-purple-accent" />
                Analyze New Link
              </CardTitle>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon" className="border-purple-muted/30 hover:bg-purple-muted/10">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-purple-muted/20">
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
                        className="border-purple-muted/30 focus:border-purple-accent"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Your API key is stored locally and never sent to our servers.
                      </p>
                    </div>
                    <Button onClick={saveApiKey} className="w-full bg-purple-primary hover:bg-purple-secondary">
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
                placeholder="Paste your link here (YouTube, Instagram Reels, TikTok, websites...)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="text-base border-purple-muted/30 focus:border-purple-accent"
              />
            </div>
            <div>
              <Textarea
                placeholder="Optional: Add context to help AI understand what you're looking for..."
                value={context}
                onChange={(e) => setContext(e.target.value)}
                className="min-h-20 resize-none border-purple-muted/30 focus:border-purple-accent"
              />
            </div>
            <Button 
              onClick={analyzeLink} 
              disabled={isLoading || !url}
              className="w-full bg-purple-primary hover:bg-purple-secondary transition-all duration-200 hover:scale-105 hover:shadow-purple"
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

        {analyzedLinks.length > 0 && (
          <>
            {/* Search */}
            <div className="mb-6">
              <Input
                placeholder="Search your links, summaries, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md border-purple-muted/30 focus:border-purple-accent"
              />
            </div>

            {/* Tabbed Results */}
            <Tabs defaultValue="all" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3 bg-secondary border border-purple-muted/20">
                <TabsTrigger 
                  value="all" 
                  className="data-[state=active]:bg-purple-primary data-[state=active]:text-white"
                >
                  All ({filteredLinks.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="videos" 
                  className="data-[state=active]:bg-purple-primary data-[state=active]:text-white flex items-center gap-2"
                >
                  <Video className="h-4 w-4" />
                  Videos ({videoLinks.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="links" 
                  className="data-[state=active]:bg-purple-primary data-[state=active]:text-white flex items-center gap-2"
                >
                  <LinkIcon className="h-4 w-4" />
                  Links ({regularLinks.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                {filteredLinks.map(renderLinkCard)}
              </TabsContent>

              <TabsContent value="videos" className="space-y-4">
                {videoLinks.length > 0 ? (
                  videoLinks.map(renderLinkCard)
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-purple-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Video className="h-8 w-8 text-purple-accent" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No videos saved yet</h3>
                    <p className="text-muted-foreground">
                      Add YouTube, Instagram Reels, or TikTok links to see them here!
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="links" className="space-y-4">
                {regularLinks.length > 0 ? (
                  regularLinks.map(renderLinkCard)
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-purple-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <LinkIcon className="h-8 w-8 text-purple-accent" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No links saved yet</h3>
                    <p className="text-muted-foreground">
                      Add website links to see them organized here!
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}

        {analyzedLinks.length === 0 && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-purple-muted/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="h-10 w-10 text-purple-accent" />
            </div>
            <h3 className="text-xl font-medium mb-3">No content analyzed yet</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Add your first link or video above to get started with AI-powered analysis and smart organization!
            </p>
          </div>
        )}

        {filteredLinks.length === 0 && analyzedLinks.length > 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No content matches your search. Try a different term.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LinkAnalyzer;