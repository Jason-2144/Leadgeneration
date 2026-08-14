import React, { useState, useEffect } from 'react';
import { Database, Folder, Phone, Globe, MapPin, Search, Trash2, Tag, Download, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { getCustomSupabaseClient } from '../services/supabaseClient';
import { SavedLead } from '../types';

const SavedLeadsPage: React.FC = () => {
  const [supabaseUrl, setSupabaseUrl] = useState(() => localStorage.getItem('supabase_url') || 'https://ohvybnoyxtwlpdrsrhdy.supabase.co');
  const [supabaseKey, setSupabaseKey] = useState(() => localStorage.getItem('supabase_anon_key') || 'sb_publishable__iaAobYrI4PjhzNqAvZHVQ_4kj6acxh');
  const [isConnected, setIsConnected] = useState(false);
  const [leads, setLeads] = useState<SavedLead[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Local storage fallback for saved leads if Supabase is not connected
  const [localLeads, setLocalLeads] = useState<SavedLead[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('saved_leads_local') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const client = getCustomSupabaseClient(supabaseUrl, supabaseKey);
      if (client) {
        const { data, error } = await client
          .from('leads')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          setLeads(data);
          setIsConnected(true);
          setLoading(false);
          return;
        }
      }
    } catch (err: any) {
      console.warn('Supabase fetch error, using local leads:', err);
    }

    // Fallback to local leads
    const stored = JSON.parse(localStorage.getItem('saved_leads_local') || '[]');
    setLeads(stored);
    setLoading(false);
  };

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLeads();
  };

  const displayLeads = leads;

  // Extract unique categories (e.g. Dentists, Restaurants, Plumbers)
  const categories = ['All', ...Array.from(new Set(displayLeads.map(l => l.category || 'Uncategorized')))];

  const filteredLeads = displayLeads.filter(lead => {
    const matchesCategory = selectedCategory === 'All' || (lead.category || 'Uncategorized') === selectedCategory;
    const matchesSearch = !searchFilter.trim() || 
      lead.display_name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (lead.formatted_address || '').toLowerCase().includes(searchFilter.toLowerCase()) ||
      (lead.category || '').toLowerCase().includes(searchFilter.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleDeleteLead = async (id: string) => {
    if (isConnected) {
      const client = getCustomSupabaseClient(supabaseUrl, supabaseKey);
      if (client) {
        await client.from('leads').delete().eq('id', id);
        setLeads(prev => prev.filter(l => l.id !== id));
      }
    } else {
      const updated = localLeads.filter(l => l.id !== id);
      setLocalLeads(updated);
      localStorage.setItem('saved_leads_local', JSON.stringify(updated));
    }
  };

  const exportCSV = () => {
    const headers = ["Name", "Category", "Phone", "Website", "Address", "Search Query"];
    const csvContent = [
      headers.join(","),
      ...filteredLeads.map(p => {
        const escape = (val: string | null | undefined) => `"${(val || '').replace(/"/g, '""')}"`;
        return [
          escape(p.display_name),
          escape(p.category),
          escape(p.phone_number),
          escape(p.website_uri || 'No Website'),
          escape(p.formatted_address),
          escape(p.search_query)
        ].join(",");
      })
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `saved_leads_${selectedCategory}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-fade-in-up">

      {/* Categories & Filter Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-2xl font-bold text-slate-900">Saved Lead Categories</h3>
            <p className="text-slate-500 text-sm">Browse businesses saved across different genres (Dentists, Restaurants, etc.)</p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search saved leads..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            {filteredLeads.length > 0 && (
              <button
                onClick={exportCSV}
                className="px-4 py-2 bg-primary hover:bg-primaryDark text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shadow-sm"
              >
                <Download className="w-4 h-4" /> Export CSV
              </button>
            )}
          </div>
        </div>

        {/* Category Pills / Badges */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => {
            const count = cat === 'All' 
              ? displayLeads.length 
              : displayLeads.filter(l => (l.category || 'Uncategorized') === cat).length;

            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Folder className="w-3.5 h-3.5" />
                <span>{cat}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                  selectedCategory === cat ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Saved Leads Grid */}
      {filteredLeads.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 max-w-lg mx-auto my-8">
          <div className="bg-slate-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center text-slate-400">
            <Tag className="w-8 h-8" />
          </div>
          <h4 className="text-lg font-bold text-slate-800 mb-1">No saved leads found</h4>
          <p className="text-sm text-slate-500 mb-4">
            Search for leads in the Lead Scout tab and click "Save to Database" to group them by genre!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLeads.map((lead) => (
            <div 
              key={lead.id} 
              className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow relative flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                    <Tag className="w-3 h-3" />
                    {lead.category || 'Uncategorized'}
                  </span>
                  <button
                    onClick={() => handleDeleteLead(lead.id)}
                    className="text-slate-400 hover:text-red-600 p-1 transition-colors"
                    title="Delete lead"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h4 className="text-lg font-bold text-slate-900 mb-2 line-clamp-1">{lead.display_name}</h4>

                <div className="space-y-2 text-xs text-slate-600 mb-4">
                  {lead.formatted_address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{lead.formatted_address}</span>
                    </div>
                  )}
                  {lead.phone_number && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{lead.phone_number}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {lead.website_uri ? (
                      <a 
                        href={lead.website_uri} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-blue-600 hover:underline line-clamp-1"
                      >
                        {lead.website_uri}
                      </a>
                    ) : (
                      <span className="text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded text-[11px]">
                        No Website (High Intent Lead)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>From query: "{lead.search_query}"</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedLeadsPage;
