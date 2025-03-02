import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { X, Check, ChevronDown } from "lucide-react";
import { endpointStore, type FlowiseEndpoint } from '@/stores/endpointStore';
import { GENERAL_ANALYST_NOTE } from '@/config/endpoints';

// Define which IDs go in which row
const FIRST_ROW_IDS = [1, 4, 3];
const SECOND_ROW_IDS = [6, 2, 5];

interface ModelSelectorProps {
  className?: string;
}

export function ModelSelector({ className = '' }: ModelSelectorProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState<FlowiseEndpoint>(endpointStore.currentEndpoint);
  const [tempSelectedEndpoint, setTempSelectedEndpoint] = useState<FlowiseEndpoint>(endpointStore.currentEndpoint);

  // Add effect to sync with store's current endpoint
  useEffect(() => {
    const handleEndpointChange = (event: CustomEvent) => {
      setSelectedEndpoint(event.detail.endpoint);
      setTempSelectedEndpoint(event.detail.endpoint);
    };

    // Initial sync with store
    const currentStoreEndpoint = endpointStore.currentEndpoint;
    if (currentStoreEndpoint.id !== selectedEndpoint.id) {
      setSelectedEndpoint(currentStoreEndpoint);
      setTempSelectedEndpoint(currentStoreEndpoint);
    }

    window.addEventListener('endpointChanged', handleEndpointChange as EventListener);
    return () => window.removeEventListener('endpointChanged', handleEndpointChange as EventListener);
  }, [selectedEndpoint.id]);

  // Add escape key handler
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showDialog) {
        handleCancel();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showDialog]);

  const handleModelSelect = (endpoint: FlowiseEndpoint) => {
    setTempSelectedEndpoint(endpoint);
  };

  const handleConfirm = () => {
    endpointStore.setEndpoint(tempSelectedEndpoint.id);
    setSelectedEndpoint(tempSelectedEndpoint);
    setShowDialog(false);
  };

  const handleCancel = () => {
    setTempSelectedEndpoint(selectedEndpoint);
    setShowDialog(false);
  };

  return (
    <div className={className}>
      {/* Model Selection Button */}
      <div className="flex items-center">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowDialog(true)}
          className="h-9 w-[200px] px-3 bg-white hover:bg-indigo-50 text-gray-700 flex items-center justify-between gap-1.5 shadow-sm border border-indigo-200 rounded-xl transition-colors group"
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-sm font-medium truncate">
              {selectedEndpoint.name}
            </span>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0 ml-2">
            <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded whitespace-nowrap">
              Model
            </span>
            <ChevronDown className="h-4 w-4 text-gray-400 group-hover:text-gray-500" />
          </div>
        </Button>
      </div>

      {/* Model Selection Dialog */}
      {showDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-4 md:p-6 w-full max-w-[900px] mx-2 md:mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 truncate flex-1 mr-4">Choose Advanced Analyst Agent Framework</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="hover:bg-indigo-50 rounded-full h-8 w-8 p-0 flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-6 mb-6">
              {/* Row 1: First row endpoints */}
              <div className="grid grid-cols-3 gap-3">
                {endpointStore.getAllEndpoints()
                  .filter(endpoint => FIRST_ROW_IDS.includes(endpoint.id))
                  .map((endpoint) => (
                    <div
                      key={endpoint.id}
                      onClick={() => handleModelSelect(endpoint)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                        tempSelectedEndpoint.id === endpoint.id
                          ? 'bg-indigo-50 border-indigo-200 shadow-sm'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 flex-1 mr-2">
                          <h4 className="font-medium text-gray-900 md:truncate text-sm break-words">{endpoint.name}</h4>
                        </div>
                        {tempSelectedEndpoint.id === endpoint.id && (
                          <div className="hidden md:flex items-center gap-1 text-indigo-600 flex-shrink-0">
                            <Check className="h-4 w-4" />
                            <span className="text-xs font-medium whitespace-nowrap">Selected</span>
                          </div>
                        )}
                      </div>
                      <div className="mb-1">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full md:whitespace-nowrap break-words inline-block ${
                          (() => {
                            switch(endpoint.type) {
                              case 'excellent Perf. - Lowest Cost':
                                return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
                              case 'testing':
                                return 'bg-amber-50 text-amber-700 border border-amber-200';
                              case 'Best Performance - High Cost':
                                return 'bg-purple-100 text-purple-700 border border-purple-200';
                              default:
                                return 'bg-blue-50 text-blue-700 border border-blue-200';
                            }
                          })()
                        }`}>
                          {endpoint.type.charAt(0).toUpperCase() + endpoint.type.slice(1)}
                        </span>
                      </div>
                      <p className="hidden md:block text-sm text-gray-600 line-clamp-2">{endpoint.description}</p>
                    </div>
                  ))}
              </div>

              {/* Row 2: Second row endpoints */}
              <div className="grid grid-cols-3 gap-3">
                {SECOND_ROW_IDS.map((id) => {
                  const endpoint = endpointStore.getAllEndpoints().find(e => e.id === id);
                  if (!endpoint) return null;
                  return (
                    <div
                      key={endpoint.id}
                      onClick={() => handleModelSelect(endpoint)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                        tempSelectedEndpoint.id === endpoint.id
                          ? 'bg-indigo-50 border-indigo-200 shadow-sm'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 flex-1 mr-2">
                          <h4 className="font-medium text-gray-900 md:truncate text-sm break-words">{endpoint.name}</h4>
                        </div>
                        {tempSelectedEndpoint.id === endpoint.id && (
                          <div className="hidden md:flex items-center gap-1 text-indigo-600 flex-shrink-0">
                            <Check className="h-4 w-4" />
                            <span className="text-xs font-medium whitespace-nowrap">Selected</span>
                          </div>
                        )}
                      </div>
                      <div className="mb-1">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full md:whitespace-nowrap break-words inline-block ${
                          (() => {
                            switch(endpoint.type) {
                              case 'excellent Perf. - Lowest Cost':
                                return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
                              case 'testing':
                                return 'bg-amber-50 text-amber-700 border border-amber-200';
                              case 'Best Performance - High Cost':
                                return 'bg-purple-100 text-purple-700 border border-purple-200';
                              default:
                                return 'bg-blue-50 text-blue-700 border border-blue-200';
                            }
                          })()
                        }`}>
                          {endpoint.type.charAt(0).toUpperCase() + endpoint.type.slice(1)}
                        </span>
                      </div>
                      <p className="hidden md:block text-sm text-gray-600 line-clamp-2">{endpoint.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-4 italic">
              {GENERAL_ANALYST_NOTE}
            </p>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
              <Button
                variant="outline"
                onClick={handleCancel}
                className="px-4 py-2 border-indigo-200 text-gray-700 hover:bg-indigo-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 flex items-center gap-2"
              >
                <Check className="h-4 w-4" />
                Confirm Selection
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 