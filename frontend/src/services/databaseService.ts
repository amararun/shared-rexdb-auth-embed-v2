import { toast } from "@/components/ui/use-toast";
import { getSchemaFromGPT, fetchAndAnalyzeSchemaCustomDB, sendSchemaToAgent } from "./schemaAnalysisService";
import axios from 'axios';
import { ProgressStep } from "@/components/progress-status-dialog";
import { flowiseAdvAnalystEndpoint } from '@/stores/endpointStore';

// Constants
const FLOWISE_API_ENDPOINT = import.meta.env.VITE_FLOWISE_API_ENDPOINT ||
  "https://flowise.tigzig.com/api/v1/prediction/flowise-fallback-endpoint";

const API_URL = import.meta.env.VITE_NEON_API_URL;

const CHAR_WIDTH = 10;
const MIN_CHARS = 20;
const PADDING = 40;

// Add Message type
type Message = {
  role: 'assistant' | 'user';
  content: string;
};

// Add PanelType type
type PanelType = 'structure' | 'analysis' | 'quickAnalysis' | 'chat' | 'charts' | 'documents';

// Add PanelState type
type PanelState = {
  expanded: PanelType | null;
  maximized: PanelType | null;
};

// Types
export type DbCredentials = {
  host: string;
  database: string;
  user: string;
  password: string;
  schema: string;
  port: string;
  db_type: 'postgresql' | 'mysql';
};

export type CustomDbUploadResponse = {
  status: string;
  message: string;
  table_name: string;
  rows_inserted: number;
  columns: string[];
  duration_seconds?: number;
};

export type UploadMode = 'database' | 'grid';

type ChatMessage = {
  role: 'assistant' | 'user';
  content: string;
};

// Helper function for database names
const generateDatabaseName = (nickname: string) => {
  const randomSuffix = Math.floor(10000 + Math.random() * 90000); // 5-digit random number
  return `neon_${nickname.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${randomSuffix}`;
};

