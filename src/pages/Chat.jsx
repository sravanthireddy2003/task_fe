import React, { useState } from 'react';
import { Plus, Send } from 'lucide-react';

// Helper to format timestamp
const formatTime = (date) => {
  const d = new Date(date);
  return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
};

const Chat = () => {
  // ---------------- STATIC DATA ----------------
  const initialThreads = [
    {
      id: 'c1',
      title: 'Project Kickoff',
      participants: ['Alice', 'Bob', 'Charlie'],
      messages: [
        { sender: 'Alice', text: 'Kickoff meeting at 10 AM.', time: Date.now() - 3600000 },
        { sender: 'Bob', text: 'I will prepare the agenda.', time: Date.now() - 3500000 },
        { sender: 'Charlie', text: 'I can share the roadmap.', time: Date.now() - 3400000 },
      ],
      unread: 0,
    },
    {
      id: 'c2',
      title: 'Design Feedback',
      participants: ['Alice', 'Bob'],
      messages: [
        { sender: 'Bob', text: 'The mockups look great!', time: Date.now() - 7200000 },
        { sender: 'Alice', text: 'Thanks! Updating prototype.', time: Date.now() - 7100000 },
      ],
      unread: 2,
    },
  ];

  // ---------------- STATE ----------------
  const [threads, setThreads] = useState(initialThreads);
  const [activeThread, setActiveThread] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [showAddThread, setShowAddThread] = useState(false);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadParticipants, setNewThreadParticipants] = useState('');

  // ---------------- HANDLERS ----------------
  const handleSelectThread = (thread) => {
    setActiveThread(thread);
    // Mark messages as read
    const updatedThreads = threads.map((t) =>
      t.id === thread.id ? { ...t, unread: 0 } : t
    );
    setThreads(updatedThreads);
    setShowAddThread(false);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    const updatedThread = { ...activeThread };
    updatedThread.messages.push({ sender: 'You', text: newMessage, time: Date.now() });
    setActiveThread(updatedThread);

    const updatedThreads = threads.map((t) =>
      t.id === updatedThread.id ? updatedThread : t
    );
    setThreads(updatedThreads);
    setNewMessage('');
  };

  const handleAddThread = () => {
    if (!newThreadTitle.trim()) return;
    const newThread = {
      id: `c_${Date.now()}`,
      title: newThreadTitle,
      participants: newThreadParticipants
        ? newThreadParticipants.split(',').map((p) => p.trim())
        : [],
      messages: [],
      unread: 0,
    };
    setThreads([newThread, ...threads]);
    setActiveThread(newThread);
    setNewThreadTitle('');
    setNewThreadParticipants('');
    setShowAddThread(false);
  };

  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 h-screen bg-gray-50">

      {/* ---------------- THREAD LIST ---------------- */}
      <div className="md:col-span-1 flex flex-col border rounded-lg bg-white shadow">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">Chat Threads</h2>
          <button
            onClick={() => setShowAddThread(!showAddThread)}
            className="p-2 rounded-full hover:bg-gray-100"
            title="Add Thread"
          >
            <Plus size={18} />
          </button>
        </div>

        {/* Add Thread Form */}
        {showAddThread && (
          <div className="p-4 border-b bg-gray-50 space-y-2">
            <input
              type="text"
              value={newThreadTitle}
              onChange={(e) => setNewThreadTitle(e.target.value)}
              placeholder="Thread title"
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <input
              type="text"
              value={newThreadParticipants}
              onChange={(e) => setNewThreadParticipants(e.target.value)}
              placeholder="Participants (comma separated)"
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              onClick={handleAddThread}
              className="w-full bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700"
            >
              Create Thread
            </button>
          </div>
        )}

        <ul className="flex-1 overflow-y-auto p-4 space-y-3">
          {threads.map((t) => (
            <li
              key={t.id}
              className={`p-3 rounded-lg cursor-pointer flex flex-col justify-between relative ${activeThread?.id === t.id
                  ? 'bg-blue-50 border border-blue-400'
                  : 'hover:bg-gray-50'
                }`}
              onClick={() => handleSelectThread(t)}
            >
              <div className="font-medium">{t.title}</div>
              <div className="text-xs text-gray-500 truncate">
                {t.messages[t.messages.length - 1]?.text || 'No messages yet'}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {t.participants.length} participant{t.participants.length > 1 ? 's' : ''}
              </div>
              {t.unread > 0 && (
                <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {t.unread}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* ---------------- MESSAGE PANEL ---------------- */}
      <div className="md:col-span-2 flex flex-col border rounded-lg bg-white shadow">
        {activeThread ? (
          <>
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">{activeThread.title}</h2>
              <p className="text-sm text-gray-500">
                Participants: {activeThread.participants.join(', ') || 'None'}
              </p>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-3 flex flex-col">
              {activeThread.messages.length === 0 && (
                <div className="text-gray-400 self-center mt-10">No messages yet</div>
              )}
              {activeThread.messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg max-w-xs flex flex-col ${m.sender === 'You' ? 'bg-blue-100 self-end' : 'bg-gray-100 self-start'
                    }`}
                >
                  <div className="text-sm font-medium">{m.sender}</div>
                  <div className="text-sm">{m.text}</div>
                  <div className="text-xs text-gray-500 self-end mt-1">
                    {formatTime(m.time)}
                  </div>
                </div>
              ))}

            </div>

            <div className="p-4 border-t flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                onClick={handleSendMessage}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Send size={16} /> Send
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Select a thread to view messages
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
