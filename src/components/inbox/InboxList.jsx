import React from 'react';
import dummyChats from '../../data/dummyMessages';

const InboxList = ({ onSelectChat, selectedChatId }) => {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-5 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-semibold mb-4">Inbox</h2>
        <input
          type="text"
          placeholder="Search messages..."
          className="w-full bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {dummyChats.map((chat) => (
          <div
            key={chat.id}
           onClick={() => onSelectChat(chat)}       // ← This calls the function
            className={`px-5 py-4 flex gap-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border-b border-gray-100 dark:border-gray-800 last:border-none
              ${selectedChatId === chat.id ? 'bg-blue-50 dark:bg-blue-950 border-l-4 border-blue-600' : ''}`}
          >
            <div className="w-12 h-12 rounded-2xl overflow-hidden flex-shrink-0">
              {chat.avatar ? (
                <img src={chat.avatar} alt={chat.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-12 h-12 bg-blue-600 text-white flex items-center justify-center text-2xl font-medium">
                  {chat.name.charAt(0)}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <h4 className="font-semibold text-gray-900 dark:text-white truncate pr-2">
                  {chat.name}
                </h4>
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {chat.lastMessageTime}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 truncate mt-1">
                {chat.lastMessage}
              </p>
            </div>

            {chat.unread > 0 && (
              <div className="bg-blue-600 text-white text-xs font-medium w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                {chat.unread}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default InboxList;