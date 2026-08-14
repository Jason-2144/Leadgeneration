import React, { useState } from 'react';
import { PlaceResult, SavedLead } from '../types';
import { Globe, Phone, MapPin, Building2, AlertCircle, Map as MapIcon, BookmarkPlus, Check } from 'lucide-react';
import { getCustomSupabaseClient } from '../services/supabaseClient';

interface ResultsTableProps {
  results: PlaceResult[];
  loading: boolean;
  searchQuery?: string;
}

const ResultsTable: React.FC<ResultsTableProps> = ({ results, loading, searchQuery = '' }) => {
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  // Infer genre/category from searchQuery (e.g. "Dentists in Manhattan" => "Dentists")
  const deriveCategory = (query: string) => {
    if (!query) return 'General';
    const cleaned = query.split(' in ')[0].split(' near ')[0].trim();
    return cleaned ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1) : 'General';
  };

  const handleSaveLead = async (place: PlaceResult) => {
    const category = deriveCategory(searchQuery);
    const newLead: SavedLead = {
      id: place.id || String(Date.now()),
      place_id: place.id || '',
      display_name: place.displayName || 'Unknown Business',
      formatted_address: place.formattedAddress || null,
      phone_number: place.nationalPhoneNumber || null,
      website_uri: place.websiteURI || null,
      category,
      search_query: searchQuery
    };

    const url = localStorage.getItem('supabase_url');
    const key = localStorage.getItem('supabase_anon_key');

    if (url && key) {
      const client = getCustomSupabaseClient(url, key);
      if (client) {
        await client.from('leads').upsert([newLead], { onConflict: 'place_id' });
      }
    } else {
      // Local fallback
      const existing: SavedLead[] = JSON.parse(localStorage.getItem('saved_leads_local') || '[]');
      const filtered = existing.filter(l => l.place_id !== newLead.place_id);
      localStorage.setItem('saved_leads_local', JSON.stringify([newLead, ...filtered]));
    }

    setSavedIds(prev => new Set(prev).add(place.id));
  };

  if (loading) {
    return (
      <div className="w-full bg-white/60 backdrop-blur-md rounded-3xl shadow-glass border border-white/50 p-16 flex flex-col items-center justify-center min-h-[400px]">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-primary/10 rounded-full animate-pulse"></div>
          </div>
        </div>
        <p className="text-slate-600 font-medium mt-6 animate-pulse tracking-wide">Analyzing local business data...</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="w-full bg-white/60 backdrop-blur-md rounded-3xl shadow-glass border border-white/50 p-16 flex flex-col items-center justify-center min-h-[300px] text-center group">
        <div className="bg-slate-50 p-6 rounded-full mb-6 group-hover:scale-110 transition-transform duration-500 shadow-inner">
          <Building2 className="h-10 w-10 text-slate-300 group-hover:text-primary transition-colors" />
        </div>
        <h3 className="text-slate-900 font-bold text-xl mb-2">No leads found yet</h3>
        <p className="text-slate-500 max-w-xs mx-auto leading-relaxed">
          Start your search above to populate this list with potential clients.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/50 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200/60 text-xs uppercase font-bold text-slate-500 tracking-wider">
              <th className="px-8 py-5 first:rounded-tl-3xl">Business Details</th>
              <th className="px-6 py-5">Digital Presence</th>
              <th className="px-6 py-5">Contact</th>
              <th className="px-6 py-5">Location</th>
              <th className="px-6 py-5 text-right last:rounded-tr-3xl">Save Lead</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {results.map((place, idx) => {
              const isSaved = savedIds.has(place.id);
              return (
                <tr
                  key={place.id || idx}
                  className="group hover:bg-white transition-all duration-200 hover:shadow-lg relative z-0 hover:z-10"
                >
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-500 font-bold text-lg shadow-inner group-hover:from-primary group-hover:to-secondary group-hover:text-white transition-all">
                        {place.displayName ? place.displayName.charAt(0) : '?'}
                      </div>
                      <div className="font-bold text-slate-900 text-base">{place.displayName || "Unknown"}</div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    {place.websiteURI ? (
                      <a
                        href={place.websiteURI}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100 hover:bg-blue-100 transition-colors gap-1.5"
                      >
                        <Globe className="h-3.5 w-3.5" />
                        Website
                      </a>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold shadow-lg shadow-orange-500/30 animate-pulse-slow gap-1.5">
                        <AlertCircle className="h-3.5 w-3.5" />
                        No Website
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    {place.nationalPhoneNumber ? (
                      <div className="flex items-center text-slate-600 font-medium text-sm group-hover:text-slate-900 transition-colors">
                        <Phone className="h-4 w-4 mr-2 text-slate-400" />
                        {place.nationalPhoneNumber}
                      </div>
                    ) : (
                      <span className="text-slate-300 text-sm font-medium">Unavailable</span>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-start max-w-xs text-slate-500 text-sm group-hover:text-slate-700 transition-colors">
                        <MapPin className="h-4 w-4 mr-2 mt-0.5 text-slate-300 group-hover:text-secondary shrink-0 transition-colors" />
                        <span className="truncate">{place.formattedAddress}</span>
                      </div>
                      {place.formattedAddress && (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.formattedAddress)}&query_place_id=${place.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center self-start px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100 hover:bg-emerald-100 transition-colors gap-1.5 ml-6"
                        >
                          <MapIcon className="h-3 w-3" />
                          View on Map
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button
                      onClick={() => handleSaveLead(place)}
                      disabled={isSaved}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all inline-flex items-center gap-1.5 ${
                        isSaved
                          ? 'bg-emerald-100 text-emerald-800 cursor-default'
                          : 'bg-slate-900 hover:bg-slate-800 text-white shadow-sm active:scale-95'
                      }`}
                    >
                      {isSaved ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Saved
                        </>
                      ) : (
                        <>
                          <BookmarkPlus className="w-3.5 h-3.5" /> Save Lead
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ResultsTable;