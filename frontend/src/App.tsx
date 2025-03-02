import { useState, useCallback, useEffect, useReducer } from 'react'
import { Button } from "@/components/ui/button"
import { Loader2, Database, Plus, X, Copy, LogOut, AlertTriangle } from "lucide-react"
import { ChartSection } from "@/components/ChartSection"
import { useToast } from "@/components/ui/use-toast"
import { ToastProvider } from "@/components/ui/toast"
import { Toaster } from "@/components/ui/toaster"
import { Tooltip } from "@/components/ui/tooltip"
import { DocumentBoxSection } from "@/components/document-box-section"
import { AnalysisTabs } from "@/components/analysis-tabs"
import { v4 as uuidv4 } from 'uuid';
import { useAuth0 } from "@auth0/auth0-react";
import { DatabaseConnectionDialog } from "@/components/database-connection-dialog"
import { DatabaseOptionDialog } from "@/components/database-option-dialog"
import { ProgressStatusDialog, ProgressStep } from "@/components/progress-status-dialog"
import { FileUploadSection } from "@/components/file-upload-section"
import { CreateDatabaseDialog } from "@/components/create-database-dialog"
import { AnalysisSection, DEFAULT_ANALYSIS_PROMPT, DEFAULT_STRUCTURE_PROMPT } from '@/components/AnalysisSection';
import { handleQuickConnect, handleCreateNeonDb, handlePushToMyDb, handleFileUpload, handleCreateTemporaryDb } from "@/services/databaseService";
import { DataTableSection } from "@/components/data-table-section";
import { generateAnalysisPdf, generateQuickAnalysisPdf } from "@/services/pdfService";
import { TableView, TableData } from "@/types/database";
import { HoverCard } from "@/components/hover-card"
import { endpointStore } from '@/stores/endpointStore';

// Add these console log to debug environment variables
console.log('Environment Variables:', {
  FLOWISE: import.meta.env.VITE_FLOWISE_API_ENDPOINT,
  API: import.meta.env.VITE_API_ENDPOINT,
  // Don't log the full API key in production
  OPENAI_KEY_EXISTS: !!import.meta.env.VITE_OPENAI_API_KEY
});

// Export the constants with fallbacks
export const FLOWISE_API_ENDPOINT = import.meta.env.VITE_FLOWISE_API_ENDPOINT || '';
export const FLOWISE_ADV_ANALYST_API_ENDPOINT = import.meta.env.VITE_FLOWISE_ADV_ANALYST_API_ENDPOINT || '';

export const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT ||
  "https://file-processing-endpoint-fallback.tigzig.com";

// Use the environment variable for API_URL
export const API_URL = import.meta.env.VITE_NEON_API_URL;

// Add this constant for the REX DB button toggle
export const SHOW_REX_DB_BUTTON = import.meta.env.VITE_SHOW_REX_DB_BUTTON === 'true';

// Add type definitions
type GridData = TableData & {
  schema?: any;
};

type PanelType = 'structure' | 'analysis' | 'quickAnalysis' | 'chat' | 'charts' | 'documents';

type PanelState = {
  expanded: PanelType | null;
  maximized: PanelType | null;
};

type ChatMessage = {
  role: 'assistant' | 'user';
  content: string;
};

type State = {
  files: {
    main: { content: string; filename: string; } | null;
    summary: { content: string; filename: string; } | null;
  };
  tables: {
    main: TableData | null;
    summary: TableData | null;
  };
  loading: boolean;
  error: string | null;
  status: string;
  progress: number;
  charts: { url: string; timestamp: number }[];
  tableInfo: {
    tableName: string;
    rowCount: number;
    columns: string[];
  };
}

type Action =
  | { type: 'SET_FILES'; payload: any }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_STATUS'; payload: string }
  | { type: 'SET_PROGRESS'; payload: number }
  | { type: 'ADD_CHART'; payload: { url: string; timestamp: number } }
  | { type: 'RESET' }
  | { type: 'SET_TABLE_INFO'; payload: { tableName: string; rowCount: number; columns: string[] } };

const initialState: State = {
  files: { main: null, summary: null },
  tables: { main: null, summary: null },
  loading: false,
  error: null,
  status: 'pending',
  progress: 0,
  charts: [],
  tableInfo: {
    tableName: '',
    rowCount: 0,
    columns: []
  },
}

