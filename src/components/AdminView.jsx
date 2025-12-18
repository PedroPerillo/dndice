import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

function AdminView({ user }) {
  const [allQuickRolls, setAllQuickRolls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadAllQuickRolls = async () => {
    setLoading(true);
    setError(null);

    try {
      // Note: This will only work if RLS allows it, or if you use a service role
      // For now, this will only show the current user's rolls
      // To see all users' rolls, you'd need to adjust RLS or use a service role function
      const { data, error } = await supabase
        .from('quick_rolls')
        .select(`
          *,
          user:auth.users!quick_rolls_user_id_fkey(email)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        // If RLS blocks this, try getting just user emails
        const { data: rollsData, error: rollsError } = await supabase
          .from('quick_rolls')
          .select('*')
          .order('created_at', { ascending: false });

        if (rollsError) {
          throw rollsError;
        }

        // Get user emails separately
        const userIds = [...new Set(rollsData.map(r => r.user_id))];
        const usersMap = {};
        
        for (const userId of userIds) {
          const { data: userData } = await supabase.auth.admin.getUserById(userId);
          if (userData?.user) {
            usersMap[userId] = userData.user.email;
          }
        }

        setAllQuickRolls(rollsData.map(roll => ({
          ...roll,
          user_email: usersMap[roll.user_id] || roll.user_id,
        })));
      } else {
        setAllQuickRolls(data.map(roll => ({
          ...roll,
          user_email: data.user?.email || roll.user_id,
        })));
      }
    } catch (err) {
      console.error('Error loading quick rolls:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadAllQuickRolls();
    }
  }, [user]);

  if (!user) {
    return (
      <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-xl p-6 max-w-2xl mx-auto">
        <p className="text-white text-center">Please log in to view quick rolls.</p>
      </div>
    );
  }

  return (
    <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-xl p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-white text-2xl font-bold">All Saved Quick Rolls</h2>
        <button
          onClick={loadAllQuickRolls}
          disabled={loading}
          className="backdrop-blur-md bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-4 py-2 text-white font-semibold transition-all duration-300 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="text-red-300 text-sm bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4">
          {error}
          <p className="mt-2 text-xs">Note: You can only see your own rolls due to Row Level Security. To see all users' rolls, check Supabase dashboard or adjust RLS policies.</p>
        </div>
      )}

      {loading ? (
        <p className="text-white/60 text-center">Loading...</p>
      ) : allQuickRolls.length === 0 ? (
        <p className="text-white/60 text-center">No quick rolls found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/20">
                <th className="text-white/80 font-semibold pb-3 pr-4">User</th>
                <th className="text-white/80 font-semibold pb-3 pr-4">Name</th>
                <th className="text-white/80 font-semibold pb-3 pr-4">Dice</th>
                <th className="text-white/80 font-semibold pb-3 pr-4">Modifier</th>
                <th className="text-white/80 font-semibold pb-3 pr-4">Created</th>
              </tr>
            </thead>
            <tbody>
              {allQuickRolls.map((roll) => (
                <tr key={roll.id} className="border-b border-white/10">
                  <td className="text-white/60 py-3 pr-4 text-sm">
                    {roll.user_email || roll.user_id?.substring(0, 8) || 'Unknown'}
                  </td>
                  <td className="text-white py-3 pr-4">{roll.name || 'Unnamed'}</td>
                  <td className="text-white py-3 pr-4 font-mono">
                    {roll.count}d{roll.dice_type}
                  </td>
                  <td className="text-white/60 py-3 pr-4">
                    {roll.modifier !== 0 ? (roll.modifier > 0 ? `+${roll.modifier}` : `${roll.modifier}`) : '0'}
                  </td>
                  <td className="text-white/60 py-3 pr-4 text-sm">
                    {new Date(roll.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminView;