// Helper function to detect delimiter
const detectDelimiter = (content: string): string => {
  const firstLine = content.split('\n')[0];
  const pipeCount = (firstLine.match(/\|/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;

  console.log('Delimiter detection:', { pipeCount, commaCount });
  return pipeCount > commaCount ? '|' : ',';
};

// Parse credentials with AI
export const parseCredentialsWithAI = async (credentialsString: string): Promise<DbCredentials> => {
  console.log('Parsing credentials with OpenAI...');
  console.log('Raw credentials string:', credentialsString);

  const enhancedPrompt = `You are a specialized database credentials parser. Parse the following connection details into a standardized JSON format.

Background:
- These credentials will be used for automated database connections
- The format must be exact as it will be used directly in code
- All values must be strings
- The response must be valid JSON without any markdown or additional text

Required Fields (all must be present):
1. host: The database server hostname/IP
2. database: The database name
3. user: The username for authentication
4. password: The password for authentication
5. schema: The database schema (default to "public" if not specified)
6. port: The connection port (use defaults if not specified)
7. db_type: Must be either "postgresql" or "mysql"

Rules:
1. Default Ports:
   - PostgreSQL: use "5432"
   - MySQL: use "3306"
2. Default Schema:
   - If not specified, use "public"
3. Database Type Detection:
   - Look for keywords like "postgres", "postgresql", "psql" to set as "postgresql"
   - Look for keywords like "mysql", "mariadb" to set as "mysql"
   - If unclear, default to "postgresql"
4. Value Formatting:
   - All values must be strings (including port numbers)
   - Remove any surrounding quotes or whitespace
   - Preserve exact case for username/password
   - Convert hostname to lowercase

Expected JSON Structure:
{
  "host": "example.host.com",
  "database": "dbname",
  "user": "username",
  "password": "exact_password",
  "schema": "public",
  "port": "5432",
  "db_type": "postgresql"
}

Input to parse:
${credentialsString}

Return ONLY the JSON object, no explanations or additional text.`;

  try {
    console.log('Making OpenAI API request via proxy server...');
    
    // Get the RT endpoint from environment variables
    const RT_ENDPOINT = import.meta.env.VITE_RT_ENDPOINT || 'https://rtephemeral.hosting.tigzig.com';
    console.log('Using RT endpoint:', RT_ENDPOINT);

    interface OpenAIRequestBody {
      model: string;
      messages: Array<{ role: string; content: string }>;
      response_format: { type: string };
      temperature?: number;
    }

    const requestBody: OpenAIRequestBody = {
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a specialized database credentials parser. Return only valid JSON without any markdown formatting or additional text."
        },
        {
          role: "user",
          content: enhancedPrompt
        }
      ],
      response_format: { type: "json_object" }
    };

    // Add temperature only if not using o3 model
    if (!requestBody.model.startsWith('o3')) {
      requestBody.temperature = 0.1;
    }

    console.log('Request Body:', JSON.stringify(requestBody, null, 2));

    const apiUrl = `${RT_ENDPOINT}/open-chat-completion`;
    console.log('Making request to:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}: ${await response.text()}`);
    }

    console.log('OpenAI Response Status:', response.status);
    const data = await response.json();
    console.log('OpenAI Full Response:', data);

    if (!data || !data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response format from API');
    }

    const content = data.choices[0].message.content;
    console.log('Raw content:', content);

    const parsedCredentials = JSON.parse(content);
    console.log('Parsed Credentials:', {
      ...parsedCredentials,
      password: '***' // Mask password in logs
    });

    const requiredFields = ['host', 'database', 'user', 'password', 'schema', 'port', 'db_type'];
    const missingFields = requiredFields.filter(field => !parsedCredentials[field]);

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    if (!['postgresql', 'mysql'].includes(parsedCredentials.db_type)) {
      throw new Error('Invalid database type. Must be either "postgresql" or "mysql"');
    }

    return parsedCredentials;
  } catch (error) {
    console.error('Error parsing credentials:', error);
    throw new Error('Failed to parse database credentials: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
};

// Quick Connect handler
export async function handleQuickConnect(
  connectionString: string,
  additionalInfo: string,
  sessionId: string,
  setIsQuickConnecting: (loading: boolean) => void,
  setLastUsedCredentials: (credentials: DbCredentials | null) => void,
  setSharedMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  setPanelState: React.Dispatch<React.SetStateAction<PanelState>>,
  setAdvancedMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  setProgressSteps?: React.Dispatch<React.SetStateAction<ProgressStep[]>>,
  setShowProgressDialog?: React.Dispatch<React.SetStateAction<boolean>>
) {
  if (!connectionString) {
    toast({
      title: "Missing Connection String",
      description: "Please provide database connection details",
      duration: 3000,
      className: "bg-red-50 border-red-200 shadow-lg border-2 rounded-xl",
    });
    return;
  }

  try {
    setIsQuickConnecting(true);
    console.log('Starting quick connect process...');

    // Only initialize progress steps if we're not being called as part of another process
    // (i.e., both setProgressSteps and setShowProgressDialog are provided)
    const shouldShowProgress = setProgressSteps && setShowProgressDialog;
    if (shouldShowProgress) {
      setProgressSteps([
        { id: '1', message: 'Parsing connection details...', status: 'pending' },
        { id: '2', message: 'Validating credentials...', status: 'pending' },
        { id: '3', message: 'Sending to AI agents for analysis...', status: 'pending' },
        { id: '4', message: 'Receiving and processing AI responses...', status: 'pending' }
      ]);
      setShowProgressDialog(true);
    }

    if (shouldShowProgress) {
      setProgressSteps(prev => prev.map(step =>
        step.id === '1' ? { ...step, status: 'in_progress' } : step
      ));
    }

    const parsedCredentials = await parseCredentialsWithAI(connectionString);
    setLastUsedCredentials(parsedCredentials);
    console.log('Credentials parsed and stored');

    if (shouldShowProgress) {
      setProgressSteps(prev => prev.map(step =>
        step.id === '1' ? { ...step, status: 'completed' } :
        step.id === '2' ? { ...step, status: 'in_progress' } : step
      ));
    }

    sessionStorage.setItem('dbCredentials', connectionString);

    const prompt = `I have database connection details that I need you to analyze and test. Here are the details:

${connectionString}
${additionalInfo || ''}

Please:
1. Check if all required information is present (host, database, user, password, type, port)
2. If any required information is missing, tell me what's missing
3. If all information is present, try to connect and check for available schemas
4. Respond with one of:
   - "Missing required information: [list what's missing]"
   - "I have tested the connection and it is working. [Then share the database credential as a list nicely formatted :Database Nickname, Host, Database Name, User Name, Type of warehouse - PostGres or MySQL] Available schemas are ..[share as list]. Let me know your questions [Show eagerness to help]."
   - "Connection failed. Please check the following: (1) Ensure all credentials are correct. (2) Verify the user has the necessary access permissions. (3) Confirm there are no firewall or IP restrictions blocking access to the remote database or cloud service. (4) Check if the database server or instance is running and accessible. (5) Ensure the database endpoint (URL/hostname) is correct. Here are the credentials I have tested [Then share the database credential as a list nicely formatted :Database Nickname, Host, Database Name, User Name, Type of warehouse - PostGres or MySQL]"`;

    if (shouldShowProgress) {
      setProgressSteps(prev => prev.map(step =>
        step.id === '2' ? { ...step, status: 'completed' } :
        step.id === '3' ? { ...step, status: 'in_progress' } : step
      ));
    }

    console.log('Making parallel API calls to both Flowise endpoints...');
    
    const [regularResponse, advancedResponse] = await Promise.all([
      fetch(FLOWISE_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question: prompt,
          overrideConfig: {
            sessionId: sessionId
          }
        })
      }),
      fetch(flowiseAdvAnalystEndpoint.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question: prompt,
          overrideConfig: {
            sessionId: sessionId
          }
        })
      })
    ]);

    if (!regularResponse.ok || !advancedResponse.ok) {
      throw new Error('Failed to send to AI agents');
    }

    if (shouldShowProgress) {
      setProgressSteps(prev => prev.map(step =>
        step.id === '3' ? { ...step, status: 'completed' } :
        step.id === '4' ? { ...step, status: 'in_progress' } : step
      ));
    }

    const [regularResult, advancedResult] = await Promise.all([
      regularResponse.json(),
      advancedResponse.json()
    ]);

    setSharedMessages(prev => [...prev, {
      role: 'assistant',
      content: regularResult.text || regularResult.message
    }]);

    if (setAdvancedMessages) {
      setAdvancedMessages(prev => [...prev, {
        role: 'assistant',
        content: advancedResult.text || advancedResult.message
      }]);
    }

    if (shouldShowProgress) {
      setProgressSteps(prev => prev.map(step =>
        step.id === '4' ? { ...step, status: 'completed' } : step
      ));
    }

    // Don't close the dialog immediately - let user see the final message
    // setShowQuickConnectDialog(false);
    const chatTabEvent = new CustomEvent('activateChatTab', {
      detail: { activate: true }
    });
    window.dispatchEvent(chatTabEvent);
    setPanelState(prev => ({ ...prev, expanded: 'chat' }));

  } catch (error) {
    console.error('Connection error:', error);

    if (setProgressSteps) {
      setProgressSteps(prev => prev.map(step => 
        step.status === 'pending' || step.status === 'in_progress'
          ? { ...step, status: 'error', error: 'Process interrupted' }
          : step
      ));
    }

    toast({
      title: "Connection Failed",
      description: error instanceof Error ? error.message : "Failed to connect",
      duration: 3000,
      className: "bg-red-50 border-red-200 shadow-lg border-2 rounded-xl",
    });
    throw error;
  } finally {
    setIsQuickConnecting(false);
  }
}

