import React from 'react';
import { MessageSquare, Settings, Sparkles, Bot, Users } from 'lucide-react';

export const HomeContent: React.FC = () => {
  return (
    <div className="min-h-full flex flex-col items-center justify-center p-4 md:p-8">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-6">
          <img
            src="https://raw.githubusercontent.com/yatricloud/yatri-images/refs/heads/main/Logo/yatricloud-round-transparent.png"
            alt="Chat Yatri"
            className="w-16 h-16 md:w-20 md:h-20"
          />
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-primary">
              Hello Yatris👋
            </h1>
          </div>
        </div>
        
        <p className="text-lg md:text-xl text-foreground/80 max-w-2xl mx-auto mb-8">
          Welcome back! Your AI conversation companion is ready to assist you.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full mb-8">
        <div className="flex flex-col items-center text-center p-6 bg-secondary/50 rounded-xl border border-border/50">
          <Bot className="w-8 h-8 text-primary mb-3" />
          <h2 className="text-lg font-semibold mb-2">AI Assistant</h2>
          <p className="text-sm text-foreground/70">
            Get intelligent responses to any question or task
          </p>
        </div>
        
        <div className="flex flex-col items-center text-center p-6 bg-secondary/50 rounded-xl border border-border/50">
          <Sparkles className="w-8 h-8 text-primary mb-3" />
          <h2 className="text-lg font-semibold mb-2">Smart Context</h2>
          <p className="text-sm text-foreground/70">
            Maintains conversation context for natural flow
          </p>
        </div>
        
        <div className="flex flex-col items-center text-center p-6 bg-secondary/50 rounded-xl border border-border/50">
          <Users className="w-8 h-8 text-primary mb-3" />
          <h2 className="text-lg font-semibold mb-2">Multi-Model</h2>
          <p className="text-sm text-foreground/70">
            Access to hundreds of AI models
          </p>
        </div>
      </div>

      <div className="text-center max-w-2xl mx-auto">
        <h3 className="text-lg font-semibold mb-4">Ready to start chatting?</h3>
        <p className="text-foreground/70 mb-6">
          Type your message in the input box below to begin your conversation. 
          You can ask questions, get help with tasks, or just have a friendly chat.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg">
            <MessageSquare className="w-4 h-4" />
            <span className="text-sm font-medium">Start typing below</span>
          </div>
          
          <div className="flex items-center gap-2 px-4 py-2 bg-secondary text-foreground rounded-lg">
            <Settings className="w-4 h-4" />
            <span className="text-sm font-medium">Ctrl/Cmd + , for settings</span>
          </div>
        </div>
      </div>
    </div>
  );
};