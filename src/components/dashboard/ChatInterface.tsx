import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Message } from '@/types/catalyr';
import { Send, Sparkles, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { chatHistory, agents } from '@/data/mockData';
import { format } from 'date-fns';

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>(chatHistory);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const responses = [
        { agent: agents[0], content: "I've analyzed your request. Breaking it down into actionable tasks:\n\n1. **Content Creation** → Assigned to Aurora (CMO)\n2. **Lead Research** → Assigned to Scout (Lead Collector)\n3. **Email Draft** → Assigned to Echo (Copywriter)\n\nEstimated completion: 2 hours." },
        { agent: agents[1], content: "Marketing analysis complete. Based on current engagement metrics:\n\n• LinkedIn posts perform 34% better at 9 AM EST\n• Technical content generates 2x more leads\n• Video content has 45% higher retention\n\nRecommendation: Focus on technical thought leadership." },
        { agent: agents[4], content: "Sales pipeline update:\n\n**Hot Leads (80+ score):** 23\n**Warm Leads (60-79):** 54\n**Total Pipeline Value:** $127,500\n\nTop opportunity: Sarah Chen from TechFlow AI is ready for a demo call." },
      ];

      const response = responses[Math.floor(Math.random() * responses.length)];

      const aiMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        agent: response.agent,
        status: 'complete',
      };

      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const suggestions = [
    "Show me today's priority tasks",
    "Generate 50 SaaS leads",
    "Draft a LinkedIn post about AI",
    "What's my schedule for tomorrow?",
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] glass-card rounded-2xl">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h2 className="font-semibold text-foreground">Command Center</h2>
          <p className="text-xs text-muted-foreground">Your AI team is ready</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
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
      {messages.length <= 3 && (
        <div className="px-4 pb-2">
          <div className="flex flex-wrap gap-2">
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
  );
}