// Create Neon Database handler
export const handleCreateNeonDb = async (
  nickname: string,
  setIsCreatingDb: (value: boolean) => void,
  setShowCreateDbDialog: (value: boolean) => void,
  handleQuickConnectCallback: (
    connectionString: string,
    additionalInfo: string,
    setProgressSteps?: React.Dispatch<React.SetStateAction<ProgressStep[]>>,
    setShowProgressDialog?: React.Dispatch<React.SetStateAction<boolean>>
  ) => Promise<void>,
  user: any,
  setProgressSteps?: React.Dispatch<React.SetStateAction<ProgressStep[]>>,
  setShowProgressDialog?: React.Dispatch<React.SetStateAction<boolean>>
) => {
  if (!nickname.trim()) {
    toast({
      title: "Missing Nickname",
      description: "Please provide a nickname for your database",
      duration: 3000,
      className: "bg-red-50 border-red-200 shadow-lg border-2 rounded-xl",
    });
    return;
  }

  try {
    setIsCreatingDb(true);
    console.log('Creating new Neon database with nickname:', nickname);

    // Initialize progress steps with combined steps from both processes
    if (setProgressSteps && setShowProgressDialog) {
      setProgressSteps([
        { id: '1', message: 'Creating new database...', status: 'pending' },
        { id: '2', message: 'Configuring database credentials...', status: 'pending' },
        { id: '3', message: 'Validating database connection...', status: 'pending' },
        { id: '4', message: 'Setting up AI agent connection...', status: 'pending' },
        { id: '5', message: 'Analyzing database configuration...', status: 'pending' }
      ]);
      setShowProgressDialog(true);
    }
    
    // Update progress: Creating database
    if (setProgressSteps) {
      setProgressSteps(prev => prev.map(step =>
        step.id === '1' ? { ...step, status: 'in_progress' } : step
      ));
    }
    
    const databaseName = generateDatabaseName(nickname);
    
    const response = await axios.post(
      `${API_URL}/api/create-neon-db`,
      {
        project: {
          name: databaseName
        }
      }
    );

    // Update progress: Database created and configuring credentials
    if (setProgressSteps) {
      setProgressSteps(prev => prev.map(step =>
        step.id === '1' ? { ...step, status: 'completed' } :
        step.id === '2' ? { ...step, status: 'in_progress' } : step
      ));
    }

    // Close the create dialog
    setShowCreateDbDialog(false);

    // Format credentials for display
    const credentials = {
      hostname: response.data.hostname,
      database: response.data.database_name,
      username: response.data.database_owner,
      password: response.data.database_owner_password,
      port: response.data.port,
      type: response.data.database_type
    };

    // Update progress: Credentials configured, starting validation
    if (setProgressSteps) {
      setProgressSteps(prev => prev.map(step =>
        step.id === '2' ? { ...step, status: 'completed' } :
        step.id === '3' ? { ...step, status: 'in_progress' } : step
      ));
    }

    // Format and pass to AI agent
    const dbDetailsMessage = `
Host: ${response.data.hostname}
Database: ${response.data.database_name}
Username: ${response.data.database_owner}
Password: ${response.data.database_owner_password}
Port: ${response.data.port}
Type: ${response.data.database_type}
Nickname: ${response.data.database_nickname}
    `.trim();

    // Pass to AI agent without creating new progress steps
    try {
      // Update progress: Starting AI analysis
      if (setProgressSteps) {
        setProgressSteps(prev => prev.map(step =>
          step.id === '3' ? { ...step, status: 'completed' } :
          step.id === '4' ? { ...step, status: 'in_progress' } : step
        ));
      }

      // Call handleQuickConnect but tell it not to create its own progress dialog
      await handleQuickConnectCallback(
        dbDetailsMessage, 
        `New database created with nickname: ${nickname}`,
        undefined, // Pass undefined to prevent new progress dialog
        undefined
      );

      // Update progress: All steps completed
      if (setProgressSteps) {
        setProgressSteps(prev => {
          const updatedSteps = prev.map(step =>
            step.id === '4' ? { ...step, status: 'completed' as const } :
            step.id === '5' ? { ...step, status: 'completed' as const } : step
          );

          // Add credentials display step
          return [
            ...updatedSteps,
            {
              id: '6',
              message: 'Database Created Successfully',
              status: 'completed' as const,
              isCredentialsDisplay: true,
              credentials: credentials,
              isTemporary: true
            }
          ];
        });
      }

    } catch (error) {
      console.error('Error in AI analysis:', error);
      if (setProgressSteps) {
        setProgressSteps(prev => prev.map(step =>
          step.status === 'pending' || step.status === 'in_progress'
            ? { ...step, status: 'error', error: 'AI analysis failed' }
            : step
        ));
      }
      throw error;
    }

    // Handle user data webhook if user exists
    if (user) {
      const webhookData = `User Data|user_id: ${user.sub}|user_email: ${user.email}|hostname: ${response.data.hostname}|database: ${response.data.database_name}|username: ${response.data.database_owner}|port: ${response.data.port}|type: ${response.data.database_type}|nickname: ${response.data.database_nickname}`;

      try {
        const webhookUrl = import.meta.env.VITE_MAKE_WEBHOOK_URL;
        if (webhookUrl) {
          await axios.post(webhookUrl, { data: webhookData });
          console.log('Webhook data sent successfully');
        }
      } catch (webhookError) {
        console.error('Failed to send data to webhook:', webhookError);
      }
    }

  } catch (error) {
    console.error('Error creating database:', error);
    
    if (setProgressSteps) {
      setProgressSteps(prev => prev.map(step => 
        step.status === 'pending' || step.status === 'in_progress'
          ? { ...step, status: 'error', error: 'Process interrupted' }
          : step
      ));
    }

    let errorMessage = 'Failed to create database';
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', {
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers
      });

      if (error.response?.data) {
        errorMessage = typeof error.response.data === 'string' 
          ? error.response.data 
          : JSON.stringify(error.response.data);
      }
    }

    toast({
      title: "Database Creation Failed",
      description: errorMessage,
      duration: 3000,
      className: "bg-red-50 border-red-200 shadow-lg border-2 rounded-xl",
    });
    throw error;
  } finally {
    setIsCreatingDb(false);
  }
};

