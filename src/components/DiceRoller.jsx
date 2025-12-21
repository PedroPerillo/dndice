import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

// Cookie utility functions
const setCookie = (name, value, days = 365) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  // Cookies should be URI-encoded; JSON contains characters that can be invalid in cookie values.
  // Also set SameSite to reduce cross-site leakage; add Secure when served over HTTPS.
  const encoded = encodeURIComponent(JSON.stringify(value));
  const secure = window.location?.protocol === 'https:' ? ';Secure' : '';
  document.cookie = `${name}=${encoded};expires=${expires.toUTCString()};path=/;SameSite=Lax${secure}`;
};

const getCookie = (name) => {
  const nameEQ = name + '=';
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) {
      try {
        const raw = c.substring(nameEQ.length, c.length);
        const decoded = decodeURIComponent(raw);
        return JSON.parse(decoded);
      } catch {
        return null;
      }
    }
  }
  return null;
};

// Keep non-deterministic work out of the component body to satisfy the
// react-hooks/purity lint rule, while still only invoking it from event handlers.
const rollSingleDie = (sides) => Math.floor(Math.random() * sides) + 1;

const DICE_TYPES = [
  { value: 4, label: 'd4' },
  { value: 6, label: 'd6' },
  { value: 8, label: 'd8' },
  { value: 10, label: 'd10' },
  { value: 12, label: 'd12' },
  { value: 20, label: 'd20' },
  { value: 100, label: 'd100' },
];

