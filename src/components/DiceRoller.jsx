import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

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
  const [savedQuickRolls, setSavedQuickRolls] = useState([]);
  const [showAddQuickRoll, setShowAddQuickRoll] = useState(false);
  const [newQuickRollCount, setNewQuickRollCount] = useState(1);
  const [newQuickRollDice, setNewQuickRollDice] = useState(20);
  const [newQuickRollName, setNewQuickRollName] = useState('');
  const [newQuickRollModifier, setNewQuickRollModifier] = useState(0);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const isInitialMount = useRef(true);
  const isLoadingQuickRolls = useRef(false);

  useEffect(() => {
    // Apply forest theme class on mount
    document.body.className = 'theme-forest';
  }, []);

  // Load saved quick rolls from Supabase (only when logged in)
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) {
        setSavedQuickRolls([]);
        return;
      }

      isLoadingQuickRolls.current = true;
      
      // Load quick rolls from Supabase
      const { data: rollsData, error: rollsError } = await supabase
        .from('quick_rolls')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (rollsError) {
        console.error('Error loading quick rolls:', rollsError);
        console.error('User ID:', user.id);
        alert(`Failed to load quick rolls: ${rollsError.message}. Please check the browser console.`);
      } else {
        console.log('Loaded quick rolls:', rollsData);
        if (rollsData && rollsData.length > 0) {
          setSavedQuickRolls(rollsData.map(roll => ({
            id: roll.id,
            count: roll.count,
            diceType: roll.dice_type,
            modifier: roll.modifier || 0,
            label: `${roll.count}d${roll.dice_type}${roll.modifier ? (roll.modifier > 0 ? `+${roll.modifier}` : `${roll.modifier}`) : ''}`,
            name: roll.name,
          })));
        } else {
          console.log('No quick rolls found for user:', user.id);
          setSavedQuickRolls([]);
        }
      }
      
      isLoadingQuickRolls.current = false;
    };

    loadUserData();
  }, [user]);

  // Note: We no longer use a save effect that syncs on every change
  // Quick rolls are saved individually when added/deleted
  // This prevents race conditions and unnecessary database operations


  const rollDice = (count = diceCount, diceType = selectedDice, rollModifier = null) => {
    setIsRolling(true);
    const newRolls = [];
    let sum = 0;
    let highest = 0;

    // Use provided modifier or state modifier
    const appliedModifier = rollModifier !== null ? rollModifier : modifier;

    for (let i = 0; i < count; i++) {
      const roll = Math.floor(Math.random() * diceType) + 1;
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
    if (!user) {
      alert('Please log in to save quick rolls.');
      return;
    }

    const name = newQuickRollName.trim() || `${newQuickRollCount}d${newQuickRollDice}`;
    const modifier = parseInt(newQuickRollModifier) || 0;
    const modifierText = modifier !== 0 ? (modifier > 0 ? `+${modifier}` : `${modifier}`) : '';
    
    // Save to Supabase
    const rollData = {
      user_id: user.id,
      name: name,
      count: newQuickRollCount,
      dice_type: newQuickRollDice,
      modifier: modifier,
    };

    console.log('Saving quick roll:', rollData);

    const { data, error } = await supabase
      .from('quick_rolls')
      .insert(rollData)
      .select()
      .single();

    if (error) {
      console.error('Error adding quick roll:', error);
      console.error('Roll data attempted:', rollData);
      alert(`Failed to save quick roll: ${error.message}. Please check the browser console and try again.`);
      return;
    }

    console.log('Successfully saved quick roll:', data);

    const newRoll = {
      id: data.id,
      count: data.count,
      diceType: data.dice_type,
      modifier: data.modifier || 0,
      label: `${data.count}d${data.dice_type}${modifierText}`,
      name: data.name,
    };
    setSavedQuickRolls([...savedQuickRolls, newRoll]);

    setShowAddQuickRoll(false);
    setNewQuickRollCount(1);
    setNewQuickRollDice(20);
    setNewQuickRollName('');
    setNewQuickRollModifier(0);
  };

  const handleDeleteClick = (id) => {
    setDeleteConfirmId(id);
  };

  const deleteQuickRoll = async (id) => {
    if (!user) {
      alert('Please log in to delete quick rolls.');
      setDeleteConfirmId(null);
      return;
    }

    // Delete from Supabase
    const { error } = await supabase
      .from('quick_rolls')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting quick roll:', error);
      alert(`Failed to delete quick roll: ${error.message}. Please try again.`);
      setDeleteConfirmId(null);
      return;
    }
    
    // Remove from local state
    setSavedQuickRolls(savedQuickRolls.filter(roll => roll.id !== id));
    setDeleteConfirmId(null);
  };

  const cancelDelete = () => {
    setDeleteConfirmId(null);
  };

  const getButtonClasses = (isRolling) => {
    if (isRolling) {
      return 'bg-forest-800/50 border-forest-600 cursor-not-allowed';
    }
    return 'bg-forest-600/50 border-forest-400 hover:bg-forest-500/60 hover:scale-105 hover:shadow-xl active:scale-95';
  };

  const getSelectedDiceClasses = () => {
    return 'bg-forest-600/50 border-forest-400';
  };

  const getTotalClasses = () => {
    return 'bg-forest-600/40 border-forest-400/50';
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 max-w-md mx-4 shadow-2xl">
            <h3 className="text-white text-xl font-bold mb-4">Delete Quick Roll?</h3>
            <p className="text-white/80 mb-6">
              Are you sure you want to delete this quick roll? This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <button
                onClick={cancelDelete}
                className="flex-1 backdrop-blur-md bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-4 py-2 text-white font-semibold transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteQuickRoll(deleteConfirmId)}
                className="flex-1 backdrop-blur-md bg-red-600/50 hover:bg-red-600/70 border border-red-400 rounded-lg px-4 py-2 text-white font-semibold transition-all duration-300"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Effects - Leaves */}
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
      
      <div className="w-full max-w-2xl relative z-10">
        {/* Main Card */}
        <div className="backdrop-blur-xl bg-white/10 rounded-3xl shadow-2xl border border-white/20 p-8 md:p-12 relative">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-2 text-center relative z-10">
            D&D Dice Roller
          </h1>
          <p className="text-forest-200 text-center mb-6 text-lg relative z-10">
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
                      onClick={() => handleDeleteClick(roll.id)}
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
            {!user ? (
              <div className="text-center">
                <p className="text-white/60 mb-2">Please log in to save quick rolls</p>
              </div>
            ) : !showAddQuickRoll ? (
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

