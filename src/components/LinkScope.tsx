import React, { useState, useEffect } from 'react'
import { 
  DndContext, 
  DragEndEvent, 
  DragOverlay, 
  DragStartEvent,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical,
  ExternalLink,
  Calendar,
  Clock,
  Tag,
  User,
  CheckCircle,
  Circle,
  Archive,
  Star,
  AlertCircle,
  Sparkles,
  Link2,
  Video,
  Play,
  Instagram,
  Music,
  Settings,
  X,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Save,
  Copy,
  Share2,
  Bookmark,
  BookmarkCheck,
  Target,
  GripVertical
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { linkService, LocalAnalyzedLink } from '@/services/linkService'
import { useDebounce } from 'react-use'
import { useSettings } from '@/contexts/SettingsContext'
import { analyzeLink } from '@/services/openaiService'

interface LinkScopeProps {
  username: string
}

interface SortableLinkProps {
  link: LocalAnalyzedLink
  onEdit: (link: LocalAnalyzedLink) => void
  onDelete: (id: string) => void
  onStatusChange: (id: string, status: LocalAnalyzedLink['status']) => void
  onTagClick: (tag: string) => void
  onLinkClick: (link: LocalAnalyzedLink) => void
  getStatusIcon: (status: string) => React.ReactElement
  isDragging?: boolean
}

const SortableLink: React.FC<SortableLinkProps> = ({ 
  link, 
  onEdit, 
  onDelete, 
  onStatusChange, 
  onTagClick, 
  onLinkClick,
  getStatusIcon,
  isDragging = false
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: link.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const getPlatformIcon = (platform?: string) => {
    switch (platform) {
      case 'youtube':
        return <Play className="h-4 w-4 text-red-500" />
      case 'instagram':
        return <Instagram className="h-4 w-4 text-pink-500" />
      case 'tiktok':
        return <Music className="h-4 w-4 text-purple-500" />
      default:
        return <Link2 className="h-4 w-4 text-blue-500" />
    }
  }



  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date)
  }

  const handleLinkClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    await linkService.trackAccess(link.id)
    onLinkClick(link)
    window.open(link.url, '_blank')
  }

  const handleStatusToggle = () => {
    // Only allow toggling if the item is already a todo or completed
    if (link.status === 'todo') {
      onStatusChange(link.id, 'completed')
    } else if (link.status === 'completed') {
      onStatusChange(link.id, 'todo')
    }
    // Don't allow toggling for 'active' or 'archived' items
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`
        group relative bg-gray-800 rounded-lg border border-gray-700 shadow-sm hover:shadow-md 
        transition-all duration-200 hover:border-gray-600
        ${isSortableDragging ? 'opacity-50 scale-95' : ''}
        ${link.status === 'completed' ? 'opacity-60' : ''}
      `}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4 text-gray-400" />
      </div>

      <div className="p-4 pl-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div onClick={(e) => e.stopPropagation()}>
              <button
                onClick={handleStatusToggle}
                className={`flex-shrink-0 transition-transform p-2 ${
                  link.status === 'todo' || link.status === 'completed' 
                    ? 'hover:scale-110 cursor-pointer' 
                    : 'cursor-default'
                }`}
                disabled={link.status !== 'todo' && link.status !== 'completed'}
              >
                {getStatusIcon(link.status)}
              </button>
            </div>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {getPlatformIcon(link.platform)}
              <div className="flex-1 min-w-0">
                <h3 
                  className={`font-medium truncate cursor-pointer hover:text-blue-400 transition-colors ${link.status === 'completed' ? 'text-gray-400 line-through' : 'text-white'}`}
                  onClick={() => onLinkClick(link)}
                >
                  {link.title || link.summary}
                </h3>
                <p className="text-sm text-gray-400 truncate">
                  {formatDate(link.createdAt)}
                  {link.userId && (
                    <span className="ml-2 px-2 py-0.5 bg-green-900/50 text-green-300 rounded-full text-xs">
                      by {link.userId}
                    </span>
                  )}
                  {link.isManuallyAdded && (
                    <span className="ml-2 px-2 py-0.5 bg-blue-900/50 text-blue-300 rounded-full text-xs">
                      Manual
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(link)} className="focus:bg-blue-900/20 focus:text-blue-300">
                <Edit className="h-4 w-4 mr-2 text-blue-500" />
                <span className="font-medium">Edit</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onLinkClick(link)} className="focus:bg-purple-900/20 focus:text-purple-300">
                <Eye className="h-4 w-4 mr-2 text-purple-500" />
                <span className="font-medium">View Details</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(link.url)} className="focus:bg-green-900/20 focus:text-green-300">
                <Copy className="h-4 w-4 mr-2 text-green-500" />
                <span className="font-medium">Copy URL</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {link.status === 'active' && (
                <DropdownMenuItem onClick={() => onStatusChange(link.id, 'todo')} className="focus:bg-orange-900/20 focus:text-orange-300">
                  <Circle className="h-4 w-4 mr-2 text-orange-500" />
                  <span className="font-medium">Mark as Todo</span>
                </DropdownMenuItem>
              )}
              {link.status === 'todo' && (
                <DropdownMenuItem onClick={() => onStatusChange(link.id, 'active')} className="focus:bg-blue-900/20 focus:text-blue-300">
                  <Target className="h-4 w-4 mr-2 text-blue-500" />
                  <span className="font-medium">Remove from Todos</span>
                </DropdownMenuItem>
              )}
              {link.status === 'completed' && (
                <DropdownMenuItem onClick={() => onStatusChange(link.id, 'active')} className="focus:bg-blue-900/20 focus:text-blue-300">
                  <Target className="h-4 w-4 mr-2 text-blue-500" />
                  <span className="font-medium">Remove from Todos</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onDelete(link.id)} className="text-red-600 focus:bg-red-900/20 focus:text-red-400">
                <Trash2 className="h-4 w-4 mr-2" />
                <span className="font-medium">Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <a
            href={link.url}
            onClick={handleLinkClick}
            className="block text-sm text-blue-400 hover:text-blue-300 hover:underline break-all"
          >
            {link.url}
          </a>
          
          {link.context && (
            <p className="text-sm text-gray-400 italic">
              "{link.context}"
            </p>
          )}
          
          {link.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {link.tags.slice(0, 3).map((tag, index) => (
                <button
                  key={index}
                  onClick={() => onTagClick(tag)}
                  className="px-2 py-1 bg-gray-700 text-gray-300 rounded-full text-xs hover:bg-gray-600 transition-colors"
                >
                  #{tag}
                </button>
              ))}
              {link.tags.length > 3 && (
                <span className="px-2 py-1 bg-gray-700 text-gray-400 rounded-full text-xs">
                  +{link.tags.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

const LinkScope: React.FC<LinkScopeProps> = ({ username }) => {
  const [links, setLinks] = useState<LocalAnalyzedLink[]>([])
  const [filteredLinks, setFilteredLinks] = useState<LocalAnalyzedLink[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'links' | 'todos'>('links')
  const [draggedLink, setDraggedLink] = useState<LocalAnalyzedLink | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)
  const [selectedLink, setSelectedLink] = useState<LocalAnalyzedLink | null>(null)
  const [editingLink, setEditingLink] = useState<LocalAnalyzedLink | null>(null)
  
  // Settings management
  const { apiKey, setApiKey, hasApiKey, clearApiKey } = useSettings()
  const [tempApiKey, setTempApiKey] = useState(apiKey)
  const [showApiKey, setShowApiKey] = useState(false)
  
  // Helper functions
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'todo':
        return <Circle className="h-4 w-4 text-orange-500" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'archived':
        return <Archive className="h-4 w-4 text-gray-500" />
      default:
        return <Target className="h-4 w-4 text-blue-500" />
    }
  }
  
  // Form states
  const [newLink, setNewLink] = useState({
    url: '',
    title: '',
    summary: '',
    tags: '',
    context: '',
    status: 'active' as 'active' | 'todo' | 'completed' | 'archived',
  })
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [useAI, setUseAI] = useState(true)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Debounced search
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  useDebounce(
    () => {
      setDebouncedSearchTerm(searchTerm)
    },
    300,
    [searchTerm]
  )

  // Load links
  useEffect(() => {
    loadLinks()
  }, [])

      // Filter links based on search, tag, and tab
    useEffect(() => {
      let filtered = links

      if (activeTab === 'links') {
        // Links tab: only show active and archived links (not todos)
        filtered = filtered.filter(link => link.status === 'active' || link.status === 'archived')
      } else if (activeTab === 'todos') {
        // Todo tab: only show todo and completed items
        filtered = filtered.filter(link => link.status === 'todo' || link.status === 'completed')
        // Sort todos: incomplete first, completed at bottom
        filtered.sort((a, b) => {
          if (a.status === 'completed' && b.status === 'todo') return 1
          if (a.status === 'todo' && b.status === 'completed') return -1
          return 0
        })
      }

      if (debouncedSearchTerm) {
        filtered = filtered.filter(link => 
          link.url.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          link.summary.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          link.title?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          link.tags.some(tag => tag.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
        )
      }

      if (selectedTag) {
        filtered = filtered.filter(link => link.tags.includes(selectedTag))
      }

      setFilteredLinks(filtered)
    }, [links, debouncedSearchTerm, selectedTag, activeTab])

  const loadLinks = async () => {
    try {
      setIsLoading(true)
      const loadedLinks = await linkService.getLinks()
      setLinks(loadedLinks)
    } catch (error) {
      console.error('Error loading links:', error)
      toast.error('Failed to load links')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const link = links.find(l => l.id === active.id)
    setDraggedLink(link || null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setDraggedLink(null)

    if (!over) return

    if (active.id !== over.id) {
      const oldIndex = filteredLinks.findIndex(link => link.id === active.id)
      const newIndex = filteredLinks.findIndex(link => link.id === over.id)
      
      const newFilteredLinks = arrayMove(filteredLinks, oldIndex, newIndex)
      setFilteredLinks(newFilteredLinks)
      
      // Update order in database
      const orderUpdates = newFilteredLinks.map((link, index) => ({
        id: link.id,
        order: index
      }))
      linkService.updateOrder(orderUpdates)
    }
  }

  const handleAddLink = async () => {
    if (!newLink.url) {
      toast.error('Please enter a URL')
      return
    }
    if (!useAI && !newLink.summary) {
      toast.error('Please enter a summary')
      return
    }
    
    if (useAI && !hasApiKey) {
      toast.error('Please configure your OpenAI API key in the settings first')
      return
    }

    try {
      setIsAnalyzing(true)
      let createdLink: LocalAnalyzedLink

      if (useAI) {
        // Use AI analysis
        const linkInfo = linkService.detectLinkType(newLink.url)
        const result = await analyzeLink(
          newLink.url,
          newLink.context || '',
          linkInfo.type,
          linkInfo.platform,
          apiKey
        )
        createdLink = await linkService.createLink({
          url: newLink.url,
          title: newLink.title || undefined,
          summary: result.summary || newLink.summary,
          tags: result.tags || newLink.tags.split(',').map(t => t.trim()),
          context: newLink.context || undefined,
          status: newLink.status,
          type: linkService.detectLinkType(newLink.url).type,
          platform: linkService.detectLinkType(newLink.url).platform,
          order: links.length,
        })
      } else {
        // Manual creation
        createdLink = await linkService.createLinkManually({
          url: newLink.url,
          title: newLink.title || undefined,
          summary: newLink.summary,
          tags: newLink.tags.split(',').map(t => t.trim()).filter(t => t),
          context: newLink.context || undefined,
          status: newLink.status,
        })
      }

      setLinks(prev => [createdLink, ...prev])
      setNewLink({
        url: '',
        title: '',
        summary: '',
        tags: '',
        context: '',
        status: 'active',
      })
      setShowAddDialog(false)
      toast.success('Link added successfully!')
    } catch (error) {
      console.error('Error adding link:', error)
      toast.error('Failed to add link')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleEditLink = (link: LocalAnalyzedLink) => {
    setEditingLink(link)
    setNewLink({
      url: link.url,
      title: link.title || '',
      summary: link.summary,
      tags: link.tags.join(', '),
      context: link.context || '',
      status: link.status,
    })
    setShowAddDialog(true)
  }

  const handleUpdateLink = async () => {
    if (!editingLink) return

    try {
      setIsAnalyzing(true)
      const updatedLink = await linkService.updateLink(editingLink.id, {
        title: newLink.title || undefined,
        summary: newLink.summary,
        tags: newLink.tags.split(',').map(t => t.trim()).filter(t => t),
        context: newLink.context || undefined,
        status: newLink.status,
      })

      setLinks(prev => prev.map(l => l.id === editingLink.id ? updatedLink : l))
      setEditingLink(null)
      setNewLink({
        url: '',
        title: '',
        summary: '',
        tags: '',
        context: '',
        status: 'active',
      })
      setShowAddDialog(false)
      toast.success('Link updated successfully!')
    } catch (error) {
      console.error('Error updating link:', error)
      toast.error('Failed to update link')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleDeleteLink = async (id: string) => {
    if (!confirm('Are you sure you want to delete this link?')) return

    try {
      await linkService.deleteLink(id)
      setLinks(prev => prev.filter(l => l.id !== id))
      toast.success('Link deleted successfully!')
    } catch (error) {
      console.error('Error deleting link:', error)
      toast.error('Failed to delete link')
    }
  }

  const handleStatusChange = async (id: string, status: LocalAnalyzedLink['status']) => {
    try {
      const updatedLink = await linkService.updateLink(id, { status })
      setLinks(prev => prev.map(l => l.id === id ? updatedLink : l))
      toast.success('Status updated!')
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    }
  }

  const handleTagClick = (tag: string) => {
    setSelectedTag(selectedTag === tag ? null : tag)
  }

  const handleLinkClick = (link: LocalAnalyzedLink) => {
    setSelectedLink(link)
    setShowDetailDialog(true)
  }

  const exportToCSV = () => {
    const csvContent = [
      ['URL', 'Title', 'Summary', 'Tags', 'Status', 'Created At', 'Context'],
      ...links.map(link => [
        link.url,
        link.title || '',
        link.summary,
        link.tags.join(', '),
        link.status,
        new Date(link.createdAt).toLocaleDateString(),
        link.context || ''
      ])
    ].map(row => row.map(field => `"${field.replace(/"/g, '""')}"`).join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `linkscope-links-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Links exported to CSV!')
  }

  const exportToJSON = () => {
    const jsonContent = JSON.stringify(links, null, 2)
    const blob = new Blob([jsonContent], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `linkscope-links-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Links exported to JSON!')
  }

  const handleChangeUsername = () => {
    localStorage.removeItem('username')
    window.location.reload()
  }

  // API Key management functions
  const handleSaveApiKey = () => {
    setApiKey(tempApiKey)
    toast.success(tempApiKey ? "API key saved successfully!" : "API key removed")
  }

  const handleClearApiKey = () => {
    clearApiKey()
    setTempApiKey('')
    toast.success("API key removed")
  }

  const isValidApiKey = (key: string) => {
    return key.startsWith('sk-') && key.length > 20
  }

  // Update tempApiKey when apiKey changes (e.g., on dialog open)
  useEffect(() => {
    setTempApiKey(apiKey)
  }, [apiKey])

  const getAllTags = () => {
    const tagSet = new Set<string>()
    links.forEach(link => {
      link.tags.forEach(tag => tagSet.add(tag))
    })
    return Array.from(tagSet).sort()
  }

  const getTabCounts = () => {
    return {
      links: links.filter(l => l.status === 'active' || l.status === 'archived').length,
      todos: links.filter(l => l.status === 'todo' || l.status === 'completed').length,
    }
  }

  const tabCounts = getTabCounts()

  function renderPreview(link: LocalAnalyzedLink) {
    if (link.platform === 'youtube') {
      const match = link.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/)
      const videoId = match ? match[1] : null
      return videoId ? (
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          title="YouTube Video"
          className="w-full h-[350px] bg-black"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ border: 'none' }}
        />
      ) : (
        <div className="p-4 text-center text-gray-400">Invalid YouTube URL</div>
      )
    }
    if (link.platform === 'instagram') {
      const match = link.url.match(/instagram\.com\/p\/([A-Za-z0-9_-]+)/)
      const shortcode = match ? match[1] : null
      return shortcode ? (
        <iframe
          src={`https://www.instagram.com/p/${shortcode}/embed`}
          title="Instagram Post"
          className="w-full h-[350px] bg-black"
          allow="encrypted-media"
          style={{ border: 'none' }}
        />
      ) : (
        <div className="p-4 text-center text-gray-400">Invalid Instagram URL</div>
      )
    }
    if (link.platform === 'tiktok') {
      const match = link.url.match(/tiktok\.com\/@[\w.-]+\/video\/(\d+)/)
      const videoId = match ? match[1] : null
      return videoId ? (
        <iframe
          src={`https://www.tiktok.com/embed/v2/${videoId}`}
          title="TikTok Video"
          className="w-full h-[350px] bg-black"
          allow="autoplay; encrypted-media"
          style={{ border: 'none' }}
        />
      ) : (
        <div className="p-4 text-center text-gray-400">Invalid TikTok URL</div>
      )
    }
    // Default: website preview
    return (
      <iframe
        src={link.url}
        title="Website Preview"
        className="w-full h-[350px] bg-gray-900"
        sandbox="allow-scripts allow-same-origin allow-popups"
        style={{ border: 'none' }}
        onError={(e) => {
          e.currentTarget.style.display = 'none';
          const fallback = document.createElement('div');
          fallback.className = 'p-4 text-center text-gray-400';
          fallback.innerText = 'Preview unavailable for this site.';
          e.currentTarget.parentNode.appendChild(fallback);
        }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-900/30 rounded-lg">
                <Sparkles className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">LinkScope</h1>
                <p className="text-gray-400">Welcome back, {username}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowAddDialog(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Link
              </Button>
              <Button variant="outline" size="sm" className="border-gray-700 text-gray-300 hover:bg-gray-800" onClick={() => setShowSettingsDialog(true)}>
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search links..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
              />
            </div>
            {selectedTag && (
              <Button 
                variant="outline" 
                onClick={() => setSelectedTag(null)}
                className="whitespace-nowrap border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <X className="h-4 w-4 mr-2" />
                #{selectedTag}
              </Button>
            )}
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
            <TabsList className="grid w-full grid-cols-2 bg-gray-800 border-gray-700">
              <TabsTrigger value="links" className="text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-white">
                Links ({tabCounts.links})
              </TabsTrigger>
              <TabsTrigger value="todos" className="text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-white">
                Todos ({tabCounts.todos})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading your links...</p>
            </div>
          </div>
        ) : filteredLinks.length === 0 ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="p-3 bg-gray-800 rounded-full w-fit mx-auto mb-4">
                <Link2 className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No links found</h3>
              <p className="text-gray-400 mb-6">
                {searchTerm || selectedTag ? 'Try adjusting your search or filters' : 'Add your first link to get started'}
              </p>
              <Button onClick={() => setShowAddDialog(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Link
              </Button>
            </div>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={filteredLinks} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                <AnimatePresence>
                  {filteredLinks.map(link => (
                    <SortableLink
                      key={link.id}
                      link={link}
                      onEdit={handleEditLink}
                      onDelete={handleDeleteLink}
                      onStatusChange={handleStatusChange}
                      onTagClick={handleTagClick}
                      onLinkClick={handleLinkClick}
                      getStatusIcon={getStatusIcon}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </SortableContext>
            
            <DragOverlay>
              {draggedLink ? (
                <div className="bg-white rounded-lg border border-gray-200 shadow-lg p-4 opacity-90">
                  <div className="flex items-center gap-2">
                    <div className="p-1 bg-blue-100 rounded">
                      <Link2 className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="font-medium text-gray-900 truncate">
                      {draggedLink.title || draggedLink.summary}
                    </span>
                  </div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-md bg-gray-900 border-gray-700 text-white">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingLink ? 'Edit Link' : 'Add New Link'}
              </DialogTitle>
              <DialogDescription>
                {editingLink ? 'Update your link details and settings.' : 'Add a new link to your collection with AI analysis or manual entry.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Button
                  variant={useAI ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setUseAI(true)}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  AI Analysis
                </Button>
                <Button
                  variant={!useAI ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setUseAI(false)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Manual
                </Button>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  URL *
                </label>
                <Input
                  placeholder="https://example.com"
                  value={newLink.url}
                  onChange={(e) => setNewLink(prev => ({ ...prev, url: e.target.value }))}
                  disabled={!!editingLink}
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                />
              </div>

              {/* QOL warning for video/social links in AI mode */}
              {useAI &&
                /youtube\.com|youtu\.be|tiktok\.com|instagram\.com/.test(newLink.url) && (
                  <div className="bg-yellow-900/60 border-l-4 border-yellow-500 text-yellow-200 px-4 py-2 rounded mb-2 text-sm">
                    <strong>Note:</strong> AI may not generate a good summary for this link. For best results, please provide some context about the video or post in the context box below.
                  </div>
                )}

              {useAI && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Context (Optional)
                  </label>
                  <Textarea
                    placeholder="Help AI understand what you're looking for in this link..."
                    value={newLink.context}
                    onChange={(e) => setNewLink(prev => ({ ...prev, context: e.target.value }))}
                    className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 min-h-[80px]"
                  />
                </div>
              )}

              {!useAI && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Title
                    </label>
                    <Input
                      placeholder="Optional title for the link"
                      value={newLink.title}
                      onChange={(e) => setNewLink(prev => ({ ...prev, title: e.target.value }))}
                      className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Summary *
                    </label>
                    <Textarea
                      placeholder="Describe what this link is about"
                      value={newLink.summary}
                      onChange={(e) => setNewLink(prev => ({ ...prev, summary: e.target.value }))}
                      className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 min-h-[120px]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Tags
                    </label>
                    <Input
                      placeholder="tag1, tag2, tag3"
                      value={newLink.tags}
                      onChange={(e) => setNewLink(prev => ({ ...prev, tags: e.target.value }))}
                      className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Context (Optional)
                    </label>
                    <Textarea
                      placeholder="Additional context or notes"
                      value={newLink.context}
                      onChange={(e) => setNewLink(prev => ({ ...prev, context: e.target.value }))}
                      className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 min-h-[80px]"
                    />
                  </div>
                </>
              )}
              
              <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                <div className="relative">
                  <input
                    type="checkbox"
                    id="isTodo"
                    checked={newLink.status === 'todo'}
                    onChange={(e) => setNewLink(prev => ({ ...prev, status: e.target.checked ? 'todo' : 'active' }))}
                    className="sr-only"
                  />
                  <label 
                    htmlFor="isTodo" 
                    className={`flex items-center gap-2 cursor-pointer px-3 py-2 rounded-md transition-all duration-200 ${
                      newLink.status === 'todo' 
                        ? 'bg-orange-900/30 text-orange-300 border border-orange-500/50' 
                        : 'bg-gray-700/50 text-gray-300 border border-gray-600 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <div className={`relative w-4 h-4 border-2 rounded transition-all duration-200 ${
                      newLink.status === 'todo' 
                        ? 'border-orange-500 bg-orange-500' 
                        : 'border-gray-400 bg-transparent'
                    }`}>
                      {newLink.status === 'todo' && (
                        <svg 
                          className="absolute inset-0 w-full h-full text-white" 
                          fill="currentColor" 
                          viewBox="0 0 20 20"
                        >
                          <path 
                            fillRule="evenodd" 
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                            clipRule="evenodd" 
                          />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm font-medium">Mark as Todo</span>
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddDialog(false)} className="border-gray-700 text-gray-300 hover:bg-gray-800">
                  Cancel
                </Button>
                <Button
                  onClick={editingLink ? handleUpdateLink : handleAddLink}
                  disabled={isAnalyzing}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isAnalyzing ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                      {useAI ? 'Analyzing...' : 'Saving...'}
                    </div>
                  ) : (
                    editingLink ? 'Update Link' : 'Add Link'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Detail Dialog */}
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="max-w-2xl bg-gray-900 border-gray-700 text-white p-0">
            {selectedLink && (
              <>
                <DialogHeader className="px-6 pt-6">
                  <DialogTitle className="flex items-center gap-2 text-white">
                    {selectedLink.type === 'video' ? (
                      <Video className="h-5 w-5" />
                    ) : (
                      <Link2 className="h-5 w-5" />
                    )}
                    {selectedLink.title || selectedLink.summary}
                  </DialogTitle>
                  <DialogDescription>
                    View detailed information about this link and its metadata.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 px-6 pb-6 pt-2 max-h-[80vh] overflow-y-auto">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      URL
                    </label>
                    <a
                      href={selectedLink.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 hover:underline break-all"
                    >
                      {selectedLink.url}
                    </a>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Summary
                    </label>
                    <p className="text-gray-100">{selectedLink.summary}</p>
                  </div>
                  
                  {selectedLink.context && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Context
                      </label>
                      <p className="text-gray-100">{selectedLink.context}</p>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Tags
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {selectedLink.tags.map((tag, index) => (
                        <button
                          key={index}
                          onClick={() => handleTagClick(tag)}
                          className="px-2 py-1 bg-blue-900/50 text-blue-300 rounded-full text-sm hover:bg-blue-900/70 transition-colors"
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Created by
                      </label>
                      <div className="flex items-center gap-2 text-gray-100">
                        <User className="h-4 w-4 text-blue-400" />
                        {selectedLink.userId || 'Unknown'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Created
                      </label>
                      <p className="text-gray-100">{new Intl.DateTimeFormat('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }).format(selectedLink.createdAt)}</p>
                    </div>
                  </div>
                  {/* Embedded website preview (last, inside scrollable area) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Preview
                    </label>
                    <div className="rounded-lg border border-gray-700 overflow-hidden bg-gray-800">
                      {renderPreview(selectedLink)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Some sites may not allow embedding for security reasons.</div>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Settings Dialog */}
        <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
          <DialogContent className="max-w-md bg-gray-900 border-gray-700 text-white p-0">
            <DialogHeader className="px-6 pt-6">
              <DialogTitle className="text-white">Settings</DialogTitle>
              <DialogDescription>
                Configure your OpenAI API key and manage application settings.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 px-6 pb-6 pt-2 max-h-[80vh] overflow-y-auto">
              {/* API Key Section */}
              <div>
                <h3 className="text-lg font-medium text-white mb-3">OpenAI API Key</h3>
                <div className="space-y-4">
                  {/* API Key Status */}
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-gray-300">Status</Label>
                    <Badge variant={hasApiKey ? "default" : "destructive"}>
                      {hasApiKey ? "Configured" : "Not Set"}
                    </Badge>
                  </div>

                  {/* API Key Input */}
                  <div className="space-y-2">
                    <Label htmlFor="apiKey" className="text-sm font-medium text-gray-300">
                      API Key
                    </Label>
                    <div className="relative">
                      <Input
                        id="apiKey"
                        type={showApiKey ? "text" : "password"}
                        placeholder="sk-..."
                        value={tempApiKey}
                        onChange={(e) => setTempApiKey(e.target.value)}
                        className={`pr-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400 ${
                          tempApiKey && !isValidApiKey(tempApiKey) ? 'border-red-500' : ''
                        }`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-400 hover:text-white"
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
                      <p className="text-sm text-red-400">
                        Please enter a valid OpenAI API key (starts with 'sk-')
                      </p>
                    )}
                    <p className="text-sm text-gray-400">
                      Get your API key from{" "}
                      <a
                        href="https://platform.openai.com/api-keys"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline"
                      >
                        OpenAI Platform
                      </a>
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <Button
                      onClick={handleSaveApiKey}
                      disabled={tempApiKey && !isValidApiKey(tempApiKey)}
                      className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700"
                    >
                      <Save className="h-4 w-4" />
                      Save
                    </Button>
                    {hasApiKey && (
                      <Button
                        variant="outline"
                        onClick={handleClearApiKey}
                        className="gap-2 text-red-400 hover:text-red-300 border-gray-700 hover:bg-gray-800"
                      >
                        <Trash2 className="h-4 w-4" />
                        Clear
                      </Button>
                    )}
                  </div>

                  {/* Info */}
                  <div className="bg-blue-950/40 p-3 rounded-lg border border-blue-800/50">
                    <p className="text-sm text-blue-300">
                      <strong>Privacy:</strong> Your API key is stored locally in your browser and never sent to our servers.
                      All AI analysis requests are made directly from your browser to OpenAI.
                    </p>
                  </div>
                </div>
              </div>

              <Separator className="bg-gray-700" />

              {/* Export Section */}
              <div>
                <h3 className="text-lg font-medium text-white mb-3">Export Data</h3>
                <div className="space-y-2">
                  <Button
                    onClick={exportToCSV}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    Export to CSV
                  </Button>
                  <Button
                    onClick={exportToJSON}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    Export to JSON
                  </Button>
                </div>
              </div>

              <Separator className="bg-gray-700" />

              {/* User Management Section */}
              <div>
                <h3 className="text-lg font-medium text-white mb-3">User Management</h3>
                <div className="space-y-2">
                  <Button
                    onClick={handleChangeUsername}
                    variant="outline"
                    className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
                  >
                    Change Username
                  </Button>
                </div>
              </div>

              <Separator className="bg-gray-700" />

              {/* Stats Section */}
              <div>
                <h3 className="text-lg font-medium text-white mb-3">Statistics</h3>
                <div className="space-y-2 text-sm text-gray-300">
                  <div className="flex justify-between">
                    <span>Total Links:</span>
                    <span className="text-white">{links.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Links:</span>
                    <span className="text-white">{links.filter(l => l.status === 'active').length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Todo Items:</span>
                    <span className="text-white">{links.filter(l => l.status === 'todo').length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Completed:</span>
                    <span className="text-white">{links.filter(l => l.status === 'completed').length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Unique Tags:</span>
                    <span className="text-white">{getAllTags().length}</span>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default LinkScope 