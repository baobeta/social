# Contributing to Social Application

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to this project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Code Review Process](#code-review-process)

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Respect different viewpoints and experiences

## Getting Started

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone https://github.com/your-username/social.git
   cd social
   ```
3. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/original-owner/social.git
   ```
4. **Install dependencies**
   ```bash
   npm install
   ```

## Development Setup

### Prerequisites

- Node.js 20+
- npm 10+
- Docker and Docker Compose (recommended)
- PostgreSQL 15+ (if not using Docker)
- Redis 7+ (if not using Docker)

### Initial Setup

1. **Set up environment variables**
   ```bash
   cp apps/backend/.env.example apps/backend/.env
   # Edit apps/backend/.env with your configuration
   ```

2. **Start services**
   ```bash
   docker compose up postgres redis -d
   ```

3. **Run migrations**
   ```bash
   npm run db:migrate
   ```

4. **Seed database (optional)**
   ```bash
   npm run db:seed
   ```

5. **Start development servers**
   ```bash
   npm run dev
   ```

## Making Changes

### Branch Naming

Use descriptive branch names:
- `feature/add-user-profile` - New features
- `fix/login-error` - Bug fixes
- `docs/update-readme` - Documentation
- `refactor/auth-module` - Code refactoring
- `test/add-user-tests` - Adding tests

### Workflow

1. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clean, readable code
   - Follow existing code style
   - Add tests for new features
   - Update documentation

3. **Test your changes**
   ```bash
   npm test
   npm run lint
   npm run typecheck
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add user profile feature"
   ```

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(auth): add password reset functionality

fix(posts): resolve pagination issue

docs(readme): update installation instructions
```

## Coding Standards

### Backend

Follow the [Backend Engineering Checklist](./docs/):

- **Structure**: Feature-based modules
- **Controllers**: No business logic
- **Services**: All business rules
- **Repositories**: 100% database access
- **TypeScript**: Strict mode, no `any`
- **Validation**: Zod for all inputs
- **Error Handling**: Centralized error handler

### Frontend

Follow the [Vue Development Rules](./docs/):

- **Components**: Single File Components with `<script setup>`
- **State**: Pinia for global state, local state when possible
- **API**: Dedicated service files
- **Routing**: Lazy-loaded components
- **TypeScript**: Strict mode enabled

### Code Style

- Use 2 spaces for indentation
- Use single quotes for strings
- Trailing commas in multi-line objects/arrays
- No console.log in production code
- Use meaningful variable names

## Testing

### Writing Tests

- **Unit tests** for services and utilities
- **Integration tests** for controllers and repositories
- **E2E tests** for critical user flows

### Running Tests

```bash
# All tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test -- --coverage

# Specific workspace
npm run test:backend
npm run test:frontend
```

### Test Requirements

- New features must include tests
- Bug fixes should include regression tests
- Aim for >80% code coverage
- Tests must pass before submitting PR

## Submitting Changes

### Pull Request Process

1. **Update your branch**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Push your branch**
   ```bash
   git push origin feature/your-feature-name
   ```

3. **Create Pull Request**
   - Use a clear, descriptive title
   - Fill out the PR template
   - Link related issues
   - Describe changes and testing

### PR Checklist

- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] All tests pass
- [ ] No new warnings
- [ ] Type checking passes
- [ ] Linting passes

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How was this tested?

## Checklist
- [ ] Tests pass
- [ ] Documentation updated
- [ ] Code follows style guidelines
```

## Code Review Process

### For Contributors

- Address review feedback promptly
- Be open to suggestions
- Ask questions if something is unclear
- Keep PRs focused and small (<500 lines)

### For Reviewers

- Be constructive and respectful
- Explain reasoning for suggestions
- Approve when satisfied
- Request changes when needed

## Documentation

### Updating Documentation

- Update README.md for user-facing changes
- Update relevant docs/ files
- Add code comments for complex logic
- Update API documentation if endpoints change

### Documentation Files

- `README.md` - Main project documentation
- `CONTRIBUTING.md` - This file
- `docs/DEVELOPMENT.md` - Development guide
- `docs/` - Additional documentation

## Getting Help

- Check existing documentation
- Search existing issues
- Ask questions in discussions
- Open an issue for bugs

## Recognition

Contributors will be recognized in:
- CONTRIBUTORS.md (if created)
- Release notes
- Project documentation

Thank you for contributing! 🎉