function reducer(state: State, action: Action): State {
  console.log('Reducer called with action:', action.type);

  switch (action.type) {
    case 'SET_FILES':
    case 'SET_LOADING':
    case 'SET_ERROR':
    case 'SET_STATUS':
    case 'SET_PROGRESS':
      return {
        ...state, [action.type === 'SET_FILES' ? 'files' :
          action.type === 'SET_LOADING' ? 'loading' :
            action.type === 'SET_ERROR' ? 'error' :
              action.type === 'SET_STATUS' ? 'status' :
                'progress']: action.payload
      };
    case 'RESET':
      return initialState;
    case 'ADD_CHART':
      console.log('Processing ADD_CHART action');
      console.log('Current charts:', state.charts);
      console.log('New chart payload:', action.payload);

      const newCharts = [...state.charts, action.payload];
      console.log('New charts array:', newCharts);

      const newState = {
        ...state,
        charts: newCharts
      };

      console.log('Final state:', newState);
      return newState;
    case 'SET_TABLE_INFO':
      return {
        ...state,
        tableInfo: action.payload
      };
    default:
      return state;
  }
}

// Add this type near other type definitions
type ParsedDbCredentials = {
  host: string;
  database: string;
  user: string;
  password: string;
  schema: string;
  port: string;
  db_type: 'postgresql' | 'mysql';
};

// First, add the device detection hook near the top of the file, after other imports
const useDeviceDetect = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      return (
        (window.innerWidth <= 768 || window.screen.width <= 768) ||
        /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        /iPhone|iPod|Android/.test(navigator.platform) ||
        ('orientation' in window)
      );
    };

    const handleResize = () => setIsMobile(checkMobile());
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return { isMobile };
};

