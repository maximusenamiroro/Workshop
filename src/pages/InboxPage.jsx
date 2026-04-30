import { useState, useRef, useEffect } from "react";
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
  const messagesEndRef = useRef(null);
  const activeChatRef = useRef(null);

  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  useEffect(() => {
    if (!user) return;

    const params = new URLSearchParams(location.search);
    const targetUserId = params.get("user");

    const init = async () => {
      await fetchConversations();

      if (targetUserId && targetUserId !== "null" && targetUserId !== "undefined") {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url, country, role")
          .eq("id", targetUserId)
          .maybeSingle();

        if (profile) {
          const chatObj = {
            id: profile.id,
            name: profile.full_name || "User",
            avatar_url: profile.avatar_url || null,
            country: profile.country || null,
            role: profile.role || null,
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

  // Real-time incoming messages
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

        if (activeChatRef.current?.id === newMsg.sender_id) {
          setMessages(prev => [...prev, newMsg]);
          await supabase.from("messages").update({ seen: true }).eq("id", newMsg.id);
        } else {
          setConversations(prev => {
            const exists = prev.find(c => c.id === newMsg.sender_id);
            if (exists) {
              return prev.map(c =>
                c.id === newMsg.sender_id
                  ? { ...c, lastMessage: newMsg.text, unread: (c.unread || 0) + 1 }
                  : c
              );
            } else {
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
        return {
          id: profile.id,
          name: profile.full_name || "User",
          avatar_url: profile.avatar_url || null,
          country: profile.country || null,
          role: profile.role || null,
          lastMessage: lastMsg?.text || "",
          seen: lastMsg?.seen || false,
          unread: unreadCounts[profile.id] || 0,
          lastTime: lastMsg?.created_at || "",
        };
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

      await supabase
        .from("messages")
        .update({ seen: true })
        .eq("sender_id", partnerId)
        .eq("receiver_id", user.id)
        .eq("seen", false);

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

      setConversations(prev =>
        prev.map(c =>
          c.id === activeChat.id
            ? { ...c, lastMessage: data.text, lastTime: data.created_at }
            : c
        )
      );
    } catch (err) {
      console.error("Send message error:", err.message);
      alert("Failed to send: " + err.message);
    }
  };

  const goToProfile = (chat) => {
    if (chat.role === "worker") {
      navigate(`/seller-profile/${chat.id}`);
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
    <div className="h-full overflow-hidden bg-[#0f0f0f] text-white flex flex-col">

      {/* CHAT LIST */}
      <div className={`${activeChat ? "hidden md:flex" : "flex"} flex-col w-full md:w-[35%] border-r border-white/10 h-full`}>
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
                  <div className="relative">
                    <Avatar name={chat.name} avatar_url={chat.avatar_url} />
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
                    {chat.country && (
                      <p className="text-[10px] text-gray-500">📍 {chat.country}</p>
                    )}
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
      <div className={`${activeChat ? "flex" : "hidden md:flex"} flex-col flex-1 h-full`}>
        {activeChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-white/10 flex items-center gap-3">
              <button className="md:hidden" onClick={() => setActiveChat(null)}>
                <FaArrowLeft />
              </button>

              <button
                onClick={() => goToProfile(activeChat)}
                className="flex items-center gap-3 flex-1 text-left"
              >
                <Avatar
                  name={activeChat.name}
                  avatar_url={activeChat.avatar_url}
                  size="w-10 h-10"
                />
                <div>
                  <h2 className="font-semibold text-white">{activeChat.name}</h2>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-green-400">Active</p>
                    {activeChat.country && (
                      <p className="text-xs text-gray-500">· 📍 {activeChat.country}</p>
                    )}
                    {activeChat.role === "worker" && (
                      <p className="text-xs text-blue-400">· View Profile →</p>
                    )}
                  </div>
                </div>
              </button>
            </div>

            {/* Messages Area - This is the scrolling part */}
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

            {/* Input Area */}
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