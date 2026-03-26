import React, { useState } from 'react';
import InboxList from '../components/inbox/InboxList';
import ChatWindow from '../components/inbox/ChatWindow';

const InboxPage = () => {
  const [selectedChat, setSelectedChat] = useState(null);

  const handleSelectChat = (chat) => {
    console.log("✅ Chat selected:", chat?.name); // This will help us debug
    setSelectedChat(chat);
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">

      {/* Left Sidebar - Inbox List */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex flex-col overflow-hidden">
        <InboxList 
          onSelectChat={handleSelectChat}     // ← Must be passed here
          selectedChatId={selectedChat?.id} 
        />
      </div>

      {/* Right Side - Chat Window */}
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-950">
        {selectedChat ? (
          <ChatWindow chat={selectedChat} />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-7xl mb-6">💬</div>
              <h2 className="text-3xl font-semibold mb-2">No conversation selected</h2>
              <p className="text-gray-500">Click on a user from the left to open chat</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InboxPage;