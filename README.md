# REX-A Analyzer

## Documentation
- **[User Guide](./USERGUIDE.md)** - Comprehensive guide on how to use the application
- **Setup Guide** - Continue reading below for installation and setup instructions

---

## Getting Started
Follow these instructions to set up and run the project locally.


### 1. Clone the Repository
First, clone the repository to your local machine using the following command:
```bash
git clone <https://github.com/amararun/shared-rexdb-file-upload> . 
```
Note: Check for the latest shared repository name in case it has changed.


### 2. Remove Statcounter Web Analytics Code Patch
I often have a Statcounter web analytics code patch in index.html. You can remove that, if it's there.


### 3. Navigate to the Frontend Directory
Move into the `frontend` directory where the application dependencies are managed:
```bash
cd frontend
```

### 4. Install Dependencies
Install the necessary dependencies using npm.
```bash
npm install
```

### 5. Configure Advanced Analyst Endpoints
The application uses multiple AI models for analysis, which are configured in `frontend/src/config/endpoints.ts`. You can customize these endpoints based on your requirements.

#### 5.1 Available Models Configuration
Navigate to `frontend/src/config/endpoints.ts` where you'll find the model configurations. Each model configuration includes:
- `id`: Unique identifier for the model
- `name`: Display name shown in the UI (e.g., "Google Gemini Flash 2.0")
- `url`: Environment variable reference for the Flowise API endpoint
- `description`: Components and capabilities (e.g., "🔎 Analysis ➔ gemini-2.0-flash   ⚡️ Reviewer + Executor ➔ gpt-4o")
- `type`: Performance category (e.g., "Excellent Perf. - Lowest Cost")

Example model configuration:
```typescript
{
  id: 1,
  name: "Google Gemini Flash 2.0",
  url: import.meta.env.VITE_FLOWISE_ADV_ANALYST_API_ENDPOINT_GEMINI_NOERR,
  description: "🔎 Analysis ➔ gemini-2.0-flash   ⚡️ Reviewer + Executor ➔ gpt-4o",
  type: "excellent Perf. - Lowest Cost"
}
```

You can:
1. Modify existing model configurations
2. Add new models by following the same structure
3. Set a different default model by updating the `defaultEndpoint` export
4. Customize model descriptions and performance categories

Note: The actual API endpoints for these models are defined in the environment variables (`.env` file) which is covered in the next section.

### 6. Update dot env File
Create a `.env` file in the frontend folder with the following variables. An example `.env.example` file is provided in the codebase for reference.

```env
# Flowise API endpoints for LLM-powered database operations
VITE_FLOWISE_API_ENDPOINT="https://flowise-coolify.hosting.tigzig.com/api/v1/prediction/916676e1-ac69-46b1-8241-78b480a275c"  # Flowise API endpoint for General Analyst

VITE_FLOWISE_ADV_ANALYST_API_ENDPOINT_GEMINI_NOERR="https://flowise-coolify.hosting.tigzig.com/api/v1/prediction/d262a169-e3fb-49cc-be64-a335757a92"  # Gemini Flowise API endpoint for advanced analyst without error handling agent

VITE_FLOWISE_ADV_ANALYST_API_ENDPOINT="https://flowise-coolify.hosting.tigzig.com/api/v1/prediction/acda6507-c1b8-492f-a8b4-3b47aba011e"  # OpenAI Flowise API endpoint for advanced analyst

VITE_FLOWISE_ADV_ANALYST_API_ENDPOINT_DEEPSEEK="https://flowise-coolify.hosting.tigzig.com/api/v1/prediction/704e4bbc-8da8-4333-9d5c-389280befc"  # Deepseek Flowise API endpoint for advanced analyst

VITE_FLOWISE_ADV_ANALYST_API_ENDPOINT_GEMINI="https://flowise-coolify.hosting.tigzig.com/api/v1/prediction/917467eb-834e-4ea8-8d66-b8984f40ab"  # Gemini Flowise API endpoint for advanced analyst with error handling agent

VITE_FLOWISE_ADV_ANALYST_API_ENDPOINT_GEMINI_DEBUG="https://flowise-coolify.hosting.tigzig.com/api/v1/prediction/d262a169-e3fb-49cc-be64-a339575927" # Gemini Flowise API endpoint for advanced analyst with seperate error debugger agent 

# Core API endpoints
VITE_API_ENDPOINT="https://rexdb.hosting.tigzig.cm"  # REX DB API endpoint for Text-to-SQL operations

VITE_NEON_API_URL="https://neon.hosting.tigzig.cm"  # Neon FastAPI server for database creation

VITE_RT_ENDPOINT="https://rtephemeral.hosting.tigzig.com"  # Proxy server for LLM API Calls

# Authentication
VITE_AUTH0_DOMAIN="dev-ztnexopjwwosxll.us.auth0.com"  # Auth0 domain for authentication

VITE_AUTH0_CLIENT_ID="oFvyfPeTcI7kMpzFbcxqZl9G3nP5I64"  # Auth0 client ID

# Additional Settings
VITE_SHOW_REX_DB_BUTTON="false"  # Toggle visibility of REX DB update button

VITE_MAKE_WEBHOOK_URL="https://hook.us1.make.com/3ykkrmftubwrtzoijsjjue7x32zbc2n"  # Make webhook URL to update database credentials for Neon DB users
```

