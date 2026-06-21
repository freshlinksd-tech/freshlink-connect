/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSocialPlatform } from '../context/SocialPlatformContext';
import { User, Message } from '../types';
import { db } from '../lib/firebase';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { 
  Send, 
  User as UserIcon, 
  Search, 
  MoreVertical, 
  MapPin, 
  Compass, 
  Check,
  CheckCheck,
  Zap,
  Clock,
  Edit3,
  Trash2
} from 'lucide-react';

interface ChatProps {
  onSelectUser: (userId: string) => void;
  targetChatUserId: string | null;
  setTargetChatUserId: (userId: string | null) => void;
}

const CHAT_AUTO_REPLIES: Record<string, string[]> = {
  user_alice: [
    "Compiling an LLM adapter model right now! Quick break. How is the feed treating your custom articles?",
    "Hey! That is quite fascinating. In custom neural architecture terms, we call that weight alignment. What specs are you training on?",
    "Fascinating insights. Let me test running that logic in Python. Talk soon!",
    "Offline for a local CPU sync, but let's schedule an AI chat segment tomorrow!"
  ],
  user_bob: [
    "Hey! Just pulling over in Patagonia to capture some high-aperture raw frames. What is going on?",
    " Fitz Roy has a massive storm coming in, so we are packing up the camera gear. Did you check out my latest Patagonian travel-log?",
    "Hah, that is travel adventure life for you! Carry extra gas canisters, that is the gold standard.",
    "Breathtaking landscapes. I will upload high-res presets files of this trip tonight. Talk in a bit!"
  ],
  user_charlie: [
    "Just finished an active recovery block! High protein salmon sandwich in hand. Let's talk training macro routines.",
    "Progressive overload is literally the answer to almost 95% of athletic growth halts! What is your squat weight looking like?",
    "Haha! Master the core multi-joint lifts first, avoid fancy machine noise. Keep crushing!",
    "Preparing my personal gym roster. Stay dedicated and consistent!"
  ],
  user_david: [
    "Kneading a sourdough pre-ferment poolish as we speak! Yeast science is incredible. What is cooking?",
    " domestic standard kitchen ovens can peak-shine with baking stones or cast-irons on max temperature! Give it a try.",
    "Haha, culinary techniques must remain accessible to all! Let me know if you need the macro breakdown.",
    "Busy slice-and-dicing ingredients for a gourmet tasting session. Let's chat recipes soon!"
  ]
};

