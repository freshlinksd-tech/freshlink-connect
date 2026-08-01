import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Search,
  Filter,
  Trash2,
  Download,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  FileCode,
  AlertTriangle,
  Clock,
  Layers,
  ChevronRight,
  Eye,
  X,
  Database,
  CheckCircle2,
  Activity
} from 'lucide-react';
import { dataAuditService, AuditLogEntry } from '../services/DataAuditService';

interface AdminAuditLogsProps {
  currentUserEmail?: string;
}

export const AdminAuditLogs: React.FC<AdminAuditLogsProps> = ({ currentUserEmail }) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    // Initial fetch
    dataAuditService.fetchAuditLogs().then(fetched => {
      setLogs(fetched);
      setLoading(false);
    });

    // Subscribe to live events
    const unsubscribe = dataAuditService.subscribe(updatedLogs => {
      setLogs(updatedLogs);
    });

    return () => unsubscribe();
  }, []);

  const handleManualRefresh = async () => {
    setLoading(true);
    const updated = await dataAuditService.fetchAuditLogs();
    setLogs(updated);
    setLoading(false);
    setNotification('Audit logs refreshed from Firestore backend.');
    setTimeout(() => setNotification(null), 3000);
  };

  const handleClearLogs = async () => {
    if (window.confirm('Are you sure you want to clear all audit log history? This action cannot be undone.')) {
      await dataAuditService.clearAuditLogs();
      await dataAuditService.logAction({
        type: 'security',
        entity: 'system',
        entityId: 'audit_cleared',
        actorEmail: currentUserEmail || 'admin',
        description: 'Audit log history was purged by administrator',
        details: { action: 'clear_audit_history' }
      });
      setNotification('Audit log history purged.');
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleExportJSON = () => {
    const jsonStr = JSON.stringify(logs, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus_data_audit_logs_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchType = typeFilter === 'all' || log.type === typeFilter;
      const matchEntity = entityFilter === 'all' || log.entity === entityFilter;
      const term = search.toLowerCase().trim();
      const matchSearch =
        !term ||
        log.description.toLowerCase().includes(term) ||
        log.actorEmail.toLowerCase().includes(term) ||
        (log.actorName && log.actorName.toLowerCase().includes(term)) ||
        log.entityId.toLowerCase().includes(term) ||
        log.type.toLowerCase().includes(term);

      return matchType && matchEntity && matchSearch;
    });
  }, [logs, typeFilter, entityFilter, search]);

  const getTypeBadge = (type: AuditLogEntry['type']) => {
    switch (type) {
      case 'create':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Create</span>;
      case 'update':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200/60 flex items-center gap-1"><Activity className="w-3 h-3" /> Update</span>;
      case 'delete':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-50 text-red-700 border border-red-200/60 flex items-center gap-1"><Trash2 className="w-3 h-3" /> Delete</span>;
      case 'clearance':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200/60 flex items-center gap-1"><UserCheck className="w-3 h-3" /> Clearance</span>;
      case 'security':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200/60 flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Security</span>;
      case 'sync':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-50 text-cyan-700 border border-cyan-200/60 flex items-center gap-1"><Database className="w-3 h-3" /> Sync</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-zinc-100 text-zinc-700 border border-zinc-200 flex items-center gap-1"><Layers className="w-3 h-3" /> {type}</span>;
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-zinc-100 space-y-6" id="admin-audit-logs-module">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-zinc-900 flex items-center gap-2">
                Firestore Data Audit Trail
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-bold border border-orange-200">
                  {logs.length} Operations Logged
                </span>
              </h3>
              <p className="text-xs text-zinc-500 font-mono mt-0.5">
                Real-time tracking of backend profile mutations, clearance updates, & database syncs
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleManualRefresh}
            disabled={loading}
            className="px-3.5 py-2 bg-zinc-50 hover:bg-zinc-100 disabled:opacity-50 text-zinc-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer border border-zinc-200/80"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-orange-500 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Audit Logs</span>
          </button>
          <button
            onClick={handleExportJSON}
            className="px-3.5 py-2 bg-zinc-900 hover:bg-black text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export JSON</span>
          </button>
          <button
            onClick={handleClearLogs}
            className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer border border-red-200/60"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Purge Logs</span>
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Filter and Search controls */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search audit trail by actor, entity ID, description..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border-none outline-none bg-zinc-50 text-xs font-bold text-zinc-800 focus:bg-zinc-100 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Action Type Filter */}
          <div className="flex items-center gap-1 text-xs text-zinc-500 font-bold bg-zinc-50 px-2 py-1 rounded-xl border border-zinc-200/60">
            <Filter className="w-3.5 h-3.5 text-zinc-400" />
            <span>Action:</span>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="bg-transparent text-zinc-800 font-bold outline-none cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
              <option value="clearance">Clearance</option>
              <option value="security">Security</option>
              <option value="sync">Sync</option>
            </select>
          </div>

          {/* Entity Filter */}
          <div className="flex items-center gap-1 text-xs text-zinc-500 font-bold bg-zinc-50 px-2 py-1 rounded-xl border border-zinc-200/60">
            <Layers className="w-3.5 h-3.5 text-zinc-400" />
            <span>Collection:</span>
            <select
              value={entityFilter}
              onChange={e => setEntityFilter(e.target.value)}
              className="bg-transparent text-zinc-800 font-bold outline-none cursor-pointer"
            >
              <option value="all">All Collections</option>
              <option value="users">Users</option>
              <option value="posts">Posts</option>
              <option value="clearance">Clearance Queue</option>
              <option value="ads">Ads</option>
              <option value="withdrawals">Withdrawals</option>
              <option value="system">System</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Logs Table / Feed */}
      <div className="border border-zinc-100 rounded-2xl overflow-hidden bg-white">
        {loading ? (
          <div className="p-12 text-center text-zinc-400 font-mono text-xs flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-orange-500" />
            <span>Querying Firestore Audit Logs...</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-zinc-400 font-mono text-xs flex flex-col items-center justify-center gap-2">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
            <span>No audit trail entries matched your search criteria.</span>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {filteredLogs.map(log => (
              <div
                key={log.id}
                className="p-4 hover:bg-zinc-50/70 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="pt-0.5 shrink-0">{getTypeBadge(log.type)}</div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-zinc-850 text-xs leading-snug">
                      {log.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-zinc-500 font-mono">
                      <span>
                        Actor: <strong className="text-zinc-750">{log.actorName || log.actorEmail}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Collection: <span className="uppercase text-orange-600 font-bold">{log.entity}</span>
                      </span>
                      <span>•</span>
                      <span>Ref ID: <code className="bg-zinc-100 px-1 py-0.5 rounded text-zinc-700">{log.entityId}</code></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <span className="text-[10.5px] font-mono text-zinc-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-zinc-400" />
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                  <button
                    onClick={() => setSelectedEntry(log)}
                    className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                    title="View JSON Payload & Detailed Metadata"
                  >
                    <Eye className="w-3.5 h-3.5 text-zinc-600" />
                    <span>Payload</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* JSON Payload Detail Inspector Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setSelectedEntry(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500/10 text-orange-400 rounded-xl flex items-center justify-center border border-orange-500/20">
                <FileCode className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-base text-white">Audit Event Details</h4>
                <p className="text-xs text-zinc-400 font-mono">{selectedEntry.id}</p>
              </div>
            </div>

            <div className="space-y-2 text-xs font-mono bg-zinc-950 p-4 rounded-2xl border border-zinc-800/80">
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-zinc-500 block">Timestamp</span>
                  <span className="text-zinc-200">{new Date(selectedEntry.timestamp).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Action Type</span>
                  <span className="text-emerald-400 font-bold uppercase">{selectedEntry.type}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Collection</span>
                  <span className="text-orange-400 font-bold uppercase">{selectedEntry.entity}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Actor</span>
                  <span className="text-zinc-200">{selectedEntry.actorEmail}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-800">
                <span className="text-zinc-500 block mb-1 font-bold">Details Payload JSON:</span>
                <pre className="bg-zinc-900 p-3 rounded-xl overflow-x-auto text-emerald-300 text-[11px] leading-relaxed max-h-48 custom-scrollbar">
                  {JSON.stringify(selectedEntry.details || {}, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedEntry(null)}
                className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
