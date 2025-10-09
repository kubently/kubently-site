# Kubently Documentation Site

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-brightgreen)](https://kubently.io)
[![Jekyll](https://img.shields.io/badge/Jekyll-4.3-red)](https://jekyllrb.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Modern documentation website for Kubently - troubleshoot Kubernetes agentically with AI-powered conversational debugging. Kubently (Kubernetes + Agentically) enables natural language cluster interactions through multiple LLM providers via the LLMFactory interface.

## 🌟 Live Site

**Visit the live documentation:** [https://kubently.io](https://kubently.io)

## 🎨 Features

- **Modern Design**: Clean, responsive design with gradient accents and custom logo
- **Fast Navigation**: Sticky header with intuitive navigation
- **Interactive Elements**: Feature cards, performance metrics, and call-to-action buttons  
- **Mobile Friendly**: Fully responsive design that works on all devices
- **SEO Optimized**: Meta tags, Open Graph, and structured data
- **Dark Code Themes**: Syntax-highlighted code blocks with modern styling

## 🛠️ Local Development

### Prerequisites
- Ruby 2.7+
- Bundler gem

### Setup
```bash
git clone https://github.com/adickinson72/kubently-site.git
cd kubently-site
bundle install
bundle exec jekyll serve
```

Visit `http://localhost:4000/` to view the site locally.

## 📁 Site Structure

```
kubently-site/
├── _config.yml          # Site configuration
├── _layouts/            # Page layouts
├── _includes/           # Reusable components
├── assets/
│   ├── css/style.scss   # Custom modern theme
│   └── images/          # Logo and graphics
├── guides/              # User guides
│   ├── quick-start.md
│   ├── basic-usage.md
│   ├── multi-agent.md
│   ├── security.md
│   └── troubleshooting.md
├── api.md              # API reference
├── architecture.md     # System architecture
├── installation.md     # Installation guide
├── contributing.md     # Contribution guidelines
└── index.md           # Homepage
```

## 🎨 Design System

The site uses a modern design system with:

- **Colors**: Blue primary (`#2563eb`), teal secondary (`#0891b2`), green accent (`#059669`)
- **Typography**: Inter font for text, JetBrains Mono for code
- **Components**: Feature cards, metrics displays, alert boxes, modern buttons
- **Layout**: Grid-based responsive design with consistent spacing

## 🚀 Deployment

The site automatically deploys to GitHub Pages when changes are pushed to the `main` branch.

## 📄 Content Guidelines

When adding new content:

1. Use the existing page templates in `_layouts/`
2. Follow the established navigation structure
3. Include the navigation component on new pages
4. Use modern styling classes for consistency
5. Add appropriate meta tags and descriptions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally with `bundle exec jekyll serve`
5. Submit a pull request

## 📝 License

This documentation site is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

Built with ❤️ using Jekyll and GitHub Pages
