import React from 'react';

const MessageBubble = ({ message }) => {
  const isMe = message.sender === 'me';

  return (
    <div className={`message ${isMe ? 'message-me' : 'message-them'}`}>
      <div className="message-content">
        <p>{message.text}</p>
        <span className="message-time">{message.time}</span>
      </div>
    </div>
  );
};

export default MessageBubble;