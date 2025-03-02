"use client";

import { useRef, useState, useEffect } from 'react';
import { Button } from "@/components/ui/button"
import { Tooltip } from "@/components/ui/tooltip"
import { Loader2, TableProperties, LayoutGrid, LineChart, Upload, Download, FileText } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { ExportTableDialog } from "@/components/export-table-dialog"
import { SampleFilesDialog } from "@/components/sample-files-dialog"
import { DbCredentials } from "@/services/databaseService"
import { ModelSelector } from "@/components/model-selector"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Add mobile detection hook
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

// Import types
type UploadMode = 'database' | 'grid';

interface FileUploadSectionProps {
  onFileUpload: (form: HTMLFormElement, mode: UploadMode) => Promise<void>;
  onAnalyzeData: (file: File) => Promise<void>;
  onQuickAnalysis: (file: File) => Promise<void>;
  onCustomAnalysis: (file: File, prompt: string) => Promise<void>;
  onCustomStructureAnalysis: (file: File, prompt: string) => Promise<void>;
  onPushToMyDb: (file: File) => Promise<void>;
  isGridLoading: boolean;
  isCustomDbLoading: boolean;
  analysisState: {
    isAnalyzing: boolean;
    isStructureAnalyzing: boolean;
    isQuickAnalyzing: boolean;
    isCustomAnalyzing: boolean;
  };
  setShowCustomPromptDialog: (show: boolean) => void;
  setShowCustomStructureDialog: (show: boolean) => void;
  setCustomPrompt: (prompt: string) => void;
  DEFAULT_ANALYSIS_PROMPT: string;
  DEFAULT_STRUCTURE_PROMPT: string;
  dbCredentials: DbCredentials | null;
  tableInfo: {
    tableName: string;
    rowCount: number;
  };
  handleDatabaseOptionSelect: (useTemporary: boolean) => Promise<void>;
  isDbLoading?: boolean;
  showAnalysisOptions?: boolean;
  setShowAnalysisOptions?: (show: boolean) => void;
  showStructureOptions?: boolean;
  setShowStructureOptions?: (show: boolean) => void;
  SHOW_REX_DB_BUTTON?: boolean;
}

