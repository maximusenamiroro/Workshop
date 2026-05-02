import { useState, useRef, useEffect, useCallback } from "react";
import { FaPaperPlane, FaSearch, FaArrowLeft, FaCheck, FaCheckDouble } from "react-icons/fa";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";

export default function Inbox() {
  const { user, role } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);
  const activeChatRef = useRef(null);
  const messageChannelRef = useRef(null);
  const inputRef = useRef(null);

  // Keep activeChatRef in sync
  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  // Init — handle ?user= param
  useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams(location.search);
    const targetUserId = params.get("user");
    init(targetUserId);
  }, [user, location.search]);

  const init = async (targetUserId) => {
    await fetchConversations();

    if (targetUserId && targetUserId !== "null" && targetUserId !== "undefined") {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, country, role")
        .eq("id", targetUserId)
        .maybeSingle();

      if (profile) {
        const chatObj = buildChatObj(profile);
        setConversations(prev => {
          const exists = prev.find(c => c.id === profile.id);
          if (!exists) return [chatObj, ...prev];
          return prev;
        });
        setActiveChat(chatObj);
      }
    }
  };

  const buildChatObj = (profile, extras = {}) => ({
    id: profile.id,
    name: profile.full_name || "User",
    avatar_url: profile.avatar_url || null,
    country: profile.country || null,
    role: profile.role || null,
    lastMessage: extras.lastMessage || "",
    seen: extras.seen || false,
    unread: extras.unread || 0,
    lastTime: extras.lastTime || "",
  });

  // Global real-time listener — for incoming messages from anyone
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`inbox_global_${user.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `receiver_id=eq.${user.id}`,
      }, async (payload) => {
        const newMsg = payload.new;
        const currentChat = activeChatRef.current;

        if (currentChat?.id === newMsg.sender_id) {
          // Chat is open with this sender — add message instantly and mark seen
          setMessages(prev => {
            // Avoid duplicates
            if (prev.find(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          // Mark seen immediately
          await supabase
            .from("messages")
            .update({ seen: true })
            .eq("id", newMsg.id);
          // Update conversation last message
          setConversations(prev =>
            prev.map(c =>
              c.id === newMsg.sender_id
                ? { ...c, lastMessage: newMsg.text, lastTime: newMsg.created_at, unread: 0 }
                : c
            )
          );
        } else {
          // Different chat — update badge + preview
          setConversations(prev => {
            const exists = prev.find(c => c.id === newMsg.sender_id);
            if (exists) {
              return prev.map(c =>
                c.id === newMsg.sender_id
                  ? {
                      ...c,
                      lastMessage: newMsg.text,
                      lastTime: newMsg.created_at,
                      unread: (c.unread || 0) + 1,
                      seen: false,
                    }
                  : c
              ).sort((a, b) => new Date(b.lastTime) - new Date(a.lastTime));
            } else {
              // New conversation — fetch their profile and add
              fetchConversations();
              return prev;
            }
          });
        }
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user]);

  // Per-chat real-time listener — also listens for seen status updates on sent messages
  useEffect(() => {
    if (!activeChat || !user) return;

    // Clean up previous channel
    if (messageChannelRef.current) {
      supabase.removeChannel(messageChannelRef.current);
      messageChannelRef.current = null;
    }

    // Fetch messages for this chat
    fetchMessages(activeChat.id);

    // Subscribe to seen status updates on messages I sent
    const channel = supabase
      .channel(`chat_seen_${user.id}_${activeChat.id}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "messages",
        filter: `sender_id=eq.${user.id}`,
      }, (payload) => {
        const updated = payload.new;
        if (updated.receiver_id === activeChat.id) {
          setMessages(prev =>
            prev.map(m => m.id === updated.id ? { ...m, seen: updated.seen } : m)
          );
        }
      })
      .subscribe();

    messageChannelRef.current = channel;

    return () => {
      if (messageChannelRef.current) {
        supabase.removeChannel(messageChannelRef.current);
        messageChannelRef.current = null;
      }
    };
  }, [activeChat?.id, user]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("sender_id, receiver_id, text, created_at, seen")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const partnerIds = [...new Set(
        (data || []).map(m => m.sender_id === user.id ? m.receiver_id : m.sender_id)
      )];

      if (partnerIds.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, country, role")
        .in("id", partnerIds);

      const unreadCounts = {};
      (data || []).forEach(m => {
        if (m.receiver_id === user.id && !m.seen) {
          unreadCounts[m.sender_id] = (unreadCounts[m.sender_id] || 0) + 1;
        }
      });

      const convos = (profiles || []).map(profile => {
        const lastMsg = (data || []).find(m =>
          m.sender_id === profile.id || m.receiver_id === profile.id
        );
        return buildChatObj(profile, {
          lastMessage: lastMsg?.text || "",
          seen: lastMsg?.seen || false,
          unread: unreadCounts[profile.id] || 0,
          lastTime: lastMsg?.created_at || "",
        });
      });

      convos.sort((a, b) => new Date(b.lastTime) - new Date(a.lastTime));
      setConversations(convos);
    } catch (err) {
      console.error("Fetch conversations error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (partnerId) => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("id, sender_id, receiver_id, text, seen, created_at")
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`
        )
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Mark all received messages as seen
      await supabase
        .from("messages")
        .update({ seen: true })
        .eq("sender_id", partnerId)
        .eq("receiver_id", user.id)
        .eq("seen", false);

      // Clear unread badge for this conversation
      setConversations(prev =>
        prev.map(c => c.id === partnerId ? { ...c, unread: 0 } : c)
      );
    } catch (err) {
      console.error("Fetch messages error:", err.message);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !activeChat || !user || sending) return;

    const text = message.trim();

    // Optimistic UI — add message immediately like WhatsApp
    const tempId = `temp_${Date.now()}`;
    const tempMsg = {
      id: tempId,
      sender_id: user.id,
      receiver_id: activeChat.id,
      text,
      seen: false,
      created_at: new Date().toISOString(),
      _sending: true, // flag to show sending state
    };

    setMessages(prev => [...prev, tempMsg]);
    setMessage("");
    inputRef.current?.focus();

    // Update conversation preview immediately
    setConversations(prev =>
      prev.map(c =>
        c.id === activeChat.id
          ? { ...c, lastMessage: text, lastTime: tempMsg.created_at }
          : c
      ).sort((a, b) => new Date(b.lastTime) - new Date(a.lastTime))
    );

    setSending(true);
    try {
      const { data, error } = await supabase
        .from("messages")
        .insert({
          sender_id: user.id,
          receiver_id: activeChat.id,
          text,
          seen: false,
        })
        .select()
        .single();

      if (error) throw error;

      // Replace temp message with real one from DB
      setMessages(prev =>
        prev.map(m => m.id === tempId ? { ...data, _sending: false } : m)
      );
    } catch (err) {
      console.error("Send message error:", err.message);
      // Remove failed message and restore input
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setMessage(text); // restore what they typed
    } finally {
      setSending(false);
    }
  };

  const goToProfile = (chat) => {
    if (chat.role === "worker") navigate(`/seller-profile/${chat.id}`);
  };

  const renderStatus = (msg) => {
    if (msg.sender_id !== user.id) return null;
    if (msg._sending) return <span className="text-white/30 text-xs">⏱</span>;
    if (msg.seen) return <FaCheckDouble className="text-blue-400 text-xs" />;
    return <FaCheck className="text-white/50 text-xs" />;
  };

  const formatTime = (dateStr) =>
    new Date(dateStr).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  const formatLastTime = (dateStr) => {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    if (diff < 60000) return "now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const Avatar = ({ name, avatar_url, size = "w-10 h-10", textSize = "text-sm" }) => (
    <div className={`${size} rounded-full overflow-hidden bg-green-600 flex items-center justify-center font-bold ${textSize} flex-shrink-0`}>
      {avatar_url ? (
        <img src={avatar_url} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span className="text-white">{name?.[0] || "?"}</span>
      )}
    </div>
  );

  const filtered = conversations.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full overflow-hidden bg-[#0f0f0f] text-white flex">

      {/* CONVERSATION LIST */}
      <div className={`${activeChat ? "hidden md:flex" : "flex"} flex-col w-full md:w-[35%] border-r border-white/10 h-full`}>

        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Inbox</h2>
          {conversations.filter(c => c.unread > 0).length > 0 && (
            <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
              {conversations.reduce((sum, c) => sum + (c.unread || 0), 0)} new
            </span>
          )}
        </div>

        {/* Search */}
        <div className="p-3">
          <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-xl">
            <FaSearch className="text-white/50 flex-shrink-0" />
            <input
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent outline-none text-sm w-full text-white placeholder-gray-500"
            />
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center mt-10">
              <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center mt-16 text-gray-500">
              <p className="text-3xl mb-2">💬</p>
              <p className="text-sm">No conversations yet</p>
            </div>
          ) : (
            filtered.map((chat) => (
              <div
                key={chat.id}
                onClick={() => setActiveChat(chat)}
                className={`px-4 py-3 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors ${
                  activeChat?.id === chat.id ? "bg-white/10" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    <Avatar name={chat.name} avatar_url={chat.avatar_url} />
                    {chat.unread > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-[9px] font-bold">
                          {chat.unread > 9 ? "9+" : chat.unread}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <h3 className={`text-sm truncate ${
                        chat.unread > 0 ? "font-bold text-white" : "font-medium text-white/80"
                      }`}>
                        {chat.name}
                      </h3>
                      <span className="text-[10px] text-white/30 ml-2 flex-shrink-0">
                        {formatLastTime(chat.lastTime)}
                      </span>
                    </div>
                    {chat.country && (
                      <p className="text-[10px] text-gray-500">📍 {chat.country}</p>
                    )}
                    <p className={`text-xs truncate mt-0.5 ${
                      chat.unread > 0 ? "text-white/80 font-medium" : "text-white/40"
                    }`}>
                      {chat.lastMessage || "No messages yet"}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* CHAT SCREEN */}
      <div className={`${activeChat ? "flex" : "hidden md:flex"} flex-col flex-1 h-full overflow-hidden`}>
        {activeChat ? (
          <>
            {/* Chat header */}
            <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3 flex-shrink-0 bg-[#0f0f0f]">
              <button
                className="md:hidden p-2 text-gray-400 hover:text-white active:scale-90 transition"
                onClick={() => setActiveChat(null)}
              >
                <FaArrowLeft />
              </button>

              <button
                onClick={() => goToProfile(activeChat)}
                className="flex items-center gap-3 flex-1 text-left min-w-0"
              >
                <Avatar name={activeChat.name} avatar_url={activeChat.avatar_url} />
                <div className="min-w-0">
                  <h2 className="font-semibold text-white text-sm">{activeChat.name}</h2>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-green-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block" />
                      Active
                    </span>
                    {activeChat.country && (
                      <span className="text-[10px] text-gray-500">· 📍 {activeChat.country}</span>
                    )}
                    {activeChat.role === "worker" && (
                      <span className="text-[10px] text-blue-400">· View Profile →</span>
                    )}
                  </div>
                </div>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <p className="text-4xl mb-3">👋</p>
                  <p className="text-sm">Say hello to {activeChat.name}!</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = msg.sender_id === user.id;
                  const prevMsg = messages[idx - 1];
                  const showTime = !prevMsg || 
                    new Date(msg.created_at) - new Date(prevMsg.created_at) > 5 * 60 * 1000;

                  return (
                    <div key={msg.id}>
                      {/* Time separator */}
                      {showTime && (
                        <div className="flex justify-center my-2">
                          <span className="text-[10px] text-white/25 bg-white/5 px-3 py-1 rounded-full">
                            {formatTime(msg.created_at)}
                          </span>
                        </div>
                      )}

                      <div className={`flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"}`}>
                        {/* Avatar for received messages */}
                        {!isMe && (
                          <Avatar
                            name={activeChat.name}
                            avatar_url={activeChat.avatar_url}
                            size="w-6 h-6"
                            textSize="text-[10px]"
                          />
                        )}

                        <div className={`max-w-[72%] ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                            isMe
                              ? "bg-green-600 text-white rounded-br-sm"
                              : "bg-white/10 text-white rounded-bl-sm"
                          } ${msg._sending ? "opacity-70" : ""}`}>
                            {msg.text}
                          </div>

                          {/* Delivery status — only for sent messages */}
                          {isMe && (
                            <div className="flex items-center gap-1 mt-0.5 px-1">
                              {renderStatus(msg)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-3 py-3 border-t border-white/10 flex gap-2 items-end flex-shrink-0 bg-[#0f0f0f]">
              <input
                ref={inputRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-white/8 border border-white/10 px-4 py-3 rounded-2xl outline-none text-sm text-white placeholder-gray-500 focus:border-green-500/50 transition"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />
              <button
                onClick={sendMessage}
                disabled={!message.trim() || sending}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:opacity-50 p-3 rounded-2xl transition active:scale-90 flex-shrink-0"
              >
                <FaPaperPlane size={16} className="text-white" />
              </button>
            </div>
          </>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center text-white/30">
            <div className="text-center">
              <p className="text-5xl mb-3">💬</p>
              <p className="text-sm">Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}