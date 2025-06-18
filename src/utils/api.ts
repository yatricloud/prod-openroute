import { OpenRouteConfig } from '../types';

export const validateOpenRouteConfig = (config: OpenRouteConfig): string | null => {
  if (!config.apiKey || config.apiKey.trim() === '') {
    return 'API key is required';
  }
  
  if (!config.model || config.model.trim() === '') {
    return 'Model selection is required';
  }
  
  if (config.maxTokens && (config.maxTokens <= 0 || config.maxTokens > 100000)) {
    return 'Max tokens must be between 1 and 100,000';
  }
  
  return null;
};

export const getOpenRouteHeaders = (config: OpenRouteConfig): Record<string, string> => {
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${config.apiKey}`,
    'Content-Type': 'application/json'
  };

  if (config.siteUrl) {
    headers['HTTP-Referer'] = config.siteUrl;
  }
  
  if (config.siteName) {
    headers['X-Title'] = config.siteName;
  }

  return headers;
};

// Fetch and cache models from OpenRouter
export async function fetchOpenRouterModels() {
  const cacheKey = 'openrouter_models_cache_v1';
  const cacheExpiry = 1000 * 60 * 60 * 6; // 6 hours
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try {
      const { models, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < cacheExpiry) {
        // Start background refresh
        refreshOpenRouterModelsInBackground();
        return models;
      }
    } catch {}
  }
  // Fetch from API
  return await fetchAndCacheOpenRouterModels();
}

async function fetchAndCacheOpenRouterModels() {
  const apiBaseUrl = getApiBaseUrl();
  const res = await fetch(`${apiBaseUrl}/models`);
  if (!res.ok) throw new Error('Failed to fetch models');
  const data = await res.json();
  const models = (data.data || []).map((model: any) => {
    const baseModel = {
      value: model.id,
      label: model.name,
      description: model.description,
      contextLength: model.context_length,
      pricing: model.pricing,
      inputModalities: model.input_modalities || [],
      supportedFeatures: model.supported_features || []
    };
    return enhanceModelData(baseModel);
  });
  localStorage.setItem('openrouter_models_cache_v1', JSON.stringify({ models, timestamp: Date.now() }));
  return models;
}

function refreshOpenRouterModelsInBackground() {
  fetchAndCacheOpenRouterModels().catch(() => {});
}

// Remove the availableModels export, as models are now fetched live. 

// Model categories based on OpenRouter models page
export const MODEL_CATEGORIES = {
  PROGRAMMING: 'Programming',
  ROLEPLAY: 'Roleplay', 
  MARKETING: 'Marketing',
  GENERAL: 'General',
  MULTIMODAL: 'Multimodal',
  REASONING: 'Reasoning'
} as const;

// Pricing tiers based on OpenRouter models page
export const PRICING_TIERS = {
  FREE: 'FREE',
  LOW: '$0.5',
  MEDIUM: '$10+',
  HIGH: '$50+'
} as const;

// Context length tiers
export const CONTEXT_LENGTH_TIERS = {
  SHORT: '4K',
  MEDIUM: '64K', 
  LONG: '1M'
} as const;

// Calculate smart default max tokens based on model characteristics
export function calculateSmartMaxTokens(model: any): number {
  if (!model) return 4000; // Conservative default
  
  const contextLength = model.contextLength || 4096;
  const promptPrice = parseFloat(model.pricing?.prompt || '0');
  const completionPrice = parseFloat(model.pricing?.completion || '0');
  
  // Base calculation on pricing tier
  let baseTokens = 4000; // Conservative default
  
  if (promptPrice === 0 && completionPrice === 0) {
    // Free models - can be more generous
    baseTokens = Math.min(8000, Math.floor(contextLength * 0.1));
  } else if (promptPrice < 0.000001) {
    // Very cheap models (like Llama 3.1 8B)
    baseTokens = Math.min(6000, Math.floor(contextLength * 0.08));
  } else if (promptPrice < 0.00001) {
    // Cheap models (like GPT-3.5 Turbo)
    baseTokens = Math.min(5000, Math.floor(contextLength * 0.06));
  } else if (promptPrice < 0.0001) {
    // Medium cost models (like GPT-4o)
    baseTokens = Math.min(4000, Math.floor(contextLength * 0.05));
  } else if (promptPrice < 0.001) {
    // Expensive models (like GPT-4)
    baseTokens = Math.min(3000, Math.floor(contextLength * 0.04));
  } else {
    // Very expensive models (like o1-pro)
    baseTokens = Math.min(2000, Math.floor(contextLength * 0.03));
  }
  
  // Ensure we don't exceed context length
  return Math.min(baseTokens, Math.floor(contextLength * 0.5));
}

// Get model category based on model ID and description
export function getModelCategory(model: any): string {
  const modelId = model.value?.toLowerCase() || '';
  const description = model.description?.toLowerCase() || '';
  
  // Programming models
  if (modelId.includes('code') || modelId.includes('coder') || 
      description.includes('code') || description.includes('programming') ||
      modelId.includes('deepseek') || modelId.includes('wizardlm')) {
    return MODEL_CATEGORIES.PROGRAMMING;
  }
  
  // Roleplay models
  if (modelId.includes('roleplay') || modelId.includes('rp') ||
      description.includes('roleplay') || description.includes('storytelling') ||
      modelId.includes('hermes') || modelId.includes('magnum')) {
    return MODEL_CATEGORIES.ROLEPLAY;
  }
  
  // Marketing models
  if (description.includes('marketing') || description.includes('business') ||
      description.includes('commercial')) {
    return MODEL_CATEGORIES.MARKETING;
  }
  
  // Multimodal models
  if (modelId.includes('vision') || modelId.includes('vl') ||
      description.includes('multimodal') || description.includes('vision') ||
      description.includes('image')) {
    return MODEL_CATEGORIES.MULTIMODAL;
  }
  
  // Reasoning models
  if (modelId.includes('reasoning') || modelId.includes('o1') || modelId.includes('o3') ||
      description.includes('reasoning') || description.includes('thinking')) {
    return MODEL_CATEGORIES.REASONING;
  }
  
  return MODEL_CATEGORIES.GENERAL;
}

// Get pricing tier based on model pricing
export function getPricingTier(model: any): string {
  const promptPrice = parseFloat(model.pricing?.prompt || '0');
  const completionPrice = parseFloat(model.pricing?.completion || '0');
  
  if (promptPrice === 0 && completionPrice === 0) {
    return PRICING_TIERS.FREE;
  } else if (promptPrice < 0.00001) {
    return PRICING_TIERS.LOW;
  } else if (promptPrice < 0.0001) {
    return PRICING_TIERS.MEDIUM;
  } else {
    return PRICING_TIERS.HIGH;
  }
}

// Get context length tier
export function getContextLengthTier(model: any): string {
  const contextLength = model.contextLength || 4096;
  
  if (contextLength <= 4096) {
    return CONTEXT_LENGTH_TIERS.SHORT;
  } else if (contextLength <= 65536) {
    return CONTEXT_LENGTH_TIERS.MEDIUM;
  } else {
    return CONTEXT_LENGTH_TIERS.LONG;
  }
}

// Enhanced model data with categories and smart defaults
export function enhanceModelData(model: any) {
  return {
    ...model,
    category: getModelCategory(model),
    pricingTier: getPricingTier(model),
    contextLengthTier: getContextLengthTier(model),
    smartMaxTokens: calculateSmartMaxTokens(model),
    estimatedCostPer1kTokens: parseFloat(model.pricing?.prompt || '0') + parseFloat(model.pricing?.completion || '0')
  };
}

// Test function to verify smart token calculation
export function testSmartTokenCalculation() {
  const testModels = [
    {
      value: 'meta-llama/llama-3.1-8b-instruct',
      pricing: { prompt: '0.000000016', completion: '0.00000003' },
      contextLength: 131000
    },
    {
      value: 'openai/gpt-3.5-turbo',
      pricing: { prompt: '0.0000005', completion: '0.0000015' },
      contextLength: 16385
    },
    {
      value: 'openai/gpt-4o',
      pricing: { prompt: '0.000005', completion: '0.000015' },
      contextLength: 128000
    },
    {
      value: 'openai/o1-pro',
      pricing: { prompt: '0.00015', completion: '0.0006' },
      contextLength: 200000
    },
    {
      value: 'google/gemma-2-9b-it:free',
      pricing: { prompt: '0', completion: '0' },
      contextLength: 8192
    }
  ];

  console.log('Smart Token Calculation Test:');
  testModels.forEach(model => {
    const smartTokens = calculateSmartMaxTokens(model);
    console.log(`${model.value}: ${smartTokens.toLocaleString()} tokens (${model.pricing.prompt === '0' ? 'FREE' : 'PAID'})`);
  });
}

// Determine API base URL - use proxy for live domains to handle CORS
export const getApiBaseUrl = () => {
  const isLocalhost = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1' ||
                     window.location.hostname === '';
  
  // Force proxy usage for testing (set to true to test proxy on localhost)
  const forceProxy = false;
  
  if (isLocalhost && !forceProxy) {
    console.log('Using direct OpenRouter API (localhost)');
    return 'https://openrouter.ai/api/v1';
  } else {
    console.log('Using proxy server for OpenRouter API (live domain or forced)');
    return '/api/openrouter';
  }
}; 