'use client';

import { useEffect, useState } from 'react';
import { useAdminAuth } from '../../../../hooks/useAdminAuth';
import { adminService } from '../../../../services/adminService';
import { AdminLead } from '../../../../types/api';

export default function AdminDashboard() {
  const { isAuthenticated } = useAdminAuth();
  const [leads, setLeads] = useState<AdminLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefetch = () => {
    setLoading(true);
    setError(null);
    setRefreshTrigger((prev) => prev + 1);
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;

    const fetchLeads = async () => {
      try {
        const data = await adminService.getLeads();
        if (isMounted) {
          setLeads(data);
        }
      } catch (err) {
        console.error(err);
        if (isMounted) {
          setError('Failed to fetch leads. Please try again.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchLeads();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, refreshTrigger]);

  const handleStatusUpdate = async (id: string, status: 'approved' | 'discarded') => {
    // Optimistic UI Update: Immediately remove the lead from the local state
    setLeads((currentLeads) => currentLeads.filter((lead) => lead.id !== id));

    try {
      // Fire request in the background
      await adminService.updateLeadStatus(id, status);
    } catch (err) {
      console.error(`Failed to update lead ${id} to ${status}`, err);
      // Re-fetch to restore state on failure (a more robust app might cache the old state and rollback)
      triggerRefetch();
    }
  };

  if (isAuthenticated === null || loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500 animate-pulse">Loading Dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500">
        <p>{error}</p>
        <button 
          onClick={triggerRefetch}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
        <p>No pending leads found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {leads.map((lead) => (
          <article 
            key={lead.id} 
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col"
          >
            <div className="p-6 flex-1">
              <header className="mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {lead.client_name || 'Anonymous Client'}
                </h2>
                {lead.client_email && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {lead.client_email}
                  </p>
                )}
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Started: {new Date(lead.started_at).toLocaleString()}
                </p>
              </header>

              <section className="mb-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Project Summary
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                  {lead.project_summary || 'No summary provided.'}
                </p>
              </section>

              <section>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Requirements (JSON)
                </h3>
                <pre className="text-xs bg-gray-50 dark:bg-gray-900 p-3 rounded-lg overflow-x-auto text-gray-700 dark:text-gray-300 max-h-32">
                  {lead.requirements_json 
                    ? JSON.stringify(lead.requirements_json, null, 2) 
                    : 'None'}
                </pre>
              </section>
            </div>
            
            <footer className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl flex gap-3">
              <button
                onClick={() => handleStatusUpdate(lead.id, 'approved')}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Approve
              </button>
              <button
                onClick={() => handleStatusUpdate(lead.id, 'discarded')}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Discard
              </button>
            </footer>
          </article>
        ))}
      </div>
    </div>
  );
}