export const Chat: React.FC<ChatProps> = ({ onSelectUser, targetChatUserId, setTargetChatUserId }) => {
  const {
    currentUser,
    users,
    sendMessage,
    getChatRooms,
    getMessagesWith,
    messages,
    markMessagesAsRead,
    setActiveChatPartnerId,
    editMessage,
    deleteMessage
  } = useSocialPlatform();

  const [activeContactId, setActiveContactId] = useState<string | null>(null);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [typeMessage, setTypeMessage] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingMessageText, setEditingMessageText] = useState('');

  // Synchronize active partner in context
  useEffect(() => {
    if (setActiveChatPartnerId) {
      setActiveChatPartnerId(activeContactId);
    }
    return () => {
      if (setActiveChatPartnerId) {
        setActiveChatPartnerId(null);
      }
    };
  }, [activeContactId, setActiveChatPartnerId]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Synchronize when outer parent passes a user (e.g. from Feed layout "chat shortcut")
  useEffect(() => {
    if (targetChatUserId) {
      setActiveContactId(targetChatUserId);
      setTargetChatUserId(null); // Reset after consumption
    }
  }, [targetChatUserId, setTargetChatUserId]);

  const activeContact = useMemo(() => {
    return users.find(u => u.id === activeContactId) || null;
  }, [activeContactId, users]);

  const chatRooms = useMemo(() => {
    return getChatRooms();
  }, [getChatRooms, currentUser, activeContactId]);

  const conversation = useMemo(() => {
    if (!activeContactId) return [];
    return getMessagesWith(activeContactId);
  }, [getMessagesWith, activeContactId, currentUser]);

  // Scroll to bottom on message updates
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  // Mark messages as read/seen when conversation is loaded or updated
  useEffect(() => {
    if (activeContactId && markMessagesAsRead) {
      markMessagesAsRead(activeContactId);
    }
  }, [activeContactId, conversation.length, markMessagesAsRead]);

  // Filter contacts lists based on query
  const filteredUsers = useMemo(() => {
    if (!currentUser) return [];
    return users.filter(u => 
      u.id !== currentUser.id && 
      u.name.toLowerCase().includes(chatSearchQuery.toLowerCase())
    );
  }, [users, currentUser, chatSearchQuery]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeMessage.trim() || !activeContactId || !currentUser) return;

    const textToSend = typeMessage.trim();
    setTypeMessage('');

    sendMessage(activeContactId, textToSend).then((sentMsg) => {
      // Trigger simulated sequence for seed influencers
      if (activeContactId.startsWith('user_')) {
        const id = sentMsg.id;
        // 1. Simulate "delivered" after 1 second
        setTimeout(async () => {
          try {
            const msgRef = doc(db, 'messages', id);
            await updateDoc(msgRef, { status: 'delivered' });
          } catch (err) {
            console.error("Error setting delivered status:", err);
          }
        }, 1000);

        // 2. Simulate "seen" after 2.5 seconds
        setTimeout(async () => {
          try {
            const msgRef = doc(db, 'messages', id);
            await updateDoc(msgRef, { status: 'seen', read: true });
          } catch (err) {
            console.error("Error setting seen status:", err);
          }
        }, 2500);

        // 3. Start typing at 3 seconds, reply at 4.5 seconds
        setTimeout(() => {
          setReplyLoading(true);
        }, 3000);

        setTimeout(async () => {
          const responses = CHAT_AUTO_REPLIES[activeContactId];
          const randomReply = responses 
            ? responses[Math.floor(Math.random() * responses.length)] 
            : "Awesome! Let me read and get back to you.";
          
          try {
            const msgId = `msg_${Date.now()}`;
            const replyMsg: Message = {
              id: msgId,
              senderId: activeContactId,
              receiverId: currentUser.id,
              message: randomReply,
              createdAt: new Date().toISOString(),
              read: false,
              status: 'sent'
            };
            await setDoc(doc(db, 'messages', msgId), replyMsg);
          } catch (err) {
            console.error("Failed to post automated response message:", err);
          } finally {
            setReplyLoading(false);
          }
        }, 4500);
      }
    }).catch(err => {
      console.error("Failed to send message:", err);
    });
  };

  // Keep state matching when data change events occur
  const [, forceUpdate] = useState({});
  useEffect(() => {
    const handleSync = () => {
      forceUpdate({});
      window.location.reload();
    };
    window.addEventListener('nexus-data-changed', handleSync);
    return () => window.removeEventListener('nexus-data-changed', handleSync);
  }, []);

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center max-w-sm mx-auto h-full" id="unauth-chat-cover">
        <div className="w-16 h-16 bg-[#F8F7F4] border border-black flex items-center justify-center text-black mb-4">
          <MoreVertical className="w-6 h-6" />
        </div>
        <h3 className="font-sans font-black text-lg text-black uppercase tracking-wider">Secure Chat Rooms</h3>
        <p className="text-black/60 text-xs mt-2 leading-relaxed">
          Please select one of our demo characters or register your own profile to chat with travel bloggers, food chefs and AI engineers in real-time.
        </p>
      </div>
    );
  }

  return (
    <div className="flex bg-white border border-black rounded-none overflow-hidden h-[85vh] max-w-5xl mx-auto select-none" id="chat-dashboard-container">
      
      {/* Sidebar panel */}
      <aside className="w-80 border-r border-[#1A1A1A]/10 flex flex-col h-full shrink-0 bg-white">
        <div className="p-4 border-b border-black/10 space-y-3">
          <h3 className="font-sans font-black text-xs uppercase tracking-widest text-black">Conversations</h3>
          
          {/* Quick search contacts */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40" />
            <input
              type="text"
              id="chat-search-input"
              value={chatSearchQuery}
              onChange={(e) => setChatSearchQuery(e.target.value)}
              placeholder="Filter inbox & contacts..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-none border border-black/15 outline-none focus:border-black font-mono uppercase bg-[#F8F7F4]/50 transition-all text-black"
            />
          </div>
        </div>

        {/* Rooms scrolling pane */}
        <div className="flex-1 overflow-y-auto divide-y divide-black/5" id="chat-rooms-list bg-[#F8F7F4]/10">
          {chatSearchQuery.trim() === '' ? (
            /* Main room threads */
            chatRooms.length > 0 ? (
              chatRooms.map((room) => {
                const isActive = activeContactId === room.user.id;
                const isSentByMe = room.lastMessage.senderId === currentUser.id;
                const unreadInRoom = messages.filter(
                  msg => msg.senderId === room.user.id && msg.receiverId === currentUser.id && !msg.read
                ).length;

                return (
                  <button
                    key={room.user.id}
                    id={`chat-room-tab-${room.user.id}`}
                    onClick={() => setActiveContactId(room.user.id)}
                    className={`w-full p-4 flex items-start gap-3 text-left transition-all relative border-b border-black/5 ${
                      isActive 
                        ? 'bg-orange-600/5 border-l-2 border-l-orange-600' 
                        : 'hover:bg-[#F8F7F4]/40 bg-white'
                    }`}
                  >
                    <img
                      src={room.user.profileImage}
                      alt={room.user.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-none object-cover border border-black shrink-0 grayscale hover:grayscale-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-black uppercase text-black truncate tracking-wide">{room.user.name}</p>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {unreadInRoom > 0 && (
                            <span className="bg-orange-600 text-white font-mono text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                              {unreadInRoom}
                            </span>
                          )}
                          <span className="text-[9px] text-black/45 font-mono uppercase">
                            {new Date(room.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                      <p className={`text-[11px] truncate mt-0.5 ${unreadInRoom > 0 ? 'font-extrabold text-black' : 'text-[#1A1A1A]/70'}`} id={`last-message-${room.user.id}`}>
                        {isSentByMe ? 'You: ' : ''}{room.lastMessage.message}
                      </p>
                    </div>
                  </button>
                );
              })
            ) : (
              /* No rooms. Suggest starting chat from directory list below */
              <p className="text-[10px] text-black/45 uppercase font-mono text-center py-8 leading-relaxed px-4">
                Chat inbox empty. Select an active contact below.
              </p>
            )
          ) : null}

          {/* Directory Contact List */}
          <div className="p-4 bg-[#F8F7F4]/60">
            <span className="text-[10px] font-mono tracking-widest font-black text-black/50 uppercase">
              Directory Contacts ({filteredUsers.length})
            </span>
            <div className="space-y-1 mt-2.5">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((u) => {
                  const unreadInUser = messages.filter(
                    msg => msg.senderId === u.id && msg.receiverId === currentUser.id && !msg.read
                  ).length;

                  return (
                    <button
                      key={u.id}
                      id={`contact-list-btn-${u.id}`}
                      onClick={() => {
                        setActiveContactId(u.id);
                        setChatSearchQuery('');
                      }}
                      className="w-full flex items-center gap-2 p-2.5 rounded-none text-xs hover:bg-white text-black transition-all border border-black/5 hover:border-black"
                    >
                      <img
                        src={u.profileImage}
                        alt={u.name}
                        referrerPolicy="no-referrer"
                        className="w-6 h-6 rounded-none object-cover border border-black shrink-0"
                      />
                      <span className="truncate font-bold uppercase tracking-wider text-[10px]">{u.name}</span>
                      {unreadInUser > 0 && (
                        <span className="ml-auto bg-orange-605/10 text-orange-650 font-mono text-[8px] font-black tracking-tighter px-2 py-0.5 rounded-full shrink-0">
                          {unreadInUser} NEW
                        </span>
                      )}
                    </button>
                  );
                })
              ) : (
                <p className="text-[9px] text-black/40 font-mono uppercase py-2">No users found.</p>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Conversation Thread pane */}
      <main className="flex-1 bg-[#F8F7F4]/20 flex flex-col h-full min-w-0" id="main-conversation-thread">
        {activeContact ? (
          <>
            {/* Header info */}
            <header className="bg-white border-b border-black/10 p-4 px-6 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={activeContact.profileImage}
                  alt={activeContact.name}
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-none object-cover border border-black cursor-pointer shrink-0"
                  onClick={() => onSelectUser(activeContact.id)}
                />
                <div className="min-w-0">
                  <h4 
                    className="text-xs font-black uppercase tracking-wider text-black hover:underline cursor-pointer truncate"
                    onClick={() => onSelectUser(activeContact.id)}
                  >
                    {activeContact.name}
                  </h4>
                  <p className="text-[11px] text-black/60 truncate mt-0.5">
                    {activeContact.bio}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-1.5 shrink-0 bg-black text-white border border-transparent px-2.5 py-1 text-[9px] font-mono tracking-wider font-extrabold uppercase">
                <Zap className="w-3 h-3 text-orange-500 animate-pulse" />
                <span>Simulation active</span>
              </div>
            </header>

            {/* Message log wrapper */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white/40" id="chat-messages-scroll-area">
              <div className="text-center py-2" id="decryption-warning">
                <span className="bg-[#F8F7F4] border border-black/10 font-mono text-[9px] text-[#1A1A1A]/50 tracking-widest uppercase px-3.5 py-1">
                  Fully Decrypted Client-Side Simulator
                </span>
              </div>

              {conversation.map((msg) => {
                const isMyMessage = msg.senderId === currentUser.id;
                return (
                  <div
                    key={msg.id}
                    id={`msg-bubble-${msg.id}`}
                    className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'} group`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl p-3.5 border text-xs leading-relaxed relative ${
                        isMyMessage
                          ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
                          : 'bg-zinc-100 border-zinc-200/60 text-zinc-800'
                      }`}
                    >
                      {/* Message Editing Controls */}
                      {isMyMessage && (
                        <div className="absolute -top-3.5 right-2 flex items-center gap-1 bg-white border border-zinc-200 shadow-sm rounded-md px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingMessageId(msg.id);
                              setEditingMessageText(msg.message);
                            }}
                            className="p-0.5 text-zinc-500 hover:text-orange-600 transition cursor-pointer"
                            title="Edit message"
                          >
                            <Edit3 className="w-2.5 h-2.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteMessage(msg.id)}
                            className="p-0.5 text-zinc-500 hover:text-red-650 transition cursor-pointer"
                            title="Delete message"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      )}

                      {editingMessageId === msg.id ? (
                        <div className="space-y-1.5 min-w-[200px]">
                          <textarea
                            value={editingMessageText}
                            onChange={(e) => setEditingMessageText(e.target.value)}
                            className="w-full p-2 outline-none border border-zinc-200 rounded-lg text-xs text-zinc-800 bg-white"
                            rows={2}
                            autoFocus
                          />
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingMessageId(null);
                                setEditingMessageText('');
                              }}
                              className="px-2 py-0.5 bg-zinc-100 hover:bg-zinc-250 text-zinc-750 text-[8px] font-bold uppercase rounded cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                if (!editingMessageText.trim()) return;
                                await editMessage(msg.id, editingMessageText.trim());
                                setEditingMessageId(null);
                                setEditingMessageText('');
                              }}
                              className="px-2 py-0.5 bg-orange-600 hover:bg-orange-700 text-white text-[8px] font-bold uppercase rounded cursor-pointer"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">
                          {msg.message}
                          {msg.updatedAt && (
                            <span className="text-[7.5px] font-medium font-mono text-zinc-400 opacity-85 ml-1.5 uppercase tracking-wide">
                              (edited)
                            </span>
                          )}
                        </p>
                      )}

                      <div className="flex items-center justify-end gap-1.5 mt-1 text-[9px] opacity-75 font-mono">
                        <span>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isMyMessage && (
                          <span className="flex items-center gap-0.5">
                            {(() => {
                              const status = msg.status || (msg.read ? 'seen' : 'sent');
                              if (status === 'seen' || msg.read) {
                                return (
                                  <span className="flex items-center gap-0.5 text-orange-400" title="Seen by receiver">
                                    <CheckCheck className="w-3 h-3 text-orange-400" />
                                    <span className="text-[7.5px] uppercase">seen</span>
                                  </span>
                                );
                              } else if (status === 'delivered') {
                                return (
                                  <span className="flex items-center gap-0.5 text-zinc-400" title="Delivered to receiver">
                                    <CheckCheck className="w-3 h-3 text-zinc-400" />
                                    <span className="text-[7.5px] uppercase">delivered</span>
                                  </span>
                                );
                              } else {
                                return (
                                  <span className="flex items-center gap-0.5 text-zinc-405" title="Sent to servers">
                                    <Check className="w-3 h-3 text-zinc-450" />
                                    <span className="text-[7.5px] uppercase">sent</span>
                                  </span>
                                );
                              }
                            })()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Bot replying spinner */}
              {replyLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-black/15 rounded-none p-3 px-4 shadow-none flex items-center gap-2">
                    <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 bg-orange-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 bg-orange-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 bg-orange-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-[9px] text-black/50 font-mono uppercase tracking-wider italic">typing...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input message form bar */}
            <form onSubmit={handleSend} className="p-4 bg-white border-t border-black/10 flex gap-2 shrink-0">
              <input
                type="text"
                required
                id="chat-message-input"
                value={typeMessage}
                onChange={(e) => setTypeMessage(e.target.value)}
                placeholder={`Type message to ${activeContact.name.split(' ')[0]}...`}
                className="flex-1 px-4 py-2.5 bg-[#F8F7F4]/50 border border-black/15 outline-none text-xs text-black focus:bg-white focus:border-black font-sans rounded-none transition-all"
              />
              <button
                type="submit"
                id="chat-send-btn"
                className="px-5 bg-black hover:bg-black/95 text-white font-black uppercase tracking-widest text-[10px] rounded-none flex items-center justify-center gap-1.5 transition-all shrink-0"
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </>
        ) : (
          /* Empty Chat landing page */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[#F8F7F4]/30" id="empty-chat-landing">
            <div className="w-16 h-16 bg-[#F8F7F4] border border-black flex items-center justify-center text-black mb-3">
              <Compass className="w-7 h-7 text-orange-600" />
            </div>
            <h4 className="font-sans font-black text-sm text-black uppercase tracking-wider leading-tight">No Chat Selected</h4>
            <p className="text-black/50 text-[11px] mt-1.5 max-w-sm leading-relaxed uppercase font-mono">
              Open a conversation thread with active developers and travel writers from the sidebar or choose one from the directory to start chatting!
            </p>
          </div>
        )}
      </main>
    </div>
  );
};
