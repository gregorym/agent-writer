# Bloggy AI Bot

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Bloggy AI Bot is an open-source application designed to automate blog content creation and publishing using AI. It helps users manage websites, perform keyword analysis, generate articles, and publish them to platforms like Ghost or GitHub repositories.

## ✨ Features

- **AI Content Generation:**
  - Generate long-form blog articles based on selected keywords or topics using Google's Gemini AI.
  - Generate relevant images for articles.
- **Scheduling & Content Publishing:**
  - Schedule article generation and publishing.
  - Automatically publish generated articles to Ghost blogs.
  - Automatically publish generated articles as MDX files to GitHub repositories via Pull Requests.
- **Keyword Analysis:**
  - Discover keywords relevant to a specific website URL.
  - Find related keywords based on a seed keyword.
- **Website Management:** Add and manage multiple websites.

## 🔌 Integrations

Bloggy AI Bot supports publishing generated content directly to:

- **Ghost:** Connect your Ghost blog via its Admin API key to publish articles automatically.
- **GitHub:** Connect a GitHub repository (using a Personal Access Token or a dedicated GitHub App) to publish articles as MDX files via Pull Requests.

## 🔧 Usage

1.  **Sign up / Log in:** Create an account or log in.
2.  **Add a Website:** Navigate to the dashboard and add a website, providing its name and URL. Configure location and language settings for keyword analysis.
3.  **Integrations (Optional):** Configure Ghost and/or GitHub integrations in the website settings if you want to auto-publish.
4.  **Keyword Research:** Use the keyword tools to find ranking keywords for the website or explore related keywords.
5.  **Create Article:** Select keywords or provide a topic to generate an article brief.
6.  **Generate & Edit:** Initiate AI generation. Review and edit the generated markdown content.
7.  **Schedule/Publish:** Schedule the article for later or publish it immediately (if integrations are set up and auto-publish is enabled).

## 🤝 Contributing

Contributions are welcome! Please see the [CONTRIBUTING.md](CONTRIBUTING.md) file for details on how to set up the project for development and contribute.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details (You'll need to add a LICENSE file).
