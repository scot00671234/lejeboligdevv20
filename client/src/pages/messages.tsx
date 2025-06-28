import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import { MessageCircle, Mail, Send, User } from 'lucide-react';
import { Link } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { Message, User as UserType } from '@shared/schema';

interface ConversationGroup {
  otherUserId: number;
  otherUserName: string;
  propertyId?: number;
  propertyTitle?: string;
  messages: Message[];
  lastMessage: Message;
}

export default function Messages() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState<ConversationGroup | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages, isLoading } = useQuery({
    queryKey: ['/api/messages'],
    enabled: isAuthenticated,
  });



  const sendMessageMutation = useMutation({
    mutationFn: async (data: { toUserId: number; content: string; propertyId?: number }) => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to send message');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      setNewMessage('');
      toast({
        title: "Besked sendt!",
        description: "Din besked er blevet sendt."
      });
    },
    onError: () => {
      toast({
        title: "Fejl",
        description: "Kunne ikke sende besked. Prøv igen.",
        variant: "destructive"
      });
    }
  });

  // Group messages into conversations
  const conversations: ConversationGroup[] = [];
  if (messages && Array.isArray(messages)) {
    const messageMap = new Map<string, ConversationGroup>();
    
    messages.forEach((message: Message) => {
      const otherUserId = message.fromUserId === user?.id ? message.toUserId : message.fromUserId;
      const key = `${otherUserId}-${message.propertyId || 'general'}`;
      
      if (!messageMap.has(key)) {
        // Use enhanced message data with real names
        const otherUserName = message.fromUserId === user?.id 
          ? (message as any).toUserName 
          : (message as any).fromUserName;
        const propertyTitle = (message as any).propertyTitle;
        
        messageMap.set(key, {
          otherUserId,
          otherUserName,
          propertyId: message.propertyId ?? undefined,
          propertyTitle,
          messages: [],
          lastMessage: message
        });
      }
      
      const conversation = messageMap.get(key)!;
      conversation.messages.push(message);
      
      // Update last message if this one is newer
      if (new Date(message.createdAt!) > new Date(conversation.lastMessage.createdAt!)) {
        conversation.lastMessage = message;
      }
    });

    conversations.push(...Array.from(messageMap.values()));
    conversations.sort((a, b) => 
      new Date(b.lastMessage.createdAt!).getTime() - new Date(a.lastMessage.createdAt!).getTime()
    );
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedConversation?.messages]);

  const handleSendMessage = () => {
    if (!selectedConversation || !newMessage.trim()) return;

    sendMessageMutation.mutate({
      toUserId: selectedConversation.otherUserId,
      content: newMessage.trim(),
      propertyId: selectedConversation.propertyId
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <h1 className="text-2xl font-bold mb-4">Login påkrævet</h1>
            <p className="text-gray-600 mb-4">Du skal være logget ind for at se dine beskeder.</p>
            <Link href="/login">
              <Button>Log ind</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-12">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">Mine beskeder</h1>
          <p className="text-lg text-gray-600">Kommuniker med udlejere og lejere</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
          {/* Conversations List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Samtaler
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="space-y-2 p-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse flex space-x-4 p-3">
                      <div className="rounded-full bg-gray-200 h-10 w-10"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-6 text-center">
                  <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Ingen beskeder endnu</p>
                </div>
              ) : (
                <div className="max-h-[500px] overflow-y-auto">
                  {conversations.map((conversation) => (
                    <div
                      key={`${conversation.otherUserId}-${conversation.propertyId}`}
                      className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedConversation === conversation ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                      }`}
                      onClick={() => setSelectedConversation(conversation)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <User className="h-8 w-8 text-gray-400 bg-gray-100 rounded-full p-1" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {conversation.otherUserName}
                          </p>
                          {conversation.propertyTitle && (
                            <p className="text-xs text-gray-500 truncate">
                              {conversation.propertyTitle}
                            </p>
                          )}
                          <p className="text-sm text-gray-600 truncate mt-1">
                            {conversation.lastMessage.content}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(conversation.lastMessage.createdAt!).toLocaleDateString('da-DK', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-2">
            {selectedConversation ? (
              <>
                <CardHeader className="border-b">
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {selectedConversation.otherUserName}
                    {selectedConversation.propertyTitle && (
                      <span className="text-sm font-normal text-gray-500">
                        - {selectedConversation.propertyTitle}
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col h-[450px] p-0">
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {selectedConversation.messages
                      .sort((a, b) => new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime())
                      .map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.fromUserId === user?.id ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              message.fromUserId === user?.id
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-900'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p className={`text-xs mt-1 ${
                              message.fromUserId === user?.id ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              {new Date(message.createdAt!).toLocaleTimeString('da-DK', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="border-t p-4">
                    <div className="flex space-x-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Skriv en besked..."
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        disabled={sendMessageMutation.isPending}
                      />
                      <Button 
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || sendMessageMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Vælg en samtale</h3>
                  <p className="text-gray-600">Vælg en samtale fra listen for at se beskeder</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
