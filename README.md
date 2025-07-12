# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/92b09fb9-bd60-4533-a6e6-b81253671436

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/92b09fb9-bd60-4533-a6e6-b81253671436) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Set up Supabase (see SUPABASE_SETUP.md for detailed instructions)
# Create a .env file with your Supabase credentials:
# VITE_SUPABASE_URL=your_supabase_project_url
# VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Step 5: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase (Database & Authentication)
- OpenAI API (Link Analysis)

## Features

**LinkScope** is an AI-powered link analyzer that helps you:

- **Analyze Any Link**: Get instant summaries and smart tags for websites, YouTube videos, Instagram Reels, and TikTok content
- **Smart Organization**: Automatically categorize content with AI-generated tags
- **User Accounts**: Secure authentication with Supabase
- **Persistent Storage**: Your analyzed links are saved and synced across devices
- **Search & Filter**: Find your saved links by URL, summary, or tags
- **Beautiful UI**: Modern, responsive design with smooth animations

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/92b09fb9-bd60-4533-a6e6-b81253671436) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
