import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Loader2, FileText, X, Check, Sparkles } from "lucide-react"
import { getSampleFiles, getSampleFile, type SampleFile } from "@/services/sampleFilesService"
import { useToast } from "@/components/ui/use-toast"
import { Tooltip } from "@/components/ui/tooltip"

interface SampleFilesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFile: (file: File) => Promise<void>;
  isLoading?: boolean;
}

export function SampleFilesDialog({
  isOpen,
  onClose,
  onSelectFile,
  isLoading = false
}: SampleFilesDialogProps) {
  const { toast } = useToast();
  const [sampleFiles, setSampleFiles] = useState<SampleFile[]>([]);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);

  useEffect(() => {
    async function loadSampleFiles() {
      try {
        const files = await getSampleFiles();
        setSampleFiles(files);
      } catch (error) {
        console.error('Error loading sample files:', error);
        toast({
          title: "Error Loading Files",
          description: "Could not load sample files. Please try again later.",
          duration: 3000,
          className: "bg-red-50 border-red-200 shadow-lg border-2 rounded-xl",
        });
      }
    }

    if (isOpen) {
      loadSampleFiles();
    }
  }, [isOpen, toast]);

  const handleCopyPrompt = async (prompt: string, fileName: string) => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopiedPrompt(fileName);
      toast({
        title: "Prompt Copied!",
        description: "Analysis prompt has been copied to clipboard",
        duration: 2000,
        className: "bg-blue-50 border-blue-200 shadow-lg border-2 rounded-xl",
      });
      setTimeout(() => setCopiedPrompt(null), 2000);
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy prompt to clipboard",
        duration: 3000,
        className: "bg-red-50 border-red-200 shadow-lg border-2 rounded-xl",
      });
    }
  };

  const handleFileSelection = async () => {
    if (!selectedFileName) return;

    setIsLoadingFile(true);
    try {
      const file = await getSampleFile(selectedFileName);
      await onSelectFile(file);
      onClose();
    } catch (error) {
      console.error('Error loading sample file:', error);
      toast({
        title: "Error Loading File",
        description: "Could not load the selected file. Please try again.",
        duration: 3000,
        className: "bg-red-50 border-red-200 shadow-lg border-2 rounded-xl",
      });
    } finally {
      setIsLoadingFile(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-4 md:p-6 w-full max-w-2xl mx-4 shadow-xl">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 flex-1 mr-4">Choose Sample Dataset</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="hover:bg-indigo-50 rounded-full h-8 w-8 p-0 flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* File List with Enhanced Styling */}
        <div className="mb-6">
          <div className="space-y-3">
            {sampleFiles.map((file) => (
              <div
                key={file.name}
                className={`p-4 rounded-xl cursor-pointer border transition-all duration-200 ${
                  selectedFileName === file.name
                    ? 'border-indigo-200 bg-indigo-50 shadow-sm'
                    : 'border-gray-200 hover:border-indigo-200 hover:bg-indigo-50/50'
                }`}
                onClick={() => setSelectedFileName(file.name)}
              >
                {/* File Header */}
                <div className="flex items-center mb-2">
                  <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                    <FileText className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{file.name}</div>
                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                      <span className="bg-gray-100 px-2 py-0.5 rounded-full">Size: {file.size}</span>
                      <span className="bg-gray-100 px-2 py-0.5 rounded-full">Rows: {file.rowCount.toLocaleString()}</span>
                      <span className="bg-gray-100 px-2 py-0.5 rounded-full">Columns: {file.columnCount}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Copy Prompt Button */}
                    {file.analysisPrompt && (
                      <Tooltip content="Copy Analysis Prompt">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (file.analysisPrompt) {
                              handleCopyPrompt(file.analysisPrompt, file.name);
                            }
                          }}
                          className="h-8 px-2 hover:bg-indigo-100 text-indigo-600 flex items-center gap-1.5 rounded-lg border border-indigo-200"
                        >
                          {copiedPrompt === file.name ? (
                            <>
                              <Check className="h-4 w-4" />
                              <span className="text-xs font-medium">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4" />
                              <span className="text-xs font-medium">Copy Prompt</span>
                            </>
                          )}
                        </Button>
                      </Tooltip>
                    )}
                    {/* Selected Indicator */}
                    {selectedFileName === file.name && (
                      <div className="flex items-center gap-1 text-indigo-600 flex-shrink-0">
                        <Check className="h-4 w-4" />
                        <span className="text-xs font-medium whitespace-nowrap">Selected</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Description with Enhanced Style */}
                <div className="mt-2 text-sm text-gray-600 bg-white/80 p-3 rounded-lg border border-gray-100">
                  {file.description}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons with Enhanced Style */}
        <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading || isLoadingFile}
            className="px-4 py-2 border-indigo-200 text-gray-700 hover:bg-indigo-50"
          >
            Cancel
          </Button>
          <Button
            onClick={handleFileSelection}
            disabled={isLoading || isLoadingFile || !selectedFileName}
            className={`px-4 py-2 flex items-center gap-2 font-medium ${
              isLoading || isLoadingFile || !selectedFileName
                ? 'bg-gray-400 hover:bg-gray-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow-md'
            } text-white transition-all duration-200`}
          >
            {isLoading || isLoadingFile ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                <span>Select Dataset</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
} 