The `.env.example` file in the frontend directory contains these sample values with slight modifications to make them non-functional while maintaining the correct format. Never commit the actual `.env` file with real credentials to version control.

### 7. Setup Backend FastAPI Servers
The application relies on three crucial FastAPI servers that handle different aspects of the functionality. You'll need to set up these servers to utilize the application's features. Each of these repositories have their own set of instructions shared in their respecive README files.

#### 7.1 LLM Proxy Server (`VITE_RT_ENDPOINT`)
```bash
git clone https://github.com/amararun/shared-rtWebrtc-fastAPI-ephemeral .
```
The LLM Proxy Server acts as a secure intermediary for all LLM API calls. It:
- Routes all calls to OpenAI and OpenRouter endpoints through a secure proxy
- Manages API keys centrally, preventing exposure in the frontend
- Adds an additional layer of regional security
- Handles rate limiting and request validation
- Provides logging and monitoring capabilities

#### 7.2 REX DB API Server (`VITE_API_ENDPOINT`)
```bash
git clone https://github.com/amararun/shared-fastapi-rex-db-coolify .
```
The REX DB API Server serves as the database connector between the frontend application and backend databases:
- Accepts SQL queries generated by either LLM agents or the JavaScript application
- Establishes secure database connections using provided credentials
- Executes various types of SQL operations:
  - SELECT queries for data retrieval
  - ALTER queries for schema modifications
  - UPDATE/INSERT operations for data manipulation
  - Table creation and management
  - Data summarization and analytics
  - Full table exports and downloads
- Handles database credentials securely
- Supports connection to multiple database types
- Provides query validation and error handling

#### 7.3 Neon Database Management Server (`VITE_NEON_API_URL`)
```bash
git clone https://github.com/amararun/shared-rexdb-fastapi-neon .
```
The Neon API Server manages the creation and lifecycle of serverless PostgreSQL databases:
- Creates fully functional databases instantly (within seconds)
- Supports the app's "Create DB" functionality
- Manages temporary database provisioning:
  - Creates databases on-demand for temporary sessions
  - Handles automatic cleanup of temporary databases
  - Supports session management and database lifecycle
- Integrates with Neon's serverless PostgreSQL platform
- Provides database status monitoring and management

Each server requires its own configuration and setup. Detailed setup instructions are available in their respective repositories.

### 8. Setup Flowise Agent Flows
The application uses five different agent flows set up in Flowise, each serving different analytical purposes. These flows need to be configured in your Flowise instance.

#### 8.1 Available Agent Flows
1. General Analyst (`VITE_FLOWISE_API_ENDPOINT`)
2. OpenAI Advanced Analyst (`VITE_FLOWISE_ADV_ANALYST_API_ENDPOINT`)
3. Gemini Advanced Analyst with Error Handling (`VITE_FLOWISE_ADV_ANALYST_API_ENDPOINT_GEMINI`)
4. Gemini Advanced Analyst without Error Handling (`VITE_FLOWISE_ADV_ANALYST_API_ENDPOINT_GEMINI_NOERR`)
5. Deepseek Advanced Analyst (`VITE_FLOWISE_ADV_ANALYST_API_ENDPOINT_DEEPSEEK`)

#### 8.2 Flow Components
Each agent flow is composed of:
- Sequential Agent configurations
- Simple Agent setups
- Custom Tools:
  - Database Connector Tool (connects to REX DB FastAPI backend)
  - Python Code Interpreter Tool
  - Additional custom tools as per flow requirements

#### 8.3 Setup Instructions
1. Locate the flow schemas in the `docs` folder
2. Import the JSON schema files into your Flowise instance
3. Update necessary configurations in the imported flows:
   - API endpoints
   - System prompts
   - Tool configurations
4. Deploy the flows and copy the prediction API endpoints
5. Update your `.env` file with the new prediction API endpoints

#### 8.4 Documentation
The following documentation is available in the `docs` folder:
- JSON schemas for all agent flows and custom tools
- System prompts collection document

Note: All system prompts used in these flows are embedded within their respective JSON schemas and are also separately documented in the system prompts collection document for reference.

### 9. Setup Auth0 Authentication (Optional)
This is an experimental, non-essential feature that is only used for the "Create New DB" functionality. The application will function normally without authentication enabled.

#### 9.1 Usage Context
- Only required for the "Create New DB" button functionality
- Created databases are automatically removed after one year
- Not required for temporary database creation during file uploads
- Not required for sample file processing

