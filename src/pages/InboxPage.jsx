import { useState, useRef, useEffect } from "react";
import { FaPaperPlane, FaSearch, FaArrowLeft, FaCheck, FaCheckDouble } from "react-icons/fa";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { useLocation } from "react-router-dom";

export default function Inbox() {
  const { user } = useAuth();
  const location = useLocation();
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const activeChatRef = useRef(null);

  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  // Handle ?user= param and init
  useEffect(() => {
    if (!user) return;

    const params = new URLSearchParams(location.search);
    const targetUserId = params.get("user");

    const init = async () => {
      await fetchConversations();

      if (targetUserId && targetUserId !== "null" && targetUserId !== "undefined") {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, full_name")
          .eq("id", targetUserId)
          .maybeSingle();

        if (profile) {
          const chatObj = {
            id: profile.id,
            name: profile.full_name || "User",
            lastMessage: "",
            seen: false,
            unread: 0,
          };

          setConversations(prev => {
            const exists = prev.find(c => c.id === profile.id);
            if (!exists) return [chatObj, ...prev];
            return prev;
          });

          setActiveChat(chatObj);
        }
      }
    };

    init();
  }, [user, location.search]);

  // Real-time — listen for new messages and update conversation list
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`inbox_realtime_${user.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `receiver_id=eq.${user.id}`,
      }, async (payload) => {
        const newMsg = payload.new;

        // If chat is open with this sender update messages directly
        if (activeChatRef.current?.id === newMsg.sender_id) {
          setMessages(prev => [...prev, newMsg]);
          // Mark as seen immediately
          await supabase
            .from("messages")
            .update({ seen: true })
            .eq("id", newMsg.id);
        } else {
          // Otherwise update conversation list with unread badge
          setConversations(prev => {
            const exists = prev.find(c => c.id === newMsg.sender_id);
            if (exists) {
              return prev.map(c =>
                c.id === newMsg.sender_id
                  ? { ...c, lastMessage: newMsg.text, unread: (c.unread || 0) + 1 }
                  : c
              );
            } else {
              // New conversation — fetch profile and add
              fetchConversations();
              return prev;
            }
          });
        }
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user]);

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
        .select("id, full_name")
        .in("id", partnerIds);

      // Count unread messages per partner
      const unreadCounts = {};
      (data || []).forEach(m => {
        if (m.receiver_id === user.id && !m.seen) {
          const partnerId = m.sender_id;
          unreadCounts[partnerId] = (unreadCounts[partnerId] || 0) + 1;
        }
      });

      const convos = (profiles || []).map(profile => {
        const lastMsg = (data || []).find(m =>
          m.sender_id === profile.id || m.receiver_id === profile.id
        );
        return {
          id: profile.id,
          name: profile.full_name || "User",
          lastMessage: lastMsg?.text || "",
          seen: lastMsg?.seen || false,
          unread: unreadCounts[profile.id] || 0,
          lastTime: lastMsg?.created_at || "",
        };
      });

      // Sort by latest message
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

      // Mark all as seen
      await supabase
        .from("messages")
        .update({ seen: true })
        .eq("sender_id", partnerId)
        .eq("receiver_id", user.id)
        .eq("seen", false);

      // Clear unread count for this conversation
      setConversations(prev =>
        prev.map(c => c.id === partnerId ? { ...c, unread: 0 } : c)
      );
    } catch (err) {
      console.error("Fetch messages error:", err.message);
    }
  };

  useEffect(() => {
    if (!activeChat || !user) return;
    fetchMessages(activeChat.id);
  }, [activeChat?.id, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!message.trim() || !activeChat || !user) return;
    try {
      const { data, error } = await supabase
        .from("messages")
        .insert({
          sender_id: user.id,
          receiver_id: activeChat.id,
          text: message.trim(),
          seen: false,
        })
        .select()
        .single();

      if (error) throw error;
      setMessages(prev => [...prev, data]);
      setMessage("");

      // Update conversation list with latest message
      setConversations(prev => {
        const exists = prev.find(c => c.id === activeChat.id);
        if (exists) {
          return prev.map(c =>
            c.id === activeChat.id
              ? { ...c, lastMessage: data.text, lastTime: data.created_at }
              : c
          );
        }
        return prev;
      });
    } catch (err) {
      console.error("Send message error:", err.message);
      alert("Failed to send: " + err.message);
    }
  };

  const renderStatus = (msg) => {
    if (msg.sender_id !== user.id) return null;
    if (msg.seen) return <FaCheckDouble className="text-blue-400 text-xs" />;
    return <FaCheck className="text-white/50 text-xs" />;
  };

  const formatTime = (dateStr) =>
    new Date(dateStr).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  const formatLastTime = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    if (diff < 60000) return "now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const filtered = conversations.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-[#0f0f0f] text-white overflow-hidden">

      {/* CHAT LIST */}
      <div className={`${activeChat ? "hidden md:flex" : "flex"} flex-col w-full md:w-[30%] border-r border-white/10`}>
        <div className="p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold">Inbox</h2>
        </div>

        <div className="p-3">
          <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-xl">
            <FaSearch className="text-white/50" />
            <input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent outline-none text-sm w-full text-white"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <p className="text-gray-500 text-sm text-center mt-10">Loading...</p>
          ) : filtered.length === 0 ? (
            <p className="text-gray-500 text-sm text-center mt-10">No conversations yet</p>
          ) : (
            filtered.map((chat) => (
              <div
                key={chat.id}
                onClick={() => setActiveChat(chat)}
                className={`p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer ${
                  activeChat?.id === chat.id ? "bg-white/10" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center font-bold text-sm">
                      {chat.name[0]}
                    </div>
                    {/* Unread badge */}
                    {chat.unread > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          {chat.unread > 9 ? "9+" : chat.unread}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <h3 className={`text-sm ${chat.unread > 0 ? "font-bold text-white" : "font-medium text-white/80"}`}>
                        {chat.name}
                      </h3>
                      <span className="text-xs text-white/30">
                        {formatLastTime(chat.lastTime)}
                      </span>
                    </div>
                    <p className={`text-xs truncate mt-0.5 ${chat.unread > 0 ? "text-white/80 font-medium" : "text-white/40"}`}>
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
      <div className={`${activeChat ? "flex" : "hidden md:flex"} flex-col flex-1`}>
        {activeChat ? (
          <>
            <div className="p-4 border-b border-white/10 flex items-center gap-3">
              <button className="md:hidden" onClick={() => setActiveChat(null)}>
                <FaArrowLeft />
              </button>
              <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center font-bold">
                {activeChat.name[0]}
              </div>
              <div>
                <h2 className="font-semibold">{activeChat.name}</h2>
                <p className="text-xs text-green-400">Active</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <p className="text-center text-gray-500 text-sm mt-10">
                  No messages yet. Say hello! 👋
                </p>
              )}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_id === user.id ? "justify-end" : "justify-start"}`}
                >
                  <div className={`px-4 py-2 rounded-2xl max-w-[70%] text-sm ${
                    msg.sender_id === user.id ? "bg-green-600" : "bg-white/10"
                  }`}>
                    {msg.text}
                    <div className="flex justify-end items-center gap-1 mt-1">
                      <span className="text-xs text-white/40">{formatTime(msg.created_at)}</span>
                      {renderStatus(msg)}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-3 border-t border-white/10 flex gap-2">
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-white/5 px-4 py-2 rounded-full outline-none text-sm text-white"
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <button
                onClick={sendMessage}
                className="bg-green-600 hover:bg-green-700 px-4 rounded-full transition"
              >
                <FaPaperPlane />
              </button>
            </div>
          </>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center text-white/40">
            <div className="text-center">
              <p className="text-4xl mb-3">💬</p>
              <p>Select a conversation</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}