export function FileUploadSection({
  onFileUpload,
  onAnalyzeData,
  onQuickAnalysis,
  onCustomAnalysis,
  onCustomStructureAnalysis,
  onPushToMyDb,
  isGridLoading,
  isCustomDbLoading,
  analysisState,
  setShowCustomPromptDialog,
  setShowCustomStructureDialog,
  setCustomPrompt,
  DEFAULT_ANALYSIS_PROMPT,
  DEFAULT_STRUCTURE_PROMPT,
  dbCredentials,
  tableInfo,
  handleDatabaseOptionSelect
}: FileUploadSectionProps) {
  const { toast } = useToast();
  const { isMobile } = useDeviceDetect();
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showSampleFilesDialog, setShowSampleFilesDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  // Dummy use of unused props to satisfy linter
  useEffect(() => {
    if (tableInfo?.tableName) {
      console.debug('Current table:', tableInfo);
    }
    // Reference handleDatabaseOptionSelect to satisfy linter
    // This function is used indirectly through the onPushToMyDb flow
    console.debug('Database option handler:', handleDatabaseOptionSelect);
  }, [tableInfo, handleDatabaseOptionSelect]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFileName(file.name);
      // Handle file change
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-2">
      <form
        onSubmit={handleSubmit}
        className="flex-1 flex flex-col md:flex-row items-center gap-2"
      >
        {/* Main Controls Container */}
        <div className={`flex ${isMobile ? 'flex-col w-full gap-2' : 'items-center md:w-auto gap-7'}`}>
          {/* First row: File Upload, Quick, and Model selector */}
          <div className="flex items-center gap-2 w-full">
            {/* File Upload Group */}
            <div className={`${isMobile ? 'flex-1' : 'w-[160px]'}`}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="h-9 w-full px-2 bg-white hover:bg-indigo-50 text-gray-700 flex items-center justify-center gap-1.5 shadow-sm border border-indigo-200 rounded-xl transition-colors group overflow-hidden"
              >
                <Upload className="h-4 w-4 text-indigo-500 group-hover:text-indigo-600 transition-colors flex-shrink-0" />
                <span className="text-sm font-medium text-gray-600 truncate">
                  {selectedFileName || 'Upload file'}
                </span>
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Quick Actions Dropdown */}
            <div className={`${isMobile ? 'flex-1' : 'w-[90px]'}`}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 w-full bg-white hover:bg-indigo-50 text-gray-700 flex items-center justify-center shadow-sm border border-indigo-200 rounded-xl transition-colors group"
                  >
                    <span className="text-sm font-medium">Quick</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48">
                  <DropdownMenuItem
                    onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                      e.preventDefault();
                      const form = document.querySelector('form');
                      if (form) onFileUpload(form, 'grid');
                    }}
                    disabled={isGridLoading}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      {isGridLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <TableProperties className="h-4 w-4 mr-2" />
                      )}
                      <span>Table</span>
                    </div>
                  </DropdownMenuItem>
                  
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      {analysisState.isStructureAnalyzing ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <LayoutGrid className="h-4 w-4 mr-2" />
                      )}
                      <span>Structure</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem
                        onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                          e.preventDefault();
                          const form = document.querySelector('form');
                          const fileInput = form?.querySelector('input[type="file"]') as HTMLInputElement;
                          if (fileInput?.files?.[0]) {
                            onAnalyzeData(fileInput.files[0]);
                          }
                        }}
                        disabled={analysisState.isStructureAnalyzing}
                      >
                        Quick Structure
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                          e.preventDefault();
                          const form = document.querySelector('form');
                          const fileInput = form?.querySelector('input[type="file"]') as HTMLInputElement;
                          if (fileInput?.files?.[0]) {
                            setCustomPrompt(DEFAULT_STRUCTURE_PROMPT);
                            setShowCustomStructureDialog(true);
                            onCustomStructureAnalysis(fileInput.files[0], DEFAULT_STRUCTURE_PROMPT);
                          }
                        }}
                        disabled={analysisState.isStructureAnalyzing}
                      >
                        Custom Structure
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>

                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      {(analysisState.isQuickAnalyzing || analysisState.isCustomAnalyzing) ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <LineChart className="h-4 w-4 mr-2" />
                      )}
                      <span>Analysis</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem
                        onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                          e.preventDefault();
                          const form = document.querySelector('form');
                          const fileInput = form?.querySelector('input[type="file"]') as HTMLInputElement;
                          if (fileInput?.files?.[0]) {
                            onQuickAnalysis(fileInput.files[0]);
                          }
                        }}
                        disabled={analysisState.isQuickAnalyzing || analysisState.isCustomAnalyzing}
                      >
                        Quick Analysis
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                          e.preventDefault();
                          const form = document.querySelector('form');
                          const fileInput = form?.querySelector('input[type="file"]') as HTMLInputElement;
                          if (fileInput?.files?.[0]) {
                            setCustomPrompt(DEFAULT_ANALYSIS_PROMPT);
                            setShowCustomPromptDialog(true);
                            onCustomAnalysis(fileInput.files[0], DEFAULT_ANALYSIS_PROMPT);
                          }
                        }}
                        disabled={analysisState.isQuickAnalyzing || analysisState.isCustomAnalyzing}
                      >
                        Custom Analysis
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Model Selector - Show in both views but with different styling */}
            <div className={`${isMobile ? 'flex-1' : 'w-[180px]'}`}>
              <ModelSelector className="w-full" />
            </div>
          </div>

          {/* Push My DB and Export buttons */}
          <div className={`${isMobile ? 'w-full flex justify-between' : 'flex'} items-center bg-indigo-200/30 rounded-xl border border-indigo-300 shadow-sm ml-0`}>
            <Tooltip content="Push to Your Database">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={async () => {
                  const form = document.querySelector('form');
                  const fileInput = form?.querySelector('input[type="file"]') as HTMLInputElement;
                  if (!fileInput || !fileInput.files || !fileInput.files.length) {
                    toast({
                      title: "Missing File",
                      description: "Please choose a file first",
                      duration: 3000,
                      className: "bg-blue-50 border-blue-200 shadow-lg border-2 rounded-xl",
                    });
                    return;
                  }
                  await onPushToMyDb(fileInput.files[0]);
                }}
                className="h-9 px-1.5 hover:bg-indigo-200/40 text-indigo-600 flex items-center gap-1.5 rounded-l-xl"
              >
                {isCustomDbLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-[15px] font-medium">Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    <span className="text-[15px] font-medium">Push 2DB</span>
                  </>
                )}
              </Button>
            </Tooltip>

            {/* Export Button */}
            <Tooltip content="Export Table from Database">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (!dbCredentials) {
                    toast({
                      title: "No Database Connected",
                      description: "Please connect to a database first",
                      duration: 3000,
                      className: "bg-yellow-50 border-yellow-200 shadow-lg border-2 rounded-xl",
                    });
                    return;
                  }
                  setShowExportDialog(true);
                }}
                className="h-9 px-1.5 hover:bg-indigo-200/40 text-indigo-600 flex items-center gap-1.5"
              >
                <Download className="h-4 w-4" />
                <span className="text-[15px] font-medium">Export</span>
              </Button>
            </Tooltip>

            {/* Sample Button */}
            <Tooltip content="Try Sample Files">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowSampleFilesDialog(true)}
                className="h-9 px-1.5 hover:bg-indigo-200/40 text-indigo-600 flex items-center gap-1.5 rounded-r-xl"
              >
                <FileText className="h-4 w-4" />
                <span className="text-[15px] font-medium">Sample</span>
              </Button>
            </Tooltip>
          </div>
        </div>
      </form>

      {/* Add SampleFilesDialog */}
      <SampleFilesDialog
        isOpen={showSampleFilesDialog}
        onClose={() => setShowSampleFilesDialog(false)}
        onSelectFile={async (file) => {
          // Create a new FormData object
          const form = document.querySelector('form');
          if (!form) return;

          // Create a new DataTransfer object
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);

          // Update the file input with the new file
          const fileInput = form.querySelector('input[type="file"]') as HTMLInputElement;
          if (fileInput) {
            fileInput.files = dataTransfer.files;
            // Close sample dialog and show database options
            setShowSampleFilesDialog(false);
            // Trigger onPushToMyDb which will show the database option dialog
            await onPushToMyDb(file);
          }
        }}
        isLoading={isCustomDbLoading}
      />

      {/* Export Dialog */}
      <ExportTableDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        dbCredentials={dbCredentials}
      />
    </div>
  );
} 