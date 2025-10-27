import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { ChatIcon } from './icons/ChatIcon';
import { SendIcon } from './icons/SendIcon';

interface ChatInterfaceProps {
  chatHistory: ChatMessage[];
  onSendMessage: (prompt: string) => void;
  isLoading: boolean;
  suggestedQuestions: string[];
}

const ChatMessageContent: React.FC<{ text: string }> = ({ text }) => {
    const isList = text.split('\n').some(line => line.trim().startsWith('*'));

    if (isList) {
        return (
            <ul className="space-y-1">
                {text.split('\n').map((line, index) => {
                    const trimmedLine = line.trim();
                    if (trimmedLine.startsWith('*')) {
                        return <li key={index} className="list-disc list-inside">{trimmedLine.substring(1).trim()}</li>;
                    }
                    return line ? <p key={index}>{line}</p> : null;
                })}
            </ul>
        );
    }

    return <p className="whitespace-pre-wrap">{text}</p>;
};


const ChatInterface: React.FC<ChatInterfaceProps> = ({ chatHistory, onSendMessage, isLoading, suggestedQuestions }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [chatHistory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleSuggestionClick = (question: string) => {
    if (!isLoading) {
        onSendMessage(question);
    }
  };

  return (
    <div className="bg-white border border-stone-200 rounded-2xl shadow-sm flex flex-col h-[75vh] max-h-[800px]">
      <div className="p-4 border-b border-stone-200 flex items-center gap-3">
        <ChatIcon />
        <h2 className="text-xl font-semibold text-stone-700">3. Design Assistant</h2>
      </div>
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {chatHistory.map((msg) => (
          <div key={msg.id} className={`flex items-end gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.sender === 'ai' && <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex-shrink-0"></div>}
            <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2.5 rounded-2xl ${
                msg.sender === 'user' ? 'bg-emerald-500 text-white rounded-br-none' : 
                msg.sender === 'ai' ? 'bg-stone-100 text-stone-800 rounded-bl-none' :
                'bg-transparent text-center w-full text-sm text-stone-500 italic'
            }`}>
              <ChatMessageContent text={msg.text} />
            </div>
          </div>
        ))}
        {isLoading && (
            <div className="flex items-end gap-2.5 justify-start">
                 <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex-shrink-0 animate-pulse"></div>
                 <div className="bg-stone-100 rounded-2xl p-3">
                    <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-stone-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                        <div className="w-2 h-2 bg-stone-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                        <div className="w-2 h-2 bg-stone-400 rounded-full animate-pulse"></div>
                    </div>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {suggestedQuestions.length > 0 && !isLoading && (
        <div className="px-4 pt-3 pb-2 border-t border-stone-200">
            <p className="text-xs text-stone-500 mb-2 font-semibold uppercase tracking-wider">Suggestions</p>
            <div className="flex flex-wrap gap-2">
                {suggestedQuestions.map((q, i) => (
                    <button 
                        key={i}
                        onClick={() => handleSuggestionClick(q)}
                        className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-full text-sm font-medium transition-all duration-200 ease-in-out hover:bg-emerald-100 hover:border-emerald-300"
                    >
                       {q}
                    </button>
                ))}
            </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-4 border-t border-stone-200">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g., Make the rug blue..."
            className="w-full bg-stone-100 border border-stone-300 text-stone-800 rounded-full py-3 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-emerald-600 text-white rounded-full p-2.5 hover:bg-emerald-500 disabled:bg-stone-400 disabled:cursor-not-allowed transition-colors"
            aria-label="Send message"
          >
            <SendIcon />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface;