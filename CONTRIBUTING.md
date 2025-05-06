# Contributing to Bloggy AI Bot

We welcome contributions to Bloggy AI Bot! Whether it's fixing bugs, adding new features, or improving documentation, your help is appreciated.

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

## 🏁 Getting Started (Development Setup)

Follow these steps to set up the project for local development.

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

## 📈 Contribution Workflow

1.  **Fork the repository.**
2.  **Create a new branch** for your feature or bug fix (`git checkout -b feature/your-feature-name` or `git checkout -b fix/issue-description`).
3.  **Make your changes.** Ensure you follow the project's coding standards (see below).
4.  **Test your changes** thoroughly.
5.  **Commit your changes** with clear and concise commit messages (`git commit -m 'feat: Add X feature'`). Consider using [Conventional Commits](https://www.conventionalcommits.org/).
6.  **Push your branch** to your fork (`git push origin feature/your-feature-name`).
7.  **Open a Pull Request** against the `main` branch of the original repository.
    - Provide a clear title and description for your PR.
    - Link any relevant issues.

## 📐 Coding Standards

- **Linting & Formatting:** Run `pnpm lint` and `pnpm format` before committing to ensure code consistency. The project uses ESLint and Prettier.
- **TypeScript:** Adhere to the TypeScript configurations defined in the `packages/typescript-config` directory.
- **tRPC:** Follow best practices for tRPC usage within the Next.js application.
- **Comments:** Add comments only when necessary to explain complex logic.
- **Testing:** (If applicable) Add unit or integration tests for new features or bug fixes.

## ❓ Questions?

If you have questions or need help, feel free to open an issue on GitHub.
