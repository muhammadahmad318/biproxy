'use client';

import React, { useState, useEffect } from 'react';

export interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  sessionTitle: string;
  onSendMessage: (text: string) => void;
  isConnected: boolean;
}

export const ChatDrawer: React.FC<ChatPanelProps> = ({
  isOpen,
  onClose,
  sessionTitle,
  onSendMessage,
  isConnected,
}) => {
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState<{ id: string; text: string; time: string }[]>([]);

  useEffect(() => {
    if (!isConnected) {
      const timer = setTimeout(() => {
        setHistory([]);
        setMessage('');
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [isConnected]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !isConnected) return;

    onSendMessage(message.trim());

    setHistory((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(7),
        text: message.trim(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

    setMessage('');
  };

  return (
    <aside
      className={`bg-neutral-950 lg:bg-neutral-900/80 border-neutral-800 flex flex-col overflow-hidden transition-all duration-300 ease-in-out z-50 lg:z-auto ${isOpen
        ? 'fixed inset-0 w-full h-dvh rounded-none border-0 opacity-100 translate-x-0 lg:relative lg:h-full lg:w-96 lg:flex-none lg:rounded-3xl lg:border lg:ml-4'
        : 'fixed inset-0 w-full h-dvh rounded-none border-0 opacity-0 pointer-events-none translate-x-full lg:relative lg:h-full lg:w-0 lg:translate-x-0 lg:m-0 lg:p-0'
        }`}
    >
      <header className="flex items-center justify-between p-5 border-b border-neutral-800 bg-neutral-900/90 w-full lg:w-96 whitespace-nowrap">
        <div>
          <h2 className="text-sm font-bold text-neutral-100">Live Chat</h2>
          <p className="text-[10px] text-neutral-400 truncate">{sessionTitle}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close chat panel"
          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 w-full lg:w-96">
        {history.length === 0 ? (
          <div className="flex-1 flex flex-col justify-center items-center text-center opacity-50">
            <svg className="w-8 h-8 mb-3 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-xs text-neutral-400">Type a message to the AI.</p>
            <p className="text-[10px] text-neutral-500 mt-1 max-w-50">
              Text is sent instantly to the live voice model.
            </p>
          </div>
        ) : (
          history.map((msg) => (
            <div key={msg.id} className="flex flex-col items-end">
              <div className="bg-blue-600 text-white text-sm px-4 py-2 rounded-2xl rounded-tr-sm max-w-[90%] wrap-break-word shadow-sm">
                {msg.text}
              </div>
              <span className="text-[9px] text-neutral-500 mt-1 mr-1">{msg.time}</span>
            </div>
          ))
        )}
      </div>

      <footer className="p-4 border-t border-neutral-800 bg-neutral-900/90 w-full lg:w-96">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={!isConnected}
            placeholder={isConnected ? "Message the AI..." : "Connect to chat..."}
            className="flex-1 bg-neutral-950 border border-neutral-700/60 rounded-xl px-4 py-2.5 text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!isConnected || !message.trim()}
            className="p-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </footer>
    </aside>
  );
};