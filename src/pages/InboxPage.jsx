import { useState, useRef, useEffect } from "react";
import {
  FaPaperPlane,
  FaSearch,
  FaArrowLeft,
  FaCheck,
  FaCheckDouble
} from "react-icons/fa";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

export default function Inbox() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  // ================= LOAD CONVERSATIONS =================
  useEffect(() => {
    if (!user) return;
    fetchConversations();
  }, [user]);

  const fetchConversations = async () => {
    try {
      // Get all unique people this user has messaged or received from
      const { data, error } = await supabase
        .from("messages")
        .select("sender_id, receiver_id, text, created_at, seen")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get unique conversation partners
      const partnerIds = [...new Set(
        data.map(m => m.sender_id === user.id ? m.receiver_id : m.sender_id)
      )];

      if (partnerIds.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      // Get profiles of conversation partners
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", partnerIds);

      if (profileError) throw profileError;

      // Build conversations list
      const convos = profiles.map(profile => {
        const lastMsg = data.find(m =>
          m.sender_id === profile.id || m.receiver_id === profile.id
        );
        return {
          id: profile.id,
          name: profile.full_name || "User",
          lastMessage: lastMsg?.text || "",
          seen: lastMsg?.seen || false,
        };
      });

      setConversations(convos);
    } catch (err) {
      console.error("Fetch conversations error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  // ================= LOAD MESSAGES =================
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

      // Mark messages as seen
      await supabase
        .from("messages")
        .update({ seen: true })
        .eq("sender_id", partnerId)
        .eq("receiver_id", user.id)
        .eq("seen", false);

    } catch (err) {
      console.error("Fetch messages error:", err.message);
    }
  };

  // ================= REAL-TIME MESSAGES =================
  useEffect(() => {
    if (!activeChat || !user) return;

    fetchMessages(activeChat.id);

    const channel = supabase
      .channel(`messages_${activeChat.id}_${user.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `receiver_id=eq.${user.id}`,
      }, (payload) => {
        if (payload.new.sender_id === activeChat.id) {
          setMessages(prev => [...prev, payload.new]);
          // Mark as seen immediately
          supabase
            .from("messages")
            .update({ seen: true })
            .eq("id", payload.new.id);
        }
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [activeChat, user]);

  // ================= AUTO SCROLL =================
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ================= SEND MESSAGE =================
  const sendMessage = async () => {
    if (!message.trim() || !activeChat || !user) return;

    const newMsg = {
      sender_id: user.id,
      receiver_id: activeChat.id,
      text: message.trim(),
      seen: false,
    };

    try {
      const { data, error } = await supabase
        .from("messages")
        .insert(newMsg)
        .select()
        .single();

      if (error) throw error;

      setMessages(prev => [...prev, data]);
      setMessage("");
      fetchConversations();
    } catch (err) {
      console.error("Send message error:", err.message);
    }
  };

  // ================= STATUS ICON =================
  const renderStatus = (msg) => {
    if (msg.sender_id !== user.id) return null;
    if (msg.seen) return <FaCheckDouble className="text-blue-400 text-xs" />;
    return <FaCheck className="text-white/50 text-xs" />;
  };

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filtered = conversations.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

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
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent outline-none text-sm w-full text-white"
            />
          </div>
        </div>

        {/* CHAT LIST */}
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
                  <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center font-bold text-sm">
                    {chat.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm">{chat.name}</h3>
                    <p className="text-xs text-white/50 truncate">{chat.lastMessage}</p>
                  </div>
                </div>
              </div>
            ))
          )}
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
              <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center font-bold">
                {activeChat.name[0]}
              </div>
              <div>
                <h2 className="font-semibold">{activeChat.name}</h2>
                <p className="text-xs text-green-400">Active</p>
              </div>
            </div>

            {/* MESSAGES */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
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

            {/* INPUT */}
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