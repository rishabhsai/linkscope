# 🔗 LinkScope 2.0

<div align="center">
  <img src="https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.5.3-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4.11-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white" alt="OpenAI" />
</div>

<div align="center">
  <h3>🚀 The Ultimate AI-Powered Link Management Tool</h3>
  <p>Organize, analyze, and manage your digital discoveries with intelligent categorization and seamless workflow integration.</p>
</div>

---

## ✨ Features

### 🤖 **AI-Powered Analysis**
- **Smart Categorization**: Automatically analyze links and generate relevant tags
- **Content Understanding**: Extract meaningful summaries from any website or video
- **Context-Aware**: Provide additional context for better AI analysis
- **Multi-Platform Support**: YouTube, Instagram, TikTok, and general web content

### 🎯 **Todo & Workflow Management**
- **Task Integration**: Mark links as todo items for later action
- **Status Tracking**: Active, Todo, Completed, and Archived states
- **Priority Levels**: High, Medium, Low priority classification
- **Due Dates**: Set deadlines for important links

### 🎨 **Modern & Intuitive Interface**
- **Minimalistic Design**: Clean, distraction-free interface
- **Drag & Drop**: Reorder links with smooth animations
- **Mobile Responsive**: Perfect experience on all devices
- **Dark Mode Ready**: (Coming soon)

### 🔍 **Advanced Search & Filtering**
- **Instant Search**: Real-time search across titles, URLs, and tags
- **Tag Filtering**: Click any tag to see related links
- **Status Filters**: Filter by active, todo, completed, or archived
- **Smart Suggestions**: Autocomplete and related content discovery

### 👥 **Multi-User Support**
- **User Management**: Track who added each link
- **Personal Workspace**: Each user has their own organized space
- **Collaboration Ready**: Share and discuss links with team members

### 📊 **Analytics & Insights**
- **Usage Tracking**: Monitor link access and engagement
- **Popular Content**: Discover trending links and tags
- **Activity Timeline**: View your link collection history

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager
- OpenAI API key
- Supabase account (optional for local development)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/linkscope.git
   cd linkscope
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your API keys:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```
   
   Or with Vercel CLI (recommended):
   ```bash
   vercel dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000` and start organizing your links!

## 🔧 Configuration

### Database Setup (Supabase)

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the database migrations:
   ```sql
   -- Create the analyzed_links table
   CREATE TABLE analyzed_links (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id TEXT NOT NULL,
     url TEXT NOT NULL,
     title TEXT,
     summary TEXT NOT NULL,
     tags TEXT[] DEFAULT '{}',
     context TEXT,
     type TEXT NOT NULL DEFAULT 'link',
     platform TEXT DEFAULT 'other',
     status TEXT NOT NULL DEFAULT 'active',
     priority TEXT NOT NULL DEFAULT 'medium',
     due_date TIMESTAMP WITH TIME ZONE,
     thumbnail TEXT,
     description TEXT,
     is_manually_added BOOLEAN DEFAULT FALSE,
     access_count INTEGER DEFAULT 0,
     last_accessed TIMESTAMP WITH TIME ZONE,
     order_index INTEGER DEFAULT 0,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   
   -- Create indexes for better performance
   CREATE INDEX idx_analyzed_links_user_id ON analyzed_links(user_id);
   CREATE INDEX idx_analyzed_links_status ON analyzed_links(status);
   CREATE INDEX idx_analyzed_links_tags ON analyzed_links USING GIN(tags);
   CREATE INDEX idx_analyzed_links_created_at ON analyzed_links(created_at);
   ```

3. Enable Row Level Security (RLS) for data protection
4. Update your `.env` file with your Supabase credentials

### OpenAI API Setup

1. Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Add it to your `.env` file
3. The app uses GPT-4 for intelligent link analysis

## 🎯 Usage

### Adding Links

**AI Analysis (Recommended)**
1. Click "Add Link" button
2. Paste your URL
3. Optionally add context for better analysis
4. Let AI generate summary and tags automatically

**Manual Entry**
1. Click "Add Link" → Switch to "Manual" mode
2. Fill in title, summary, and tags yourself
3. Set priority and status as needed
4. Perfect for quick additions or custom categorization

### Managing Links

**Organizing**
- Drag and drop to reorder links
- Use status filters: Active, Todo, Completed, Archived
- Click tags to filter related content
- Search across all content instantly

**Workflow Integration**
- Mark links as "Todo" for later review
- Set priority levels (High, Medium, Low)
- Add due dates for time-sensitive content
- Track completion status

### Advanced Features

**Smart Filtering**
- Click any tag to see related links
- Use the search bar for instant results
- Filter by status, priority, or date
- Combine multiple filters for precise results

**Link Details**
- Click any link to view full details
- Edit information inline
- View access history and statistics
- Share or export link data

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks and suspense
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Smooth animations and transitions
- **Radix UI** - Accessible component primitives
- **shadcn/ui** - Beautiful, customizable components

### Backend
- **Vercel Functions** - Serverless API endpoints
- **OpenAI GPT-4** - AI-powered content analysis
- **Supabase** - Database and real-time features

### Development Tools
- **Vite** - Fast development server and build tool
- **ESLint** - Code linting and formatting
- **Prettier** - Code formatting
- **Vercel CLI** - Local development and deployment

## 🌟 Roadmap

### Phase 1: Core Features ✅
- [x] AI-powered link analysis
- [x] Drag & drop interface
- [x] Todo system integration
- [x] Search and filtering
- [x] Mobile responsive design

### Phase 2: Enhanced Features 🚧
- [ ] **Browser Extension** - One-click link saving
- [ ] **Bulk Import** - CSV/JSON import functionality
- [ ] **Tags Management** - Rename, merge, organize tags
- [ ] **Link Validation** - Check for broken links
- [ ] **Export Options** - PDF, CSV, JSON export

### Phase 3: Collaboration 📋
- [ ] **Team Workspaces** - Shared link collections
- [ ] **Comments & Discussions** - Collaborate on links
- [ ] **Link Recommendations** - AI-suggested related content
- [ ] **Usage Analytics** - Detailed insights and reporting

### Phase 4: Advanced Features 🔮
- [ ] **Dark Mode** - Beautiful dark theme
- [ ] **Offline Support** - Work without internet
- [ ] **API Integration** - Connect with other tools
- [ ] **Custom Categories** - Folder-based organization

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋‍♂️ Support

- **Documentation**: Check our [wiki](https://github.com/yourusername/linkscope/wiki)
- **Issues**: Report bugs on [GitHub Issues](https://github.com/yourusername/linkscope/issues)
- **Discussions**: Join our [GitHub Discussions](https://github.com/yourusername/linkscope/discussions)
- **Email**: Contact us at support@linkscope.dev

---

<div align="center">
  <p>Made with ❤️ by developers who love organizing digital content</p>
  <p>⭐ Star this repo if you find it useful!</p>
</div>
