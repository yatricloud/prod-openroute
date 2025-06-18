import React, { useState, useEffect } from 'react';
import { MessageSquare, Zap, Shield, Settings, Key, Play, Loader2, Info, ArrowRight, CheckCircle, ExternalLink } from 'lucide-react';
import { OpenRouteConfig } from '../types';
import { validateOpenRouteConfig, fetchOpenRouterModels, MODEL_CATEGORIES, calculateSmartMaxTokens } from '../utils/api';

interface ApiSetupPageProps {
  onConfigureOpenRoute: (config: OpenRouteConfig) => void;
  onBackToChat: () => void;
  isConfigured: boolean;
}

export const ApiSetupPage: React.FC<ApiSetupPageProps> = ({ 
  onConfigureOpenRoute, 
  onBackToChat, 
  isConfigured 
}) => {
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [siteUrl, setSiteUrl] = useState('');
  const [siteName, setSiteName] = useState('');
  const [maxTokens, setMaxTokens] = useState('4000');
  const [error, setError] = useState('');
  const [models, setModels] = useState<{ value: string; label: string; description: string; category?: string; pricingTier?: string; contextLengthTier?: string; smartMaxTokens?: number }[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelsError, setModelsError] = useState('');
  const [selectedModelInfo, setSelectedModelInfo] = useState<any>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setLoadingModels(true);
    fetchOpenRouterModels()
      .then(fetched => {
        setModels(fetched);
        setLoadingModels(false);
        if (fetched.length > 0 && !model) setModel(fetched[0].value);
      })
      .catch(() => {
        setModelsError('Failed to load models. Please try again later.');
        setLoadingModels(false);
      });
    // eslint-disable-next-line
  }, []);

  // Update max tokens and model info when model changes
  useEffect(() => {
    if (model && models.length > 0) {
      const selectedModel = models.find(m => m.value === model);
      if (selectedModel) {
        setSelectedModelInfo(selectedModel);
        // Only update max tokens if user hasn't manually set it
        if (maxTokens === '4000' || maxTokens === '15000') {
          setMaxTokens(selectedModel.smartMaxTokens?.toString() || '4000');
        }
      }
    }
  }, [model, models, maxTokens]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    const config: OpenRouteConfig = {
      apiKey: apiKey.trim(),
      model,
      siteUrl: siteUrl.trim() || undefined,
      siteName: siteName.trim() || undefined,
      maxTokens: parseInt(maxTokens) || 4000,
    };
    
    const validationError = validateOpenRouteConfig(config);
    if (validationError) {
      setError(validationError);
      setIsSubmitting(false);
      return;
    }
    
    try {
      onConfigureOpenRoute(config);
      // Small delay to show success state
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (err) {
      setError('Failed to configure API. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <img
              src="https://raw.githubusercontent.com/yatricloud/yatri-images/refs/heads/main/Logo/yatricloud-round-transparent.png"
              alt="Chat Yatri"
              className="w-12 h-12"
            />
            <h1 className="text-3xl font-bold text-primary">
              Chat Yatri
            </h1>
          </div>
          <p className="text-xl text-foreground/80 max-w-2xl mx-auto">
            Welcome to your AI conversation companion
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Setup Steps */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            <div className="flex flex-col items-center text-center p-6 bg-secondary/50 rounded-xl border border-border/50">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Key className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">1. Get API Key</h3>
              <p className="text-sm text-foreground/70">
                Sign up at OpenRouter and get your free API key
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center p-6 bg-secondary/50 rounded-xl border border-border/50">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Settings className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">2. Configure</h3>
              <p className="text-sm text-foreground/70">
                Choose your preferred AI model and settings
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center p-6 bg-secondary/50 rounded-xl border border-border/50">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">3. Start Chatting</h3>
              <p className="text-sm text-foreground/70">
                Begin your AI-powered conversations
              </p>
            </div>
          </div>

          {/* API Configuration Form */}
          <div className="bg-secondary/30 backdrop-blur-sm rounded-2xl border border-border/50 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Key className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">OpenRouter API Setup</h2>
                <p className="text-foreground/70">Configure your API key to start chatting</p>
              </div>
            </div>
            
            {error && (
              <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg text-red-700">
                {error}
              </div>
            )}
            
            {modelsError && (
              <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg text-red-700">
                {modelsError}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="apiKey" className="block text-sm font-semibold mb-2">
                    API Key *
                  </label>
                  <input
                    id="apiKey"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your OpenRoute API key"
                    className="w-full p-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                    required
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <a 
                      href="https://openrouter.ai/keys" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      Get your API key
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="model" className="block text-sm font-semibold mb-2">
                    AI Model *
                  </label>
                  
                  {/* Category Filter */}
                  <div className="mb-2">
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="w-full p-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm"
                      aria-label="Filter models by category"
                    >
                      <option value="all">All Categories</option>
                      {Object.values(MODEL_CATEGORIES).map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  
                  {loadingModels ? (
                    <div className="flex items-center gap-2 text-foreground/60 p-3 bg-background border border-border rounded-lg">
                      <Loader2 className="animate-spin w-4 h-4" /> 
                      Loading models...
                    </div>
                  ) : (
                    <select
                      id="model"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="w-full p-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                      required
                    >
                      {models
                        .filter(m => categoryFilter === 'all' || m.category === categoryFilter)
                        .map((modelOption) => (
                          <option key={modelOption.value} value={modelOption.value} title={modelOption.description}>
                            {modelOption.label}
                          </option>
                        ))}
                    </select>
                  )}
                </div>
              </div>
              
              {/* Model Info Display */}
              {selectedModelInfo && (
                <div className="bg-background border border-border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Info className="w-4 h-4 text-primary" />
                    <span className="font-semibold">Model Information</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-foreground/60">Category:</span>
                      <div className="font-medium">{selectedModelInfo.category || 'General'}</div>
                    </div>
                    <div>
                      <span className="text-foreground/60">Pricing:</span>
                      <div className="font-medium">{selectedModelInfo.pricingTier || 'Unknown'}</div>
                    </div>
                    <div>
                      <span className="text-foreground/60">Context:</span>
                      <div className="font-medium">{selectedModelInfo.contextLengthTier || 'Unknown'}</div>
                    </div>
                    <div>
                      <span className="text-foreground/60">Smart Limit:</span>
                      <div className="font-medium">{selectedModelInfo.smartMaxTokens?.toLocaleString() || '4,000'} tokens</div>
                    </div>
                  </div>
                  <div className="text-sm text-foreground/60 mt-2">
                    💡 Estimated cost: ${((selectedModelInfo.estimatedCostPer1kTokens || 0) * 1000).toFixed(6)} per 1K tokens
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="siteUrl" className="block text-sm font-semibold mb-2">
                    Site URL (Optional)
                  </label>
                  <input
                    id="siteUrl"
                    type="url"
                    value={siteUrl}
                    onChange={(e) => setSiteUrl(e.target.value)}
                    placeholder="https://your-site.com"
                    className="w-full p-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                  />
                  <p className="text-xs text-foreground/60 mt-1">
                    Used for OpenRouter rankings
                  </p>
                </div>
                
                <div>
                  <label htmlFor="siteName" className="block text-sm font-semibold mb-2">
                    Site Name (Optional)
                  </label>
                  <input
                    id="siteName"
                    type="text"
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    placeholder="Your Site Name"
                    className="w-full p-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                  />
                  <p className="text-xs text-foreground/60 mt-1">
                    Used for OpenRouter rankings
                  </p>
                </div>
                
                <div>
                  <label htmlFor="maxTokens" className="block text-sm font-semibold mb-2">
                    Max Tokens
                  </label>
                  <input
                    id="maxTokens"
                    type="number"
                    min="1"
                    max="100000"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(e.target.value)}
                    placeholder={selectedModelInfo?.smartMaxTokens?.toString() || "4000"}
                    className="w-full p-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                  />
                  <p className="text-xs text-foreground/60 mt-1">
                    Smart default: {selectedModelInfo?.smartMaxTokens?.toLocaleString() || '4,000'}
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <button
                  type="submit"
                  disabled={loadingModels || !!modelsError || isSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:bg-secondary disabled:text-foreground/60 disabled:cursor-not-allowed transition-all duration-200 font-semibold"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin w-5 h-5" />
                      Configuring...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      Start Chatting
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
                
                {isConfigured && (
                  <button
                    type="button"
                    onClick={onBackToChat}
                    className="px-6 py-3 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 transition-colors font-semibold"
                  >
                    Back to Chat
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="flex flex-col items-center text-center p-6 bg-secondary/30 rounded-xl border border-border/50">
              <MessageSquare className="w-8 h-8 text-primary mb-3" />
              <h3 className="text-lg font-semibold mb-2">Natural Conversations</h3>
              <p className="text-sm text-foreground/70">
                Engage in fluid, context-aware conversations with advanced AI models
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center p-6 bg-secondary/30 rounded-xl border border-border/50">
              <Zap className="w-8 h-8 text-primary mb-3" />
              <h3 className="text-lg font-semibold mb-2">Lightning Fast</h3>
              <p className="text-sm text-foreground/70">
                Get instant responses powered by cutting-edge technology
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center p-6 bg-secondary/30 rounded-xl border border-border/50">
              <Shield className="w-8 h-8 text-primary mb-3" />
              <h3 className="text-lg font-semibold mb-2">Secure & Private</h3>
              <p className="text-sm text-foreground/70">
                Your conversations are protected with enterprise-grade security
              </p>
            </div>
          </div>
        </div>

        {/* Copyright Footer */}
        <div className="text-center mt-12 pt-8 border-t border-border/50">
          <p className="text-sm text-foreground/60">
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
  );
}; 