#### 9.2 Setup Instructions
1. Create an Auth0 account if you don't have one
2. Configure your Auth0 application settings
3. Update the following environment variables:
```env
VITE_AUTH0_DOMAIN="your_auth0_domain"
VITE_AUTH0_CLIENT_ID="your_auth0_client_id"
```

Note: The application's core features, including temporary database creation and file processing, will continue to work without Auth0 authentication. Only the manual "Create New DB" feature requires authentication.

### 10. Security - IP Whitelisting
The application implements IP-based access control for all backend services. This security measure ensures that only authorized sources can access the various endpoints.

#### 10.1 Whitelisted Endpoints
The following endpoints are protected by IP whitelisting:

1. Flowise API Endpoints:
   - General Analyst endpoint (`VITE_FLOWISE_API_ENDPOINT`)
   - OpenAI Advanced Analyst endpoint (`VITE_FLOWISE_ADV_ANALYST_API_ENDPOINT`)
   - Gemini Advanced Analyst with Error Handling (`VITE_FLOWISE_ADV_ANALYST_API_ENDPOINT_GEMINI`)
   - Gemini Advanced Analyst without Error Handling (`VITE_FLOWISE_ADV_ANALYST_API_ENDPOINT_GEMINI_NOERR`)
   - Deepseek Advanced Analyst endpoint (`VITE_FLOWISE_ADV_ANALYST_API_ENDPOINT_DEEPSEEK`)

2. Backend FastAPI Servers:
   - LLM Proxy Server (`VITE_RT_ENDPOINT`)
   - REX DB API Server (`VITE_API_ENDPOINT`)
   - Neon Database Management Server (`VITE_NEON_API_URL`)

#### 10.2 Whitelisted Sources
Access is restricted to:
- Frontend deployment domains
- Local development environments (`localhost`)

#### 10.3 Example Whitelist Configuration
Your whitelist configuration in each server should look similar to this:
```python
ALLOWED_ORIGINS = [
    "https://rex.tigzig.com",        # Your frontend deployment domain
    "http://localhost:8100",         # For local development as per your choice
    "http://localhost:5100"          # For local development as per your choice
]
```

Note: The specific whitelisting configuration details and exact port numbers are provided in the respective setup documentation for each server repository. Adjust the domains and ports according to your deployment environment.

### 11. Setup Make.com Workflow (Optional)
This is an optional tracking feature that helps monitor database creation through a simple webhook workflow.

#### 11.1 Purpose
- Tracks new database creation events
- Collects user ID, email, and database name
- Maintains a record of created databases for management purposes
- Helps in tracking database lifecycle and cleanup

#### 11.2 Implementation
- Uses Make.com (formerly Integromat) workflow
- Triggered when a new authenticated user creates a database
- Stores tracking information in a separate document
- JSON schema for the workflow available in the `docs` folder

#### 11.3 Setup
1. Import the workflow schema from the `docs` folder into Make.com (or your preferred workflow automation tool)
2. Configure the webhook endpoint
3. Update the environment variable:
```env
VITE_MAKE_WEBHOOK_URL="your_make_webhook_url"
```

Note: This is an experimental feature that could be integrated directly into the backend databases. The application functions fully without this tracking system in place

### 12. Run the Development Server
Ensure you are in the `frontend` directory where npm dependencies are installed before starting the development server:

```bash
# If not already in the frontend directory
cd frontend

# Start the development server
npm run dev
```

The application should now be running locally. All npm dependencies and scripts are configured in the frontend directory, so make sure you're in the correct location before running any npm commands

### 13. Deployment
You can deploy this application on various hosting platforms such as Vercel, Netlify, or any other hosting provider of your choice.

#### 13.1 Vercel Deployment
Vercel offers a streamlined deployment process:
1. Connect your repository to Vercel
2. The platform will automatically detect the build and run settings

Important: Remember to configure all environment variables in your Vercel project settings (or your chosen hosting provider's environment configuration). These should match the variables from your local `.env` file:
- All Flowise API endpoints
- Backend FastAPI server endpoints
- Authentication settings
- Additional configuration variables

Note: Similar steps apply for other hosting providers. Always ensure your environment variables are properly configured in your hosting platform's settings before deploying. 

---

## Top Resources

### Cursor AI
The app was built with Cursor AI, a fork of VS Code with AI features. Cursor does an astounding job of creating apps from scratch. Not only that, given a codebase, Cursor does an excellent job of unpacking and explaining the flow and elements of any codebase fed into it. You can get started by loading the codebase into Cursor, which can guide you through app flows and customizations.

Check out the Volo playlist on YouTube for brilliant videos on using Cursor AI, including building full-stack and database applications:
- [Volo YouTube Channel](https://www.youtube.com/@VoloBuilds)

### Flowise AI
For comprehensive guides on Flowise implementation and best practices, visit:
- [Leon van Zyl's YouTube Channel](https://www.youtube.com/@leonvanzy) - Top guide for anything Flowise
