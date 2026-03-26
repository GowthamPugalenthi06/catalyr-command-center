import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Message } from '@/types/catalyr';
import { Send, Sparkles, Bot, User, Plus, MessageSquare, Trash2, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { agents } from '@/data/mockData';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ChatSession {
  _id: string; // The sessionId string
  title: string;
  lastMessage: string;
  updatedAt: string;
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    if (currentSessionId) {
      fetchMessagesForSession(currentSessionId);
    } else {
      setMessages([]);
    }
  }, [currentSessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/chat/sessions');
      const data = await res.json();
      setSessions(data);
      // If we have sessions and no current one selected, maybe select the first one?
      // Or stay on "New Chat" screen. Let's select first for convenience if meaningful.
      if (data.length > 0 && !currentSessionId) {
        // Optional: auto-select most recent
        // setCurrentSessionId(data[0]._id);
      }
    } catch (e) {
      console.error("Failed to load sessions", e);
    }
  };

  const fetchMessagesForSession = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/chat?sessionId=${sessionId}`);
      const data = await res.json();

      const mapped = data.map((msg: any) => ({
        id: msg._id,
        role: msg.senderType === 'FOUNDER' ? 'user' : 'assistant',
        content: msg.rawMessage || msg.responseSummary || "...",
        timestamp: new Date(msg.createdAt),
        status: msg.status === 'COMPLETED' ? 'complete' : 'thinking',
        agent: msg.senderType === 'AI_AGENT' ? agents[0] : undefined
      }));

      setMessages(mapped);
      scrollToBottom();
    } catch (e) {
      console.error(e);
    }
  };

  const handleNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
    setInput('');
  };

  const deleteSession = async (sessionId: string) => {
    try {
      await fetch(`/api/chat/sessions/${sessionId}`, { method: 'DELETE' });
      toast({ title: "Chat Cleared", description: "History deleted successfully." });

      if (currentSessionId === sessionId) {
        handleNewChat();
      }
      fetchSessions();
    } catch (e) {
      toast({ title: "Error", description: "Failed to delete chat.", variant: "destructive" });
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    // Optimistic UI update
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageToSend = input;
    setInput('');
    setIsTyping(true);

    try {

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // If currentSessionId is null, backend will generate one and return it
        body: JSON.stringify({ message: messageToSend, senderId: 'founder-123', sessionId: currentSessionId }),
      });

      const data = await response.json();

      if (data.success) {
        // Update session ID if this was a new chat
        if (!currentSessionId && data.sessionId) {
          setCurrentSessionId(data.sessionId);
          // Refresh sessions list to show the new one
          fetchSessions();
        }

        const replyContent = data.chatMessage.responseSummary || "Command processed.";

        const aiMessage: Message = {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant',
          content: replyContent,
          timestamp: new Date(),
          status: 'complete',
          // Pass the agent info if the first detected intent has an assigned role
          agent: agents.find(a => a.role === 'COO') // Default to COO (Orion) appearance for system responses
        };
        setMessages((prev) => [...prev, aiMessage]);

        // If we still didn't have a session ID locally for some reason, fetch sessions again
        if (!currentSessionId) fetchSessions();

      } else {
        const errorMessage: Message = {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant',
          content: "Failed to process request.",
          timestamp: new Date(),
          status: 'error',
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: "Error connecting to Commander Brain.",
        timestamp: new Date(),
        status: 'error',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const suggestions = [
    "Show me today's priority tasks",
    "Generate 50 SaaS leads",
    "Draft a LinkedIn post about AI",
    "What's my schedule for tomorrow?",
  ];

  return (
    <div className="flex h-[calc(100vh-8rem)] glass-card rounded-2xl overflow-hidden">
      {/* Sidebar */}
      <div className={cn(
        "w-64 bg-muted/20 border-r border-border flex flex-col transition-all duration-300",
        !showSidebar && "w-0 border-none overflow-hidden"
      )}>
        <div className="p-4 border-b border-border">
          <Button
            onClick={handleNewChat}
            className="w-full justify-start gap-2 bg-primary text-primary-foreground hover:opacity-90"
            variant="default"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
          {sessions.length === 0 && (
            <div className="text-center p-4 text-xs text-muted-foreground">
              No chat history
            </div>
          )}
          {sessions.map(session => (
            <div
              key={session._id}
              onClick={() => setCurrentSessionId(session._id)}
              className={cn(
                "group flex items-center justify-between p-3 rounded-lg cursor-pointer text-sm transition-colors hover:bg-muted",
                currentSessionId === session._id ? "bg-muted/80 text-foreground font-medium" : "text-muted-foreground"
              )}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <MessageSquare className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{session.title || "New Conversation"}</span>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Chat Session?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete this conversation history.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSession(session._id);
                      }}
                      className="bg-red-500 hover:bg-red-600"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full bg-background/50">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setShowSidebar(!showSidebar)} className="p-1 hover:bg-muted rounded text-muted-foreground">
              <Menu className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Command Center</h2>
              <p className="text-xs text-muted-foreground">
                {currentSessionId ? sessions.find(s => s._id === currentSessionId)?.title || "Current Session" : "New Conversation"}
              </p>
            </div>
          </div>
          {/* Optional Top Actions */}
          {currentSessionId && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
                  Clear Chat
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear Current Chat?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete the current conversation history.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteSession(currentSessionId)}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    Clear Chat
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
          {messages.length === 0 && !currentSessionId && (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-50">
              <Bot className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-lg font-medium">How can I help you today?</h3>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3 animate-fade-in",
                message.role === 'user' ? "justify-end" : "justify-start"
              )}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center flex-shrink-0">
                  {message.agent ? (
                    <span>{message.agent.avatar}</span>
                  ) : (
                    <Bot className="w-4 h-4 text-primary" />
                  )}
                </div>
              )}

              <div
                className={cn(
                  "max-w-[75%] rounded-2xl p-4",
                  message.role === 'user'
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted/50 text-foreground rounded-bl-md"
                )}
              >
                {message.agent && message.role === 'assistant' && (
                  <p className="text-xs text-primary font-medium mb-2">
                    {message.agent.name} • {message.agent.role}
                  </p>
                )}
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className={cn(
                  "text-xs mt-2",
                  message.role === 'user' ? "text-primary-foreground/70" : "text-muted-foreground"
                )}>
                  {format(new Date(message.timestamp), 'h:mm a')}
                </p>
              </div>

              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3 animate-fade-in">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="bg-muted/50 rounded-2xl rounded-bl-md p-4">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        {messages.length <= 1 && (
          <div className="px-4 pb-2">
            <div className="flex flex-wrap gap-2 justify-center">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="text-xs px-3 py-1.5 rounded-full bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-border">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Command your AI team..."
              className="flex-1 bg-muted/50 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="px-4 rounded-xl bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
