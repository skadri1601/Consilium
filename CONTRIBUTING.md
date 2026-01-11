# Contributing to Consilium

Thank you for your interest in contributing to Consilium! This document provides guidelines and instructions for contributing.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/yourusername/consilium.git
   cd consilium
   ```
3. **Create a branch** for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Setup

See the main [README.md](README.md) for setup instructions.

## Code Style

### TypeScript/JavaScript

- Use TypeScript for all new code
- Follow existing code style
- Run `pnpm lint` before committing
- Use meaningful variable and function names

### Python

- Follow PEP 8 style guide
- Use type hints where possible
- Run `ruff check` and `black` before committing

## Commit Messages

Use clear, descriptive commit messages:

```
feat: Add support for new model provider
fix: Resolve SSE streaming connection issue
docs: Update self-hosting guide
refactor: Simplify debate workflow logic
```

## Pull Request Process

1. **Update documentation** if needed
2. **Add tests** for new features
3. **Ensure all tests pass**: `pnpm test`
4. **Update CHANGELOG.md** with your changes
5. **Create Pull Request** with clear description

## Areas for Contribution

- 🐛 Bug fixes
- ✨ New features
- 📚 Documentation improvements
- 🧪 Test coverage
- 🎨 UI/UX improvements
- ⚡ Performance optimizations
- 🔧 Developer experience improvements

## Questions?

- Open an issue for bugs or feature requests
- Start a discussion for questions
- Check existing issues before creating new ones

Thank you for contributing! 🎉

