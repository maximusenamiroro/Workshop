import React, { useState, useRef, useEffect } from 'react';

const ChatWindow = ({ chat }) => {
  const [messages, setMessages] = useState(chat.messages || []);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: newMessage.trim(),
      sender: 'me',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');

    // Simulate reply
    setTimeout(() => {
      const replies = ["Got it!", "Thanks 👍", "I'll check that soon.", "Perfect!"];
      const reply = {
        id: Date.now() + 1,
        text: replies[Math.floor(Math.random() * replies.length)],
        sender: 'them',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, reply]);
    }, 700);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex items-center gap-3 flex-shrink-0">
        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
          {chat.avatar ? (
            <img src={chat.avatar} alt={chat.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-10 h-10 bg-blue-600 text-white flex items-center justify-center text-xl font-medium">
              {chat.name.charAt(0)}
            </div>
          )}
        </div>
        <div>
          <h3 className="font-semibold">{chat.name}</h3>
          <p className="text-xs text-green-500 flex items-center gap-1">
            ● Online
          </p>
        </div>
      </div>

      {/* Messages - Scrollable Area */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-gray-50 dark:bg-gray-950">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400">
            Start the conversation...
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] px-4 py-3 rounded-2xl ${
                  msg.sender === 'me'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-white dark:bg-gray-800 shadow-sm rounded-bl-none'
                }`}
              >
                <p className="text-sm">{msg.text}</p>
                <span className="text-[10px] opacity-70 mt-1 block text-right">
                  {msg.time}
                </span>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Always visible and clickable */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex-shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 focus:border-blue-500 rounded-full px-5 py-3 text-sm outline-none"
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-7 py-3 rounded-full font-medium transition-all active:scale-95"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;