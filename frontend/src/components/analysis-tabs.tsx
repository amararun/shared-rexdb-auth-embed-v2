import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AnalysisDisplay } from "./analysis-display"
import { QuickAnalysisDisplay } from "./quick-analysis-display"
import { ChatBox } from "./chat-box"
import { LogDisplay } from "./log-display"
import { Maximize2, Minimize2, FileDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { logService, type LogEntry } from "@/services/logService"

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

type Message = {
  role: 'assistant' | 'user';
  content: string;
};

interface AnalysisTabsProps {
  analysisContent: string;
  quickAnalysisContent: string;
  sessionId: string;
  onGeneratePdf: () => void;
  onGenerateQuickPdf: () => void;
  isPdfGenerating: boolean;
  isQuickPdfGenerating: boolean;
  sharedMessages: Message[];
  setSharedMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  advancedMessages: Message[];
  setAdvancedMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

export function AnalysisTabs({
  analysisContent,
  quickAnalysisContent,
  sessionId,
  onGeneratePdf,
  onGenerateQuickPdf,
  isPdfGenerating,
  isQuickPdfGenerating,
  sharedMessages,
  setSharedMessages,
  advancedMessages,
  setAdvancedMessages,
}: AnalysisTabsProps) {
  const { isMobile } = useDeviceDetect();
  const [maximizedTab, setMaximizedTab] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('structure');
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    const unsubscribe = logService.subscribe(setLogs);
    return () => unsubscribe();
  }, []);

  const toggleMaximize = (tab: string) => {
    setMaximizedTab(maximizedTab === tab ? null : tab);
  };

  return (
    <Tabs 
      defaultValue="structure"
      value={activeTab}
      onValueChange={setActiveTab}
      className={`w-full ${
        maximizedTab 
          ? 'fixed left-4 right-6 top-4 bottom-4 z-50 bg-white shadow-2xl rounded-lg max-w-[calc(100vw-3rem)]' 
          : ''
      }`}
    >
      <TabsList className={`w-full ${isMobile ? 'grid-rows-2 grid-cols-3 gap-x-3 gap-y-2 h-auto py-2' : 'grid-cols-5 gap-3'} grid bg-violet-50/90 px-2 py-1.5 rounded-lg font-inter`}>
        {isMobile ? (
          <>
            {/* First Row */}
            <TabsTrigger 
              value="structure" 
              className="data-[state=active]:bg-white data-[state=active]:text-violet-950 data-[state=active]:shadow-sm text-violet-950 text-[14px] font-medium rounded-md hover:bg-white/60 transition-colors relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-violet-600/20 hover:after:bg-violet-600/30 data-[state=active]:after:bg-violet-600 font-inter"
            >
              Structure
            </TabsTrigger>
            <TabsTrigger 
              value="quick" 
              className="data-[state=active]:bg-white data-[state=active]:text-violet-950 data-[state=active]:shadow-sm text-violet-950 text-[14px] font-medium rounded-md hover:bg-white/60 transition-colors relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-violet-600/20 hover:after:bg-violet-600/30 data-[state=active]:after:bg-violet-600 font-inter"
            >
              Quick Insights
            </TabsTrigger>
            <TabsTrigger 
              value="chat" 
              className="data-[state=active]:bg-white data-[state=active]:text-violet-950 data-[state=active]:shadow-sm text-violet-950 text-[14px] font-medium rounded-md hover:bg-white/60 transition-colors relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-violet-600/20 hover:after:bg-violet-600/30 data-[state=active]:after:bg-violet-600 font-inter"
            >
              AI Gen. Analyst
            </TabsTrigger>
            {/* Second Row */}
            <TabsTrigger 
              value="advanced" 
              className="data-[state=active]:bg-white data-[state=active]:text-violet-950 data-[state=active]:shadow-sm text-violet-950 text-[14px] font-medium rounded-md hover:bg-white/60 transition-colors relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-violet-600/20 hover:after:bg-violet-600/30 data-[state=active]:after:bg-violet-600 font-inter"
            >
              AI Adv. Analyst
            </TabsTrigger>
            <TabsTrigger 
              value="logs" 
              className="data-[state=active]:bg-white data-[state=active]:text-violet-950 data-[state=active]:shadow-sm text-violet-950 text-[14px] font-medium rounded-md hover:bg-white/60 transition-colors relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-violet-600/20 hover:after:bg-violet-600/30 data-[state=active]:after:bg-violet-600 font-inter col-span-2"
            >
              Logs
            </TabsTrigger>
          </>
        ) : (
          <>
            <TabsTrigger 
              value="structure" 
              className="data-[state=active]:bg-white data-[state=active]:text-violet-950 data-[state=active]:shadow-sm text-violet-950 text-[15px] font-medium rounded-md hover:bg-white/60 transition-colors relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-violet-600/20 hover:after:bg-violet-600/30 data-[state=active]:after:bg-violet-600 font-inter"
            >
              AI Data Structure
            </TabsTrigger>
            <TabsTrigger 
              value="quick" 
              className="data-[state=active]:bg-white data-[state=active]:text-violet-950 data-[state=active]:shadow-sm text-violet-950 text-[15px] font-medium rounded-md hover:bg-white/60 transition-colors relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-violet-600/20 hover:after:bg-violet-600/30 data-[state=active]:after:bg-violet-600 font-inter"
            >
              AI Quick Insights
            </TabsTrigger>
            <TabsTrigger 
              value="chat" 
              className="data-[state=active]:bg-white data-[state=active]:text-violet-950 data-[state=active]:shadow-sm text-violet-950 text-[15px] font-medium rounded-md hover:bg-white/60 transition-colors relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-violet-600/20 hover:after:bg-violet-600/30 data-[state=active]:after:bg-violet-600 font-inter"
            >
              AI General Analyst
            </TabsTrigger>
            <TabsTrigger 
              value="advanced" 
              className="data-[state=active]:bg-white data-[state=active]:text-violet-950 data-[state=active]:shadow-sm text-violet-950 text-[15px] font-medium rounded-md hover:bg-white/60 transition-colors relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-violet-600/20 hover:after:bg-violet-600/30 data-[state=active]:after:bg-violet-600 font-inter"
            >
              AI Advanced Analyst
            </TabsTrigger>
            <TabsTrigger 
              value="logs" 
              className="data-[state=active]:bg-white data-[state=active]:text-violet-950 data-[state=active]:shadow-sm text-violet-950 text-[15px] font-medium rounded-md hover:bg-white/60 transition-colors relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-violet-600/20 hover:after:bg-violet-600/30 data-[state=active]:after:bg-violet-600 font-inter"
            >
              Logs
            </TabsTrigger>
          </>
        )}
      </TabsList>

      <TabsContent value="structure" className={`relative ${maximizedTab === 'structure' ? 'h-[calc(100vh-8rem)]' : 'h-[calc(100vh-12rem)]'}`}>
        <div className="flex justify-between items-center px-3 py-1 border-b bg-white">
          <Button
            onClick={onGeneratePdf}
            disabled={isPdfGenerating}
            variant="ghost"
            size="sm"
            className="text-blue-600 hover:text-blue-800 font-medium text-[14px] flex items-center gap-1 font-inter"
          >
            {isPdfGenerating ? (
              <>
                <span className="animate-spin">⏳</span>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <FileDown className="h-4 w-4" />
                <span>Generate PDF</span>
              </>
            )}
          </Button>
          <button
            onClick={() => toggleMaximize('structure')}
            className="text-gray-500 hover:text-gray-700 font-inter"
          >
            {maximizedTab === 'structure' ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
        <AnalysisDisplay 
          content={analysisContent}
          onGeneratePdf={onGeneratePdf}
          isPdfGenerating={isPdfGenerating}
          hideTopButtons={true}
        />
      </TabsContent>

      <TabsContent value="quick" className={`relative ${maximizedTab === 'quick' ? 'h-[calc(100vh-8rem)]' : 'h-[calc(100vh-12rem)]'}`}>
        <div className="flex justify-between items-center px-3 py-1 border-b bg-white">
          <Button
            onClick={onGenerateQuickPdf}
            disabled={isQuickPdfGenerating}
            variant="ghost"
            size="sm"
            className="text-blue-600 hover:text-blue-800 font-medium text-[14px] flex items-center gap-1 font-inter"
          >
            {isQuickPdfGenerating ? (
              <>
                <span className="animate-spin">⏳</span>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <FileDown className="h-4 w-4" />
                <span>Generate PDF</span>
              </>
            )}
          </Button>
          <button
            onClick={() => toggleMaximize('quick')}
            className="text-gray-500 hover:text-gray-700 font-inter"
          >
            {maximizedTab === 'quick' ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
        <QuickAnalysisDisplay
          content={quickAnalysisContent}
          onGeneratePdf={onGenerateQuickPdf}
          isPdfGenerating={isQuickPdfGenerating}
          hideTopButtons={true}
        />
      </TabsContent>

      <TabsContent 
        value="chat" 
        data-value="chat"
        className={`relative ${maximizedTab === 'chat' ? 'h-[calc(100vh-8rem)]' : 'h-[calc(100vh-12rem)]'}`}
      >
        <div className="flex justify-end items-center px-3 py-1 border-b bg-white">
          <button
            onClick={() => toggleMaximize('chat')}
            className="text-indigo-600 hover:text-indigo-800"
          >
            {maximizedTab === 'chat' ? (
              <Minimize2 className="h-5 w-5" />
            ) : (
              <Maximize2 className="h-5 w-5" />
            )}
          </button>
        </div>
        <ChatBox
          sessionId={sessionId}
          isExpanded={true}
          messages={sharedMessages}
          onMessageUpdate={setSharedMessages}
        />
      </TabsContent>

      <TabsContent 
        value="advanced" 
        data-value="advanced"
        className={`relative ${maximizedTab === 'advanced' ? 'h-[calc(100vh-8rem)]' : 'h-[calc(100vh-12rem)]'}`}
      >
        <div className="flex justify-end items-center px-3 py-1 border-b bg-white">
          <button
            onClick={() => toggleMaximize('advanced')}
            className="text-indigo-600 hover:text-indigo-800"
          >
            {maximizedTab === 'advanced' ? (
              <Minimize2 className="h-5 w-5" />
            ) : (
              <Maximize2 className="h-5 w-5" />
            )}
          </button>
        </div>
        <ChatBox
          sessionId={sessionId}
          isExpanded={true}
          messages={advancedMessages}
          onMessageUpdate={setAdvancedMessages}
          isAdvanced={true}
        />
      </TabsContent>

      <TabsContent 
        value="logs" 
        className={`relative ${maximizedTab === 'logs' ? 'h-[calc(100vh-8rem)]' : 'h-[calc(100vh-12rem)]'}`}
      >
        <LogDisplay
          logs={logs}
          isMaximized={maximizedTab === 'logs'}
          onToggleMaximize={() => toggleMaximize('logs')}
        />
      </TabsContent>
    </Tabs>
  )
} 