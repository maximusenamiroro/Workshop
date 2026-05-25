import { useState, useRef, useEffect, useCallback } from "react";
import {
  FaPaperPlane, FaSearch, FaArrowLeft,
  FaCheck, FaCheckDouble, FaImage,
  FaMicrophone, FaStop, FaTimes, FaPlay, FaPause,
} from "react-icons/fa";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";

const MAX_VOICE_SECONDS = 60;

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

  // Image upload
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef(null);

  // Voice recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState(null);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [playingMsgId, setPlayingMsgId] = useState(null);
  const mediaRecorderRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioPlayersRef = useRef({});

  const messagesEndRef = useRef(null);
  const activeChatRef = useRef(null);
  const messageChannelRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { activeChatRef.current = activeChat; }, [activeChat]);

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
    lastMessageType: extras.lastMessageType || "text",
    seen: extras.seen || false,
    unread: extras.unread || 0,
    lastTime: extras.lastTime || "",
  });

  // Global real-time
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`inbox_global_${user.id}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public",
        table: "messages", filter: `receiver_id=eq.${user.id}`,
      }, async (payload) => {
        const newMsg = payload.new;
        const currentChat = activeChatRef.current;
        if (currentChat?.id === newMsg.sender_id) {
          setMessages(prev => {
            if (prev.find(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          await supabase.from("messages").update({ seen: true }).eq("id", newMsg.id);
          setConversations(prev =>
            prev.map(c =>
              c.id === newMsg.sender_id
                ? { ...c, lastMessage: newMsg.text || "", lastMessageType: newMsg.message_type || "text", lastTime: newMsg.created_at, unread: 0 }
                : c
            )
          );
        } else {
          setConversations(prev => {
            const exists = prev.find(c => c.id === newMsg.sender_id);
            if (exists) {
              return prev.map(c =>
                c.id === newMsg.sender_id
                  ? { ...c, lastMessage: newMsg.text || "", lastMessageType: newMsg.message_type || "text", lastTime: newMsg.created_at, unread: (c.unread || 0) + 1, seen: false }
                  : c
              ).sort((a, b) => new Date(b.lastTime) - new Date(a.lastTime));
            }
            fetchConversations();
            return prev;
          });
        }
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [user]);

  // Per-chat real-time
  useEffect(() => {
    if (!activeChat || !user) return;
    if (messageChannelRef.current) {
      supabase.removeChannel(messageChannelRef.current);
      messageChannelRef.current = null;
    }
    fetchMessages(activeChat.id);
    const channel = supabase
      .channel(`chat_seen_${user.id}_${activeChat.id}`)
      .on("postgres_changes", {
        event: "UPDATE", schema: "public",
        table: "messages", filter: `sender_id=eq.${user.id}`,
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Cleanup voice on unmount
  useEffect(() => {
    return () => {
      stopRecording(true);
      if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
    };
  }, []);

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("sender_id, receiver_id, text, message_type, created_at, seen")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const partnerIds = [...new Set(
        (data || []).map(m => m.sender_id === user.id ? m.receiver_id : m.sender_id)
      )];
      if (partnerIds.length === 0) { setConversations([]); setLoading(false); return; }

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, country, role")
        .in("id", partnerIds);

      const unreadCounts = {};
      (data || []).forEach(m => {
        if (m.receiver_id === user.id && !m.seen)
          unreadCounts[m.sender_id] = (unreadCounts[m.sender_id] || 0) + 1;
      });

      const convos = (profiles || []).map(profile => {
        const lastMsg = (data || []).find(m =>
          m.sender_id === profile.id || m.receiver_id === profile.id
        );
        return buildChatObj(profile, {
          lastMessage: lastMsg?.text || "",
          lastMessageType: lastMsg?.message_type || "text",
          seen: lastMsg?.seen || false,
          unread: unreadCounts[profile.id] || 0,
          lastTime: lastMsg?.created_at || "",
        });
      });

      convos.sort((a, b) => new Date(b.lastTime) - new Date(a.lastTime));
      setConversations(convos);
    } catch (err) {
      console.error("fetchConversations error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (partnerId) => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("id, sender_id, receiver_id, text, message_type, media_url, seen, created_at")
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`
        )
        .order("created_at", { ascending: true });
      if (error) throw error;
      setMessages(data || []);
      await supabase.from("messages").update({ seen: true })
        .eq("sender_id", partnerId).eq("receiver_id", user.id).eq("seen", false);
      setConversations(prev =>
        prev.map(c => c.id === partnerId ? { ...c, unread: 0 } : c)
      );
    } catch (err) {
      console.error("fetchMessages error:", err.message);
    }
  };

  // ── Send text message ──────────────────────────────────────
  const sendMessage = async () => {
    if (!message.trim() || !activeChat || !user || sending) return;
    const text = message.trim();
    const tempId = `temp_${Date.now()}`;
    const tempMsg = {
      id: tempId, sender_id: user.id, receiver_id: activeChat.id,
      text, message_type: "text", media_url: null,
      seen: false, created_at: new Date().toISOString(), _sending: true,
    };
    setMessages(prev => [...prev, tempMsg]);
    setMessage("");
    inputRef.current?.focus();
    setConversations(prev =>
      prev.map(c =>
        c.id === activeChat.id
          ? { ...c, lastMessage: text, lastMessageType: "text", lastTime: tempMsg.created_at }
          : c
      ).sort((a, b) => new Date(b.lastTime) - new Date(a.lastTime))
    );
    setSending(true);
    try {
      const { data, error } = await supabase
        .from("messages")
        .insert({ sender_id: user.id, receiver_id: activeChat.id, text, message_type: "text", seen: false })
        .select().single();
      if (error) throw error;
      setMessages(prev => prev.map(m => m.id === tempId ? { ...data, _sending: false } : m));
    } catch (err) {
      console.error("sendMessage error:", err.message);
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setMessage(text);
    } finally {
      setSending(false);
    }
  };

  // ── Image handling ─────────────────────────────────────────
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    if (!file.type.startsWith("image/")) return;
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > 10) { alert("Image too large — max 10MB"); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const cancelImage = () => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
  };

  const sendImage = async () => {
    if (!imageFile || !activeChat || !user) return;
    setUploadingImage(true);

    const tempId = `temp_img_${Date.now()}`;
    const tempMsg = {
      id: tempId, sender_id: user.id, receiver_id: activeChat.id,
      text: null, message_type: "image", media_url: imagePreview,
      seen: false, created_at: new Date().toISOString(), _sending: true,
    };
    setMessages(prev => [...prev, tempMsg]);
    cancelImage();

    try {
      const ext = imageFile.name.split(".").pop().toLowerCase() || "jpg";
      const fileName = `${user.id}_${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("messages")
        .upload(fileName, imageFile, { cacheControl: "3600", upsert: false, contentType: imageFile.type });
      if (upErr) throw upErr;

      const { data: urlData } = supabase.storage.from("messages").getPublicUrl(fileName);
      const mediaUrl = urlData.publicUrl;

      const { data, error } = await supabase.from("messages")
        .insert({
          sender_id: user.id, receiver_id: activeChat.id,
          text: null, message_type: "image", media_url: mediaUrl, seen: false,
        })
        .select().single();
      if (error) throw error;

      setMessages(prev => prev.map(m => m.id === tempId ? { ...data, _sending: false } : m));
      setConversations(prev =>
        prev.map(c =>
          c.id === activeChat.id
            ? { ...c, lastMessage: "📷 Photo", lastMessageType: "image", lastTime: data.created_at }
            : c
        ).sort((a, b) => new Date(b.lastTime) - new Date(a.lastTime))
      );
    } catch (err) {
      console.error("sendImage error:", err.message);
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } finally {
      setUploadingImage(false);
    }
  };

  // ── Voice recording ────────────────────────────────────────
  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      alert("Voice recording is not supported on this device.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      // Try to get best supported format
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : MediaRecorder.isTypeSupported("audio/ogg")
            ? "audio/ogg"
            : "audio/mp4";

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        setAudioPreviewUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start(100); // collect data every 100ms
      setIsRecording(true);
      setRecordingSeconds(0);

      // Auto-stop at MAX_VOICE_SECONDS
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(prev => {
          if (prev >= MAX_VOICE_SECONDS - 1) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error("startRecording error:", err.message);
      alert("Could not access microphone. Please allow microphone permission.");
    }
  };

  const stopRecording = (silent = false) => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (!silent) setIsRecording(false);
    else { setIsRecording(false); setRecordingSeconds(0); }
  };

  const cancelVoice = () => {
    stopRecording(true);
    setAudioBlob(null);
    if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
    setAudioPreviewUrl(null);
    setRecordingSeconds(0);
  };

  const sendVoice = async () => {
    if (!audioBlob || !activeChat || !user) return;
    setUploadingAudio(true);

    const tempId = `temp_voice_${Date.now()}`;
    const tempMsg = {
      id: tempId, sender_id: user.id, receiver_id: activeChat.id,
      text: null, message_type: "voice", media_url: audioPreviewUrl,
      seen: false, created_at: new Date().toISOString(), _sending: true,
      _duration: recordingSeconds,
    };
    setMessages(prev => [...prev, tempMsg]);

    const blobToUpload = audioBlob;
    const previewToRevoke = audioPreviewUrl;
    setAudioBlob(null);
    setAudioPreviewUrl(null);
    setRecordingSeconds(0);

    try {
      const ext = blobToUpload.type.includes("ogg") ? "ogg"
        : blobToUpload.type.includes("mp4") ? "mp4" : "webm";
      const fileName = `voice_${user.id}_${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("messages")
        .upload(fileName, blobToUpload, {
          cacheControl: "3600", upsert: false,
          contentType: blobToUpload.type,
        });
      if (upErr) throw upErr;

      const { data: urlData } = supabase.storage.from("messages").getPublicUrl(fileName);
      const mediaUrl = urlData.publicUrl;

      const { data, error } = await supabase.from("messages")
        .insert({
          sender_id: user.id, receiver_id: activeChat.id,
          text: null, message_type: "voice", media_url: mediaUrl, seen: false,
        })
        .select().single();
      if (error) throw error;

      setMessages(prev => prev.map(m => m.id === tempId ? { ...data, _sending: false } : m));
      setConversations(prev =>
        prev.map(c =>
          c.id === activeChat.id
            ? { ...c, lastMessage: "🎤 Voice note", lastMessageType: "voice", lastTime: data.created_at }
            : c
        ).sort((a, b) => new Date(b.lastTime) - new Date(a.lastTime))
      );
      URL.revokeObjectURL(previewToRevoke);
    } catch (err) {
      console.error("sendVoice error:", err.message);
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } finally {
      setUploadingAudio(false);
    }
  };

  // ── Audio playback ─────────────────────────────────────────
  const toggleAudioPlay = (msgId, url) => {
    if (playingMsgId === msgId) {
      audioPlayersRef.current[msgId]?.pause();
      setPlayingMsgId(null);
      return;
    }
    // Pause any currently playing
    if (playingMsgId && audioPlayersRef.current[playingMsgId]) {
      audioPlayersRef.current[playingMsgId].pause();
    }
    if (!audioPlayersRef.current[msgId]) {
      const audio = new Audio(url);
      audio.onended = () => setPlayingMsgId(null);
      audioPlayersRef.current[msgId] = audio;
    }
    audioPlayersRef.current[msgId].play().catch(() => {});
    setPlayingMsgId(msgId);
  };

  // ── Helpers ────────────────────────────────────────────────
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

  const formatDuration = (secs) => {
    const s = Math.floor(secs || 0);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  };

  const getLastMessagePreview = (chat) => {
    if (chat.lastMessageType === "image") return "📷 Photo";
    if (chat.lastMessageType === "voice") return "🎤 Voice note";
    return chat.lastMessage || "No messages yet";
  };

  const Avatar = ({ name, avatar_url, size = "w-10 h-10", textSize = "text-sm" }) => (
    <div className={`${size} rounded-full overflow-hidden bg-green-600 flex items-center justify-center font-bold ${textSize} flex-shrink-0`}>
      {avatar_url
        ? <img src={avatar_url} alt={name} className="w-full h-full object-cover" />
        : <span className="text-white">{name?.[0] || "?"}</span>
      }
    </div>
  );

  // ── Render a single message bubble ────────────────────────
  const renderMessage = (msg, idx) => {
    const isMe = msg.sender_id === user.id;
    const prevMsg = messages[idx - 1];
    const showTime = !prevMsg ||
      new Date(msg.created_at) - new Date(prevMsg.created_at) > 5 * 60 * 1000;

    return (
      <div key={msg.id}>
        {showTime && (
          <div className="flex justify-center my-2">
            <span className="text-[10px] text-white/25 bg-white/5 px-3 py-1 rounded-full">
              {formatTime(msg.created_at)}
            </span>
          </div>
        )}

        <div className={`flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"}`}>
          {!isMe && (
            <Avatar
              name={activeChat.name}
              avatar_url={activeChat.avatar_url}
              size="w-6 h-6"
              textSize="text-[10px]"
            />
          )}

          <div className={`max-w-[72%] ${isMe ? "items-end" : "items-start"} flex flex-col`}>
            {/* ── Text message ── */}
            {(!msg.message_type || msg.message_type === "text") && (
              <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                isMe ? "bg-green-600 text-white rounded-br-sm" : "bg-white/10 text-white rounded-bl-sm"
              } ${msg._sending ? "opacity-70" : ""}`}>
                {msg.text}
              </div>
            )}

            {/* ── Image message ── */}
            {msg.message_type === "image" && (
              <div className={`rounded-2xl overflow-hidden ${msg._sending ? "opacity-70" : ""} ${
                isMe ? "rounded-br-sm" : "rounded-bl-sm"
              }`}>
                {msg._sending ? (
                  <div className="w-48 h-48 bg-white/10 flex items-center justify-center rounded-2xl">
                    <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <img
                    src={msg.media_url}
                    alt="Photo"
                    className="max-w-[220px] max-h-[280px] object-cover rounded-2xl cursor-pointer active:scale-95 transition"
                    onClick={() => window.open(msg.media_url, "_blank")}
                    onError={(e) => { e.target.src = ""; }}
                  />
                )}
              </div>
            )}

            {/* ── Voice message ── */}
            {msg.message_type === "voice" && (
              <div className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl min-w-[180px] ${
                isMe ? "bg-green-600 rounded-br-sm" : "bg-white/10 rounded-bl-sm"
              } ${msg._sending ? "opacity-70" : ""}`}>
                <button
                  onClick={() => !msg._sending && toggleAudioPlay(msg.id, msg.media_url)}
                  disabled={msg._sending}
                  className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 active:scale-90 transition"
                >
                  {msg._sending
                    ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : playingMsgId === msg.id
                      ? <FaPause size={12} className="text-white" />
                      : <FaPlay size={12} className="text-white ml-0.5" />
                  }
                </button>
                {/* Waveform bars — decorative */}
                <div className="flex items-center gap-[2px] flex-1">
                  {Array.from({ length: 24 }).map((_, i) => (
                    <div
                      key={i}
                      className={`rounded-full transition-all ${
                        isMe ? "bg-white/60" : "bg-white/40"
                      } ${playingMsgId === msg.id ? "animate-pulse" : ""}`}
                      style={{
                        width: "2px",
                        height: `${Math.max(4, Math.random() * 18 + 4)}px`,
                      }}
                    />
                  ))}
                </div>
                <span className="text-[10px] text-white/60 flex-shrink-0">
                  {msg._duration ? formatDuration(msg._duration) : ""}
                </span>
              </div>
            )}

            {/* Status tick */}
            {isMe && (
              <div className="flex items-center gap-1 mt-0.5 px-1">
                {renderStatus(msg)}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const filtered = conversations.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const hasAttachment = imagePreview || audioBlob;
  const isInputBusy = sending || uploadingImage || uploadingAudio || isRecording;

  return (
    <div className="h-full overflow-hidden bg-[#0f0f0f] text-white flex">

      {/* ── CONVERSATION LIST ── */}
      <div className={`${activeChat ? "hidden md:flex" : "flex"} flex-col w-full md:w-[35%] border-r border-white/10 h-full`}>
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Inbox</h2>
          {conversations.filter(c => c.unread > 0).length > 0 && (
            <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
              {conversations.reduce((sum, c) => sum + (c.unread || 0), 0)} new
            </span>
          )}
        </div>

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
                      {getLastMessagePreview(chat)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── CHAT SCREEN ── */}
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
                messages.map((msg, idx) => renderMessage(msg, idx))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* ── IMAGE PREVIEW BAR ── */}
            {imagePreview && (
              <div className="px-4 py-2 border-t border-white/10 bg-[#0f0f0f] flex items-center gap-3">
                <img src={imagePreview} alt="preview"
                  className="w-16 h-16 object-cover rounded-xl border border-white/20" />
                <div className="flex-1">
                  <p className="text-xs text-gray-400">Ready to send photo</p>
                </div>
                <button onClick={cancelImage}
                  className="p-2 text-gray-500 hover:text-red-400 transition active:scale-90">
                  <FaTimes size={16} />
                </button>
                <button
                  onClick={sendImage}
                  disabled={uploadingImage}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-700 px-4 py-2 rounded-xl text-sm font-semibold transition active:scale-95 flex items-center gap-2"
                >
                  {uploadingImage
                    ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <FaPaperPlane size={13} />
                  }
                  Send
                </button>
              </div>
            )}

            {/* ── VOICE PREVIEW BAR ── */}
            {audioBlob && !isRecording && (
              <div className="px-4 py-2 border-t border-white/10 bg-[#0f0f0f] flex items-center gap-3">
                <div className="flex-1 flex items-center gap-3 bg-white/5 rounded-xl px-3 py-2">
                  <button
                    onClick={() => toggleAudioPlay("preview", audioPreviewUrl)}
                    className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0"
                  >
                    {playingMsgId === "preview"
                      ? <FaPause size={11} className="text-white" />
                      : <FaPlay size={11} className="text-white ml-0.5" />
                    }
                  </button>
                  <span className="text-xs text-gray-400">
                    Voice note · {formatDuration(recordingSeconds)}
                  </span>
                </div>
                <button onClick={cancelVoice}
                  className="p-2 text-gray-500 hover:text-red-400 transition active:scale-90">
                  <FaTimes size={16} />
                </button>
                <button
                  onClick={sendVoice}
                  disabled={uploadingAudio}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-700 px-4 py-2 rounded-xl text-sm font-semibold transition active:scale-95 flex items-center gap-2"
                >
                  {uploadingAudio
                    ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <FaPaperPlane size={13} />
                  }
                  Send
                </button>
              </div>
            )}

            {/* ── RECORDING BAR ── */}
            {isRecording && (
              <div className="px-4 py-2 border-t border-white/10 bg-[#0f0f0f] flex items-center gap-3">
                <div className="flex-1 flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                  <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse flex-shrink-0" />
                  <span className="text-sm text-red-400 font-medium">Recording...</span>
                  <span className="text-xs text-red-400/70 ml-auto">
                    {formatDuration(recordingSeconds)} / {formatDuration(MAX_VOICE_SECONDS)}
                  </span>
                  {/* Progress bar */}
                  <div className="w-16 h-1 bg-red-500/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500 rounded-full transition-all"
                      style={{ width: `${(recordingSeconds / MAX_VOICE_SECONDS) * 100}%` }}
                    />
                  </div>
                </div>
                <button
                  onClick={() => stopRecording()}
                  className="bg-red-500/20 hover:bg-red-500/40 text-red-400 p-3 rounded-xl transition active:scale-90 border border-red-500/30"
                >
                  <FaStop size={14} />
                </button>
              </div>
            )}

            {/* ── INPUT BAR ── */}
            {!imagePreview && !audioBlob && !isRecording && (
              <div className="px-3 py-3 border-t border-white/10 flex gap-2 items-end flex-shrink-0 bg-[#0f0f0f]">

                {/* Hidden image input */}
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageSelect}
                />

                {/* Image button */}
                <button
                  onClick={() => imageInputRef.current?.click()}
                  disabled={isInputBusy}
                  className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-white/8 border border-white/10 hover:bg-white/15 disabled:opacity-50 transition active:scale-90"
                >
                  <FaImage size={16} className="text-white/60" />
                </button>

                {/* Text input */}
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

                {/* Send or mic */}
                {message.trim() ? (
                  <button
                    onClick={sendMessage}
                    disabled={sending}
                    className="flex-shrink-0 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:opacity-50 w-10 h-10 rounded-full flex items-center justify-center transition active:scale-90"
                  >
                    <FaPaperPlane size={15} className="text-white" />
                  </button>
                ) : (
                  <button
                    onMouseDown={startRecording}
                    onTouchStart={(e) => { e.preventDefault(); startRecording(); }}
                    disabled={isInputBusy}
                    className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-white/8 border border-white/10 hover:bg-green-600/20 hover:border-green-500/30 disabled:opacity-50 transition active:scale-90"
                  >
                    <FaMicrophone size={16} className="text-white/60" />
                  </button>
                )}
              </div>
            )}
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