function DiceRoller({ user }) {
  const [selectedDice, setSelectedDice] = useState(20);
  const [diceCount, setDiceCount] = useState(1);
  const [modifier, setModifier] = useState(0);
  const [rolls, setRolls] = useState([]);
  const [total, setTotal] = useState(null);
  const [diceTotal, setDiceTotal] = useState(null);
  const [appliedModifier, setAppliedModifier] = useState(0);
  const [highestRoll, setHighestRoll] = useState(null);
  const [isRolling, setIsRolling] = useState(false);
  const [theme, setTheme] = useState('forest');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [savedQuickRolls, setSavedQuickRolls] = useState([]);
  const [showAddQuickRoll, setShowAddQuickRoll] = useState(false);
  const [newQuickRollCount, setNewQuickRollCount] = useState(1);
  const [newQuickRollDice, setNewQuickRollDice] = useState(20);
  const [newQuickRollName, setNewQuickRollName] = useState('');
  const [newQuickRollModifier, setNewQuickRollModifier] = useState(0);
  const isInitialMount = useRef(true);
  const appliedThemeClassRef = useRef(null);

  const themes = [
    { id: 'forest', name: 'Forest Green', icon: '🌲' },
    { id: 'pink', name: 'Pink Sparkles', icon: '🌸' },
  ];

  useEffect(() => {
    // Apply theme class without clobbering any existing <body> classes.
    // (Overwriting body.className can break other global styling/behaviour.)
    const prev = appliedThemeClassRef.current;
    if (prev) document.body.classList.remove(prev);

    const next = `theme-${theme}`;
    // Clean up any stale theme-* classes from previous versions.
    for (const cls of Array.from(document.body.classList)) {
      if (cls.startsWith('theme-') && cls !== next) document.body.classList.remove(cls);
    }
    document.body.classList.add(next);
    appliedThemeClassRef.current = next;

    return () => {
      document.body.classList.remove(next);
      if (appliedThemeClassRef.current === next) appliedThemeClassRef.current = null;
    };
  }, [theme]);

  // Load saved quick rolls from Supabase (if logged in) or cookies (if not)
  useEffect(() => {
    let cancelled = false;
    const safeSetSavedQuickRolls = (next) => {
      if (!cancelled) setSavedQuickRolls(next);
    };

    (async () => {
      if (user) {
        // Load from Supabase
        const { data, error } = await supabase
          .from('quick_rolls')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading quick rolls:', error);
          return;
        }
        if (data) {
          safeSetSavedQuickRolls(
            data.map((roll) => ({
              id: roll.id,
              count: roll.count,
              diceType: roll.dice_type,
              modifier: roll.modifier || 0,
              label: `${roll.count}d${roll.dice_type}${
                roll.modifier ? (roll.modifier > 0 ? `+${roll.modifier}` : `${roll.modifier}`) : ''
              }`,
              name: roll.name,
            }))
          );
        }
      } else {
        // Fallback to cookies if not logged in
        const saved = getCookie('dndice_quickrolls');
        if (saved && Array.isArray(saved)) safeSetSavedQuickRolls(saved);
      }
    })().catch((error) => {
      console.error('Error loading quick rolls:', error);
    });

    return () => {
      cancelled = true;
    };
  }, [user]);

  // Save quick rolls to cookies for guests.
  // For authenticated users, we persist explicitly in add/delete flows rather than re-syncing
  // (the previous "delete all then re-insert everything" approach was slow and could lose data).
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (!user) setCookie('dndice_quickrolls', savedQuickRolls);
  }, [savedQuickRolls, user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDropdownOpen && !event.target.closest('.theme-dropdown')) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  const selectTheme = (themeId) => {
    setTheme(themeId);
    setIsDropdownOpen(false);
  };

  const currentTheme = themes.find(t => t.id === theme) || themes[0];

  const rollDice = (count = diceCount, diceType = selectedDice, rollModifier = null) => {
    setIsRolling(true);
    const newRolls = [];
    let sum = 0;
    let highest = 0;

    // Use provided modifier or state modifier
    const appliedModifier = rollModifier !== null ? rollModifier : modifier;

    for (let i = 0; i < count; i++) {
      const roll = rollSingleDie(diceType);
      newRolls.push(roll);
      sum += roll;
      if (roll > highest) {
        highest = roll;
      }
    }

    // Apply modifier to total
    const totalWithModifier = sum + appliedModifier;

    // Add animation delay
    setTimeout(() => {
      setRolls(newRolls);
      setDiceTotal(sum);
      setTotal(totalWithModifier);
      setAppliedModifier(appliedModifier);
      setHighestRoll(highest);
      setIsRolling(false);
    }, 500);
  };

  const quickRollD20 = (count) => {
    setSelectedDice(20);
    setDiceCount(count);
    rollDice(count, 20);
  };

  const quickRoll = (count, diceType, modifier = 0) => {
    setSelectedDice(diceType);
    setDiceCount(count);
    rollDice(count, diceType, modifier);
  };

  const addQuickRoll = async () => {
    const name = newQuickRollName.trim() || `${newQuickRollCount}d${newQuickRollDice}`;
    const modifier = parseInt(newQuickRollModifier) || 0;
    const modifierText = modifier !== 0 ? (modifier > 0 ? `+${modifier}` : `${modifier}`) : '';
    
    if (user) {
      // Save to Supabase
      const { data, error } = await supabase
        .from('quick_rolls')
        .insert({
          user_id: user.id,
          name: name,
          count: newQuickRollCount,
          dice_type: newQuickRollDice,
          modifier: modifier,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding quick roll:', error);
        alert('Failed to save quick roll. Please try again.');
        return;
      }

      const newRoll = {
        id: data.id,
        count: data.count,
        diceType: data.dice_type,
        modifier: data.modifier || 0,
        label: `${data.count}d${data.dice_type}${modifierText}`,
        name: data.name,
      };
      setSavedQuickRolls([...savedQuickRolls, newRoll]);
    } else {
      // Save to local state (will be saved to cookies)
      const newRoll = {
        id: Date.now(),
        count: newQuickRollCount,
        diceType: newQuickRollDice,
        modifier: modifier,
        label: `${newQuickRollCount}d${newQuickRollDice}${modifierText}`,
        name: name,
      };
      setSavedQuickRolls([...savedQuickRolls, newRoll]);
    }

    setShowAddQuickRoll(false);
    setNewQuickRollCount(1);
    setNewQuickRollDice(20);
    setNewQuickRollName('');
    setNewQuickRollModifier(0);
  };

  const deleteQuickRoll = async (id) => {
    if (user) {
      // Delete from Supabase
      const { error } = await supabase
        .from('quick_rolls')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting quick roll:', error);
        alert('Failed to delete quick roll. Please try again.');
        return;
      }
    }
    
    setSavedQuickRolls(savedQuickRolls.filter(roll => roll.id !== id));
  };

  const getButtonClasses = (isRolling) => {
    if (isRolling) {
      return theme === 'pink' 
        ? 'bg-pink-800/50 border-pink-600 cursor-not-allowed'
        : 'bg-forest-800/50 border-forest-600 cursor-not-allowed';
    }
    return theme === 'pink'
      ? 'bg-pink-600/50 border-pink-400 hover:bg-pink-500/60 hover:scale-105 hover:shadow-xl active:scale-95'
      : 'bg-forest-600/50 border-forest-400 hover:bg-forest-500/60 hover:scale-105 hover:shadow-xl active:scale-95';
  };

  const getSelectedDiceClasses = () => {
    return theme === 'pink'
      ? 'bg-pink-600/50 border-pink-400'
      : 'bg-forest-600/50 border-forest-400';
  };

  const getTotalClasses = () => {
    return theme === 'pink'
      ? 'bg-pink-600/40 border-pink-400/50'
      : 'bg-forest-600/40 border-forest-400/50';
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
      {/* Theme Dropdown */}
      <div className="fixed top-4 right-4 z-50 theme-dropdown">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="backdrop-blur-md bg-white/20 hover:bg-white/30 border border-white/30 rounded-lg px-4 py-2 text-white font-semibold transition-all duration-300 hover:scale-105 shadow-lg flex items-center gap-2"
        >
          <span>{currentTheme.icon}</span>
          <span className="hidden sm:inline">{currentTheme.name}</span>
          <svg
            className={`w-4 h-4 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 backdrop-blur-md bg-white/20 border border-white/30 rounded-lg shadow-xl overflow-hidden">
            {themes.map((themeOption) => (
              <button
                key={themeOption.id}
                onClick={() => selectTheme(themeOption.id)}
                className={`w-full px-4 py-3 text-left text-white hover:bg-white/20 transition-colors duration-200 flex items-center gap-3 ${
                  theme === themeOption.id ? 'bg-white/10 font-semibold' : ''
                }`}
              >
                <span className="text-xl">{themeOption.icon}</span>
                <span>{themeOption.name}</span>
                {theme === themeOption.id && (
                  <span className="ml-auto">✓</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Floating Effects - Sparkles for Pink, Leaves for Forest */}
      {theme === 'pink' ? (
        <>
          <div className="sparkle" style={{ top: '10%', left: '15%', animationDelay: '0s' }}></div>
          <div className="sparkle" style={{ top: '20%', left: '80%', animationDelay: '0.5s' }}></div>
          <div className="sparkle" style={{ top: '60%', left: '10%', animationDelay: '1s' }}></div>
          <div className="sparkle" style={{ top: '80%', left: '70%', animationDelay: '1.5s' }}></div>
          <div className="sparkle" style={{ top: '40%', left: '50%', animationDelay: '2s' }}></div>
          <div className="sparkle" style={{ top: '30%', left: '25%', animationDelay: '2.5s' }}></div>
          <div className="sparkle" style={{ top: '15%', left: '60%', animationDelay: '0.8s' }}></div>
          <div className="sparkle" style={{ top: '70%', left: '40%', animationDelay: '1.2s' }}></div>
          <div className="sparkle" style={{ top: '50%', left: '85%', animationDelay: '1.8s' }}></div>
          <div className="sparkle" style={{ top: '25%', left: '5%', animationDelay: '2.2s' }}></div>
        </>
      ) : (
        <>
          <div className="leaf" style={{ top: '10%', left: '15%', animationDelay: '0s' }}></div>
          <div className="leaf" style={{ top: '20%', left: '80%', animationDelay: '0.5s' }}></div>
          <div className="leaf" style={{ top: '60%', left: '10%', animationDelay: '1s' }}></div>
          <div className="leaf" style={{ top: '80%', left: '70%', animationDelay: '1.5s' }}></div>
          <div className="leaf" style={{ top: '40%', left: '50%', animationDelay: '2s' }}></div>
          <div className="leaf" style={{ top: '30%', left: '25%', animationDelay: '2.5s' }}></div>
          <div className="leaf" style={{ top: '15%', left: '60%', animationDelay: '0.8s' }}></div>
          <div className="leaf" style={{ top: '70%', left: '40%', animationDelay: '1.2s' }}></div>
          <div className="leaf" style={{ top: '50%', left: '85%', animationDelay: '1.8s' }}></div>
          <div className="leaf" style={{ top: '25%', left: '5%', animationDelay: '2.2s' }}></div>
        </>
      )}
      
      <div className="w-full max-w-2xl relative z-10">
        {/* Main Card */}
        <div className="backdrop-blur-xl bg-white/10 rounded-3xl shadow-2xl border border-white/20 p-8 md:p-12 relative">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-2 text-center relative z-10">
            D&D Dice Roller
          </h1>
          <p className={`${theme === 'pink' ? 'text-pink-200' : 'text-forest-200'} text-center mb-6 text-lg relative z-10`}>
            Roll your fate
          </p>

          {/* Quick Roll d20 Buttons */}
          <div className="mb-8">
            <label className="block text-white mb-4 text-lg font-semibold text-center">
              Quick Roll d20
            </label>
            <div className="flex justify-center gap-4 flex-wrap">
              <button
                onClick={() => quickRollD20(1)}
                disabled={isRolling}
                className={`backdrop-blur-md rounded-xl px-6 py-3 text-lg font-bold text-white transition-all duration-300 border-2 ${getButtonClasses(isRolling)}`}
              >
                1d20
              </button>
              <button
                onClick={() => quickRollD20(2)}
                disabled={isRolling}
                className={`backdrop-blur-md rounded-xl px-6 py-3 text-lg font-bold text-white transition-all duration-300 border-2 ${getButtonClasses(isRolling)}`}
              >
                2d20
              </button>
              <button
                onClick={() => quickRollD20(3)}
                disabled={isRolling}
                className={`backdrop-blur-md rounded-xl px-6 py-3 text-lg font-bold text-white transition-all duration-300 border-2 ${getButtonClasses(isRolling)}`}
              >
                3d20
              </button>
              <button
                onClick={() => quickRollD20(6)}
                disabled={isRolling}
                className={`backdrop-blur-md rounded-xl px-6 py-3 text-lg font-bold text-white transition-all duration-300 border-2 ${getButtonClasses(isRolling)}`}
              >
                6d20
              </button>
            </div>
          </div>

          {/* Saved Quick Rolls */}
          {savedQuickRolls.length > 0 && (
            <div className="mb-8">
              <label className="block text-white mb-4 text-lg font-semibold text-center">
                Saved Quick Rolls
              </label>
              <div className="flex flex-wrap justify-center gap-3">
                {savedQuickRolls.map((roll) => (
                  <div key={roll.id} className="relative group">
                    <button
                      onClick={() => quickRoll(roll.count, roll.diceType, roll.modifier || 0)}
                      disabled={isRolling}
                      className={`backdrop-blur-md rounded-xl px-6 py-3 text-lg font-bold text-white transition-all duration-300 border-2 ${getButtonClasses(isRolling)}`}
                      title={roll.name !== roll.label ? roll.label : ''}
                    >
                      {roll.name || roll.label}
                    </button>
                    <button
                      onClick={() => deleteQuickRoll(roll.id)}
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full backdrop-blur-md bg-red-500/80 hover:bg-red-600 border border-white/30 text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center"
                      title="Delete"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Quick Roll Section */}
          <div className="mb-8">
            {!showAddQuickRoll ? (
              <div className="text-center">
                <button
                  onClick={() => setShowAddQuickRoll(true)}
                  className="backdrop-blur-md bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-6 py-2 text-white font-semibold transition-all duration-300"
                >
                  + Add Quick Roll
                </button>
              </div>
            ) : (
              <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-white text-lg font-semibold">
                    Create Quick Roll
                  </label>
                    <button
                      onClick={() => {
                        setShowAddQuickRoll(false);
                        setNewQuickRollCount(1);
                        setNewQuickRollDice(20);
                        setNewQuickRollName('');
                        setNewQuickRollModifier(0);
                      }}
                      className="text-white/60 hover:text-white text-xl"
                    >
                      ×
                    </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-white/80 mb-2 text-sm">Name (Optional)</label>
                    <input
                      type="text"
                      value={newQuickRollName}
                      onChange={(e) => setNewQuickRollName(e.target.value)}
                      placeholder={`e.g., "Attack Roll" or "${newQuickRollCount}d${newQuickRollDice}"`}
                      className="w-full backdrop-blur-md bg-white/10 border border-white/20 rounded-xl p-3 text-white placeholder-white/40 outline-none focus:border-white/40 transition-colors"
                      maxLength={30}
                    />
                  </div>
                  <div>
                    <label className="block text-white/80 mb-2 text-sm">Number of Dice</label>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setNewQuickRollCount(Math.max(1, newQuickRollCount - 1))}
                        className="backdrop-blur-md bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg w-12 h-12 flex items-center justify-center text-white font-bold transition-all duration-300"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={newQuickRollCount}
                        onChange={(e) => {
                          const value = Math.max(1, Math.min(20, parseInt(e.target.value) || 1));
                          setNewQuickRollCount(value);
                        }}
                        className="flex-1 backdrop-blur-md bg-white/10 border border-white/20 rounded-xl p-3 text-white text-center font-bold outline-none"
                      />
                      <button
                        onClick={() => setNewQuickRollCount(Math.min(20, newQuickRollCount + 1))}
                        className="backdrop-blur-md bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg w-12 h-12 flex items-center justify-center text-white font-bold transition-all duration-300"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-white/80 mb-2 text-sm">Dice Type</label>
                    <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                      {DICE_TYPES.map((dice) => (
                        <button
                          key={dice.value}
                          onClick={() => setNewQuickRollDice(dice.value)}
                          className={`backdrop-blur-md rounded-lg p-3 transition-all duration-300 border-2 ${
                            newQuickRollDice === dice.value
                              ? `${getSelectedDiceClasses()} text-white shadow-lg scale-105`
                              : 'bg-white/10 border-white/20 text-white/80 hover:bg-white/20 hover:border-white/30'
                          }`}
                        >
                          <div className="text-sm font-bold">{dice.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-white/80 mb-2 text-sm">Modifier (Optional)</label>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setNewQuickRollModifier(Math.max(-50, newQuickRollModifier - 1))}
                        className="backdrop-blur-md bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg w-12 h-12 flex items-center justify-center text-white font-bold transition-all duration-300"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min="-50"
                        max="50"
                        value={newQuickRollModifier}
                        onChange={(e) => {
                          const value = Math.max(-50, Math.min(50, parseInt(e.target.value) || 0));
                          setNewQuickRollModifier(value);
                        }}
                        placeholder="0"
                        className="flex-1 backdrop-blur-md bg-white/10 border border-white/20 rounded-xl p-3 text-white text-center font-bold outline-none placeholder-white/40"
                      />
                      <button
                        onClick={() => setNewQuickRollModifier(Math.min(50, newQuickRollModifier + 1))}
                        className="backdrop-blur-md bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg w-12 h-12 flex items-center justify-center text-white font-bold transition-all duration-300"
                      >
                        +
                      </button>
                    </div>
                    {newQuickRollModifier !== 0 && (
                      <p className="text-white/60 text-xs mt-2 text-center">
                        {newQuickRollModifier > 0 ? '+' : ''}{newQuickRollModifier} will be added to the total
                      </p>
                    )}
                  </div>
                  <button
                    onClick={addQuickRoll}
                    className={`w-full backdrop-blur-md rounded-xl p-3 text-lg font-bold text-white transition-all duration-300 border-2 ${getButtonClasses(false)}`}
                  >
                    Save {newQuickRollName.trim() || `${newQuickRollCount}d${newQuickRollDice}${newQuickRollModifier !== 0 ? (newQuickRollModifier > 0 ? `+${newQuickRollModifier}` : `${newQuickRollModifier}`) : ''}`}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Dice Type Selection */}
          <div className="mb-8">
            <label className="block text-white mb-4 text-lg font-semibold">
              Select Dice Type
            </label>
            <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
              {DICE_TYPES.map((dice) => (
                <button
                  key={dice.value}
                  onClick={() => setSelectedDice(dice.value)}
                  className={`backdrop-blur-md rounded-xl p-4 transition-all duration-300 border-2 w-20 h-20 flex items-center justify-center ${
                    selectedDice === dice.value
                      ? `${getSelectedDiceClasses()} text-white shadow-lg scale-105`
                      : 'bg-white/10 border-white/20 text-white/80 hover:bg-white/20 hover:border-white/30'
                  }`}
                >
                  <div className="text-xl font-bold">{dice.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Modifier Section */}
          <div className="mb-8">
            <label className="block text-white mb-4 text-lg font-semibold">
              Modifier: {modifier !== 0 ? (modifier > 0 ? `+${modifier}` : `${modifier}`) : '0'}
            </label>
            {/* Quick Modifier Buttons */}
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                <button
                  key={value}
                  onClick={() => setModifier(value)}
                  className={`backdrop-blur-md rounded-lg px-3 py-2 text-sm font-bold text-white transition-all duration-300 border ${
                    modifier === value
                      ? `${getSelectedDiceClasses()} shadow-lg scale-105`
                      : 'bg-white/10 border-white/20 hover:bg-white/20 hover:border-white/30'
                  }`}
                >
                  +{value}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setModifier(Math.max(-50, modifier - 1))}
                className="backdrop-blur-md bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg w-16 h-16 flex items-center justify-center text-white font-bold text-lg transition-all duration-300"
              >
                −
              </button>
              <div className="flex-1 backdrop-blur-md bg-white/10 border border-white/20 rounded-xl p-4 text-center">
                <input
                  type="number"
                  min="-50"
                  max="50"
                  value={modifier}
                  onChange={(e) => {
                    const value = Math.max(-50, Math.min(50, parseInt(e.target.value) || 0));
                    setModifier(value);
                  }}
                  className="w-full bg-transparent text-white text-3xl font-bold text-center outline-none"
                />
              </div>
              <button
                onClick={() => setModifier(Math.min(50, modifier + 1))}
                className="backdrop-blur-md bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg w-16 h-16 flex items-center justify-center text-white font-bold text-lg transition-all duration-300"
              >
                +
              </button>
            </div>
          </div>

          {/* Dice Count Selection */}
          <div className="mb-8">
            <label className="block text-white mb-4 text-lg font-semibold">
              Number of Dice: {diceCount}
            </label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setDiceCount(Math.max(1, diceCount - 1))}
                className="backdrop-blur-md bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg w-16 h-16 flex items-center justify-center text-white font-bold text-lg transition-all duration-300"
              >
                −
              </button>
              <div className="flex-1 backdrop-blur-md bg-white/10 border border-white/20 rounded-xl p-4 text-center">
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={diceCount}
                  onChange={(e) => {
                    const value = Math.max(1, Math.min(20, parseInt(e.target.value) || 1));
                    setDiceCount(value);
                  }}
                  className="w-full bg-transparent text-white text-3xl font-bold text-center outline-none"
                />
              </div>
              <button
                onClick={() => setDiceCount(Math.min(20, diceCount + 1))}
                className="backdrop-blur-md bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg w-16 h-16 flex items-center justify-center text-white font-bold text-lg transition-all duration-300"
              >
                +
              </button>
            </div>
          </div>

          {/* Roll Button */}
          <button
            onClick={() => rollDice(diceCount, selectedDice, modifier)}
            disabled={isRolling}
            className={`w-full backdrop-blur-md rounded-xl p-6 text-xl font-bold text-white transition-all duration-300 border-2 ${getButtonClasses(isRolling)}`}
          >
            {isRolling ? 'Rolling...' : `Roll ${diceCount}d${selectedDice}${modifier !== 0 ? (modifier > 0 ? `+${modifier}` : `${modifier}`) : ''}`}
          </button>

          {/* Results */}
          {(rolls.length > 0 || total !== null) && !isRolling && (
            <div className="mt-8 space-y-6">
              {/* Individual Rolls */}
              {rolls.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-white text-xl font-semibold">
                      Individual Rolls
                    </h2>
                    {diceTotal !== null && (
                      <div className="text-white/80 text-lg font-semibold">
                        Total dice roll = <span className="text-white font-bold">{diceTotal}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {rolls.map((roll, index) => (
                      <div
                        key={index}
                        className="backdrop-blur-md bg-white/15 border border-white/30 rounded-xl p-4 min-w-[60px] text-center animate-fade-in"
                      >
                        <div className="text-2xl font-bold text-white">{roll}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Total and Highest */}
              {total !== null && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`backdrop-blur-xl ${getTotalClasses()} border-2 rounded-2xl p-6 text-center animate-fade-in`}>
                    <div className="text-white/80 mb-2 text-lg font-semibold">
                      Total {appliedModifier !== 0 ? `(${appliedModifier > 0 ? '+' : ''}${appliedModifier} modifier)` : ''}
                    </div>
                    <div className="text-5xl md:text-6xl font-bold text-white">{total}</div>
                  </div>
                  <div className={`backdrop-blur-xl ${getTotalClasses()} border-2 rounded-2xl p-6 text-center animate-fade-in`}>
                    <div className="text-white/80 mb-2 text-lg font-semibold">Highest Roll</div>
                    <div className="text-5xl md:text-6xl font-bold text-white">{highestRoll}</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DiceRoller;

