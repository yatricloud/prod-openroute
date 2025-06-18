import React from 'react';
import { Plus, MessageSquare, Trash2, History, ChevronLeft, Bot, Eye, User, LogOut } from 'lucide-react';
import { cn } from '../utils/cn';

interface SidebarProps {
  conversations: Array<{ id: string; preview: string }>;
  activeConversation: string | null;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  onClearHistory: () => void;
  onHideSidebar: () => void;
  currentModel?: string;
  onViewModelDetails?: () => void;
  onShowProfile?: () => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeConversation,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onClearHistory,
  onHideSidebar,
  currentModel,
  onViewModelDetails,
  onShowProfile,
  onLogout,
}) => {
  return (
    <div className="h-full bg-sidebar border-r border-border flex flex-col">
      <div className="m-4 flex gap-2">
        <button
          onClick={onNewChat}
          className="flex-1 p-2 flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          New chat
        </button>
        <button
          onClick={onHideSidebar}
          className="p-2 flex items-center justify-center bg-secondary hover:bg-secondary/80 text-foreground rounded-lg transition-colors md:flex hidden"
          aria-label="Hide sidebar"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.map((chat) => (
          <div
            key={chat.id}
            className={cn(
              "w-full p-3 text-left hover:bg-secondary-hover flex items-center gap-2 group",
              activeConversation === chat.id && "bg-secondary"
            )}
          >
            <div
              className="flex items-center gap-2 flex-1 cursor-pointer"
              onClick={() => onSelectChat(chat.id)}
            >
              <MessageSquare className="w-4 h-4 flex-shrink-0" />
              <span className="truncate text-sm">{chat.preview}</span>
            </div>
            <button
              onClick={() => onDeleteChat(chat.id)}
              className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity"
              aria-label="Delete conversation"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-border flex flex-col gap-2">
        {/* Profile at the top */}
        {onShowProfile && (
          <button
            onClick={onShowProfile}
            className="w-full p-2 flex items-center gap-2 hover:bg-secondary rounded-lg transition-colors text-foreground/70 hover:text-foreground"
          >
            <User className="w-4 h-4" />
            <span className="text-sm">Profile</span>
          </button>
        )}
        {/* Model section */}
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 p-2 flex items-center gap-2 text-foreground/70">
            <Bot className="w-4 h-4" />
            <span className="text-sm">
              {currentModel ? currentModel : 'No Model Connected'}
            </span>
          </div>
          {currentModel && onViewModelDetails && (
            <button
              onClick={onViewModelDetails}
              className="p-2 hover:bg-secondary rounded-lg transition-colors text-foreground/60 hover:text-foreground"
              aria-label="View model details"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}
        </div>
        {/* Clear History at the bottom */}
        <button
          onClick={onClearHistory}
          className="w-full p-2 flex items-center gap-2 hover:bg-secondary rounded-lg transition-colors text-red-400 hover:text-red-500 mt-1"
        >
          <History className="w-4 h-4" />
          <span>Clear History</span>
        </button>
      </div>
    </div>
  );
}