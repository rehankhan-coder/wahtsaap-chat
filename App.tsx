import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage as ChatMessageType, MessageRole } from './types';
import { GeminiChatService } from './services/geminiService';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import GeminiIcon from './components/icons/GeminiIcon';
import ChatGPTIcon from './components/icons/ChatGPTIcon';
import DeepSeekIcon from './components/icons/DeepSeekIcon';
import MoreIcon from './components/icons/MoreIcon';
import NewChatIcon from './components/icons/NewChatIcon';
import StatusIcon from './components/icons/StatusIcon';
import CommunityIcon from './components/icons/CommunityIcon';
import SearchIcon from './components/icons/SearchIcon';
import VideoIcon from './components/icons/VideoIcon';

const initialMessages: Record<string, ChatMessageType[]> = {
  gemini: [{ role: MessageRole.MODEL, content: "Hello! I'm Gemini. How can I help you today?" }],
  chatgpt: [{ role: MessageRole.MODEL, content: "Hello! I'm ChatGPT. How can I assist you?" }],
  deepseek: [{ role: MessageRole.MODEL, content: "Hi, I'm DeepSeek. What can I do for you?" }],
};

const chatProviders = [
    { id: 'gemini', name: 'Gemini Chat', icon: <GeminiIcon /> },
    { id: 'chatgpt', name: 'ChatGPT', icon: <ChatGPTIcon /> },
    { id: 'deepseek', name: 'DeepSeek Chat', icon: <DeepSeekIcon /> },
];


