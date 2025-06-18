import React, { useState, useEffect } from 'react';
import { MessageSquare, Zap, Shield, Settings, Key, Play, Loader2, Info } from 'lucide-react';
import { OpenRouteConfig } from '../types';
import { validateOpenRouteConfig, fetchOpenRouterModels, MODEL_CATEGORIES, PRICING_TIERS, CONTEXT_LENGTH_TIERS, calculateSmartMaxTokens } from '../utils/api';

interface HomeContentProps {
  onConfigureOpenRoute: (config: OpenRouteConfig) => void;
  isConfigured: boolean;
}

export const HomeContent: React.FC<HomeContentProps> = ({ onConfigureOpenRoute, isConfigured }) => {
  const [showConfig, setShowConfig] = useState(!isConfigured);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
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
      return;
    }
    
    onConfigureOpenRoute(config);
    setShowConfig(false);
  };

  return (
    <div className="min-h-full flex flex-col items-center justify-center p-4 md:p-8">
      <img
        src="https://raw.githubusercontent.com/yatricloud/yatri-images/refs/heads/main/Logo/yatricloud-round-transparent.png"
        alt="Chat Yatri"
        className="w-16 h-16 md:w-24 md:h-24 mb-6"
      />
      <h1 className="text-2xl md:text-4xl font-bold mb-6 text-center">Hello Yatris 👋</h1>
      
      {(!isConfigured || showConfig) && (
        <div className="w-full max-w-md mb-8">
          <div className="bg-secondary rounded-lg p-6 border border-border">
            <div className="flex items-center gap-2 mb-4">
              <Key className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">OpenRoute API Configuration</h2>
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}
            {modelsError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">
                {modelsError}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="apiKey" className="block text-sm font-medium mb-2">
                  API Key *
                </label>
                <input
                  id="apiKey"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your OpenRoute API key"
                  className="w-full p-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-foreground"
                  required
                />
                <p className="text-xs text-foreground/60 mt-1">
                  Get your API key from{' '}
                  <a 
                    href="https://openrouter.ai/keys" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    OpenRouter
                  </a>
                </p>
              </div>
              
              <div>
                <label htmlFor="model" className="block text-sm font-medium mb-2">
                  Model
                </label>
                
                {/* Category Filter */}
                <div className="mb-2">
                  <label htmlFor="categoryFilter" className="block text-xs font-medium mb-1 text-foreground/70">
                    Filter by Category
                  </label>
                  <select
                    id="categoryFilter"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full p-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-foreground text-sm"
                  >
                    <option value="all">All Categories</option>
                    {Object.values(MODEL_CATEGORIES).map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                
                {loadingModels ? (
                  <div className="flex items-center gap-2 text-foreground/60"><Loader2 className="animate-spin w-4 h-4" /> Loading models...</div>
                ) : (
                  <select
                    id="model"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full p-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-foreground"
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
                <p className="text-xs text-foreground/60 mt-1">
                  Choose from all available models on OpenRouter
                </p>
              </div>
              
              {/* Model Info Display */}
              {selectedModelInfo && (
                <div className="bg-background border border-border rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Info className="w-4 h-4 text-primary" />
                    Model Information
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-foreground/60">Category:</span>
                      <span className="ml-1 font-medium">{selectedModelInfo.category || 'General'}</span>
                    </div>
                    <div>
                      <span className="text-foreground/60">Pricing:</span>
                      <span className="ml-1 font-medium">{selectedModelInfo.pricingTier || 'Unknown'}</span>
                    </div>
                    <div>
                      <span className="text-foreground/60">Context:</span>
                      <span className="ml-1 font-medium">{selectedModelInfo.contextLengthTier || 'Unknown'}</span>
                    </div>
                    <div>
                      <span className="text-foreground/60">Smart Limit:</span>
                      <span className="ml-1 font-medium">{selectedModelInfo.smartMaxTokens?.toLocaleString() || '4,000'} tokens</span>
                    </div>
                  </div>
                  <div className="text-xs text-foreground/60">
                    Estimated cost: ${((selectedModelInfo.estimatedCostPer1kTokens || 0) * 1000).toFixed(6)} per 1K tokens
                  </div>
                </div>
              )}
              
              <div>
                <label htmlFor="siteUrl" className="block text-sm font-medium mb-2">
                  Site URL (Optional)
                </label>
                <input
                  id="siteUrl"
                  type="url"
                  value={siteUrl}
                  onChange={(e) => setSiteUrl(e.target.value)}
                  placeholder="https://your-site.com"
                  className="w-full p-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-foreground"
                />
                <p className="text-xs text-foreground/60 mt-1">
                  Used for rankings on OpenRouter
                </p>
              </div>
              
              <div>
                <label htmlFor="siteName" className="block text-sm font-medium mb-2">
                  Site Name (Optional)
                </label>
                <input
                  id="siteName"
                  type="text"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  placeholder="Your Site Name"
                  className="w-full p-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-foreground"
                />
                <p className="text-xs text-foreground/60 mt-1">
                  Used for rankings on OpenRouter
                </p>
              </div>
              
              <div>
                <label htmlFor="maxTokens" className="block text-sm font-medium mb-2">
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
                  className="w-full p-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-foreground"
                />
                <p className="text-xs text-foreground/60 mt-1">
                  Maximum tokens to generate (1-100,000). Smart default: {selectedModelInfo?.smartMaxTokens?.toLocaleString() || '4,000'} tokens
                </p>
                {selectedModelInfo && (
                  <p className="text-xs text-foreground/60">
                    💡 Lower values save credits. Higher values allow longer responses.
                  </p>
                )}
              </div>
              
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
                disabled={loadingModels || !!modelsError}
              >
                <Play className="w-4 h-4" />
                Start Conversation
              </button>
            </form>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 max-w-4xl w-full mb-8">
        <div className="flex flex-col items-center text-center p-4 md:p-6 bg-secondary rounded-lg">
          <MessageSquare className="w-6 h-6 md:w-8 md:h-8 text-primary mb-3" />
          <h2 className="text-base md:text-lg font-semibold mb-2">Natural Conversations</h2>
          <p className="text-sm md:text-base text-foreground/70">Engage in fluid, context-aware conversations with advanced AI</p>
        </div>
        
        <div className="flex flex-col items-center text-center p-4 md:p-6 bg-secondary rounded-lg">
          <Zap className="w-6 h-6 md:w-8 md:h-8 text-primary mb-3" />
          <h2 className="text-base md:text-lg font-semibold mb-2">Lightning Fast</h2>
          <p className="text-sm md:text-base text-foreground/70">Get instant responses powered by cutting-edge technology</p>
        </div>
        
        <div className="flex flex-col items-center text-center p-4 md:p-6 bg-secondary rounded-lg">
          <Shield className="w-6 h-6 md:w-8 md:h-8 text-primary mb-3" />
          <h2 className="text-base md:text-lg font-semibold mb-2">Secure & Private</h2>
          <p className="text-sm md:text-base text-foreground/70">Your conversations are protected with enterprise-grade security</p>
        </div>
      </div>

      <p className="text-sm md:text-base text-center text-foreground/60 max-w-sm md:max-w-2xl px-4">
        {isConfigured 
          ? "Start a new chat by clicking the 'New chat' button in the sidebar. Chat Yatri is ready to assist you with any questions or tasks you have."
          : "Configure your OpenRoute API key to start chatting with advanced AI models."
        }
      </p>
      
      {isConfigured && (
        <button
          onClick={() => setShowConfig(true)}
          className="mt-4 flex items-center gap-2 px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 transition-colors"
        >
          <Settings className="w-4 h-4" />
          Change API Settings
        </button>
      )}
    </div>
  );
};