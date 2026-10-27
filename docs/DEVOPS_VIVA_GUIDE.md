# SmartChain Windows DevOps Viva Guide

## What is already in place

- SmartChain is the existing React/Vite frontend, FastAPI backend, and MySQL application.
- The backend has API tests using a separate in-memory SQLite database.
- `compose.yaml` runs the application with MySQL, persistent database storage, dependency health checks, and configurable local ports.
- The root `Jenkinsfile` is for the Windows Jenkins service. It checks out source, verifies Docker daemon access, validates Compose, builds the frontend and backend images, tests against temporary SQLite, deploys locally only after the tests pass, and confirms that the live backend is healthy and connected to MySQL.
- The Jenkins parameter `SIMULATE_TEST_FAILURE` runs a separate, deliberately failing test. It is off by default and does not change application code or database data.
- `.gitignore` excludes local passwords, database files, dependency directories, and build/test output. Initializing Git locally does not create or publish a GitHub repository.

## Windows demonstration checklist

1. Start Docker Desktop and sign in to Jenkins at `http://localhost:8080`.
2. From the project folder in PowerShell, create `.env` from `.env.example` if it does not exist, set two unique local passwords, and start the app:

   ```powershell
   if (-not (Test-Path .env)) { Copy-Item .env.example .env }
   notepad .env
   docker compose up --build --detach
   docker compose ps
   ```

3. Show the UI at `http://localhost:3000`, API docs at `http://localhost:8000/docs`, and health at `http://localhost:8000/api/health`.
4. In GitHub, show the repository and commit history after you have connected a repository you are allowed to use.
5. In Jenkins, open the Pipeline job and show the completed checkout, configuration check, image build, backend test, deployment, and MySQL health stages. `docker info` in the configuration stage proves Jenkins can reach the Docker daemon.
6. To show a safe failure, choose **Build with Parameters**, enable `SIMULATE_TEST_FAILURE`, and run the job. The dedicated demonstration test fails and Jenkins does not enter deployment. The existing app and database volume are left alone.
7. Leave the parameter disabled and run the job again to show recovery. For a visible application update, make a small text-only change in the React UI, commit and push it, and show that Jenkins rebuilds and redeploys the UI.
8. End by showing the running containers with `docker compose ps` and reloading the application.

The Jenkins deployment defaults to ports `13000` (UI), `18000` (API), and `13306` (MySQL), separate from the local development ports. These are configurable **Build with Parameters** values. Never use `docker compose down -v` for this demonstration; the `-v` flag removes database data.

## GitHub and Jenkins setup

- The project is prepared for local Git, but is not connected to GitHub. Do not push this teammate-provided project until you have permission to publish it. Create or choose the GitHub repository yourself; it is safest to use a private repository until publication is authorized.
- In Jenkins, use **New Item → Pipeline → Pipeline script from SCM**. Enter the repository URL, branch `*/main`, and script path `Jenkinsfile`.
- For a private repository, add its Git credentials in Jenkins' credential store and select them in the job configuration. Never put a token in the URL, source code, `.env`, or chat.
- Add Jenkins **Secret text** credentials with IDs `smartchain-mysql-root-password` and `smartchain-mysql-password`. Use the passwords from the local `.env`. The Jenkinsfile binds these secrets only for local deployment; Jenkins masks credential values in logs.
- This Jenkins installation runs as the Windows `LocalSystem` service account. The pipeline checks `docker info` instead of assuming Docker access. If that check fails after Docker Desktop is installed, an administrator must configure Jenkins under an account permitted to use Docker Desktop or set up an approved Windows build agent. Do not change the service account without authorization.
- A GitHub webhook needs Jenkins to be reachable from GitHub over the internet; `localhost` is not reachable. The Jenkinsfile instead polls SCM approximately every five minutes. A manual **Build Now** is another safe local option. Do not create a public tunnel for this demo.

## Safe recovery and troubleshooting

- **Docker command not found / daemon unavailable:** Install and start [Docker Desktop for Windows](https://docs.docker.com/desktop/setup/install/windows-install/). In PowerShell, verify `docker version`, `docker compose version`, and `docker info` before running Jenkins.
- **Jenkins rejects access:** Sign in with an administrator account for the existing Jenkins installation. An anonymous `403 Forbidden` is an authorization response, not permission to bypass Jenkins security. Do not share the initial administrator password.
- **Pipeline fails before checkout:** Check Jenkins' Git plugin, the repository URL, branch, and credentials.
- **Pipeline fails at `docker info`:** The Windows Jenkins service does not currently have working Docker CLI/daemon access. Deployment has not started.
- **Ports are occupied:** Use a different port in `.env` or stop your own development server. Do not terminate an unidentified process.
- **Health reports SQLite instead of MySQL:** The deployment did not connect to MySQL. Check the Jenkins password credentials against the values used when the existing persistent MySQL volume was initialized; do not delete the volume to reset it.
- **Database continuity:** `docker compose down` retains the named MySQL volume. Do not add `-v`, remove the volume, or use a different Compose project name.

## Likely external viva questions

**What is Docker, and what is an image versus a container?**  
Docker packages an application and its runtime dependencies. An image is the packaged template; a container is a running instance of that image.

**Why use Docker Compose?**  
Compose declares the frontend, API, database, their network, startup dependencies, health checks, and persistent database storage together.

**What does Jenkins do in this project?**  
Jenkins checks out the selected Git revision, verifies Docker, validates Compose, builds images, runs the API tests, deploys the local Compose services only after tests pass, and checks the live API health and database engine.

**What is the difference between CI, Continuous Delivery, and Continuous Deployment?**  
Continuous Integration automatically integrates changes and runs checks. Continuous Delivery keeps validated changes ready to release but leaves release approval to a person. Continuous Deployment automatically releases every change that passes its checks. This project runs local automated checks and deployment for a viva demo; it does not publish to or deploy to a public server.

**How do the pipeline tests avoid changing the application database?**  
The test stage sets a separate SQLite URL and uses `docker compose run --no-deps`; it does not start MySQL or mount the persistent data volume into the test container.

**Why check the database engine as well as an HTTP status code?**  
FastAPI can intentionally fall back to SQLite when MySQL is unreachable. The pipeline requires `engine == "mysql"` so a successful HTTP response alone cannot falsely mark a broken MySQL deployment as healthy.

**How are database passwords managed?**  
Local Compose reads passwords from the ignored `.env` file. Jenkins retrieves deployment passwords from its credentials store using credential IDs; the values are not written into the Jenkinsfile or printed by pipeline commands.

**What happens when an automated test fails?**  
The test stage fails and Jenkins stops before the deploy stage. The optional demonstration test proves this behavior without editing production code.

**Why does the project poll GitHub instead of using a webhook?**  
A locally running Jenkins server is not publicly reachable. Polling can discover remote changes without opening a firewall or exposing a tunnel.

**What keeps database data when the application is restarted?**  
The MySQL data directory is stored in a named Docker volume. Restarting or stopping the Compose application keeps that volume unless someone explicitly removes it.
