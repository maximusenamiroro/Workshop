const dummyChats = [
  {
    id: 1,
    name: "John Doe",
    avatar: "https://i.pravatar.cc/150?img=1",
    lastMessage: "Hey, can we reschedule the meeting?",
    lastMessageTime: "10:32 AM",
    unread: 2,
    messages: [
      { id: 101, text: "Hi there!", sender: "them", time: "09:15 AM" },
      { id: 102, text: "Hey, can we reschedule the meeting?", sender: "them", time: "10:32 AM" },
    ]
  },
  {
    id: 2,
    name: "Sarah Chen",
    avatar: "https://i.pravatar.cc/150?img=5",
    lastMessage: "The design looks amazing! 🔥",
    lastMessageTime: "Yesterday",
    unread: 0,
    messages: []
  },
  // Add more chats...
];

export default dummyChats;