// Helper function to generate random nickname for temporary databases
const generateTemporaryNickname = () => {
  const adjectives = ['temp', 'quick', 'instant', 'rapid', 'fast'];
  const nouns = ['analysis', 'data', 'project', 'session', 'workspace'];
  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${randomAdjective}-${randomNoun}`;
};

// Create temporary database handler
export const handleCreateTemporaryDb = async (
  file: File,
  sessionId: string,
  setIsCustomDbLoading: (value: boolean) => void,
  setTableInfo: (info: { tableName: string; rowCount: number; columns: string[] }) => void,
  setSharedMessages: (updater: (prev: ChatMessage[]) => ChatMessage[]) => void,
  API_ENDPOINT: string,
  setLastUsedCredentials: (credentials: DbCredentials) => void,
  setPanelState: (updater: (prev: PanelState) => PanelState) => void,
  setAdvancedMessages?: (updater: (prev: ChatMessage[]) => ChatMessage[]) => void,
  updateProgress?: (stepId: string, status: 'in_progress' | 'completed' | 'error', message?: string, isRowCountMessage?: boolean) => void
) => {
  try {
    setIsCustomDbLoading(true);
    console.log('Creating temporary database...');
    
    // Update progress: Creating database
    updateProgress?.('1', 'in_progress');
    
    const nickname = generateTemporaryNickname();
    const databaseName = generateDatabaseName(nickname);
    
    const response = await axios.post(
      `${API_URL}/api/create-neon-db`,
      {
        project: {
          name: databaseName,
          is_temporary: true
        }
      }
    );

    console.log('Temporary database created:', response.data);
    updateProgress?.('1', 'completed');

    // Update progress: Configuring credentials
    updateProgress?.('2', 'in_progress');

    // Format credentials for AI agent
    const dbDetailsMessage = `
Host: ${response.data.hostname}
Database: ${response.data.database_name}
Username: ${response.data.database_owner}
Password: ${response.data.database_owner_password}
Port: ${response.data.port}
Type: ${response.data.database_type}
Nickname: ${response.data.database_nickname}
    `.trim();

    // Create credentials object
    const credentials: DbCredentials = {
      host: response.data.hostname,
      database: response.data.database_name,
      user: response.data.database_owner,
      password: response.data.database_owner_password,
      schema: 'public',
      port: response.data.port,
      db_type: 'postgresql'
    };

    // Store credentials
    setLastUsedCredentials(credentials);
    sessionStorage.setItem('dbCredentials', dbDetailsMessage);
    updateProgress?.('2', 'completed');

    // Update progress: Sending to AI
    updateProgress?.('3', 'in_progress');

    // Send credentials to Flowise agents for testing and setup
    const connectionPrompt = `I have database connection details that I need you to analyze and test. Here are the details:

${dbDetailsMessage}
This is a temporary database created for quick analysis.

Please:
1. Check if all required information is present (host, database, user, password, type, port)
2. If any required information is missing, tell me what's missing
3. If all information is present, try to connect and check for available schemas
4. Respond with one of:
   - "Missing required information: [list what's missing]"
   - "I have tested the connection and it is working. [Then share the database credential as a list nicely formatted :Database Nickname, Host, Database Name, User Name, Type of warehouse - PostGres or MySQL] Available schemas are ..[share as list]. Let me know your questions [Show eagerness to help]."
   - "Connection failed. Please check the following: (1) Ensure all credentials are correct. (2) Verify the user has the necessary access permissions. (3) Confirm there are no firewall or IP restrictions blocking access to the remote database or cloud service. (4) Check if the database server or instance is running and accessible. (5) Ensure the database endpoint (URL/hostname) is correct. Here are the credentials I have tested [Then share the database credential as a list nicely formatted :Database Nickname, Host, Database Name, User Name, Type of warehouse - PostGres or MySQL]"`;

    console.log('Sending credentials to Flowise agents...');
    
    // Make parallel API calls to both endpoints
    const [regularResponse, advancedResponse] = await Promise.all([
      // Regular analyst call
      fetch(FLOWISE_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question: connectionPrompt,
          overrideConfig: {
            sessionId: sessionId
          }
        })
      }),
      // Advanced analyst call
      fetch(flowiseAdvAnalystEndpoint.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question: connectionPrompt,
          overrideConfig: {
            sessionId: sessionId
          }
        })
      })
    ]);

    if (!regularResponse.ok || !advancedResponse.ok) {
      throw new Error('Failed to send credentials to AI agents');
    }

    const [regularResult, advancedResult] = await Promise.all([
      regularResponse.json(),
      advancedResponse.json()
    ]);

    // Update chat messages with connection results
    setSharedMessages(prev => [...prev, {
      role: 'assistant',
      content: regularResult.text || regularResult.message
    }]);

    if (setAdvancedMessages) {
      setAdvancedMessages(prev => [...prev, {
        role: 'assistant',
        content: advancedResult.text || advancedResult.message
      }]);
    }

    updateProgress?.('3', 'completed');

    // Update progress: File upload
    updateProgress?.('4', 'in_progress');

    // Now proceed with file upload
    const formData = new FormData();
    formData.append('file', file);

    const queryParams = new URLSearchParams({
      host: credentials.host,
      database: credentials.database,
      user: credentials.user,
      password: credentials.password,
      schema: credentials.schema,
      port: credentials.port
    });

    const endpoint = '/upload-file-custom-db-pg/';
    const fullUrl = `${API_ENDPOINT}${endpoint}?${queryParams.toString()}`;
    
    console.log('Uploading file to temporary database...');
    const uploadResponse = await axios.post<CustomDbUploadResponse>(
      fullUrl,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json'
        },
        timeout: 900000
      }
    );

    if (uploadResponse.data.status === 'success') {
      console.log('File uploaded successfully:', uploadResponse.data);
      updateProgress?.('4', 'completed');
      
      setTableInfo({
        tableName: uploadResponse.data.table_name,
        rowCount: uploadResponse.data.rows_inserted,
        columns: uploadResponse.data.columns
      });

      // Update progress: Schema analysis
      updateProgress?.('5', 'in_progress');

      // Analyze schema and send to AI
      const schemaData = await fetchAndAnalyzeSchemaCustomDB(uploadResponse.data.table_name, credentials);
      const schemaResponse = await sendSchemaToAgent(schemaData, sessionId, uploadResponse.data.table_name, setAdvancedMessages);

      setSharedMessages(prev => [...prev, {
        role: 'assistant',
        content: schemaResponse.text || schemaResponse.message || 'Schema analysis complete'
      }]);

      updateProgress?.('5', 'completed');

      // Activate chat tab
      const chatTabEvent = new CustomEvent('activateChatTab', {
        detail: { activate: true }
      });
      window.dispatchEvent(chatTabEvent);
      setPanelState(prev => ({ ...prev, expanded: 'chat' }));

      // Update progress: Finalizing with upload info
      updateProgress?.('6', 'in_progress');
      updateProgress?.('6', 'completed');
      // Add row count message as a separate step
      const rowCountMessage = `${uploadResponse.data.rows_inserted} rows inserted into temporary database table ${uploadResponse.data.table_name}`;
      updateProgress?.('6', 'completed', rowCountMessage, true);
    }

  } catch (error) {
    console.error('Error in temporary database flow:', error);
    let errorMessage = 'Failed to process with temporary database';
    
    if (axios.isAxiosError(error)) {
      errorMessage = error.response?.data?.message || error.message;
    }

    toast({
      title: "Process Failed",
      description: errorMessage,
      duration: 3000,
      className: "bg-red-50 border-red-200 shadow-lg border-2 rounded-xl",
    });
    throw error;
  } finally {
    setIsCustomDbLoading(false);
  }
};

// Modify handlePushToMyDb to handle temporary database option
export const handlePushToMyDb = async (
  file: File,
  credentials: DbCredentials | null,
  sessionId: string,
  setIsCustomDbLoading: (value: boolean) => void,
  setTableInfo: (info: { tableName: string; rowCount: number; columns: string[] }) => void,
  setSharedMessages: (updater: (prev: ChatMessage[]) => ChatMessage[]) => void,
  API_ENDPOINT: string,
  setLastUsedCredentials: (credentials: DbCredentials) => void,
  setPanelState: (updater: (prev: PanelState) => PanelState) => void,
  setShowDatabaseOptionDialog: (value: boolean) => void,
  setAdvancedMessages?: (updater: (prev: ChatMessage[]) => ChatMessage[]) => void,
  updateProgress?: (stepId: string, status: 'in_progress' | 'completed' | 'error', message?: string, isRowCountMessage?: boolean) => void
) => {
  if (!credentials) {
    // Show the styled dialog
    setShowDatabaseOptionDialog(true);
    return;
  }

  try {
    setIsCustomDbLoading(true);
    console.log('Starting custom DB upload process...');

    // Update progress: File upload
    updateProgress?.('1', 'in_progress');

    const formData = new FormData();
    formData.append('file', file);

    const dbType = credentials.db_type;
    const endpoint = dbType === 'postgresql'
      ? '/upload-file-custom-db-pg/'
      : '/upload-file-custom-db-mysql/';

    const queryParams = new URLSearchParams({
      host: credentials.host,
      database: credentials.database,
      user: credentials.user,
      password: credentials.password,
      schema: credentials.schema,
      port: credentials.port
    });

    const fullUrl = `${API_ENDPOINT}${endpoint}?${queryParams.toString()}`;
    const debugUrl = fullUrl.replace(
      new RegExp(credentials.password, 'g'),
      '***'
    );
    console.log('Using endpoint:', debugUrl);

    const response = await axios.post<CustomDbUploadResponse>(
      fullUrl,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json'
        },
        timeout: 900000,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            console.log(`Upload Progress: ${percentCompleted}%`);
          }
        }
      }
    );

    console.log('Upload response:', response.data);

    if (response.data.status === 'success') {
      updateProgress?.('1', 'completed');
      
      setTableInfo({
        tableName: response.data.table_name,
        rowCount: response.data.rows_inserted,
        columns: response.data.columns
      });

      // Store the credentials for future use
      setLastUsedCredentials(credentials);

      // Update progress: Schema analysis
      updateProgress?.('2', 'in_progress');

      // Analyze schema and send to AI
      const schemaData = await fetchAndAnalyzeSchemaCustomDB(response.data.table_name, credentials);
      const schemaResponse = await sendSchemaToAgent(schemaData, sessionId, response.data.table_name, setAdvancedMessages);

      setSharedMessages(prev => [...prev, {
        role: 'assistant',
        content: schemaResponse.text || schemaResponse.message || 'Schema analysis complete'
      }]);

      updateProgress?.('2', 'completed');

      // Activate chat tab
      const chatTabEvent = new CustomEvent('activateChatTab', {
        detail: { activate: true }
      });
      window.dispatchEvent(chatTabEvent);
      setPanelState(prev => ({ ...prev, expanded: 'chat' }));

      // Update progress: Finalizing with upload info
      updateProgress?.('3', 'in_progress');
      updateProgress?.('3', 'completed');
      // Add row count message as a separate step
      const rowCountMessage = `${response.data.rows_inserted} rows inserted into ${dbType === 'postgresql' ? 'PostgreSQL' : 'MySQL'} table ${response.data.table_name}`;
      updateProgress?.('3', 'completed', rowCountMessage, true);
    }

  } catch (error) {
    console.error('Error in file upload process:', error);
    let errorMessage = 'Failed to upload file to database';
    
    if (axios.isAxiosError(error)) {
      errorMessage = error.response?.data?.message || error.message;
    }

    // Mark all pending steps as error
    ['1', '2', '3'].forEach(stepId => {
      updateProgress?.(stepId, 'error', 'Process interrupted');
    });

    toast({
      title: "Upload Failed",
      description: errorMessage,
      duration: 3000,
      className: "bg-red-50 border-red-200 shadow-lg border-2 rounded-xl",
    });
    throw error;
  } finally {
    setIsCustomDbLoading(false);
  }
};

// Add handleFileUpload function
export const handleFileUpload = async (
  form: HTMLFormElement,
  mode: UploadMode,
  API_ENDPOINT: string,
  setIsGridLoading: (value: boolean) => void,
  setIsDbLoading: (value: boolean) => void,
  setGridData: (data: any) => void,
  handleShowTable: (type: 'main' | 'summary', viewType: 'simple' | 'advanced') => void,
  setTableInfo: (info: { tableName: string; rowCount: number; columns: string[] }) => void,
  setLastUsedCredentials: (credentials: DbCredentials) => void
) => {
  console.log(`File upload started in ${mode} mode...`);
  console.log('Using API endpoint:', API_ENDPOINT);

  const fileInput = form.querySelector('input[type="file"]') as HTMLInputElement;
  if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
    toast({
      title: "Missing File",
      description: "Please choose a file first",
      duration: 3000,
      className: "bg-red-50 border-red-200 shadow-lg border-2 rounded-xl",
    });
    return;
  }

  // Set loading state based on mode
  if (mode === 'database') {
    setIsDbLoading(true);
  } else {
    setIsGridLoading(true);
  }

  try {
    const file = fileInput.files[0];

    if (mode === 'grid') {
      // Grid mode handling
      const text = await file.text();
      const delimiter = detectDelimiter(text);
      console.log('Detected delimiter:', delimiter);

      // Get first few rows for schema analysis
      const rows = text.split('\n').filter(row => row.trim());
      if (rows.length === 0) {
        throw new Error('File is empty');
      }

      const headers = rows[0].split(delimiter).map(h => h.trim());
      console.log('Headers:', headers);

      const sampleData = rows.slice(0, 5).join('\n');
      console.log('Sample data for schema:', sampleData);

      // Get schema from GPT
      const schema = await getSchemaFromGPT(sampleData, delimiter);
      console.log('Schema from GPT:', schema);

      // Create column definitions for the table
      const columnDefs = headers.map(header => {
        const schemaCol = schema.columns.find(col => col.name.toLowerCase() === header.toLowerCase());
        console.log(`Mapping header ${header} to schema:`, schemaCol);

        return {
          field: header,
          headerName: header,
          type: schemaCol?.type || 'TEXT',
          filter: schemaCol?.type === 'INTEGER' || schemaCol?.type === 'NUMERIC' ? 'agNumberColumnFilter' : 'agTextColumnFilter',
          sortable: true,
          resizable: true,
          width: Math.max(header.length * CHAR_WIDTH + PADDING, MIN_CHARS * CHAR_WIDTH),
          valueFormatter: (params: any) => {
            if (params.value === null || params.value === undefined || params.value === '') return '';
            if (schemaCol?.type === 'INTEGER' || schemaCol?.type === 'NUMERIC') {
              return new Intl.NumberFormat('en-IN', {
                maximumFractionDigits: schemaCol.type === 'INTEGER' ? 0 : 2,
                minimumFractionDigits: 0
              }).format(Number(params.value));
            }
            return params.value;
          },
          cellClass: (schemaCol?.type === 'INTEGER' || schemaCol?.type === 'NUMERIC') ? 'text-right' : ''
        };
      });

      // Parse data rows according to schema
      const parsedData = rows.slice(1).map(row => {
        const values = row.split(delimiter);
        return headers.reduce((obj: Record<string, string>, header, index) => {
          const schemaCol = schema.columns.find(col => col.name.toLowerCase() === header.toLowerCase());
          let value = values[index]?.trim() || '';

          // Convert values according to schema type
          if (value !== '') {
            if (schemaCol?.type === 'INTEGER') {
              const parsed = parseInt(value, 10);
              value = !isNaN(parsed) ? parsed.toString() : value;
            } else if (schemaCol?.type === 'NUMERIC') {
              const parsed = parseFloat(value);
              value = !isNaN(parsed) ? parsed.toString() : value;
            }
          }

          obj[header] = value;
          return obj;
        }, {});
      });

      console.log('Column definitions:', columnDefs);
      console.log('Sample parsed data:', parsedData.slice(0, 2));

      // Set grid data state
      setGridData({
        columns: columnDefs,
        data: parsedData,
        schema
      });

      // Show table
      handleShowTable('main', 'advanced');

      toast({
        title: "Table Generated",
        description: "Data loaded successfully",
        duration: 3000,
        className: "bg-blue-50 border-blue-200 shadow-lg border-2 rounded-xl",
      });
    } else if (mode === 'database') {
      // Database mode handling
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post<CustomDbUploadResponse>(
        `${API_ENDPOINT}/upload-file-llm-pg/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Accept': 'application/json'
          },
          timeout: 900000,
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              console.log(`Upload Progress: ${percentCompleted}%`);
            }
          }
        }
      );

      if (response.data.status === 'success') {
        toast({
          title: "File Upload Successful",
          description: `${response.data.rows_inserted} rows inserted into table ${response.data.table_name}`,
          duration: 3000,
          className: "bg-blue-50 border-blue-200 shadow-lg border-2 rounded-xl",
        });

        setTableInfo({
          tableName: response.data.table_name,
          rowCount: response.data.rows_inserted,
          columns: response.data.columns
        });

        // Set default database credentials for REX DB
        setLastUsedCredentials({
          host: 'rex.tigzig.com',
          database: 'rexdb',
          user: 'rex_user',
          password: 'rex_password',
          schema: 'public',
          port: '5432',
          db_type: 'postgresql'
        });
      }
    }
  } catch (error) {
    console.error('Upload error:', error);
    toast({
      title: "Upload Failed",
      description: error instanceof Error ? error.message : "Failed to process the file",
      duration: 3000,
      className: "bg-red-50 border-red-200 shadow-lg border-2 rounded-xl",
    });
  } finally {
    setIsGridLoading(false);
    setIsDbLoading(false);
  }
}; 