export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: number;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
}

export interface OpenRouteConfig {
  apiKey: string;
  model: string;
  siteUrl?: string;
  siteName?: string;
  maxTokens?: number;
}

export interface ChatSettings {
  openRouteConfig: OpenRouteConfig;
  isConfigured: boolean;
}