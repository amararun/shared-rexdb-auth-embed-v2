import { Button } from "@/components/ui/button"
import { X, Terminal, ArrowRight } from "lucide-react"
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { useEffect } from 'react';

interface AgentReasoningModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentReasoning: any[];
}

export function AgentReasoningModal({
  isOpen,
  onClose,
  agentReasoning
}: AgentReasoningModalProps) {
  if (!isOpen) return null;

  // Add escape key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Validate agentReasoning data
  if (!Array.isArray(agentReasoning) || agentReasoning.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-4 md:p-6 w-full max-w-4xl mx-2 md:mx-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-indigo-600">No Reasoning Data Available</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="hover:bg-indigo-50 rounded-full h-8 w-8 p-0"
            >
              <X className="h-4 w-4 text-indigo-600" />
            </Button>
          </div>
          <p className="text-gray-600">No agent reasoning data is available for this response.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gradient-to-b from-white to-indigo-50/30 rounded-xl p-4 md:p-6 w-full max-w-4xl mx-2 md:mx-4 max-h-[85vh] md:max-h-[90vh] overflow-y-auto relative shadow-2xl border border-indigo-100">
        <div className="flex justify-between items-center mb-6 pb-3 border-b border-indigo-100">
          <div>
            <h3 className="text-xl font-semibold bg-gradient-to-r from-indigo-600 to-indigo-800 bg-clip-text text-transparent font-inter">
              Agent Reasoning
            </h3>
            <p className="text-sm text-indigo-400 mt-1 font-inter">Step-by-step analysis process</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="hover:bg-indigo-50 rounded-full h-8 w-8 p-0 transition-colors duration-200"
          >
            <X className="h-4 w-4 text-indigo-600" />
          </Button>
        </div>

        <div className="space-y-6">
          {agentReasoning.map((agent, index) => (
            <div key={index} className="border border-indigo-100 rounded-xl p-5 bg-white/80 shadow-sm hover:shadow-md transition-all duration-200 hover:bg-white">
              {/* Agent Header */}
              <div className="flex items-center gap-3 font-medium text-base mb-4 pb-3 border-b border-indigo-100">
                <div className="bg-gradient-to-r from-indigo-600 to-indigo-400 w-1.5 h-6 rounded-full"></div>
                <div>
                  <div className="text-indigo-700 font-semibold font-inter">{agent?.agentName || 'Agent'}</div>
                  <div className="text-sm text-indigo-500 flex items-center gap-1.5 font-inter">
                    <Terminal className="h-3.5 w-3.5" />
                    {agent?.nodeName || 'Process'}
                  </div>
                </div>
              </div>
              
              {/* Agent Messages */}
              {agent?.messages && Array.isArray(agent.messages) && agent.messages.map((message: string, msgIndex: number) => {
                const cleanMessage = typeof message === 'string' 
                  ? message
                      .replace(/\\n/g, '\n')
                      .replace(/\\"/g, '"')
                      .replace(/^### /gm, '### ')
                      .replace(/^\- /gm, '- ')
                  : JSON.stringify(message);
                
                return (
                  <div key={msgIndex} className="prose prose-sm max-w-none mb-4">
                    <div className="text-indigo-900">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw]}
                        components={{
                          h3: ({children}) => (
                            <h3 className="text-lg font-semibold text-indigo-900 mt-4 mb-2 font-inter">
                              {children}
                            </h3>
                          ),
                          p: ({children}) => (
                            <p className="text-[15px] text-indigo-900 mb-3 whitespace-pre-line font-inter">
                              {children}
                            </p>
                          ),
                          ul: ({children}) => (
                            <ul className="list-disc pl-6 mb-3 space-y-1 font-inter">
                              {children}
                            </ul>
                          ),
                          ol: ({children}) => (
                            <ol className="list-decimal pl-6 mb-3 space-y-1 font-inter">
                              {children}
                            </ol>
                          ),
                          li: ({children}) => (
                            <li className="text-indigo-800 font-inter">
                              {children}
                            </li>
                          )
                        }}
                      >
                        {cleanMessage}
                      </ReactMarkdown>
                    </div>
                  </div>
                );
              })}

              {/* Tools Section */}
              {agent?.usedTools && Array.isArray(agent.usedTools) && agent.usedTools.map((tool: any, toolIndex: number) => {
                if (!tool || typeof tool !== 'object') return null;
                
                return (
                  <div key={toolIndex} className="mb-4 bg-gradient-to-b from-white to-indigo-50/40 rounded-xl p-4 border border-indigo-100 shadow-sm">
                    <div className="flex items-center gap-2 text-base font-medium text-indigo-700 mb-3 pb-2 border-b border-indigo-100">
                      <div className="bg-indigo-100 p-1.5 rounded-lg">
                        <div className="w-3.5 h-3.5 bg-gradient-to-tr from-indigo-600 to-indigo-400 rounded-md"></div>
                      </div>
                      Tool: {tool.tool || 'Unknown Tool'}
                    </div>
                    
                    {/* Tool Input */}
                    {tool.toolInput && (
                      <div className="mb-4">
                        <div className="flex items-center gap-1.5 font-medium text-sm text-indigo-600 mb-2">
                          <ArrowRight className="h-3.5 w-3.5" />
                          Input Parameters
                        </div>
                        <pre className="bg-indigo-50 p-3 rounded-lg overflow-x-auto border border-indigo-100">
                          <code className="text-indigo-700 whitespace-pre-wrap font-mono text-[14px]">
                            {typeof tool.toolInput === 'string' 
                              ? tool.toolInput 
                              : JSON.stringify(tool.toolInput, null, 2)}
                          </code>
                        </pre>
                      </div>
                    )}
                    
                    {/* Tool Output */}
                    {tool.toolOutput && (
                      <div>
                        <div className="flex items-center gap-1.5 font-medium text-sm text-indigo-600 mb-2">
                          <ArrowRight className="h-3.5 w-3.5" />
                          Execution Result
                        </div>
                        <div className="bg-indigo-50/50 rounded-lg p-4 border border-indigo-100">
                          <div className="prose prose-indigo max-w-none">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              rehypePlugins={[rehypeRaw]}
                              components={{
                                h3: ({children}) => {
                                  const text = String(children).replace(/^###\s*/, '');
                                  return (
                                    <h3 className="text-lg font-semibold text-indigo-900 mt-4 mb-2 font-inter">
                                      {text}
                                    </h3>
                                  );
                                },
                                p: ({children}) => (
                                  <p className="text-[15px] text-indigo-900 mb-3 whitespace-pre-line font-inter">
                                    {children}
                                  </p>
                                ),
                                ul: ({children}) => (
                                  <ul className="list-disc pl-6 mb-3 space-y-1 font-inter">
                                    {children}
                                  </ul>
                                ),
                                ol: ({children}) => (
                                  <ol className="list-decimal pl-6 mb-3 space-y-1 font-inter">
                                    {children}
                                  </ol>
                                ),
                                li: ({children}) => {
                                  const text = String(children).replace(/^-\s*/, '');
                                  return (
                                    <li className="text-indigo-800 font-inter">
                                      {text}
                                    </li>
                                  );
                                }
                              }}
                            >
                              {typeof tool.toolOutput === 'string'
                                ? tool.toolOutput
                                    .replace(/\\n/g, '\n')
                                    .replace(/\\"/g, '"')
                                    .replace(/^###/gm, '### ')
                                    .replace(/^- /gm, '* ')
                                    .trim()
                                : JSON.stringify(tool.toolOutput, null, 2)}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 