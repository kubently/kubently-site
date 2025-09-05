---
layout: page
title: Contributing
permalink: /contributing/
---

# Contributing to Kubently

We welcome contributions to Kubently! This guide will help you get started with contributing to the project.

## Ways to Contribute

- **Bug Reports**: Report bugs and issues
- **Feature Requests**: Suggest new features and improvements
- **Code Contributions**: Submit bug fixes and new features
- **Documentation**: Improve documentation and examples
- **Testing**: Help test new features and releases
- **Community**: Help answer questions and support users

## Getting Started

### Prerequisites

- Python 3.13+
- Docker and Docker Compose
- Kubernetes cluster (local or remote)
- kubectl configured
- Git

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/kubently.git
   cd kubently
   ```

2. **Set up Development Environment**
   ```bash
   # Create virtual environment
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   
   # Install dependencies
   pip install -r requirements.txt
   pip install -r requirements-dev.txt
   
   # Install pre-commit hooks
   pre-commit install
   ```

3. **Start Local Development Environment**
   ```bash
   # Start Redis
   docker run -d -p 6379:6379 redis:7-alpine
   
   # Set environment variables
   export KUBENTLY_REDIS_URL=redis://localhost:6379
   export KUBENTLY_API_KEYS=dev-key-123
   export KUBENTLY_AGENT_TOKENS='{"local": "dev-token-456"}'
   
   # Start API in development mode
   uvicorn kubently.main:app --reload --port 8080
   ```

4. **Run Tests**
   ```bash
   # Run unit tests
   pytest
   
   # Run integration tests
   pytest tests/integration/
   
   # Run linting
   flake8 kubently/
   black kubently/
   mypy kubently/
   ```

## Development Workflow

### Branch Strategy

- `main`: Stable release branch
- `develop`: Development integration branch
- `feature/*`: Feature development branches
- `bugfix/*`: Bug fix branches
- `release/*`: Release preparation branches

### Making Changes

1. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**
   - Follow the existing code style
   - Add tests for new functionality
   - Update documentation as needed
   - Keep commits focused and atomic

3. **Test Your Changes**
   ```bash
   # Run tests
   pytest
   
   # Run linting
   pre-commit run --all-files
   
   # Test end-to-end
   ./deployment/scripts/e2e-test.sh
   ```

4. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add new debugging feature"
   ```

5. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

## Code Style Guidelines

### Python Code Style

We follow PEP 8 with some modifications:

```python
# Use type hints
def create_session(cluster_id: str, metadata: Optional[Dict] = None) -> Session:
    """Create a new debugging session.
    
    Args:
        cluster_id: Target cluster identifier
        metadata: Optional session metadata
        
    Returns:
        Session object with generated ID
        
    Raises:
        ClusterNotFoundError: If cluster is not available
    """
    pass

# Use dataclasses or Pydantic models for data structures
from dataclasses import dataclass
from typing import Optional
from datetime import datetime

@dataclass
class Session:
    session_id: str
    cluster_id: str
    created_at: datetime
    expires_at: datetime
    status: str = "active"
    metadata: Optional[Dict] = None
```

### Documentation Style

- Use Google-style docstrings
- Include type information in docstrings
- Provide examples for complex functions
- Document all public APIs

### Testing Guidelines

```python
import pytest
from unittest.mock import Mock, patch
from kubently.session import SessionManager

class TestSessionManager:
    @pytest.fixture
    def session_manager(self):
        return SessionManager(redis_client=Mock())
    
    async def test_create_session_success(self, session_manager):
        # Arrange
        cluster_id = "test-cluster"
        
        # Act
        session = await session_manager.create_session(cluster_id)
        
        # Assert
        assert session.cluster_id == cluster_id
        assert session.status == "active"
        assert session.session_id.startswith("sess_")
    
    async def test_create_session_invalid_cluster(self, session_manager):
        # Arrange
        cluster_id = "nonexistent-cluster"
        
        # Act & Assert
        with pytest.raises(ClusterNotFoundError):
            await session_manager.create_session(cluster_id)
```

## Project Structure

```
kubently/
├── kubently/                 # Main package
│   ├── __init__.py
│   ├── main.py              # FastAPI application
│   └── modules/             # Core modules
│       ├── auth/            # Authentication
│       ├── session/         # Session management
│       ├── queue/           # Command queuing
│       ├── agent/           # Agent communication
│       └── api/             # API models and handlers
├── tests/                   # Test suite
│   ├── unit/               # Unit tests
│   ├── integration/        # Integration tests
│   └── conftest.py         # Test configuration
├── deployment/             # Deployment manifests
├── docs/                   # Documentation
└── kubently-cli/           # CLI package
```

## Submitting Changes

### Pull Request Guidelines

1. **PR Title**: Use conventional commits format
   - `feat:` for new features
   - `fix:` for bug fixes
   - `docs:` for documentation changes
   - `refactor:` for code refactoring
   - `test:` for test additions/changes

2. **PR Description**: Include:
   - Summary of changes
   - Motivation and context
   - Testing performed
   - Breaking changes (if any)
   - Related issues

3. **Checklist**:
   - [ ] Tests pass
   - [ ] Code follows style guidelines
   - [ ] Self-review completed
   - [ ] Documentation updated
   - [ ] No breaking changes (or documented)

### Example PR Template

```markdown
## Summary
Brief description of what this PR does.

## Changes
- List of specific changes made
- Another change

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing completed

## Breaking Changes
None / Describe any breaking changes

## Related Issues
Fixes #123
```

## Release Process

### Version Strategy

We follow Semantic Versioning (SemVer):
- `MAJOR.MINOR.PATCH`
- MAJOR: Breaking changes
- MINOR: New features (backward compatible)
- PATCH: Bug fixes (backward compatible)

### Release Steps

1. **Prepare Release Branch**
   ```bash
   git checkout -b release/v1.2.0
   ```

2. **Update Version Numbers**
   - `pyproject.toml`
   - `kubently/__init__.py`
   - Helm chart versions

3. **Update Changelog**
   - Document all changes since last release
   - Follow Keep a Changelog format

4. **Create Release PR**
   - Review all changes
   - Ensure tests pass
   - Get approval from maintainers

5. **Tag and Release**
   ```bash
   git tag -a v1.2.0 -m "Release v1.2.0"
   git push origin v1.2.0
   ```

## Community Guidelines

### Code of Conduct

We are committed to providing a welcoming and inclusive experience for everyone. Please read our [Code of Conduct](CODE_OF_CONDUCT.md).

### Communication

- **GitHub Issues**: Bug reports, feature requests
- **GitHub Discussions**: General questions, ideas
- **Slack/Discord**: Real-time chat (links in README)

### Getting Help

If you need help contributing:
1. Check existing documentation
2. Search GitHub issues
3. Ask in GitHub Discussions
4. Reach out to maintainers

## Recognition

Contributors are recognized in:
- `CONTRIBUTORS.md` file
- Release notes
- GitHub contributor graphs
- Special mentions for significant contributions

## Maintainer Guidelines

### For Project Maintainers

#### Review Process

1. **Code Review Checklist**:
   - [ ] Code quality and style
   - [ ] Test coverage
   - [ ] Documentation updates
   - [ ] Breaking change considerations
   - [ ] Security implications

2. **Merge Criteria**:
   - All tests pass
   - At least one maintainer approval
   - No outstanding change requests
   - Contributor has signed CLA (if required)

#### Release Management

1. **Feature Freeze**: 1 week before release
2. **Release Candidate**: Test thoroughly
3. **Release**: Tag and publish
4. **Post-Release**: Monitor for issues

#### Issue Triage

- Label issues appropriately
- Assign to appropriate milestone
- Engage with community
- Close stale issues

## Technical Decisions

Major technical decisions are documented in:
- Architecture Decision Records (ADRs)
- Design documents
- GitHub issues with `design` label

## Getting Started Checklist

For new contributors:

- [ ] Read this contributing guide
- [ ] Set up development environment
- [ ] Run tests successfully
- [ ] Make a small test change
- [ ] Submit your first PR
- [ ] Join community discussions

Welcome to the Kubently community! 🚀