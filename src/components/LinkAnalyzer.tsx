import { useState, useEffect } from "react";
import { Plus, ExternalLink, Settings, Sparkles, Video, Link as LinkIcon, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { linkService, LocalAnalyzedLink } from "@/services/linkService";
import { useSettings } from "@/contexts/SettingsContext";
import SettingsDialog from "@/components/SettingsDialog";
import { analyzeLink } from "@/services/openaiService";

export default function LinkAnalyzer({ username }: { username: string }) {
  const [url, setUrl] = useState("");
  const [context, setContext] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [analyzedLinks, setAnalyzedLinks] = useState<LocalAnalyzedLink[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoadingLinks, setIsLoadingLinks] = useState(true);
  
  // Settings context for API key
  const { apiKey, hasApiKey } = useSettings();

  // Load links on component mount
  useEffect(() => {
    const loadLinks = async () => {
      try {
        const links = await linkService.getLinks();
        setAnalyzedLinks(links);
      } catch (error) {
        console.error('Error loading links:', error);
        toast.error('Failed to load your links');
      } finally {
        setIsLoadingLinks(false);
      }
    };
    loadLinks();
  }, []);

  const analyzeLink = async () => {
    if (!url) {
      toast.error("Please enter a URL");
      return;
    }
    
    if (!hasApiKey) {
      toast.error("Please configure your OpenAI API key in the settings first");
      return;
    }
    
    setIsLoading(true);
    try {
      // Validate and normalize URL
      let validUrl = url.trim();
      if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
        validUrl = 'https://' + validUrl;
      }
      new URL(validUrl);
      
      const linkInfo = detectLinkType(validUrl);
      const result = await analyzeLink(
        validUrl,
        context,
        linkInfo.type,
        linkInfo.platform,
        apiKey
      );
      const newLink = await linkService.createLink({
        url: validUrl,
        summary: result.summary,
        tags: result.tags,
        context,
        type: linkInfo.type,
        platform: linkInfo.platform,
      });
      setAnalyzedLinks(prev => [newLink, ...prev]);
      setUrl("");
      setContext("");
      toast.success("Link analyzed successfully!");
    } catch (error) {
      console.error("Error analyzing link:", error);
      toast.error("Failed to analyze link. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

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

  const renderLinkCard = (link: LocalAnalyzedLink) => (
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

  const handleChangeUsername = () => {
    localStorage.removeItem("username");
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12 relative">
          <div className="absolute top-0 right-0 flex gap-2">
            <SettingsDialog />
            <Button variant="outline" size="sm" className="border-purple-muted/30 hover:bg-purple-muted/10" onClick={handleChangeUsername}>
              Change Username
            </Button>
          </div>
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
        {isLoadingLinks ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-purple-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your links...</p>
          </div>
        ) : analyzedLinks.length > 0 ? (
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
        ) : (
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
        {!isLoadingLinks && filteredLinks.length === 0 && analyzedLinks.length > 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No content matches your search. Try a different term.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}