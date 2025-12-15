
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export default function ChatInterface() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading) return;

        const userMsg = inputValue;
        setInputValue('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsLoading(true);

        try {
            const res = await fetch('/api/n8n/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: userMsg })
            });

            if (!res.ok) throw new Error('Failed to fetch response');

            const data = await res.json();
            setMessages(prev => [...prev, { role: 'assistant', content: data.answer || "I'm sorry, I couldn't generate an answer." }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: "Error connecting to AI service." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {!isOpen && (
                <Button
                    onClick={() => setIsOpen(true)}
                    className="h-14 w-14 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 transition-all duration-300"
                >
                    <MessageCircle className="h-6 w-6 text-white" />
                </Button>
            )}

            {isOpen && (
                <Card className="w-[380px] h-[500px] flex flex-col shadow-2xl animate-in fade-in slide-in-from-bottom-10 border-blue-100">
                    <CardHeader className="flex flex-row items-center justify-between p-4 border-b bg-blue-50/50">
                        <CardTitle className="text-md flex items-center gap-2 text-blue-800">
                            <Bot className="h-4 w-4" /> AI Assistant
                        </CardTitle>
                        <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8">
                            <X className="h-4 w-4" />
                        </Button>
                    </CardHeader>

                    <CardContent className="flex-1 p-0 overflow-hidden relative">
                        <ScrollArea className="h-full p-4">
                            <div className="flex flex-col gap-4 pb-4">
                                {messages.length === 0 && (
                                    <div className="text-center text-sm text-muted-foreground mt-10">
                                        Ask me anything about your documents!
                                    </div>
                                )}
                                {messages.map((m, i) => (
                                    <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        {m.role === 'assistant' && (
                                            <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center mt-1">
                                                <Bot className="h-3 w-3 text-blue-600" />
                                            </div>
                                        )}
                                        <div className={`rounded-lg px-3 py-2 max-w-[80%] text-sm ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                                            {m.content}
                                        </div>
                                    </div>
                                ))}
                                {isLoading && (
                                    <div className="flex gap-2 justify-start">
                                        <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center mt-1">
                                            <Bot className="h-3 w-3 text-blue-600" />
                                        </div>
                                        <div className="bg-gray-100 rounded-lg px-3 py-2 text-sm text-gray-500 italic">
                                            Thinking...
                                        </div>
                                    </div>
                                )}
                                <div ref={scrollRef} />
                            </div>
                        </ScrollArea>
                    </CardContent>

                    <form onSubmit={handleSubmit} className="p-3 border-t bg-gray-50/50 flex gap-2">
                        <Input
                            value={inputValue}
                            onChange={e => setInputValue(e.target.value)}
                            placeholder="Type your question..."
                            className="flex-1"
                            disabled={isLoading}
                        />
                        <Button type="submit" size="icon" disabled={isLoading || !inputValue.trim()} className="bg-blue-600 hover:bg-blue-700">
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </Card>
            )}
        </div>
    );
}
