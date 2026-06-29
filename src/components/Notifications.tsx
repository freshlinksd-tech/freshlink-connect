/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useSocialPlatform } from '../context/SocialPlatformContext';
import { Bell, Check, Trash2, ShieldCheck, MessageCircle, Heart, UserPlus, Coins } from 'lucide-react';
import { motion } from 'motion/react';

export const Notifications: React.FC = () => {
  const { 
    notifications, 
    markNotificationAsRead, 
    markAllNotificationsAsRead, 
    submitPollAnswer,
    currentUser 
  } = useSocialPlatform();

  const userNotifications = notifications.filter(n => n.userId === currentUser?.id);
  const unreadCount = userNotifications.filter(n => !n.read).length;

  const getNotificationIcon = (msg: string) => {
    const text = msg.toLowerCase();
    if (text.includes('like') || text.includes('liked')) {
      return <Heart className="w-4 h-4 text-rose-500" />;
    }
    if (text.includes('comment') || text.includes('commented')) {
      return <MessageCircle className="w-4 h-4 text-blue-500" />;
    }
    if (text.includes('follow') || text.includes('following')) {
      return <UserPlus className="w-4 h-4 text-emerald-500" />;
    }
    if (text.includes('coin') || text.includes('tip') || text.includes('tipping') || text.includes('payment') || text.includes('payout')) {
      return <Coins className="w-4 h-4 text-amber-500" />;
    }
    return <Bell className="w-4 h-4 text-orange-500" />;
  };

  return (
    <div className="h-full bg-zinc-50/50 flex flex-col overflow-hidden max-w-7xl mx-auto p-4 md:p-8 space-y-6" id="notifications-dashboard">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200/60 pb-5">
        <div>
          <h1 className="font-sans font-black text-2xl uppercase tracking-tight text-zinc-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-orange-600 animate-pulse" />
            Activity Center
          </h1>
          <p className="text-zinc-500 text-xs mt-1">
            Stay updated with comments, likes, clearances, and tipping notifications.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllNotificationsAsRead}
            className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-orange-600 text-white font-sans font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-orange-700 transition cursor-pointer shadow-md shadow-orange-500/10"
          >
            <Check className="w-4 h-4" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* Main Alert Feed */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-3">
        {userNotifications.length === 0 ? (
          <div className="p-16 text-center bg-white border border-zinc-200/80 rounded-3xl shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-zinc-50 border border-zinc-150 flex items-center justify-center mx-auto mb-4 text-zinc-300">
              <Bell className="w-7 h-7" />
            </div>
            <h3 className="font-sans font-bold text-sm text-zinc-700">All Quiet For Now</h3>
            <p className="text-zinc-400 text-xs mt-1 max-w-xs mx-auto">
              You will see activity alerts here when users interact with your blogs, tip your contributions or follow you!
            </p>
          </div>
        ) : (
          <div className="bg-white border border-zinc-200/65 rounded-3xl overflow-hidden shadow-xs divide-y divide-zinc-100">
            {[...userNotifications]
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
              .map((notif, index) => {
                const isUnread = !notif.read;
                return (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.05, 0.4), duration: 0.2 }}
                    onClick={() => {
                      if (isUnread) markNotificationAsRead(notif.id);
                    }}
                    className={`flex items-start gap-4 p-4 hover:bg-zinc-50/50 transition-all cursor-pointer relative ${
                      isUnread ? 'bg-orange-50/[0.15]' : 'opacity-85'
                    }`}
                  >
                    {/* Unread Glowing bar on left side */}
                    {isUnread && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-600 rounded-r-md" />
                    )}

                    {/* Sender Avatar / Action Icon wrapper */}
                    <div className="relative shrink-0">
                      {notif.senderImage ? (
                        <img
                          src={notif.senderImage}
                          alt={notif.senderName}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-full object-cover border border-zinc-200 shadow-xs"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center font-bold text-zinc-650 text-sm font-sans">
                          {notif.senderName ? notif.senderName.slice(0, 1).toUpperCase() : '?'}
                        </div>
                      )}
                      
                      {/* Floating type indicator icon */}
                      <div className="absolute -bottom-1 -right-1 p-1 bg-white rounded-full border border-zinc-250 shadow-xs">
                        {getNotificationIcon(notif.message)}
                      </div>
                    </div>

                    {/* Text block */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-sans font-bold text-xs text-zinc-900 block truncate">
                          {notif.senderName || 'Notification'}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono shrink-0">
                          {new Date(notif.createdAt).toLocaleDateString(undefined, { 
                            month: 'short', 
                            day: 'numeric', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                      
                      <p className="font-sans text-xs text-zinc-650 mt-1 leading-normal select-none">
                        {notif.message}
                      </p>

                      {notif.isPoll && (
                        <div className="mt-3 bg-zinc-50 border border-zinc-150 p-3.5 rounded-xl space-y-2 max-w-sm">
                          <p className="text-[9px] font-sans font-bold uppercase tracking-wider text-zinc-450 block">
                            Interactive Poll Question
                          </p>
                          {notif.pollAnswer ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-zinc-700">
                                Your response:
                              </span>
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-orange-50 text-orange-700 border border-orange-100">
                                {notif.pollAnswer.toUpperCase()}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 pt-1 flex-wrap">
                              {((notif.pollOptions && notif.pollOptions.length > 0)
                                ? notif.pollOptions
                                : ['Yes', 'No']
                              ).map((option) => (
                                <button
                                  key={option}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    submitPollAnswer(notif.id, option);
                                  }}
                                  className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-sans font-bold text-[9px] uppercase tracking-wider rounded-lg transition-all cursor-pointer shadow-sm shadow-orange-650/10"
                                >
                                  {option}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Ping Indicator dot for unread inline items */}
                    {isUnread && (
                      <span className="relative flex h-2 w-2 shrink-0 mt-2 self-start mr-1">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-600"></span>
                      </span>
                    )}
                  </motion.div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
};
