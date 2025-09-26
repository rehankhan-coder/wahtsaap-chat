import React from 'react';
import { ChatMessage, MessageRole } from '../types';

interface ChatMessageProps {
  message: ChatMessage;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === MessageRole.USER;

  const loadingIndicator = (
    <span className="animate-pulse">...</span>
  );

  return (
    <div className={`flex items-start gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-xl break-words rounded-lg px-3 py-2 shadow-sm text-gray-200 ${
          isUser
            ? 'bg-[#005c4b]'
            : 'bg-[#202c33]'
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content === '...' ? loadingIndicator : message.content}</p>
      </div>
    </div>
  );
};

export default ChatMessage;