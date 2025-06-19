import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, Send, Square, Settings, Bot, Plus, X, MessageSquare, LogOut, User } from 'lucide-react';
import { ChatMessage } from './components/ChatMessage';
import { Sidebar } from './components/Sidebar';
import { Message, ChatState, OpenRouteConfig } from './types';
import { HomeContent } from './components/HomeContent';
import { ApiSetupPage } from './components/ApiSetupPage';
import { ThemeToggle } from './components/ThemeToggle';
import { SettingsModal } from './components/SettingsModal';
import { ProfileModal } from './components/ProfileModal';
import { getOpenRouteHeaders, fetchOpenRouterModels, calculateSmartMaxTokens, testSmartTokenCalculation } from './utils/api';
import LoginPage from './components/LoginPage';
import { supabase } from './utils/supabase';

interface ConversationData {
  id: string;
  preview: string;
  messages: Message[];
}

type AppView = 'setup' | 'chat';

function App() {
  const [currentView, setCurrentView] = useState<AppView>('setup');
  const [conversations, setConversations] = useState<ConversationData[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [openRouteConfig, setOpenRouteConfig] = useState<OpenRouteConfig | null>(() => {
    const saved = localStorage.getItem('openRouteConfig');
    return saved ? JSON.parse(saved) : null;
  });
  const [modelConfigs, setModelConfigs] = useState<Record<string, OpenRouteConfig>>(() => {
    const saved = localStorage.getItem('modelConfigs');
    return saved ? JSON.parse(saved) : {};
  });
  const [models, setModels] = useState<any[]>([]);
  const [tokenUsage, setTokenUsage] = useState<{ prompt: number; completion: number; total: number }>({ prompt: 0, completion: 0, total: 0 });
  const [showSettingsMessage, setShowSettingsMessage] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [originalModel, setOriginalModel] = useState<string | null>(null);
  const [isAddingNewModel, setIsAddingNewModel] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showModelDetails, setShowModelDetails] = useState(false);
  const [selectedModelForDetails, setSelectedModelForDetails] = useState<OpenRouteConfig | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAwaitingResponse, setIsAwaitingResponse] = useState(false);

  // Set initial view based on configuration
  useEffect(() => {
    if (openRouteConfig) {
      setCurrentView('chat');
    } else {
      setCurrentView('setup');
    }
  }, [openRouteConfig]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (openRouteConfig) {
      localStorage.setItem('openRouteConfig', JSON.stringify(openRouteConfig));
      // Save to model configs
      const updatedConfigs = { ...modelConfigs, [openRouteConfig.model]: openRouteConfig };
      setModelConfigs(updatedConfigs);
      localStorage.setItem('modelConfigs', JSON.stringify(updatedConfigs));
    } else {
      localStorage.removeItem('openRouteConfig');
    }
  }, [openRouteConfig, modelConfigs]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      setShouldAutoScroll(true);
    }
  };

  useEffect(() => {
    if (isLoading && shouldAutoScroll) {
      scrollToBottom();
    }
  }, [conversations, isLoading, shouldAutoScroll]);

  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
      const shouldShowButton = !isAtBottom && scrollHeight > clientHeight;
      
      setShouldAutoScroll(isAtBottom);
      setShowScrollButton(shouldShowButton);
    }
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleConfigureOpenRoute = (config: OpenRouteConfig) => {
    setOpenRouteConfig(config);
    setCurrentView('chat');
    setModelConfigs(prev => ({ ...prev, [config.model]: config }));
    const modelName = models.find(m => m.value === config.model)?.label || config.model;
    showToast(`✅ Connected to ${modelName}`);
  };

  const handleBackToSetup = () => {
    setCurrentView('setup');
  };

  const handleBackToChat = () => {
    setCurrentView('chat');
  };

  const handleNewChat = () => {
    const newId = Date.now().toString();
    const newConversation: ConversationData = {
      id: newId,
      preview: 'New conversation',
      messages: []
    };
    setConversations(prev => [newConversation, ...prev]);
    setActiveConversation(newId);
  };

  const handleDeleteChat = (id: string) => {
    setConversations(prev => prev.filter(conv => conv.id !== id));
    if (activeConversation === id) {
      setActiveConversation(null);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all chat history? This action cannot be undone.')) {
      setConversations([]);
      setActiveConversation(null);
    }
  };

  const getCurrentMessages = () => {
    if (!activeConversation) return [];
    const conversation = conversations.find(conv => conv.id === activeConversation);
    return conversation?.messages || [];
  };

  const handleStopGeneration = () => {
    if (abortController) {
      abortController.abort();
      setIsLoading(false);
      setAbortController(null);
    }
  };

  const updateConversationContent = (conversationId: string, messageId: string, chunk: string) => {
    setConversations(prev => {
      const newConversations = prev.map(conv => {
        if (conv.id !== conversationId) return conv;
        
        return {
          ...conv,
          messages: conv.messages.map(msg => {
            if (msg.id !== messageId) return msg;
            return { ...msg, content: msg.content + chunk };
          })
        };
      });
      return newConversations;
    });
    setIsAwaitingResponse(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !openRouteConfig) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      timestamp: Date.now()
    };

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: '',
      role: 'assistant',
      timestamp: Date.now() + 1
    };

    let currentConversationId = activeConversation;
    
    if (!currentConversationId) {
      currentConversationId = Date.now().toString();
      const newConversation: ConversationData = {
        id: currentConversationId,
        preview: input.slice(0, 30) + (input.length > 30 ? '...' : ''),
        messages: [userMessage, assistantMessage]
      };
      setConversations(prev => [newConversation, ...prev]);
      setActiveConversation(currentConversationId);
    } else {
      setConversations(prev =>
        prev.map(conv =>
          conv.id === currentConversationId
            ? {
                ...conv,
                preview: input.slice(0, 30) + (input.length > 30 ? '...' : ''),
                messages: [...conv.messages, userMessage, assistantMessage]
              }
            : conv
        )
      );
    }

    setInput('');
    setIsLoading(true);
    setShouldAutoScroll(true);
    setIsAwaitingResponse(true);

    const controller = new AbortController();
    setAbortController(controller);

    try {
      // Get conversation history for context
      const conversation = conversations.find(conv => conv.id === currentConversationId);
      const messages = conversation?.messages || [];
      
      // Prepare messages for OpenRoute API - only include user messages and the new input
      const apiMessages = messages
        .filter(msg => msg.role === 'user') // Only include user messages
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));

      // Add the new user message
      apiMessages.push({
        role: 'user',
        content: input
      });

      const headers = getOpenRouteHeaders(openRouteConfig);

      console.log('Sending to OpenRouter:', {
        model: openRouteConfig.model,
        messages: apiMessages,
        headers: { ...headers, 'Authorization': 'Bearer ***' } // Hide API key in logs
      });

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: openRouteConfig.model,
          messages: apiMessages,
          stream: true,
          max_tokens: openRouteConfig.maxTokens || getSmartMaxTokens() // Use smart calculation or configured value
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenRouter API error:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              setIsLoading(false);
              setAbortController(null);
              continue;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta && parsed.choices[0].delta.content) {
                const chunk = parsed.choices[0].delta.content;
                setConversations(prev =>
                  prev.map(conv =>
                    conv.id === currentConversationId
                      ? {
                          ...conv,
                          messages: conv.messages.map(msg =>
                            msg.id === assistantMessage.id
                              ? { ...msg, content: msg.content + chunk }
                              : msg
                          )
                        }
                      : conv
                  )
                );
              }
            } catch (e) {
              console.error('Failed to parse chunk:', e);
            }
          }
        }
      }

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Request aborted');
      } else {
        console.error('Error:', error);
        let errorMessage = 'Error: Failed to get response from OpenRoute API. Please check your API key and try again.';
        
        if (error.message.includes('401')) {
          errorMessage = 'Error: Invalid API key. Please check your OpenRoute API key.';
        } else if (error.message.includes('402')) {
          errorMessage = 'Error: Insufficient credits. Please add more credits to your OpenRouter account or reduce the max_tokens limit.';
        } else if (error.message.includes('429')) {
          errorMessage = 'Error: Rate limit exceeded. Please try again later.';
        } else if (error.message.includes('400')) {
          errorMessage = 'Error: Invalid request. Please check your model selection.';
        } else if (error.message.includes('HTTP error')) {
          errorMessage = `Error: ${error.message}`;
        }
        
        setConversations(prev =>
          prev.map(conv =>
            conv.id === currentConversationId
              ? {
                  ...conv,
                  messages: conv.messages.map(msg =>
                    msg.id === assistantMessage.id
                      ? { ...msg, content: errorMessage }
                      : msg
                  )
                }
              : conv
          )
        );
      }
      setIsLoading(false);
      setAbortController(null);
    }
    setIsAwaitingResponse(false);
  };

  // Load models on component mount
  useEffect(() => {
    fetchOpenRouterModels()
      .then(setModels)
      .catch(console.error);
    
    // Test smart token calculation in development
    if (import.meta.env.DEV) {
      testSmartTokenCalculation();
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + , to open settings
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        if (openRouteConfig) {
          setShowSettings(true);
          setShowSettingsMessage(true);
          setTimeout(() => setShowSettingsMessage(false), 2000);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [openRouteConfig]);

  // Click outside to close model dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
        setShowModelDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calculate smart max tokens for the selected model
  const getSmartMaxTokens = () => {
    if (!openRouteConfig?.model || !models.length) return 4000;
    const selectedModel = models.find(m => m.value === openRouteConfig.model);
    return selectedModel ? calculateSmartMaxTokens(selectedModel) : 4000;
  };

  // Calculate estimated cost for current usage
  const getEstimatedCost = () => {
    if (!openRouteConfig?.model || !models.length) return 0;
    const selectedModel = models.find(m => m.value === openRouteConfig.model);
    if (!selectedModel) return 0;
    
    const promptCost = (tokenUsage.prompt / 1000) * parseFloat(selectedModel.pricing?.prompt || '0');
    const completionCost = (tokenUsage.completion / 1000) * parseFloat(selectedModel.pricing?.completion || '0');
    return promptCost + completionCost;
  };

  // Get user-friendly model name
  const getModelDisplayName = () => {
    if (!openRouteConfig?.model || !models.length) return '';
    const selectedModel = models.find(m => m.value === openRouteConfig.model);
    return selectedModel?.label || openRouteConfig.model;
  };

  const getModelIcon = () => {
    if (!openRouteConfig?.model) return <Bot className="w-5 h-5" />;
    
    const modelName = openRouteConfig.model.toLowerCase();
    
    if (modelName.includes('gemini')) return <Bot className="w-5 h-5 text-yellow-500" />;
    if (modelName.includes('claude')) return <Bot className="w-5 h-5 text-orange-500" />;
    if (modelName.includes('gpt')) return <Bot className="w-5 h-5 text-green-500" />;
    if (modelName.includes('llama')) return <Bot className="w-5 h-5 text-purple-500" />;
    if (modelName.includes('mistral')) return <Bot className="w-5 h-5 text-blue-500" />;
    if (modelName.includes('meta')) return <Bot className="w-5 h-5 text-blue-600" />;
    if (modelName.includes('anthropic')) return <Bot className="w-5 h-5 text-orange-500" />;
    if (modelName.includes('deepseek')) return <Bot className="w-5 h-5 text-indigo-500" />;
    if (modelName.includes('qwen')) return <Bot className="w-5 h-5 text-red-500" />;
    if (modelName.includes('yi')) return <Bot className="w-5 h-5 text-emerald-500" />;
    
    return <Bot className="w-5 h-5" />;
  };

  const handleConfigSave = (config: OpenRouteConfig) => {
    handleConfigureOpenRoute(config);
    setShowSettings(false);
    setIsAddingNewModel(false);
    setOriginalModel(null);
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    showToast('Logged out successfully');
  };

  useEffect(() => {
    // Check for existing session
    const session = supabase.auth.getSession();
    session.then(({ data }) => {
      if (data.session?.user) {
        setUser(data.session.user);
      }
      setAuthLoading(false);
    });
    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  if (!user) {
    return <LoginPage onLogin={setUser} />;
  }

  return (
    <>
      {currentView === 'setup' ? (
        <ApiSetupPage
          onConfigureOpenRoute={handleConfigureOpenRoute}
          onBackToChat={handleBackToChat}
          isConfigured={!!openRouteConfig}
        />
      ) : (
    <div className="flex h-screen bg-background relative">
      {/* Sidebar with overlay for mobile */}
      <div 
        className={`fixed md:relative z-50 transition-transform duration-300 ease-in-out ${
              sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:hidden'
        }`}
        style={{ width: '16rem' }}
      >
        <Sidebar
              conversations={conversations}
          activeConversation={activeConversation}
          onNewChat={handleNewChat}
          onSelectChat={setActiveConversation}
          onDeleteChat={handleDeleteChat}
          onClearHistory={handleClearHistory}
              onHideSidebar={() => setSidebarOpen(false)}
              currentModel={openRouteConfig ? getModelDisplayName() : undefined}
              onViewModelDetails={() => {
                if (openRouteConfig) {
                  setSelectedModelForDetails(openRouteConfig);
                  setShowModelDetails(true);
                }
              }}
              onShowProfile={() => setShowProfile(true)}
              onLogout={handleLogout}
        />
      </div>

      {/* Overlay for mobile */}
          {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0 relative">
        <header className="sticky top-0 z-30 border-b border-border p-4 flex items-center bg-background">
              {!sidebarOpen && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 hover:bg-secondary rounded-lg transition-colors md:flex hidden mr-2"
                  aria-label="Show sidebar"
                >
                  <ChevronRight className="w-5 h-5 text-foreground" />
                </button>
              )}
          <button
                onClick={() => setSidebarOpen(false)}
            className="p-2 hover:bg-secondary rounded-lg transition-colors md:hidden"
                aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          >
                {sidebarOpen ? (
              <ChevronLeft className="w-5 h-5 text-foreground" />
            ) : (
              <ChevronRight className="w-5 h-5 text-foreground" />
            )}
          </button>
          <div className="flex items-center gap-2 flex-1 justify-center">
            <img
              src="https://raw.githubusercontent.com/yatricloud/yatri-images/refs/heads/main/Logo/yatricloud-round-transparent.png"
              alt="Chat Yatri"
              className="w-8 h-8"
            />
                <h1 className="text-xl font-semibold">
                  Chat Yatri
                </h1>
          </div>
          
          {/* Token Usage Display */}
          {openRouteConfig && tokenUsage.total > 0 && (
            <div className="hidden md:flex items-center gap-4 text-xs text-foreground/60">
              <div className="flex items-center gap-1">
                <span>Tokens:</span>
                <span className="font-medium">{tokenUsage.total.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <span>Cost:</span>
                <span className="font-medium">${getEstimatedCost().toFixed(6)}</span>
              </div>
            </div>
          )}
          
          <div className="ml-2 flex items-center gap-2">
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </div>
        </header>

        {/* Settings Message */}
        {showSettingsMessage && (
          <div className="fixed top-20 right-4 z-40 bg-primary text-white px-3 py-2 rounded-lg text-sm shadow-lg">
            Settings opened (Ctrl/Cmd + ,)
          </div>
        )}

        <div 
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto"
        >
          {getCurrentMessages().length === 0 ? (
                <HomeContent />
          ) : (
            <div className="divide-y divide-border">
              {getCurrentMessages().map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
            </div>
          )}
          <div ref={messagesEndRef} />
          {isAwaitingResponse && (
            <div className="flex items-center gap-2 p-4 animate-pulse text-primary">
              <span>Yatri AI is Thinking</span>
              <span className="dot-flashing"></span>
            </div>
          )}
        </div>

        {showScrollButton && (
          <button
            onClick={scrollToBottom}
            className="fixed bottom-24 right-4 p-2 bg-primary text-white rounded-full shadow-lg hover:bg-primary-hover transition-colors z-20"
            aria-label="Scroll to bottom"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        )}

        <form 
          onSubmit={handleSubmit} 
          className="sticky bottom-0 border-t border-border p-4 bg-background z-30"
        >
          <div className="flex gap-4 max-w-4xl mx-auto">
                {/* Model Selection Icon */}
                {openRouteConfig?.model && (
                  <div className="relative" ref={modelDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setShowModelDropdown(!showModelDropdown)}
                      className="flex items-center gap-2 p-2 hover:bg-secondary rounded-lg transition-colors"
                      aria-label="Select AI model"
                    >
                      {getModelIcon()}
                      <ChevronDown className={`w-4 h-4 text-foreground/60 transition-transform ${showModelDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {/* Model Dropdown */}
                    {showModelDropdown && (
                      <div className="absolute bottom-full left-0 mb-2 w-64 bg-background border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                        <div className="p-3 border-b border-border">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-foreground">Current Model</span>
                            <button
                              onClick={() => {
                                setShowModelDropdown(false);
                                handleBackToSetup();
                              }}
                              className="p-1 hover:bg-secondary rounded transition-colors"
                              aria-label="Add new model"
                            >
                              <Plus className="w-4 h-4 text-primary" />
                            </button>
                          </div>
                        </div>
                        <div className="py-2">
                          {/* Current Connected Model */}
                          {openRouteConfig?.model && (
                            <div className="px-3 py-2 flex items-center gap-2">
                              <div className="flex-1 min-w-0">
                                <button
                                  onClick={() => {
                                    setShowModelDropdown(false);
                                    setSelectedModelForDetails(openRouteConfig);
                                    setShowModelDetails(true);
                                  }}
                                  className="text-left w-full hover:bg-secondary rounded px-2 py-1 transition-colors"
                                >
                                  <div className="truncate text-sm font-medium">{getModelDisplayName()}</div>
                                  <div className="text-xs text-foreground/60 truncate">Connected</div>
                                </button>
                              </div>
                              <div className="flex items-center gap-1">
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                <button
                                  onClick={() => {
                                    setShowModelDropdown(false);
                                    setOpenRouteConfig(null);
                                    showToast("🔌 Disconnected from model");
                                  }}
                                  className="text-xs text-red-500 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                                >
                                  Disconnect
                                </button>
                              </div>
                            </div>
                          )}
                          
                          {/* Previously Configured Models */}
                          {Object.entries(modelConfigs)
                            .filter(([modelId]) => modelId !== openRouteConfig?.model)
                            .map(([modelId, config]) => {
                              const modelInfo = models.find(m => m.value === modelId);
                              return (
                                <div key={modelId} className="px-3 py-2 flex items-center gap-2">
                                  <div className="flex-1 min-w-0">
                                    <button
                                      onClick={() => {
                                        setShowModelDropdown(false);
                                        setSelectedModelForDetails(config);
                                        setShowModelDetails(true);
                                      }}
                                      className="text-left w-full hover:bg-secondary rounded px-2 py-1 transition-colors"
                                    >
                                      <div className="truncate">{modelInfo?.label || modelId}</div>
                                      <div className="text-xs text-foreground/60 truncate">Configured</div>
                                    </button>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    <button
                                      onClick={() => {
                                        setShowModelDropdown(false);
                                        setOpenRouteConfig(config);
                                        const modelName = models.find(m => m.value === modelId)?.label || modelId;
                                        showToast(`🔄 Switched to ${modelName}`);
                                      }}
                                      className="text-xs text-primary hover:text-white hover:bg-primary px-2 py-1 rounded transition-colors"
                                    >
                                      Switch
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={openRouteConfig ? "Type your message..." : "Configure OpenRoute API to start chatting..."}
              className="flex-1 p-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-foreground placeholder-foreground/60"
              disabled={isLoading || !openRouteConfig}
            />
            <button
              type={isLoading ? 'button' : 'submit'}
              onClick={isLoading ? handleStopGeneration : undefined}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:bg-secondary disabled:text-foreground/60 disabled:cursor-not-allowed transition-colors"
              disabled={!openRouteConfig}
            >
              {isLoading ? (
                <Square className="w-5 h-5" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </form>

            {/* Copyright Footer */}
            <div className="border-t border-border p-3 bg-background">
              <div className="text-center">
                <p className="text-xs text-foreground/60">
                  © 2025 Copyright{' '}
                  <a 
                    href="https://yatricloud.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Yatri Cloud
                  </a>
                  {' '}and Designed by{' '}
                  <a 
                    href="https://uimitra.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Uimitra
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-[9999] flex items-center gap-2">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Profile Modal */}
      <ProfileModal
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        user={user}
        onLogout={handleLogout}
        onClearHistory={handleClearHistory}
        onSwitchModel={() => {
          setShowProfile(false);
          setShowSettings(true);
        }}
        onAddModel={() => {
          setShowProfile(false);
          handleBackToSetup();
        }}
        conversations={conversations}
        openRouteConfig={openRouteConfig}
        modelConfigs={modelConfigs}
      />

        {/* Settings Modal */}
        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
        onSave={handleConfigSave}
          currentConfig={openRouteConfig || undefined}
        modelConfigs={modelConfigs}
        onSwitchModel={(config) => {
          setOpenRouteConfig(config);
          setShowSettings(false);
          const modelName = getModelDisplayName();
          showToast(`🔄 Switched to ${modelName}`);
        }}
      />

      {/* Model Details Modal */}
      {showModelDetails && selectedModelForDetails && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-3">
                {getModelIcon()}
                <div>
                  <h2 className="text-lg font-semibold">Model Details</h2>
                  <p className="text-sm text-foreground/60">
                    {models.find(m => m.value === selectedModelForDetails.model)?.label || selectedModelForDetails.model}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowModelDetails(false);
                  setSelectedModelForDetails(null);
                }}
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
                aria-label="Close model details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Model Information */}
              <div className="bg-secondary border border-border rounded-lg p-4 space-y-3">
                <h3 className="font-medium text-sm">Model Information</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-foreground/60">Model:</span>
                    <div className="font-medium">
                      {models.find(m => m.value === selectedModelForDetails.model)?.label || selectedModelForDetails.model}
                    </div>
                  </div>
                  <div>
                    <span className="text-foreground/60">Model ID:</span>
                    <div className="font-medium font-mono text-xs">{selectedModelForDetails.model}</div>
                  </div>
                  <div>
                    <span className="text-foreground/60">Max Tokens:</span>
                    <div className="font-medium">{selectedModelForDetails.maxTokens?.toLocaleString() || '4,000'}</div>
                  </div>
                  <div>
                    <span className="text-foreground/60">Status:</span>
                    <div className={`font-medium ${openRouteConfig?.model === selectedModelForDetails.model ? 'text-green-500' : 'text-blue-500'}`}>
                      {openRouteConfig?.model === selectedModelForDetails.model ? 'Connected' : 'Configured'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Model Capabilities */}
              <div className="bg-secondary border border-border rounded-lg p-4 space-y-3">
                <h3 className="font-medium text-sm">Capabilities</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Text Generation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Conversation Memory</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Context Understanding</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Multi-turn Conversations</span>
                  </div>
                </div>
              </div>

              {/* Usage Information - Only show if connected */}
              {openRouteConfig?.model === selectedModelForDetails.model && (
                <div className="bg-secondary border border-border rounded-lg p-4 space-y-3">
                  <h3 className="font-medium text-sm">Usage</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-foreground/60">Tokens Used:</span>
                      <span className="font-medium">{tokenUsage.total.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground/60">Estimated Cost:</span>
                      <span className="font-medium">${getEstimatedCost().toFixed(6)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground/60">Conversations:</span>
                      <span className="font-medium">{conversations.length}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="space-y-2">
                {openRouteConfig?.model === selectedModelForDetails.model ? (
                  <>
                    <button
                      onClick={() => {
                        setShowModelDetails(false);
                        setSelectedModelForDetails(null);
                        handleNewChat();
                      }}
                      className="w-full p-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors flex items-center justify-center gap-2"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Start New Chat
                    </button>
                    <button
                      onClick={() => {
                        setShowModelDetails(false);
                        setSelectedModelForDetails(null);
                        setOpenRouteConfig(null);
                        showToast("🔌 Disconnected from model");
                      }}
                      className="w-full p-3 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Disconnect Model
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setShowModelDetails(false);
                      setSelectedModelForDetails(null);
                      setOpenRouteConfig(selectedModelForDetails);
                      const modelName = models.find(m => m.value === selectedModelForDetails.model)?.label || selectedModelForDetails.model;
                      showToast(`🔄 Switched to ${modelName}`);
                    }}
                    className="w-full p-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors flex items-center justify-center gap-2"
                  >
                    <Bot className="w-4 h-4" />
                    Connect Model
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowModelDetails(false);
                    setSelectedModelForDetails(null);
                    setShowSettings(true);
                  }}
                  className="w-full p-3 border border-border rounded-lg hover:bg-secondary transition-colors flex items-center justify-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Model Settings
                </button>
              </div>
            </div>
      </div>
    </div>
      )}
    </>
  );
}

export default App;