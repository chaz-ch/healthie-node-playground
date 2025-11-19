# Development Container

This directory contains the VS Code Dev Container configuration for the Healthie Node Playground project.

## What is a Dev Container?

A development container (or dev container for short) allows you to use a container as a full-featured development environment. It provides:

- **Consistent Environment**: Everyone on your team gets the same development setup
- **Quick Onboarding**: New developers can start coding in minutes
- **Isolated Dependencies**: No conflicts with other projects on your machine
- **Pre-configured Tools**: All necessary tools and extensions are automatically installed

## Files in This Directory

### `devcontainer.json`

The main configuration file that defines:
- Which Docker image/Dockerfile to use
- VS Code extensions to install
- Port forwarding configuration
- Post-creation commands
- Editor settings

### `Dockerfile`

Defines the development container image:
- Based on Node.js 20 LTS
- Includes git, curl, vim, nano
- Pre-installs global npm packages (TypeScript, NestJS CLI, etc.)
- Runs as non-root user for security

### `docker-compose.yml`

Docker Compose configuration for the dev container:
- Mounts the workspace directory
- Creates persistent volumes for node_modules
- Configures networking

## How to Use

### Prerequisites

1. Install [Docker Desktop](https://www.docker.com/products/docker-desktop)
2. Install [VS Code](https://code.visualstudio.com/)
3. Install the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

### Opening the Project

1. Open the project folder in VS Code
2. Press `F1` and select "Dev Containers: Reopen in Container"
3. Wait for the container to build (first time only, takes 2-3 minutes)
4. Once ready, you'll be inside the container with all tools installed

### What Gets Installed Automatically

**Global npm packages**:
- `typescript` - TypeScript compiler
- `ts-node` - TypeScript execution environment
- `@nestjs/cli` - NestJS command-line interface
- `nodemon` - Auto-restart on file changes

**VS Code extensions**:
- ESLint - JavaScript/TypeScript linting
- Prettier - Code formatting
- TypeScript support
- React snippets
- GraphQL syntax highlighting
- Path IntelliSense
- Auto Rename Tag
- npm IntelliSense

**System packages**:
- git
- curl
- vim
- nano

### Running the Application

Once inside the dev container:

```bash
# Terminal 1 - Backend
npm run start:dev

# Terminal 2 - Frontend
cd client && npm run dev
```

The ports (3001 and 5173) are automatically forwarded to your host machine.

## Customization

### Adding VS Code Extensions

Edit `devcontainer.json` and add extension IDs to the `extensions` array:

```json
"customizations": {
  "vscode": {
    "extensions": [
      "your.extension.id"
    ]
  }
}
```

### Adding System Packages

Edit `Dockerfile` and add packages to the `apt-get install` command:

```dockerfile
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
    your-package-here
```

### Adding Global npm Packages

Edit `Dockerfile` and add packages to the `npm install -g` command:

```dockerfile
RUN npm install -g \
    your-package-here
```

## Troubleshooting

### Container Won't Build

```bash
# Rebuild without cache
# In VS Code: F1 → "Dev Containers: Rebuild Container"
```

### Slow Performance

The dev container uses named volumes for `node_modules` to improve performance. If you're still experiencing slowness:

1. Ensure Docker Desktop has enough resources allocated (Settings → Resources)
2. Try using the "cached" mount option (already configured)

### Port Conflicts

If ports 3001 or 5173 are already in use on your host:

1. Stop the conflicting process, or
2. Edit `devcontainer.json` and change the `forwardPorts` array

## Benefits Over Local Development

✅ **No version conflicts**: Node.js, npm, and all tools are isolated  
✅ **Faster onboarding**: New team members just need Docker + VS Code  
✅ **Consistent environment**: Same setup across macOS, Windows, Linux  
✅ **Easy cleanup**: Delete the container when done, no leftover files  
✅ **Pre-configured**: All extensions and settings ready to go  

## Learn More

- [VS Code Dev Containers Documentation](https://code.visualstudio.com/docs/devcontainers/containers)
- [Dev Container Specification](https://containers.dev/)
- [Docker Documentation](https://docs.docker.com/)

