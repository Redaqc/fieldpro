import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, Send, AlertCircle, Users } from "lucide-react";
import { format } from "date-fns";

export default function TeamChat() {
  const [message, setMessage] = useState('');
  const [activeChannel, setActiveChannel] = useState('general');
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['teamMessages', activeChannel],
    queryFn: () => base44.entities.TeamMessage.filter({ channel: activeChannel }),
    refetchInterval: 5000, // Poll every 5 seconds
    initialData: [],
  });

  const sendMessageMutation = useMutation({
    mutationFn: (data) => base44.entities.TeamMessage.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamMessages'] });
      setMessage('');
    },
  });

  const handleSend = () => {
    if (!message.trim()) return;

    sendMessageMutation.mutate({
      channel: activeChannel,
      message: message,
      sender_id: currentUser?.email,
      sender_name: currentUser?.full_name || currentUser?.email,
      priority: activeChannel === 'urgent' ? 'urgent' : 'normal',
      recipients: ['all']
    });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const unreadCount = messages.filter(m => 
    !m.read_by?.includes(currentUser?.email) && m.sender_id !== currentUser?.email
  ).length;

  return (
    <div className="p-6 h-screen flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Team Chat</h1>
        <p className="text-slate-500 mt-1">Real-time team communication</p>
      </div>

      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <Tabs value={activeChannel} onValueChange={setActiveChannel}>
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="general" className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                General
              </TabsTrigger>
              <TabsTrigger value="dispatch" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Dispatch
              </TabsTrigger>
              <TabsTrigger value="urgent" className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Urgent
                {unreadCount > 0 && (
                  <Badge className="bg-red-500 ml-1">{unreadCount}</Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-3 mb-4">
            {messages.map(msg => {
              const isOwn = msg.sender_id === currentUser?.email;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] ${isOwn ? 'bg-blue-600 text-white' : 'bg-slate-100'} rounded-lg p-3`}>
                    {!isOwn && (
                      <p className="text-xs font-semibold mb-1">{msg.sender_name}</p>
                    )}
                    <p className="text-sm">{msg.message}</p>
                    <p className={`text-xs mt-1 ${isOwn ? 'text-blue-100' : 'text-slate-500'}`}>
                      {format(new Date(msg.created_date), 'HH:mm')}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex gap-2 border-t pt-4">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type a message..."
              className="flex-1"
            />
            <Button onClick={handleSend} disabled={!message.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}