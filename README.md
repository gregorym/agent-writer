# Bloggy AI Bot

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Bloggy AI Bot is an open-source application designed to automate blog content creation and publishing using AI. It helps you manage multiple websites, perform keyword analysis, generate & schedule articles, and publish them to platforms like Ghost or GitHub repositories.

## ✨ Features

- **Website Management:** Add and manage multiple websites.
- **Keyword Analysis:**
  - Discover keywords relevant to a specific website URL.
  - Find related keywords based on a seed keyword.
  - Utilizes DataForSEO API for keyword data (volume, difficulty, intent, competition).
- **AI Content Generation:**
  - Generate long-form blog articles based on selected keywords or topics using Google's Gemini AI.
  - Generate relevant images for articles.
- **Content Publishing:**
  - Automatically publish generated articles to Ghost blogs.
  - Automatically publish generated articles as MDX files to GitHub repositories via Pull Requests.
- **Scheduling:** Schedule article generation and publishing.
- **User Authentication:** Secure user accounts and sessions using Lucia Auth.
- **Background Job Processing:** Uses pg-boss and a worker service for handling asynchronous tasks like AI generation and publishing.
- **(Experimental) GitHub App Integration:** Automatically generate blog posts from GitHub issues labeled 'blog'.

## 🚀 Tech Stack

- **Monorepo:** pnpm Workspaces, Turborepo
- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS, shadcn/ui
- **API:** tRPC
- **State Management:** Jotai
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** Lucia Auth
- **Background Jobs:** pg-boss
- **AI:** Google Gemini API
- **SEO Data:** DataForSEO API
- **Integrations:** Ghost Admin API, Octokit (GitHub API)
- **Linting/Formatting:** ESLint, Prettier

## 📁 Project Structure

The project is organized as a monorepo using pnpm workspaces:

```
.
├── apps
│   ├── web/         # Next.js frontend application
│   └── worker/      # Node.js background worker service
├── packages
│   ├── database/    # Prisma schema, client, and migrations
│   ├── eslint-config/ # Shared ESLint configurations
│   └── typescript-config/ # Shared TypeScript configurations
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── README.md
└── turbo.json
```

## 🏁 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended - see `package.json` engines)
- pnpm (v9 or higher recommended - see `package.json` packageManager)
- PostgreSQL Database
- Access keys for:
  - Google Gemini API
  - DataForSEO API
  - (Optional) Ghost Admin API
  - (Optional) GitHub Personal Access Token or GitHub App credentials

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/your-username/bloggy-ai-bot.git
    cd bloggy-ai-bot
    ```

2.  **Install dependencies:**

    ```bash
    pnpm install
    ```

3.  **Set up environment variables:**

    - Create a `.env` file in the root directory.
    - Copy the contents of `.env.example` (if available, otherwise define based on required keys) into `.env`.
    - Fill in your database connection string (`DATABASE_URL`, `DATABASE_URL_POOLING`) and API keys.
    - Ensure the necessary environment variables are also available to the `apps/web` and `apps/worker` packages (Turborepo might handle some of this, but check specific app requirements).

4.  **Set up the database:**
    - Navigate to the database package: `cd packages/database`
    - Run Prisma migrations: `pnpm prisma migrate deploy`
    - Generate Prisma Client: `pnpm prisma generate`
    - Go back to the root: `cd ../..`

### Running the Application

1.  **Start the development servers:**

    - This command uses Turborepo to run the `dev` script in both the `web` and `worker` apps concurrently.

    ```bash
    pnpm dev
    ```

2.  **Access the web application:**
    - Open your browser and navigate to `http://localhost:3000` (or the port specified in `apps/web/package.json`).

## 🔧 Usage

1.  **Sign up / Log in:** Create an account or log in.
2.  **Add a Website:** Navigate to the dashboard and add a website, providing its name and URL. Configure location and language settings for keyword analysis.
3.  **Integrations (Optional):** Configure Ghost and/or GitHub integrations in the website settings if you want to auto-publish.
4.  **Keyword Research:** Use the keyword tools to find ranking keywords for the website or explore related keywords.
5.  **Create Article:** Select keywords or provide a topic to generate an article brief.
6.  **Generate & Edit:** Initiate AI generation. Review and edit the generated markdown content.
7.  **Schedule/Publish:** Schedule the article for later or publish it immediately (if integrations are set up and auto-publish is enabled).

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/your-feature-name`).
3.  Make your changes.
4.  Commit your changes (`git commit -m 'Add some feature'`).
5.  Push to the branch (`git push origin feature/your-feature-name`).
6.  Open a Pull Request.

Please ensure your code adheres to the project's linting and formatting standards (`pnpm lint` and `pnpm format`).

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details (You'll need to add a LICENSE file).
