import React, { useState, useMemo } from 'react';
import { useSocialPlatform } from '../context/SocialPlatformContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { BarChart3, PieChart as PieIcon, HelpCircle, Users, Percent, Sparkles, CheckCircle2 } from 'lucide-react';

export const PollAnalyticsDashboard: React.FC = () => {
  const { notifications, users } = useSocialPlatform();
  const [activePollIndex, setActivePollIndex] = useState<number>(0);
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');

  // Compute poll data from notifications
  const pollsData = useMemo(() => {
    const systemPolls = notifications.filter(n => n.type === 'system' && n.isPoll);
    
    // Group they by question message text
    const grouped: { [key: string]: { 
      message: string; 
      createdAt: string;
      options: string[];
      votes: { [option: string]: number };
      totalVotes: number;
      totalSent: number;
      respondents: { name: string; email: string; answer: string }[];
    }} = {};
    
    systemPolls.forEach(notif => {
      const key = notif.message;
      if (!grouped[key]) {
        grouped[key] = {
          message: notif.message,
          createdAt: notif.createdAt,
          options: notif.pollOptions && notif.pollOptions.length > 0 
            ? notif.pollOptions 
            : ['Yes', 'No'],
          votes: {},
          totalVotes: 0,
          totalSent: 0,
          respondents: []
        };
        // Initialize vote counts for this poll's defined options
        grouped[key].options.forEach(opt => {
          grouped[key].votes[opt.toLowerCase()] = 0;
        });
      }
      
      grouped[key].totalSent += 1;
      
      if (notif.pollAnswer) {
        const answerLower = notif.pollAnswer.toLowerCase();
        // Dynamic additions just in case options changed
        if (grouped[key].votes[answerLower] === undefined) {
          grouped[key].votes[answerLower] = 0;
          if (!grouped[key].options.map(o => o.toLowerCase()).includes(answerLower)) {
            grouped[key].options.push(notif.pollAnswer);
          }
        }
        grouped[key].votes[answerLower] += 1;
        grouped[key].totalVotes += 1;
        
        const voter = users.find(u => u.id === notif.userId);
        if (voter) {
          grouped[key].respondents.push({
            name: voter.name,
            email: voter.email || 'No email registered',
            answer: notif.pollAnswer
          });
        }
      }
    });
    
    return Object.values(grouped).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [notifications, users]);

  // If there's no poll data
  if (pollsData.length === 0) {
    return (
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-zinc-200 shadow-xs text-center py-12" id="poll-analytics-empty">
        <div className="bg-orange-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
          <BarChart3 className="w-6 h-6 text-orange-500" />
        </div>
        <h3 className="font-sans font-bold text-sm text-zinc-800">No Poll Analytics Available</h3>
        <p className="text-zinc-400 text-xs mt-1 max-w-sm mx-auto font-sans">
          To display metrics, create an interactive system poll broadcast first, allowing registered creators to cast their votes.
        </p>
      </div>
    );
  }

  // Ensure active index is within bounds
  const currentPoll = pollsData[activePollIndex] || pollsData[0];

  // Transform current poll data for Recharts
  const chartData = currentPoll.options.map(opt => {
    const votesCount = currentPoll.votes[opt.toLowerCase()] || 0;
    const pct = currentPoll.totalVotes > 0 ? Math.round((votesCount / currentPoll.totalVotes) * 100) : 0;
    return {
      name: opt,
      Votes: votesCount,
      Percentage: pct
    };
  });

  // Color options for charts
  const COLORS = ['#EA580C', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];

  return (
    <div className="bg-white p-6 md:p-8 rounded-3xl border border-zinc-200 shadow-xs space-y-6" id="poll-analytics-dashboard">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-sans font-black text-lg uppercase tracking-tight text-zinc-900 flex items-center gap-2 font-bold">
            <BarChart3 className="w-5 h-5 text-orange-600" />
            <span>Interactive Poll Analytics Dashboard</span>
          </h3>
          <p className="text-zinc-500 text-xs mt-1">
            Real-time analytics, user consensus models, and response breakdowns.
          </p>
        </div>

        {/* Chart View Selector */}
        <div className="flex bg-zinc-100 p-1.5 rounded-xl border border-zinc-200/40 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setChartType('bar')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              chartType === 'bar' ? 'bg-white text-zinc-800 shadow-xs' : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Bar Chart</span>
          </button>
          <button
            type="button"
            onClick={() => setChartType('pie')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              chartType === 'pie' ? 'bg-white text-zinc-800 shadow-xs' : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <PieIcon className="w-3.5 h-3.5" />
            <span>Pie Chart</span>
          </button>
        </div>
      </div>

      {/* Selector dropdown for active poll */}
      <div className="space-y-1.5 font-sans">
        <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
          Select Poll to Analyze ({pollsData.length} total)
        </label>
        <select
          value={activePollIndex}
          onChange={(e) => setActivePollIndex(Number(e.target.value))}
          className="w-full bg-zinc-50 border border-zinc-200 text-xs p-3.5 rounded-xl outline-none focus:border-orange-500 font-bold text-zinc-800"
          id="active-poll-selector"
        >
          {pollsData.map((poll, i) => (
            <option key={i} value={i}>
              📊 {poll.message.substring(0, 60)}{poll.message.length > 60 ? '...' : ''} ({poll.totalVotes} responses)
            </option>
          ))}
        </select>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-zinc-50 border border-zinc-200/50 rounded-2xl text-center flex flex-col justify-center items-center">
          <Users className="w-5 h-5 text-orange-600 mb-1" />
          <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400">Audience Sent</span>
          <p className="text-xl font-black text-zinc-800">{currentPoll.totalSent}</p>
        </div>
        <div className="p-4 bg-zinc-50 border border-zinc-200/50 rounded-2xl text-center flex flex-col justify-center items-center">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 mb-1" />
          <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400">Total Votes</span>
          <p className="text-xl font-black text-emerald-600">{currentPoll.totalVotes}</p>
        </div>
        <div className="p-4 bg-zinc-50 border border-zinc-200/50 rounded-2xl text-center flex flex-col justify-center items-center">
          <Percent className="w-5 h-5 text-indigo-600 mb-1" />
          <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400">Participation</span>
          <p className="text-xl font-black text-indigo-600">
            {currentPoll.totalSent > 0 ? Math.round((currentPoll.totalVotes / currentPoll.totalSent) * 100) : 0}%
          </p>
        </div>
        <div className="p-4 bg-zinc-50 border border-zinc-200/50 rounded-2xl text-center flex flex-col justify-center items-center">
          <Sparkles className="w-5 h-5 text-amber-600 mb-1" />
          <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400">Top Consensus</span>
          <p className="text-xl font-black text-amber-600 uppercase truncate max-w-[120px]">
            {chartData.sort((a, b) => b.Votes - a.Votes)[0]?.Votes > 0 
              ? chartData[0].name 
              : 'N/A'
            }
          </p>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="bg-zinc-50 border border-zinc-200/50 rounded-2xl p-4 md:p-6" id="poll-recharts-canvas">
        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' ? (
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#71717a', fontSize: 11, fontWeight: 'bold' }} 
                  axisLine={{ stroke: '#e4e4e7' }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fill: '#71717a', fontSize: 11 }} 
                  axisLine={{ stroke: '#e4e4e7' }}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#18181b', 
                    borderRadius: '12px', 
                    border: 'none', 
                    color: '#fff',
                    fontSize: '11px',
                    fontFamily: 'Inter, sans-serif'
                  }}
                  itemStyle={{ color: '#fb923c' }}
                />
                <Bar dataKey="Votes" radius={[8, 8, 0, 0]} barSize={45}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="Votes"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#18181b', 
                    borderRadius: '12px', 
                    border: 'none', 
                    color: '#fff',
                    fontSize: '11px'
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11, fontWeight: 'bold' }} />
              </PieChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Voters list table */}
      {currentPoll.respondents.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-[11px] font-black text-zinc-500 uppercase tracking-widest font-sans flex items-center gap-1">
            <span>👥 Respondent Ledger ({currentPoll.respondents.length} Voted)</span>
          </h4>
          <div className="border border-zinc-200/60 rounded-2xl overflow-hidden max-h-48 overflow-y-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-zinc-50 border-b border-zinc-200/50 text-zinc-500 font-bold uppercase text-[9px] tracking-wider">
                <tr>
                  <th className="p-3">Creator Name</th>
                  <th className="p-3">Email Address</th>
                  <th className="p-3 text-right">Vote Answer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-150 text-zinc-700">
                {currentPoll.respondents.map((resp, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="p-3 font-semibold">{resp.name}</td>
                    <td className="p-3 text-zinc-500">{resp.email}</td>
                    <td className="p-3 text-right">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-orange-50 text-orange-700 border border-orange-100">
                        {resp.answer}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
