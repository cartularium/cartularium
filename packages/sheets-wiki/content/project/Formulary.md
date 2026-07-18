**Formulary** is a package manager for Google Sheets that enables you to install, manage, and share reusable named functions across spreadsheets.

## Key Features

- **Package Installation**: Install named functions from the [Formulary registry](https://formulary.dev)
- **Multi-Account Support**: Manage multiple Google accounts with profile switching
- **Dependency Resolution**: Automatic dependency resolution with semantic versioning
- **Private Sheets**: Keep your sheets private - authentication is stored in profiles
- **Local Caching**: Downloaded packages are cached for faster subsequent installations
- **Lockfile Management**: Deterministic installations with integrity checks

## Installation

### Prerequisites

- Python 3.12 or higher
- Git
- Google account with access to Google Sheets

### Install Formulary

**macOS / Linux:**

```bash
curl -fsSL https://raw.githubusercontent.com/Astral1119/formulary/main/scripts/install.sh | bash
```

**Windows (PowerShell):**

First configure PowerShell execution policy (run as Administrator):

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Then run the installer:

```powershell
irm https://raw.githubusercontent.com/Astral1119/formulary/main/scripts/install.ps1 | iex
```

## Quick Start

### 1. Create Authentication Profile

Create a profile to save your Google authentication:

```bash
formulary profile add personal
```

This opens a browser for Google sign-in. Your authentication is saved for future use.

### 2. Initialize a Project

Link your Google Sheet to Formulary:

```bash
formulary init "https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit"
```

### 3. Install Packages

Install packages from the registry:

```bash
formulary install hash
```

Multiple packages:

```bash
formulary install hash repr container
```

## Commands

### Package Management

- `formulary install <package>` - Install one or more packages
- `formulary remove <package>` - Remove installed packages
- `formulary upgrade` - Upgrade all packages
- `formulary upgrade <package>` - Upgrade specific package
- `formulary info <package>` - Show package information

### Profile Management

- `formulary profile add <alias>` - Create new profile (opens browser)
- `formulary profile remove <alias>` - Remove a profile
- `formulary profile list` - List all profiles
- `formulary profile switch <alias>` - Switch active profile
- `formulary profile show` - Show active profile details

### Maintenance

- `formulary self-update` - Update Formulary to latest version
- `formulary self-uninstall` - Remove Formulary from your system

## Configuration

Formulary stores configuration in `~/.formulary/`:

- `profiles/` - Authentication profiles for different Google accounts
- `cache/` - Downloaded package artifacts
- `config.toml` - Active sheet URL and settings

## Publishing Packages

To publish your own package to the registry:

```bash
formulary publish
```

See the [registry repository](https://github.com/Astral1119/formulary-registry) for package structure and submission guidelines.