function App() {
  const { isMobile } = useDeviceDetect();
  const { isAuthenticated, logout, user, loginWithRedirect } = useAuth0();
  
  const [isDbLoading, setIsDbLoading] = useState(false);
  const [isGridLoading, setIsGridLoading] = useState(false);
  const [isCustomDbLoading, setIsCustomDbLoading] = useState(false);
  const [showCreateDbDialog, setShowCreateDbDialog] = useState(false);
  const [sharedMessages, setSharedMessages] = useState<ChatMessage[]>([]);
  const [advancedMessages, setAdvancedMessages] = useState<ChatMessage[]>([]);
  const [gridData, setGridData] = useState<GridData | null>(null);
  const [isCreatingDb, setIsCreatingDb] = useState(false);
  const [credentialsDisplay, setCredentialsDisplay] = useState<{
    show: boolean;
    data: null | {
      hostname: string;
      database: string;
      username: string;
      password: string;
      port: number;
      type: string;
    };
    message: string;
  }>({
    show: false,
    data: null,
    message: ""
  });

  const [sessionId] = useState(() => {
    const newSessionId = uuidv4();
    console.log('Created new sessionId:', newSessionId);
    return newSessionId;
  });

  const [state, dispatch] = useReducer(reducer, initialState);
  const [tableView, setTableView] = useState<TableView>({ type: 'main', viewType: 'simple' });
  const [analysisContent, setAnalysisContent] = useState('');
  const [quickAnalysisContent, setQuickAnalysisContent] = useState('');
  const [panelState, setPanelState] = useState<PanelState>({
    expanded: 'analysis',
    maximized: null
  });
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [isQuickPdfGenerating, setIsQuickPdfGenerating] = useState(false);
  const [showQuickConnectDialog, setShowQuickConnectDialog] = useState(false);
  const [isQuickConnecting, setIsQuickConnecting] = useState(false);
  const { toast } = useToast();
  const [lastUsedCredentials, setLastUsedCredentials] = useState<ParsedDbCredentials | null>(null);
  const [showDatabaseOptionDialog, setShowDatabaseOptionDialog] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [progressSteps, setProgressSteps] = useState<ProgressStep[]>([]);
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [currentEndpoint, setCurrentEndpoint] = useState(endpointStore.currentEndpoint);

  // Add effect to listen for endpoint changes
  useEffect(() => {
    const handleEndpointChange = (event: CustomEvent) => {
      setCurrentEndpoint(event.detail.endpoint);
    };

    window.addEventListener('endpointChanged', handleEndpointChange as EventListener);
    return () => window.removeEventListener('endpointChanged', handleEndpointChange as EventListener);
  }, []);

  // Get analysis functionality from AnalysisSection
  const {
    analysisState,
    showAnalysisOptions,
    setShowAnalysisOptions,
    showStructureOptions,
    setShowStructureOptions,
    showCustomPromptDialog,
    setShowCustomPromptDialog,
    customPrompt,
    setCustomPrompt,
    handleAnalyzeData,
    handleQuickAnalysis,
    handleCustomAnalysis,
    handleCustomStructureAnalysis,
  } = AnalysisSection({
    sessionId,
    setAnalysisContent,
    setQuickAnalysisContent,
    setPanelState,
    FLOWISE_API_ENDPOINT,
  });

  // Create a dummy function for setShowCustomStructureDialog since it's required by FileUploadSection
  const setShowCustomStructureDialog = useCallback((show: boolean) => {
    // This is a no-op function since we don't use this functionality anymore
    console.log('Custom structure dialog toggled:', show);
  }, []);

  // Add helper function
  const isInIframe = () => {
    try {
      return window !== window.top;
    } catch (e) {
      return true;
    }
  };

  // Add event listener for new charts
  useEffect(() => {
    const handleNewChart = (event: CustomEvent<{ url: string; timestamp: number }>) => {
      console.log('Received new chart event:', event.detail);
      dispatch({ type: 'ADD_CHART', payload: event.detail });
    };

    window.addEventListener('newChart', handleNewChart as EventListener);
    return () => window.removeEventListener('newChart', handleNewChart as EventListener);
  }, []);

  // Add the toggleMaximize function with proper type
  const toggleMaximize = useCallback((panel: PanelType) => {
    setPanelState((prev) => ({
      ...prev,
      maximized: prev.maximized === panel ? null : panel
    }));
  }, []);

  // Define handleShowTable first
  const handleShowTable = useCallback((type: 'main' | 'summary', viewType: 'simple' | 'advanced') => {
    setTableView({ type, viewType });

    if (viewType === 'advanced') {
      toast({
        title: "Interactive table loaded below ↓",
        duration: 2000,
        className: "bg-blue-50 border-blue-200 shadow-lg border-2 rounded-xl",
      })

      setTimeout(() => {
        const tableSection = document.querySelector('.mt-6.w-full');
        if (tableSection) {
          const yOffset = -100;
          const y = tableSection.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }, 100);
    }
  }, [toast]);

  // Update handleFileUpload to use the service function
  const handleFileUploadWrapper = useCallback(async (form: HTMLFormElement, mode: 'database' | 'grid') => {
    await handleFileUpload(
      form,
      mode,
      API_ENDPOINT,
      setIsGridLoading,
      setIsDbLoading,
      setGridData,
      handleShowTable,
      (info) => dispatch({ type: 'SET_TABLE_INFO', payload: info }),
      setLastUsedCredentials
    );
  }, [dispatch, handleShowTable, setLastUsedCredentials]);

  // Update handlePushToMyDb to use the service function
  const handlePushToMyDbWrapper = useCallback(async (file: File) => {
    setPendingFile(file);

    if (!lastUsedCredentials) {
      // Show the database option dialog without showing progress dialog yet
      setShowDatabaseOptionDialog(true);
      return;
    }

    // Only initialize progress steps if we have credentials
    const initialSteps: ProgressStep[] = [
      { id: '1', message: 'Uploading file to database...', status: 'pending' },
      { id: '2', message: 'Analyzing schema and sending to AI...', status: 'pending' },
      { id: '3', message: 'Finalizing setup...', status: 'pending' }
    ];
    setProgressSteps(initialSteps);
    setShowProgressDialog(true);

    try {
      await handlePushToMyDb(
        file,
        lastUsedCredentials,
        sessionId,
        setIsCustomDbLoading,
        (info) => dispatch({ type: 'SET_TABLE_INFO', payload: info }),
        setSharedMessages,
        API_ENDPOINT,
        setLastUsedCredentials,
        setPanelState,
        setShowDatabaseOptionDialog,
        setAdvancedMessages,
        // Pass progress update callback
        (stepId: string, status: 'in_progress' | 'completed' | 'error', message?: string, isRowCountMessage?: boolean) => {
          setProgressSteps(prev => prev.map(step => 
            step.id === stepId 
              ? { ...step, status, message: message || step.message, isRowCountMessage }
              : step
          ));
        }
      );

      // Clear the file input after successful upload
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (error) {
      console.error('Error in file upload:', error);
      // Error handling is done in handlePushToMyDb
    }
  }, [
    sessionId,
    lastUsedCredentials,
    dispatch,
    setSharedMessages,
    setAdvancedMessages,
    setPanelState,
    API_ENDPOINT,
    setShowDatabaseOptionDialog,
    setIsCustomDbLoading,
    setProgressSteps,
    setShowProgressDialog
  ]);

  // Update handleDatabaseOptionSelect to use progress dialog
  const handleDatabaseOptionSelect = useCallback(async (useTemporary: boolean) => {
    setShowDatabaseOptionDialog(false);
    
    if (useTemporary && pendingFile) {
      // Initialize progress steps for temporary database
      const initialSteps: ProgressStep[] = [
        { id: '1', message: 'Creating temporary database...', status: 'pending' },
        { id: '2', message: 'Configuring database credentials...', status: 'pending' },
        { id: '3', message: 'Sending credentials to AI agents...', status: 'pending' },
        { id: '4', message: 'Uploading file to database...', status: 'pending' },
        { id: '5', message: 'Analyzing schema...', status: 'pending' },
        { id: '6', message: 'Finalizing setup...', status: 'pending' }
      ];
      setProgressSteps(initialSteps);
      setShowProgressDialog(true);

      try {
        // Use temporary database flow
        await handleCreateTemporaryDb(
          pendingFile,
          sessionId,
          setIsCustomDbLoading,
          (info) => dispatch({ type: 'SET_TABLE_INFO', payload: info }),
          setSharedMessages,
          API_ENDPOINT,
          setLastUsedCredentials,
          setPanelState,
          setAdvancedMessages,
          // Pass progress update callback
          (stepId: string, status: 'in_progress' | 'completed' | 'error', message?: string, isRowCountMessage?: boolean) => {
            setProgressSteps(prev => prev.map(step => 
              step.id === stepId 
                ? { ...step, status, message: message || step.message, isRowCountMessage }
                : step
            ));
          }
        );

        // Clear the file input after successful upload
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
      } catch (error) {
        console.error('Error in temporary database flow:', error);
        // Mark all pending steps as error
        setProgressSteps(prev => prev.map(step => 
          step.status === 'pending' 
            ? { ...step, status: 'error', error: 'Process interrupted' }
            : step
        ));
      }
    } else {
      // For own database option, show the connect dialog
      setShowQuickConnectDialog(true);
    }
    
    setPendingFile(null);
  }, [
    pendingFile,
    sessionId,
    API_ENDPOINT,
    setAdvancedMessages,
    dispatch,
    setSharedMessages,
    setPanelState,
    setLastUsedCredentials,
    setIsCustomDbLoading,
    setProgressSteps,
    setShowProgressDialog,
    setShowQuickConnectDialog
  ]);

  // Update the handleQuickConnect call in the component
  const handleQuickConnectWrapper = useCallback(async (
    connectionString: string,
    additionalInfo: string = '',
    setProgressSteps?: React.Dispatch<React.SetStateAction<ProgressStep[]>>,
    setShowProgressDialog?: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    await handleQuickConnect(
      connectionString,
      additionalInfo,
      sessionId,
      setIsQuickConnecting,
      setLastUsedCredentials,
      setSharedMessages,
      setPanelState,
      setAdvancedMessages,
      setProgressSteps,
      setShowProgressDialog
    );
  }, [
    sessionId,
    setAdvancedMessages,
    setIsQuickConnecting,
    setLastUsedCredentials,
    setSharedMessages,
    setPanelState
  ]);

  // Update the handleCreateNeonDb call in the component
  const handleCreateNeonDbWrapper = useCallback(async (nickname: string) => {
    await handleCreateNeonDb(
      nickname,
      setIsCreatingDb,
      setShowCreateDbDialog,
      handleQuickConnectWrapper,
      user,
      setProgressSteps,
      setShowProgressDialog
    );
  }, [user, handleQuickConnectWrapper, setProgressSteps, setShowProgressDialog]);

  // Update the PDF generation handlers to use the service functions
  const handleGeneratePdf = useCallback(async () => {
    await generateAnalysisPdf(analysisContent, setIsPdfGenerating);
  }, [analysisContent]);

  const handleGenerateQuickPdf = useCallback(async () => {
    await generateQuickAnalysisPdf(quickAnalysisContent, setIsQuickPdfGenerating);
  }, [quickAnalysisContent]);

  const isValidTableType = (type: string): type is 'main' | 'summary' => {
    return type === 'main' || type === 'summary';
  };

  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-50">
        {/* Main Header */}
        <div className="bg-gradient-to-r from-indigo-950 to-indigo-900 text-white shadow-lg border-b border-white/5">
          <div className="max-w-7xl mx-auto flex items-center gap-4 py-3 px-4">
            {isMobile ? (
              // Mobile header layout - Enhanced with three sections
              <div className="flex flex-col py-1 space-y-1.5">
                <h1 className="text-lg font-medium whitespace-nowrap leading-tight">
                  Analyze with AI
                </h1>
                <div className="text-sm text-indigo-100 font-medium leading-tight flex flex-wrap items-center gap-1.5">
                  <span>PostGres</span>
                  <span className="text-indigo-200 text-[8px]">◆</span>
                  <span>MySQL</span>
                  <span className="text-indigo-200 text-[8px]">◆</span>
                  <span>File2Database</span>
                  <span className="text-indigo-200 text-[8px]">◆</span>
                  <span>Export</span>
                </div>
                <div className="text-sm text-indigo-200 font-medium bg-indigo-800/60 px-2 py-1 rounded border border-indigo-700/50">
                  <span className="text-indigo-200">AI:</span>
                  <span className="ml-1 text-white">GPT-4o</span>
                  <span className="mx-1 text-indigo-300">•</span>
                  <span className="text-white">Gemini</span>
                  <span className="mx-1 text-indigo-300">•</span>
                  <span className="text-white">Deepseek</span>
                </div>
              </div>
            ) : (
              // Desktop header layout
              <>
                <h1 className="text-xl font-semibold whitespace-nowrap tracking-tight">
                  Analyze with AI
                </h1>
                <div className="h-5 w-px bg-indigo-300/20 mx-3"></div>
                <span className="text-base text-indigo-100 font-medium whitespace-nowrap tracking-tight">
                  <span>PostGres</span>
                  <span className="mx-2 text-indigo-200 text-[10px]">◆</span>
                  <span>MySQL</span>
                  <span className="mx-2 text-indigo-200 text-[10px]">◆</span>
                  <span>Instant Database</span>
                  <span className="mx-2 text-indigo-200 text-[10px]">◆</span>
                  <span>File2Database</span>
                  <span className="mx-2 text-indigo-200 text-[10px]">◆</span>
                  <span>Export</span>
                  <span className="mx-2 text-indigo-200 text-[10px]">◆</span>
                  <span>Logs</span>
                </span>
                <div className="h-5 w-px bg-indigo-300/20 mx-3"></div>
                <span className="text-[15px] font-medium whitespace-nowrap bg-indigo-800/80 px-4 py-1.5 rounded-md border border-indigo-700 shadow-sm">
                  <span className="text-indigo-200 mr-2">AI:</span>
                  <span className="text-white">GPT-o3-mini</span>
                  <span className="mx-2 text-indigo-400">•</span>
                  <span className="text-white">Gemini Flash 2.0</span>
                  <span className="mx-2 text-indigo-400">•</span>
                  <span className="text-white">Deepseek R1</span>
                </span>
                <div className="flex-grow"></div>
              </>
            )}
          </div>
        </div>

        {/* Menu Container */}
        <div className="py-2 px-4">
          <div className="max-w-[1400px] mx-auto">
            {/* Main Controls Row */}
            <div className={`${isMobile ? 'flex flex-col space-y-2' : 'flex items-center'} bg-white/50 rounded-lg p-2`}>
              {/* BYOW Section */}
              <div className={`${isMobile ? 'w-full' : 'flex items-center mr-4'}`}>
                <div className={`${isMobile ? 'w-full flex items-center justify-between' : 'flex items-center'} px-2 py-1 bg-indigo-200/90 rounded-xl border border-indigo-700/30 shadow-sm`}>
                  <span className={`text-[18px] font-medium text-indigo-900 font-bold ${!isMobile ? 'mr-3' : ''}`}>BYOW</span>

                  <div className="inline-flex space-x-2">
                    {/* Connect to DB button */}
                    <Tooltip content="Quick Database Connection Check">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowQuickConnectDialog(true)}
                        className="h-8 px-2.5 bg-white hover:bg-indigo-50 text-indigo-600 flex items-center gap-1.5 shadow-sm border border-indigo-100 rounded-xl"
                      >
                        <Database className="h-4 w-4" />
                        <span className="text-[15px] font-medium">Connect</span>
                      </Button>
                    </Tooltip>

                    {/* Create DB button */}
                    <Tooltip content="Create New Neon Database">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={async (e) => {
                          e.preventDefault();
                          
                          if (isInIframe()) {
                            const newWindow = window.open(window.location.href, '_blank');
                            if (newWindow) {
                              newWindow.focus();
                            }
                            
                            toast({
                              title: "Opening in new window",
                              description: "Continue with database creation in the new window",
                              duration: 3000,
                              className: "bg-blue-50 border-blue-200 shadow-lg border-2 rounded-xl",
                            });
                          } else {
                            if (!isAuthenticated) {
                              await loginWithRedirect();
                              return;
                            }
                            setShowCreateDbDialog(true);
                          }
                        }}
                        className="h-8 px-2.5 bg-white hover:bg-indigo-50 text-indigo-600 flex items-center gap-1.5 shadow-sm border border-indigo-100 rounded-xl"
                      >
                        <Plus className="h-4 w-4" />
                        <span className="text-[15px] font-medium">Create DB</span>
                      </Button>
                    </Tooltip>

                    {/* Logout button */}
                    {isAuthenticated && (
                      <Tooltip content="Logout">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => logout({ 
                            logoutParams: {
                              returnTo: window.location.origin
                            }
                          })}
                          className="h-8 px-2.5 bg-white hover:bg-indigo-50 text-indigo-600 flex items-center gap-1.5 shadow-sm border border-indigo-100 rounded-xl"
                        >
                          <LogOut className="h-4 w-4" />
                          <span className="text-[15px] font-medium">Logout</span>
                        </Button>
                      </Tooltip>
                    )}
                  </div>
                </div>
              </div>

              {/* File Upload Section */}
              <div className={`${isMobile ? 'w-full' : 'flex-1'}`}>
                <FileUploadSection
                  onFileUpload={handleFileUploadWrapper}
                  onAnalyzeData={handleAnalyzeData}
                  onQuickAnalysis={handleQuickAnalysis}
                  onCustomAnalysis={handleCustomAnalysis}
                  onCustomStructureAnalysis={handleCustomStructureAnalysis}
                  onPushToMyDb={handlePushToMyDbWrapper}
                  isDbLoading={isDbLoading}
                  isGridLoading={isGridLoading}
                  isCustomDbLoading={isCustomDbLoading}
                  analysisState={analysisState}
                  showAnalysisOptions={showAnalysisOptions}
                  setShowAnalysisOptions={setShowAnalysisOptions}
                  showStructureOptions={showStructureOptions}
                  setShowStructureOptions={setShowStructureOptions}
                  setShowCustomPromptDialog={setShowCustomPromptDialog}
                  setShowCustomStructureDialog={setShowCustomStructureDialog}
                  setCustomPrompt={setCustomPrompt}
                  DEFAULT_ANALYSIS_PROMPT={DEFAULT_ANALYSIS_PROMPT}
                  DEFAULT_STRUCTURE_PROMPT={DEFAULT_STRUCTURE_PROMPT}
                  SHOW_REX_DB_BUTTON={SHOW_REX_DB_BUTTON}
                  tableInfo={state.tableInfo}
                  dbCredentials={lastUsedCredentials}
                  handleDatabaseOptionSelect={handleDatabaseOptionSelect}
                />
              </div>
            </div>

            {/* File Info Divider */}
            <div className="mt-0">
              <div className="px-3 py-[2px] bg-indigo-50/50 border border-indigo-100 rounded-lg flex flex-wrap md:flex-nowrap items-center min-h-[24px] gap-4 md:space-x-4">
                {/* Connection Info */}
                {lastUsedCredentials && (
                  <div className="flex-shrink-0">
                    <HoverCard
                      trigger={
                        <span className="text-[12px] font-mono font-medium text-slate-900 leading-none flex items-center gap-1.5">
                          <Database className="h-3.5 w-3.5 text-orange-500 animate-[pulse_1.5s_ease-in-out_infinite] drop-shadow-[0_0_3px_rgba(249,115,22,0.5)]" />
                          {(() => {
                            const fullString = `Connected to ${lastUsedCredentials.db_type === 'postgresql' ? 'PostgreSQL' : 'MySQL'}/${lastUsedCredentials.host} as ${lastUsedCredentials.user}`;
                            return fullString.length > 50 ? fullString.substring(0, 50) + '...' : fullString;
                          })()}
                        </span>
                      }
                      title="Database Connection Details"
                      copyableContent={`Type: ${lastUsedCredentials.db_type === 'postgresql' ? 'PostgreSQL' : 'MySQL'}
Host: ${lastUsedCredentials.host}
User: ${lastUsedCredentials.user}
Schema: ${lastUsedCredentials.schema || 'default'}`}
                    >
                      <div className="space-y-1 text-[13px] bg-indigo-50/50 p-2 rounded-md">
                        <div className="whitespace-nowrap select-text">Type: {lastUsedCredentials.db_type === 'postgresql' ? 'PostgreSQL' : 'MySQL'}</div>
                        <div className="whitespace-nowrap select-text">Host: {lastUsedCredentials.host}</div>
                        <div className="whitespace-nowrap select-text">User: {lastUsedCredentials.user}</div>
                        <div className="whitespace-nowrap select-text">Schema: {lastUsedCredentials.schema || 'default'}</div>
                      </div>
                    </HoverCard>
                  </div>
                )}

                {/* Separator - only show if both connection and file info exist and not on mobile */}
                {lastUsedCredentials && state.tableInfo?.tableName && (
                  <div className="hidden md:block h-3 w-px bg-indigo-200"></div>
                )}

                {/* File Info */}
                {state.tableInfo?.tableName && (
                  <div className="flex-shrink-0">
                    <HoverCard
                      trigger={
                        <span className="text-[12px] font-mono font-medium text-slate-900 leading-none flex items-center gap-1.5">
                          <span className="text-[15px]">📋</span>
                          {(() => {
                            const label = "New Table Name: ";
                            const fullString = `${label}${state.tableInfo.tableName}`;
                            return fullString.length > 40 
                              ? fullString.substring(0, 40) + '...' 
                              : fullString;
                          })()}
                          {state.tableInfo.rowCount > 0 && (
                            <span className="ml-1">
                              ({state.tableInfo.rowCount.toLocaleString()} rows)
                            </span>
                          )}
                        </span>
                      }
                      title="Table Details"
                      copyableContent={state.tableInfo.tableName}
                    >
                      <div className="space-y-1 text-[13px] bg-indigo-50/50 p-2 rounded-md">
                        <div className="whitespace-nowrap select-text">Full Table Name: {state.tableInfo.tableName}</div>
                        {state.tableInfo.rowCount > 0 && (
                          <div className="whitespace-nowrap select-text">Row Count: {state.tableInfo.rowCount.toLocaleString()}</div>
                        )}
                      </div>
                    </HoverCard>
                  </div>
                )}

                {/* Separator - only show if table info exists and there's a previous item and not on mobile */}
                {state.tableInfo?.tableName && (
                  <div className="hidden md:block h-3 w-px bg-indigo-200"></div>
                )}

                {/* Model Info */}
                <div className="flex-shrink-0">
                  <HoverCard
                    trigger={
                      <span className="text-[12px] font-mono font-medium text-slate-900 leading-none flex items-center gap-1.5">
                        <span className="text-[15px]">🤖</span>
                        {(() => {
                          const modelString = `Model: ${currentEndpoint.name}`;
                          return modelString.length > 25 
                            ? modelString.substring(0, 25) + '...' 
                            : modelString;
                        })()}
                      </span>
                    }
                    title="Selected AI Model"
                    copyableContent={currentEndpoint.name}
                  >
                    <div className="space-y-1 text-[13px] bg-indigo-50/50 p-2 rounded-md">
                      <div className="whitespace-nowrap select-text">Model: {currentEndpoint.name}</div>
                      <div className="whitespace-nowrap select-text text-gray-600">{currentEndpoint.description}</div>
                    </div>
                  </HoverCard>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 -mt-1">
          {/* Chat Section */}
          <div className="md:col-span-2">
            <AnalysisTabs
              analysisContent={analysisContent}
              quickAnalysisContent={quickAnalysisContent}
              sessionId={sessionId}
              onGeneratePdf={handleGeneratePdf}
              onGenerateQuickPdf={handleGenerateQuickPdf}
              isPdfGenerating={isPdfGenerating}
              isQuickPdfGenerating={isQuickPdfGenerating}
              sharedMessages={sharedMessages}
              setSharedMessages={setSharedMessages}
              advancedMessages={advancedMessages}
              setAdvancedMessages={setAdvancedMessages}
            />
          </div>

          {/* Chart Section */}
          <div className="md:col-span-1">
            <div className={panelState.maximized && panelState.maximized !== 'charts' ? 'hidden' : ''}>
              <ChartSection
                charts={state.charts}
                isMaximized={panelState.maximized === 'charts'}
                onToggleMaximize={() => toggleMaximize('charts')}
              />
            </div>

            {/* Document Box */}
            <div className="mt-4">
              <DocumentBoxSection
                isMaximized={panelState.maximized === 'documents'}
                onToggleMaximize={() => toggleMaximize('documents')}
              />
            </div>
          </div>
        </div>

        {/* Data Table Section */}
        {(gridData || (tableView && isValidTableType(tableView.type) && state.tables[tableView.type])) && (
          <DataTableSection
            gridData={gridData}
            tableView={tableView}
            tables={state.tables}
          />
        )}

      {/* Add Quick Connect dialog */}
      <DatabaseConnectionDialog
        isOpen={showQuickConnectDialog}
        onClose={() => setShowQuickConnectDialog(false)}
        onConnect={handleQuickConnectWrapper}
        isConnecting={isQuickConnecting}
      />

      {/* Add Custom Analysis Dialog right before the closing ToastProvider */}
      {showCustomPromptDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <h3 className="text-lg font-medium mb-4">Custom Analysis Prompt</h3>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="w-full h-64 p-2 border rounded-md mb-4"
              placeholder="Enter your custom analysis prompt..."
            />
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => setShowCustomPromptDialog(false)}
                variant="outline"
                size="sm"
                className="bg-white hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  const form = document.querySelector('form');
                  const fileInput = form?.querySelector('input[type="file"]') as HTMLInputElement;
                  if (fileInput?.files?.[0]) {
                    handleCustomAnalysis(fileInput.files[0], customPrompt);
                    setShowCustomPromptDialog(false);
                  }
                }}
                variant="default"
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={analysisState.isCustomAnalyzing}
              >
                {analysisState.isCustomAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  'Analyze'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      <Toaster />

      {/* Create DB Dialog */}
      <CreateDatabaseDialog
        isOpen={showCreateDbDialog}
        onClose={() => setShowCreateDbDialog(false)}
          onCreateDatabase={handleCreateNeonDbWrapper}
        isCreating={isCreatingDb}
      />

      {credentialsDisplay.show && credentialsDisplay.data && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-lg p-6 w-full max-w-xl mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Database Credentials</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCredentialsDisplay({ show: false, data: null, message: "" })}
                className="hover:bg-gray-100 rounded-full h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-3.5 mb-4 flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-orange-900">
                  Temporary Database Warning
                </p>
                <p className="text-sm text-orange-800">
                  This is a temporary database that will be automatically deleted after 24 hours. Please make sure to save any important data before it expires.
                </p>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">{credentialsDisplay.message}</p>
            
            <div className="relative bg-gray-50 p-4 rounded-lg">
              <div className="font-mono text-sm whitespace-pre-wrap bg-white p-4 rounded border border-gray-200">
                {`Host: ${credentialsDisplay.data.hostname}
Database: ${credentialsDisplay.data.database}
Username: ${credentialsDisplay.data.username}
Password: ${credentialsDisplay.data.password}
Port: ${credentialsDisplay.data.port}
Type: ${credentialsDisplay.data.type}`}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const credentials = `Host: ${credentialsDisplay.data?.hostname}
Database: ${credentialsDisplay.data?.database}
Username: ${credentialsDisplay.data?.username}
Password: ${credentialsDisplay.data?.password}
Port: ${credentialsDisplay.data?.port}
Type: ${credentialsDisplay.data?.type}`;
                  navigator.clipboard.writeText(credentials);
                  toast({
                    title: "Copied!",
                    description: "All credentials copied to clipboard",
                    duration: 2000,
                  });
                }}
                className="absolute top-6 right-6 bg-white"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add DatabaseOptionDialog */}
      <DatabaseOptionDialog
        isOpen={showDatabaseOptionDialog}
        onClose={() => {
          setShowDatabaseOptionDialog(false);
          setPendingFile(null);
        }}
        onSelectTemporary={() => handleDatabaseOptionSelect(true)}
        onSelectOwn={() => handleDatabaseOptionSelect(false)}
      />

      {/* Add ProgressStatusDialog */}
      <ProgressStatusDialog
        isOpen={showProgressDialog}
        steps={progressSteps}
        title="Setting Up Your Analysis Environment"
        onClose={() => {
          setShowProgressDialog(false);
          setProgressSteps([]);
        }}
      />

      {/* Footer */}
      <footer className="bg-white/50 border-t border-indigo-100 py-2 mt-8 text-sm text-indigo-950/70 text-center">
        <div className="max-w-7xl mx-auto px-4">
          Amar Harolikar <span className="mx-1.5 text-indigo-300">•</span> Specialist - Decision Sciences & Applied Generative AI <span className="mx-1.5 text-indigo-300">•</span>
          <a 
            href="https://www.linkedin.com/in/amarharolikar" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-indigo-600 hover:text-indigo-700 hover:underline"
          >
            LinkedIn
          </a> <span className="mx-1.5 text-indigo-300">•</span>
          <a 
            href="https://rex.tigzig.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-indigo-600 hover:text-indigo-700 hover:underline"
          >
            rex.tigzig.com
          </a> <span className="mx-1.5 text-indigo-300">•</span>
          <a 
            href="https://tigzig.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-indigo-600 hover:text-indigo-700 hover:underline"
          >
            tigzig.com
          </a>
        </div>
      </footer>
      </div>
    </ToastProvider>
  )
}

export default App
