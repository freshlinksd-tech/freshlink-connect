import React, { useState } from 'react';
import { useSocialPlatform } from '../context/SocialPlatformContext';
import { Megaphone, X, ThumbsUp, ThumbsDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const BroadcastBanner: React.FC = () => {
  const { 
    notifications, 
    currentUser, 
    submitPollAnswer, 
    markNotificationAsRead 
  } = useSocialPlatform();

  // Filter only active, unread, or unvoted system announcements/polls for the current user
  const activeBroadcasts = currentUser && notifications 
    ? notifications.filter(
        (n) => 
          n.userId === currentUser.id && 
          n.type === 'system' && 
          (!n.read || (n.isPoll && !n.pollAnswer))
      )
    : [];

  if (activeBroadcasts.length === 0) return null;

  return (
    <div className="w-full space-y-3 mb-6" id="broadcast-banners-container">
      <AnimatePresence mode="popLayout">
        {activeBroadcasts.map((broadcast) => (
          <motion.div
            key={broadcast.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-3xl p-5 md:p-6 shadow-md shadow-orange-600/10 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-orange-500/30"
            id={`broadcast-banner-${broadcast.id}`}
          >
            <div className="flex items-start gap-4 flex-1">
              <div className="bg-white/15 p-2.5 rounded-2xl shrink-0 mt-0.5">
                <Megaphone className="w-5 h-5 text-amber-100" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-black tracking-widest text-orange-200 block">
                  {broadcast.isPoll ? '📢 Live Creator Poll' : '📢 Urgent Broadcast Alert'}
                </span>
                <p className="font-sans font-bold text-sm md:text-base leading-snug tracking-tight max-w-3xl">
                  {broadcast.message}
                </p>
                {broadcast.createdAt && (
                  <span className="text-[10px] text-orange-200/80 font-semibold block">
                    {new Date(broadcast.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 self-end md:self-center flex-wrap">
              {broadcast.isPoll && (
                <div className="flex items-center gap-2 flex-wrap">
                  {broadcast.pollAnswer ? (
                    <div className="bg-white/25 px-4 py-2 rounded-xl flex items-center gap-1.5 text-xs font-black uppercase tracking-wider">
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span>Answered: {broadcast.pollAnswer}</span>
                    </div>
                  ) : (
                    <>
                      {((broadcast.pollOptions && broadcast.pollOptions.length > 0)
                        ? broadcast.pollOptions
                        : ['Yes', 'No']
                      ).map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => submitPollAnswer(broadcast.id, option)}
                          className="bg-white hover:bg-zinc-50 text-orange-700 px-4.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer"
                          id={`poll-option-${broadcast.id}-${option.replace(/\s+/g, '-').toLowerCase()}`}
                        >
                          <span>{option}</span>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={() => markNotificationAsRead(broadcast.id)}
                className="bg-black/15 hover:bg-black/25 text-white p-2.5 rounded-2xl transition-all cursor-pointer border border-white/5"
                title="Dismiss announcement"
                id={`dismiss-broadcast-${broadcast.id}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
