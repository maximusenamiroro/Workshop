import { useState, useRef, useEffect } from "react";
import {
  FaPaperPlane,
  FaSearch,
  FaArrowLeft,
  FaCheck,
  FaCheckDouble
} from "react-icons/fa";

// ================= MOCK USERS =================
const mockChats = [
  {
    id: 1,
    name: "John Seller",
    online: true,
    typing: false,
    messages: [
      { from: "them", text: "Hello 👋", status: "seen" },
      { from: "me", text: "Hi!", status: "seen" },
      { from: "them", text: "Your order is on the way", status: "delivered" }
    ]
  }
];

export default function Inbox() {
  const [chats, setChats] = useState(mockChats);
  const [activeChat, setActiveChat] = useState(null);
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef(null);

  // ================= AUTO SCROLL =================
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat]);

  // ================= SIMULATE TYPING =================
  useEffect(() => {
    if (!activeChat) return;

    let typingTimeout;

    if (isTyping) {
      typingTimeout = setTimeout(() => {
        setChats((prev) =>
          prev.map((chat) =>
            chat.id === activeChat.id
              ? { ...chat, typing: true }
              : chat
          )
        );
      }, 500);

      // stop typing
      setTimeout(() => {
        setChats((prev) =>
          prev.map((chat) =>
            chat.id === activeChat.id
              ? { ...chat, typing: false }
              : chat
          )
        );
      }, 2000);
    }

    return () => clearTimeout(typingTimeout);
  }, [isTyping]);

  // ================= SEND MESSAGE =================
  const sendMessage = () => {
    if (!message.trim() || !activeChat) return;

    const newMsg = {
      from: "me",
      text: message,
      status: "sent"
    };

    const updatedChats = chats.map((chat) => {
      if (chat.id === activeChat.id) {
        return {
          ...chat,
          messages: [...chat.messages, newMsg]
        };
      }
      return chat;
    });

    setChats(updatedChats);
    setMessage("");

    // simulate delivered + seen
    setTimeout(() => updateStatus("delivered"), 1000);
    setTimeout(() => updateStatus("seen"), 2000);
  };

  const updateStatus = (status) => {
    setChats((prev) =>
      prev.map((chat) => {
        if (chat.id === activeChat.id) {
          const updatedMessages = chat.messages.map((msg, i) =>
            i === chat.messages.length - 1 && msg.from === "me"
              ? { ...msg, status }
              : msg
          );

          return { ...chat, messages: updatedMessages };
        }
        return chat;
      })
    );
  };

  // ================= STATUS ICON =================
  const renderStatus = (status) => {
    if (status === "sent") return <FaCheck className="text-white/50 text-xs" />;
    if (status === "delivered") return <FaCheckDouble className="text-white/50 text-xs" />;
    if (status === "seen") return <FaCheckDouble className="text-[#007AFF] text-xs" />;
  };

  return (
    <div className="flex h-screen bg-[#0f0f0f] text-white">

      {/* ================= CHAT LIST ================= */}
      <div className={`${activeChat ? "hidden md:flex" : "flex"} flex-col w-full md:w-[30%] border-r border-white/10`}>

        <div className="p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold">Inbox</h2>
        </div>

        {/* SEARCH */}
        <div className="p-3">
          <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-xl">
            <FaSearch className="text-white/50" />
            <input
              placeholder="Search..."
              className="bg-transparent outline-none text-sm w-full"
            />
          </div>
        </div>

        {/* CHAT LIST */}
        <div className="flex-1 overflow-y-auto">
          {chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => setActiveChat(chat)}
              className="p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer"
            >
              <h3>{chat.name}</h3>
              <p className="text-sm text-white/50">
                {chat.typing ? "Typing..." : chat.messages.at(-1)?.text}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ================= CHAT SCREEN ================= */}
      <div className={`${activeChat ? "flex" : "hidden md:flex"} flex-col flex-1`}>

        {activeChat ? (
          <>
            {/* HEADER */}
            <div className="p-4 border-b border-white/10 flex items-center gap-3">
              <button className="md:hidden" onClick={() => setActiveChat(null)}>
                <FaArrowLeft />
              </button>

              <div>
                <h2>{activeChat.name}</h2>
                <p className="text-xs text-white/50">
                  {activeChat.typing
                    ? "typing..."
                    : activeChat.online
                    ? "Online"
                    : "Offline"}
                </p>
              </div>
            </div>

            {/* MESSAGES */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {activeChat.messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.from === "me" ? "justify-end" : "justify-start"}`}>
                  <div className={`px-4 py-2 rounded-2xl max-w-[70%] text-sm ${
                    msg.from === "me" ? "bg-[#007AFF]" : "bg-white/10"
                  }`}>
                    {msg.text}

                    {msg.from === "me" && (
                      <div className="flex justify-end mt-1">
                        {renderStatus(msg.status)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* INPUT */}
            <div className="p-3 border-t border-white/10 flex gap-2">
              <input
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  setIsTyping(true);
                }}
                placeholder="Type a message..."
                className="flex-1 bg-white/5 px-4 py-2 rounded-full outline-none text-sm"
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />

              <button
                onClick={sendMessage}
                className="bg-[#007AFF] px-4 rounded-full"
              >
                <FaPaperPlane />
              </button>
            </div>
          </>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center text-white/40">
            Select a chat
          </div>
        )}
      </div>
    </div>
  );
}