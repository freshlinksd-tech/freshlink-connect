import React, { useState } from 'react';
import { useSocialPlatform } from '../context/SocialPlatformContext';
import { Megaphone, Loader2, Users, Sliders } from 'lucide-react';

interface AdminBroadcastCreatorProps {
  onSuccess?: (msg: string) => void;
  onError?: (msg: string) => void;
}

export const AdminBroadcastCreator: React.FC<AdminBroadcastCreatorProps> = ({ onSuccess, onError }) => {
  const { users, currentUser, addNotification } = useSocialPlatform();

  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastTarget, setBroadcastTarget] = useState<'all' | string>('all');
  const [broadcastType, setBroadcastType] = useState<'message' | 'poll'>('message');
  const [pollOptionsText, setPollOptionsText] = useState('Yes, No');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) {
      setErrorMsg('Please enter a message or poll question.');
      if (onError) onError('Please enter a message or poll question.');
      return;
    }

    setIsBroadcasting(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const isPoll = broadcastType === 'poll';
      const pollOptions = isPoll
        ? pollOptionsText
            .split(',')
            .map((o) => o.trim())
            .filter(Boolean)
        : undefined;

      if (broadcastTarget === 'all') {
        const recipients = users.filter((u) => u.id !== currentUser?.id);
        if (recipients.length === 0 && users.length > 0) {
          await addNotification(
            currentUser!.id,
            'system',
            broadcastMessage,
            undefined,
            isPoll,
            pollOptions
          );
        } else {
          for (const user of recipients) {
            await addNotification(
              user.id,
              'system',
              broadcastMessage,
              undefined,
              isPoll,
              pollOptions
            );
          }
        }
        const successStr = `Successfully sent broadcast ${
          isPoll ? 'custom option poll' : 'announcement'
        } to ${Math.max(1, recipients.length)} users!`;
        setSuccessMsg(successStr);
        if (onSuccess) onSuccess(successStr);
      } else {
        const targetUser = users.find((u) => u.id === broadcastTarget);
        if (!targetUser) throw new Error('Target recipient user not found.');

        await addNotification(
          broadcastTarget,
          'system',
          broadcastMessage,
          undefined,
          isPoll,
          pollOptions
        );
        const successStr = `Successfully sent ${
          isPoll ? 'custom option poll' : 'alert'
        } to ${targetUser.name}!`;
        setSuccessMsg(successStr);
        if (onSuccess) onSuccess(successStr);
      }

      setBroadcastMessage('');
    } catch (err: any) {
      const errorStr = err.message || 'Failed to dispatch broadcast.';
      setErrorMsg(errorStr);
      if (onError) onError(errorStr);
    } finally {
      setIsBroadcasting(false);
    }
  };

  // Preset quick button config options
  const handleApplyPreset = (preset: string) => {
    setPollOptionsText(preset);
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-3xl border border-zinc-200 shadow-xs space-y-6" id="admin-broadcast-creator-card">
      <div>
        <h3 className="font-sans font-black text-lg uppercase tracking-tight text-zinc-900 flex items-center gap-2 font-bold">
          <Megaphone className="w-5 h-5 text-orange-600" />
          <span>Interactive Broadcast & Poll Dispatcher</span>
        </h3>
        <p className="text-zinc-500 text-xs mt-1">
          Issue localized alerts or publish interactive surveys with custom button combinations directly to the global user feeds.
        </p>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-4 rounded-xl font-sans font-semibold">
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-xs p-4 rounded-xl font-sans font-semibold">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSendBroadcast} className="space-y-5 font-sans">
        {/* Broadcast Type Selector */}
        <div className="space-y-2">
          <label className="text-[11px] font-sans font-bold text-zinc-500 uppercase tracking-wider block">
            Broadcast Format
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setBroadcastType('message')}
              className={`p-3 rounded-xl border text-xs font-bold font-sans transition-all text-center flex flex-col items-center justify-center gap-1 cursor-pointer ${
                broadcastType === 'message'
                  ? 'border-orange-500 bg-orange-50/50 text-orange-700'
                  : 'border-zinc-200 hover:bg-zinc-50 text-zinc-600'
              }`}
              id="type-selector-announcement"
            >
              <span className="text-base">📢</span>
              <span>Regular Announcement</span>
            </button>
            <button
              type="button"
              onClick={() => setBroadcastType('poll')}
              className={`p-3 rounded-xl border text-xs font-bold font-sans transition-all text-center flex flex-col items-center justify-center gap-1 cursor-pointer ${
                broadcastType === 'poll'
                  ? 'border-orange-500 bg-orange-50/50 text-orange-700'
                  : 'border-zinc-200 hover:bg-zinc-50 text-zinc-600'
              }`}
              id="type-selector-poll"
            >
              <span className="text-base">📊</span>
              <span>Interactive Opinion Poll</span>
            </button>
          </div>
        </div>

        {/* Target Audience Selector */}
        <div className="space-y-2">
          <label className="text-[11px] font-sans font-bold text-zinc-500 uppercase tracking-wider block">
            Select Target Audience
          </label>
          <div className="relative">
            <select
              value={broadcastTarget}
              onChange={(e) => setBroadcastTarget(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 text-xs p-3.5 pl-10 rounded-xl outline-none focus:border-orange-500 font-semibold appearance-none"
              id="broadcast-audience-select"
            >
              <option value="all">📢 All Registered Creators (Global Broadcast)</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  👤 {u.name} ({u.email}) - {u.role || 'user'}
                </option>
              ))}
            </select>
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Message body */}
        <div className="space-y-2">
          <label className="text-[11px] font-sans font-bold text-zinc-500 uppercase tracking-wider block">
            {broadcastType === 'poll' ? 'Poll Question / Statement' : 'Announcement Message'}
          </label>
          <textarea
            value={broadcastMessage}
            onChange={(e) => setBroadcastMessage(e.target.value)}
            placeholder={
              broadcastType === 'poll'
                ? 'e.g., Do you want Freshlinkconnect to include push notifications on devices?'
                : 'e.g., Attention creators: Scheduled platform system maintenance tonight from 1 AM to 3 AM UTC.'
            }
            rows={4}
            required
            className="w-full bg-zinc-50 border border-zinc-200 text-xs p-3.5 rounded-xl outline-none focus:border-orange-500 font-semibold"
            id="broadcast-message-textarea"
          />
        </div>

        {/* Custom Poll Options Creator */}
        {broadcastType === 'poll' && (
          <div className="space-y-3 bg-zinc-50 p-4 rounded-2xl border border-zinc-200/50">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-sans font-bold text-zinc-600 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-orange-600" />
                <span>Custom Interactive Button Labels</span>
              </label>
              <span className="text-[9px] text-zinc-400 font-bold uppercase">Comma Separated</span>
            </div>
            
            <input
              type="text"
              value={pollOptionsText}
              onChange={(e) => setPollOptionsText(e.target.value)}
              placeholder="e.g., Yes, No, Maybe, Not Sure"
              required={broadcastType === 'poll'}
              className="w-full bg-white border border-zinc-200 text-xs p-3 rounded-xl outline-none focus:border-orange-500 font-semibold shadow-2xs"
              id="custom-poll-options-input"
            />
            
            <p className="text-[10px] text-zinc-400 font-sans leading-relaxed">
              Recipients will see these options as interactive voting buttons on the banner.
            </p>

            {/* Quick Presets */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Quick Presets:</span>
              <div className="flex flex-wrap gap-2">
                {[
                  { name: 'Yes / No', val: 'Yes, No' },
                  { name: 'Agreement (Agree / Disagree)', val: 'Agree, Disagree, Neutral' },
                  { name: 'Multi Option (A / B / C)', val: 'Option A, Option B, Option C' },
                  { name: 'Frequency (Daily / Weekly)', val: 'Daily, Weekly, Monthly, Never' }
                ].map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleApplyPreset(preset.val)}
                    className="bg-white hover:bg-zinc-100 text-zinc-700 text-[10px] font-bold px-2.5 py-1.5 rounded-lg border border-zinc-200/60 transition-colors shadow-3xs cursor-pointer"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isBroadcasting}
          className="w-full px-6 py-3.5 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-orange-600/15 uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
          id="send-broadcast-submit-btn"
        >
          {isBroadcasting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Broadcasting Alerts...</span>
            </>
          ) : (
            <span>Send Broadcast & Poll Now</span>
          )}
        </button>
      </form>
    </div>
  );
};
