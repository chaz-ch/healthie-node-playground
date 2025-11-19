# Quick Start Guide

Get up and running with the Healthie Node Playground in minutes!

## 🚀 Fastest Way: VS Code Dev Container

**Prerequisites**: Docker Desktop + VS Code with Dev Containers extension

1. **Clone and open the project**:
   ```bash
   git clone <your-repo-url>
   cd healthie-node-playground
   ```

2. **Create your `.env` file**:
   ```bash
   cp .env.example .env
   # Edit .env and add your HEALTHIE_API_KEY
   ```

3. **Open in Dev Container**:
   - Open the project in VS Code
   - Press `F1` → "Dev Containers: Reopen in Container"
   - Wait for the container to build (2-3 minutes first time)

4. **Start the application**:
   ```bash
   # Terminal 1 - Backend
   npm run start:dev
   
   # Terminal 2 - Frontend  
   cd client && npm run dev
   ```

5. **Open your browser**: http://localhost:5173

✅ **Done!** You now have a fully configured development environment.

---

## 🐳 Alternative: Docker Compose

**Prerequisites**: Docker Desktop

1. **Clone and configure**:
   ```bash
   git clone <your-repo-url>
   cd healthie-node-playground
   cp .env.example .env
   # Edit .env and add your HEALTHIE_API_KEY
   ```

2. **Start with Docker Compose**:
   ```bash
   # Using the helper script (macOS/Linux)
   ./dev.sh docker
   
   # Or using PowerShell (Windows)
   .\dev.ps1 docker
   
   # Or directly with docker-compose
   docker-compose -f docker-compose.dev.yml up
   ```

3. **Open your browser**: http://localhost:5173

---

## 💻 Alternative: Local Development

**Prerequisites**: Node.js 20+, npm

1. **Clone and install**:
   ```bash
   git clone <your-repo-url>
   cd healthie-node-playground
   
   # Using the helper script (macOS/Linux)
   ./dev.sh install
   
   # Or manually
   npm install
   cd client && npm install && cd ..
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env and add your HEALTHIE_API_KEY
   ```

3. **Start development servers**:
   ```bash
   # Using the helper script (macOS/Linux)
   ./dev.sh start
   
   # Or using PowerShell (Windows)
   .\dev.ps1 start
   
   # Or manually in two terminals:
   # Terminal 1 - Backend
   npm run start:dev
   
   # Terminal 2 - Frontend
   cd client && npm run dev
   ```

4. **Open your browser**: http://localhost:5173

---

## 🔑 Getting Your Healthie API Key

1. Log in to your Healthie account
2. Navigate to **Settings** → **API & Webhooks**
3. Generate or copy your API key
4. Add it to your `.env` file:
   ```
   HEALTHIE_API_KEY=gh_sbox_your_key_here
   ```

---

## 📝 Using the Application

1. **Enter a User ID**: Type a Healthie user ID in the search box
2. **View Conversations**: Click "Search" to see all conversations for that user
3. **Open a Conversation**: Click on any conversation to view messages
4. **Send Messages**: Type in the message box and press Enter or click Send
5. **Real-time Updates**: New messages appear automatically within 3 seconds

---

## 🛠️ Helper Scripts

### macOS/Linux (`dev.sh`)

```bash
./dev.sh install    # Install all dependencies
./dev.sh start      # Start local development
./dev.sh docker     # Start with Docker Compose
./dev.sh build      # Build production Docker image
./dev.sh help       # Show help
```

### Windows (`dev.ps1`)

```powershell
.\dev.ps1 install   # Install all dependencies
.\dev.ps1 start     # Start local development
.\dev.ps1 docker    # Start with Docker Compose
.\dev.ps1 build     # Build production Docker image
.\dev.ps1 help      # Show help
```

---

## 🐛 Troubleshooting

### Port Already in Use

If you see "Port 3001 or 5173 already in use":

```bash
# Find and kill the process
lsof -i :3001
lsof -i :5173

# Or change ports in .env
PORT=3002
```

### API Key Not Working

- Verify the key is correct in `.env`
- Check server logs show "API Key configured: Yes"
- Ensure you're using the correct environment (staging vs production)

### Docker Issues

```bash
# Rebuild containers
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up --build

# Check logs
docker-compose -f docker-compose.dev.yml logs -f
```

---

## 📚 Next Steps

- Read [README.md](README.md) for detailed documentation
- Check [DOCKER.md](DOCKER.md) for Docker deployment options
- Review [MIGRATION.md](MIGRATION.md) for NestJS architecture details

---

## 🎯 Quick Reference

| What | URL |
|------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3001 |
| Health Check | http://localhost:3001/api/health |
| WebSocket URL | http://localhost:3001/api/websocket-url |

| Environment | API URL |
|-------------|---------|
| Staging | https://staging-api.gethealthie.com/graphql |
| Production | https://api.gethealthie.com/graphql |