const App: React.FC = () => {
  const [messages, setMessages] = useState<Record<string, ChatMessageType[]>>(initialMessages);
  const [activeChat, setActiveChat] = useState<string>('gemini');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const chatServiceRef = useRef<GeminiChatService | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      chatServiceRef.current = new GeminiChatService();
    } catch (e) {
      if (e instanceof Error) {
        setError(`Initialization failed: ${e.message}`);
      } else {
        setError('An unknown error occurred during initialization.');
      }
    }
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, activeChat]);

  const handleSendMessage = useCallback(async (message: string) => {
    if (!chatServiceRef.current) {
      setError("Chat service is not initialized.");
      return;
    }

    setIsLoading(true);
    setError(null);

    const newUserMessage: ChatMessageType = { role: MessageRole.USER, content: message };
    
    setMessages(prev => ({
        ...prev,
        [activeChat]: [...prev[activeChat], newUserMessage, { role: MessageRole.MODEL, content: '' }]
    }));

    try {
      const stream = chatServiceRef.current.sendMessageStream(message, activeChat);
      let contentBuffer = '';
      for await (const chunk of stream) {
        contentBuffer += chunk;
        setMessages(prev => {
            const currentChatMessages = prev[activeChat];
            const newMessages = [...currentChatMessages];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage && lastMessage.role === MessageRole.MODEL) {
                lastMessage.content = contentBuffer;
            }
            return { ...prev, [activeChat]: newMessages };
        });
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(errorMessage);
       setMessages(prev => {
          const currentChatMessages = prev[activeChat];
          const newMessages = [...currentChatMessages];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage && lastMessage.role === MessageRole.MODEL) {
            lastMessage.content = `Sorry, I ran into an error: ${errorMessage}`;
          }
          return { ...prev, [activeChat]: newMessages };
        });
    } finally {
      setIsLoading(false);
    }
  }, [activeChat]);

  const handleClearChat = useCallback(() => {
    if (chatServiceRef.current) {
      chatServiceRef.current.resetChat(activeChat);
      setMessages(prev => ({
          ...prev,
          [activeChat]: [initialMessages[activeChat][0]]
      }));
      setError(null);
      setIsLoading(false);
    }
  }, [activeChat]);

  const activeChatProvider = chatProviders.find(p => p.id === activeChat);
  const activeMessages = messages[activeChat] || [];

  return (
    <div className="flex h-screen w-screen text-gray-300 font-sans shadow-2xl">
      {/* Left Sidebar */}
      <aside className="w-20 bg-[#111b21] p-3 flex flex-col items-center gap-6 border-r border-gray-700">
         <div className="p-2 rounded-full bg-green-500/20 text-green-400 relative">
            <CommunityIcon />
            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-green-500 ring-2 ring-[#111b21]"></span>
        </div>
        <StatusIcon />
      </aside>

      {/* Chat List Panel */}
      <aside className="w-full max-w-sm bg-[#111b21] flex flex-col border-r border-gray-700">
        <header className="bg-[#202c33] p-3 flex justify-between items-center h-[60px] flex-shrink-0">
          <h1 className="text-lg font-medium text-gray-200">WhatsApp</h1>
          <div className="flex items-center gap-4 text-gray-400">
            <NewChatIcon />
            <MoreIcon />
          </div>
        </header>
        <div className="p-2">
            <div className="relative">
                 <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <SearchIcon className="w-5 h-5 text-gray-400" />
                </div>
                <input type="text" placeholder="Search or start a new chat" className="w-full bg-[#2a3942] rounded-lg p-2 pl-10 text-sm focus:outline-none" />
            </div>
        </div>
        <div className="px-3 py-1">
             <button className="bg-green-500/20 text-green-400 text-sm rounded-full px-3 py-1">All</button>
        </div>
        <div className="flex-1 overflow-y-auto">
            {chatProviders.map(provider => {
                const chatMessages = messages[provider.id] || [];
                const lastMessage = chatMessages[chatMessages.length - 1];
                const lastMessageContent = lastMessage ? lastMessage.content : 'No messages yet';
                const isProviderLoading = isLoading && activeChat === provider.id;

                return (
                    <div 
                        key={provider.id}
                        className={`p-3 flex items-center gap-4 cursor-pointer ${activeChat === provider.id ? 'bg-[#2a3942]' : 'hover:bg-[#202c33]'}`}
                        onClick={() => setActiveChat(provider.id)}
                    >
                        <div className="bg-blue-500 rounded-full p-2">
                            {provider.icon}
                        </div>
                        <div className="flex-1">
                            <p className="font-medium text-gray-200">{provider.name}</p>
                            <p className="text-sm text-gray-400 truncate">
                                {isProviderLoading ? 'typing...' : (lastMessageContent.startsWith('Sorry') ? 'Error' : lastMessageContent)}
                            </p>
                        </div>
                        <span className="text-xs text-gray-400">Now</span>
                    </div>
                );
            })}
        </div>
      </aside>

      {/* Main Chat View */}
      <div className="flex flex-col flex-1">
        <header className="bg-[#202c33] p-3 text-white flex justify-between items-center shadow-md z-10 h-[60px] flex-shrink-0">
            <div className="flex items-center gap-4">
                <div className="bg-blue-500 rounded-full p-2">
                     {activeChatProvider?.icon}
                </div>
                <h1 className="text-lg font-medium">{activeChatProvider?.name}</h1>
            </div>
            <div className="flex items-center gap-6 text-gray-400">
                <VideoIcon />
                <SearchIcon />
                <button
                    onClick={handleClearChat}
                    className="p-1"
                    aria-label="Clear chat history"
                    >
                    <MoreIcon />
                </button>
            </div>
        </header>

        <main ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 lg:p-10 space-y-2 bg-cover bg-center" style={{backgroundImage: 'url(https://i.redd.it/qwd83gr4k5l51.png)'}}>
          {activeMessages.map((msg, index) => (
            <ChatMessage key={index} message={msg} />
          ))}
           {isLoading && activeMessages[activeMessages.length -1]?.role === MessageRole.MODEL && activeMessages[activeMessages.length-1].content === '' && (
            <ChatMessage message={{role: MessageRole.MODEL, content: '...'}} />
          )}
        </main>

        {error && (
          <div className="p-3 bg-red-800 bg-opacity-50 text-red-100 text-center text-sm">
            <p>{error}</p>
          </div>
        )}

        <footer className="p-3 bg-[#202c33]">
          <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
        </footer>
      </div>
    </div>
  );
};

export default App;