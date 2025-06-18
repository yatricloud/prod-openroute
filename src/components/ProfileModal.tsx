import React, { useState } from 'react';
import { X, User, Settings, Key, LogOut, Shield, Mail, Calendar, Edit, Save, Trash2, History, Bot, Plus } from 'lucide-react';
import { supabase } from '../utils/supabase';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onLogout: () => void;
  onClearHistory: () => void;
  onSwitchModel: () => void;
  onAddModel: () => void;
  conversations: any[];
  openRouteConfig: any;
  modelConfigs: any;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onLogout,
  onClearHistory,
  onSwitchModel,
  onAddModel,
  conversations,
  openRouteConfig,
  modelConfigs
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.user_metadata?.full_name || '');
  const [loading, setLoading] = useState(false);

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: displayName }
      });
      if (error) throw error;
      setIsEditing(false);
    } catch (error: any) {
      console.error('Error updating profile:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <User className="w-6 h-6 text-primary" />
            <div>
              <h2 className="text-xl font-semibold">Profile & Settings</h2>
              <p className="text-sm text-foreground/60">Manage your account and preferences</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
            aria-label="Close profile"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* User Information */}
          <div className="bg-secondary border border-border rounded-lg p-4">
            <h3 className="font-medium mb-4 flex items-center gap-2">
              <User className="w-4 h-4" />
              Account Information
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-foreground/60" />
                <div className="flex-1">
                  <div className="text-sm text-foreground/60">Email</div>
                  <div className="font-medium">{user?.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-foreground/60" />
                <div className="flex-1">
                  <div className="text-sm text-foreground/60">Member Since</div>
                  <div className="font-medium">{formatDate(user?.created_at)}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4 text-foreground/60" />
                <div className="flex-1">
                  <div className="text-sm text-foreground/60">Account Status</div>
                  <div className="font-medium text-green-500">Active</div>
                </div>
              </div>
            </div>
          </div>

          {/* Model Information */}
          <div className="bg-secondary border border-border rounded-lg p-4">
            <h3 className="font-medium mb-4 flex items-center gap-2">
              <Bot className="w-4 h-4" />
              AI Model Status
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-foreground/60">Current Model</div>
                  <div className="font-medium">
                    {openRouteConfig ? openRouteConfig.model : 'No model connected'}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      onClose();
                      onSwitchModel();
                    }}
                    className="px-3 py-1 text-xs bg-primary text-white rounded hover:bg-primary-hover transition-colors"
                  >
                    Switch
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      onAddModel();
                    }}
                    className="px-3 py-1 text-xs border border-border rounded hover:bg-secondary transition-colors"
                  >
                    Add New
                  </button>
                </div>
              </div>
              <div className="text-sm text-foreground/60">
                Configured Models: {Object.keys(modelConfigs || {}).length}
              </div>
            </div>
          </div>

          {/* Usage Statistics */}
          <div className="bg-secondary border border-border rounded-lg p-4">
            <h3 className="font-medium mb-4 flex items-center gap-2">
              <History className="w-4 h-4" />
              Usage Statistics
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-foreground/60">Total Conversations</div>
                <div className="font-medium text-lg">{conversations.length}</div>
              </div>
              <div>
                <div className="text-sm text-foreground/60">Active Sessions</div>
                <div className="font-medium text-lg">1</div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-3">
            <h3 className="font-medium">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={() => {
                  onClose();
                  onSwitchModel();
                }}
                className="p-3 border border-border rounded-lg hover:bg-secondary transition-colors flex items-center gap-3"
              >
                <Key className="w-4 h-4" />
                <div className="text-left">
                  <div className="font-medium">Switch Model</div>
                  <div className="text-xs text-foreground/60">Change AI model</div>
                </div>
              </button>
              
              <button
                onClick={() => {
                  onClose();
                  onAddModel();
                }}
                className="p-3 border border-border rounded-lg hover:bg-secondary transition-colors flex items-center gap-3"
              >
                <Plus className="w-4 h-4" />
                <div className="text-left">
                  <div className="font-medium">Add Model</div>
                  <div className="text-xs text-foreground/60">Configure new AI model</div>
                </div>
              </button>
              
              <button
                onClick={() => {
                  onClose();
                  onClearHistory();
                }}
                className="p-3 border border-red-300 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-3"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
                <div className="text-left">
                  <div className="font-medium text-red-600">Clear History</div>
                  <div className="text-xs text-foreground/60">Delete all conversations</div>
                </div>
              </button>
              
              <button
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                className="p-3 border border-red-300 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-3"
              >
                <LogOut className="w-4 h-4 text-red-500" />
                <div className="text-left">
                  <div className="font-medium text-red-600">Sign Out</div>
                  <div className="text-xs text-foreground/60">Logout from account</div>
                </div>
              </button>
            </div>
          </div>

          {/* Account Actions */}
          <div className="border-t border-border pt-4">
            <h3 className="font-medium mb-3">Account Actions</h3>
            <div className="space-y-2">
              <button
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                className="w-full p-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 