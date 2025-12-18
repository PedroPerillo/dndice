import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import {
  createQuickRoll,
  getQuickRolls,
  updateQuickRoll,
  deleteQuickRoll as deleteQuickRollService,
} from '../services/quickRollsService';
import '../utils/debugSupabase'; // Load debug utility

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
  const [isDiceTypeExpanded, setIsDiceTypeExpanded] = useState(false);
  const [isModifierExpanded, setIsModifierExpanded] = useState(false);
  const [isDiceCountExpanded, setIsDiceCountExpanded] = useState(false);
  const [showIndividualRollsModal, setShowIndividualRollsModal] = useState(false);
  const isInitialMount = useRef(true);
  const isLoadingQuickRolls = useRef(false);

  useEffect(() => {
    // Theme is now applied via CSS
  }, []);

  // Load saved quick rolls from Supabase (only when logged in)
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) {
        setSavedQuickRolls([]);
        return;
      }

      isLoadingQuickRolls.current = true;
      
      try {
        const rolls = await getQuickRolls(user.id);
        setSavedQuickRolls(rolls);
      } catch (error) {
        console.error('Failed to load quick rolls:', error);
        alert(`Failed to load quick rolls: ${error.message}. Please check the browser console.`);
        setSavedQuickRolls([]);
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

    try {
      const newRoll = await createQuickRoll(user.id, {
        name: name,
        count: newQuickRollCount,
        diceType: newQuickRollDice,
        modifier: modifier,
      });

      setSavedQuickRolls([...savedQuickRolls, newRoll]);
      closeAddQuickRollModal();
    } catch (error) {
      alert(`Failed to save quick roll: ${error.message}`);
      console.error('Add quick roll error:', error);
    }
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

    try {
      await deleteQuickRollService(user.id, id);
      // Remove from local state
      setSavedQuickRolls(savedQuickRolls.filter(roll => roll.id !== id));
      setDeleteConfirmId(null);
    } catch (error) {
      alert(`Failed to delete quick roll: ${error.message}`);
      console.error('Delete quick roll error:', error);
      setDeleteConfirmId(null);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmId(null);
  };

  const getButtonClasses = (isRolling) => {
    if (isRolling) {
      return 'bg-orange-800/50 border-orange-600 cursor-not-allowed';
    }
    return 'bg-orange-600/50 border-orange-400 hover:bg-orange-500/60 hover:scale-105 hover:shadow-xl active:scale-95';
  };

  const getSelectedDiceClasses = () => {
    return 'bg-orange-600/50 border-orange-400';
  };

  const getTotalClasses = () => {
    return 'bg-orange-600/40 border-orange-400/50';
  };

  const closeAddQuickRollModal = () => {
    setShowAddQuickRoll(false);
    setNewQuickRollCount(1);
    setNewQuickRollDice(20);
    setNewQuickRollName('');
    setNewQuickRollModifier(0);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-2 sm:p-4 relative z-10">
      {/* Add Quick Roll Modal */}
      {showAddQuickRoll && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={closeAddQuickRollModal}>
          <div 
            className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <label className="block text-white text-lg sm:text-xl font-semibold">
                Create Quick Roll
              </label>
              <button
                onClick={closeAddQuickRollModal}
                className="text-white/60 hover:text-white text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-white/80 mb-1.5 text-sm">Name (Optional)</label>
                <input
                  type="text"
                  value={newQuickRollName}
                  onChange={(e) => setNewQuickRollName(e.target.value)}
                  placeholder={`e.g., "Attack Roll" or "${newQuickRollCount}d${newQuickRollDice}"`}
                  className="w-full backdrop-blur-md bg-white/10 border border-white/20 rounded-lg p-2.5 text-white placeholder-white/40 outline-none focus:border-white/40 transition-colors text-sm"
                  maxLength={30}
                />
              </div>
              <div>
                <label className="block text-white/80 mb-1.5 text-sm">Number of Dice</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setNewQuickRollCount(Math.max(1, newQuickRollCount - 1))}
                    className="backdrop-blur-md bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-white font-bold transition-all duration-300 text-lg"
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
                    className="flex-1 backdrop-blur-md bg-white/10 border border-white/20 rounded-lg p-2.5 text-white text-center font-bold outline-none text-sm sm:text-base"
                  />
                  <button
                    onClick={() => setNewQuickRollCount(Math.min(20, newQuickRollCount + 1))}
                    className="backdrop-blur-md bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-white font-bold transition-all duration-300 text-lg"
                  >
                    +
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-white/80 mb-1.5 text-sm">Dice Type</label>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 sm:gap-2">
                  {DICE_TYPES.map((dice) => (
                    <button
                      key={dice.value}
                      onClick={() => setNewQuickRollDice(dice.value)}
                      className={`backdrop-blur-md rounded-lg p-2 sm:p-3 transition-all duration-300 border-2 ${
                        newQuickRollDice === dice.value
                          ? `${getSelectedDiceClasses()} text-white shadow-lg scale-105`
                          : 'bg-white/10 border-white/20 text-white/80 hover:bg-white/20 hover:border-white/30'
                      }`}
                    >
                      <div className="text-xs sm:text-sm font-bold">{dice.label}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-white/80 mb-1.5 text-sm">Modifier (Optional)</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setNewQuickRollModifier(Math.max(-50, newQuickRollModifier - 1))}
                    className="backdrop-blur-md bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-white font-bold transition-all duration-300 text-lg"
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
                    className="flex-1 backdrop-blur-md bg-white/10 border border-white/20 rounded-lg p-2.5 text-white text-center font-bold outline-none placeholder-white/40 text-sm sm:text-base"
                  />
                  <button
                    onClick={() => setNewQuickRollModifier(Math.min(50, newQuickRollModifier + 1))}
                    className="backdrop-blur-md bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-white font-bold transition-all duration-300 text-lg"
                  >
                    +
                  </button>
                </div>
                {newQuickRollModifier !== 0 && (
                  <p className="text-white/60 text-xs mt-1.5 text-center">
                    {newQuickRollModifier > 0 ? '+' : ''}{newQuickRollModifier} will be added to the total
                  </p>
                )}
              </div>
              <button
                onClick={addQuickRoll}
                className={`w-full backdrop-blur-md rounded-lg p-2.5 sm:p-3 text-base sm:text-lg font-bold text-white transition-all duration-300 border-2 ${getButtonClasses(false)}`}
              >
                Save {newQuickRollName.trim() || `${newQuickRollCount}d${newQuickRollDice}${newQuickRollModifier !== 0 ? (newQuickRollModifier > 0 ? `+${newQuickRollModifier}` : `${newQuickRollModifier}`) : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}

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

      
      <div className="w-full max-w-2xl relative z-10">
        {/* Main Card */}
        <div className="backdrop-blur-xl bg-white/10 rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20 p-4 sm:p-6 md:p-8 relative">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-1 sm:mb-2 text-center relative z-10">
            D&D Dice Roller
          </h1>
          <p className="text-gray-300 text-center mb-4 sm:mb-6 text-sm sm:text-base md:text-lg relative z-10">
            Roll your fate
          </p>

          {/* Quick Roll d20 Buttons */}
          <div className="mb-4 sm:mb-6">
            <label className="block text-white mb-2 sm:mb-3 text-base sm:text-lg font-semibold text-center">
              Quick Roll d20
            </label>
            <div className="flex justify-center gap-2 sm:gap-3 flex-wrap">
              <button
                onClick={() => quickRollD20(1)}
                disabled={isRolling}
                className={`backdrop-blur-md rounded-lg sm:rounded-xl px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base md:text-lg font-bold text-white transition-all duration-300 border-2 ${getButtonClasses(isRolling)}`}
              >
                1d20
              </button>
              <button
                onClick={() => quickRollD20(2)}
                disabled={isRolling}
                className={`backdrop-blur-md rounded-lg sm:rounded-xl px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base md:text-lg font-bold text-white transition-all duration-300 border-2 ${getButtonClasses(isRolling)}`}
              >
                2d20
              </button>
              <button
                onClick={() => quickRollD20(3)}
                disabled={isRolling}
                className={`backdrop-blur-md rounded-lg sm:rounded-xl px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base md:text-lg font-bold text-white transition-all duration-300 border-2 ${getButtonClasses(isRolling)}`}
              >
                3d20
              </button>
              <button
                onClick={() => quickRollD20(6)}
                disabled={isRolling}
                className={`backdrop-blur-md rounded-lg sm:rounded-xl px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base md:text-lg font-bold text-white transition-all duration-300 border-2 ${getButtonClasses(isRolling)}`}
              >
                6d20
              </button>
            </div>
          </div>

          {/* Saved Quick Rolls */}
          <div className="mb-4 sm:mb-6">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <label className="block text-white text-base sm:text-lg font-semibold">
                Saved Quick Rolls
              </label>
              {user && (
                <button
                  onClick={() => setShowAddQuickRoll(true)}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full backdrop-blur-md bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xl sm:text-2xl font-bold transition-all duration-300 flex items-center justify-center hover:scale-110 active:scale-95"
                  title="Add Quick Roll"
                >
                  +
                </button>
              )}
            </div>
            {!user ? (
              <p className="text-white/60 text-sm sm:text-base text-center">Please log in to save quick rolls</p>
            ) : savedQuickRolls.length > 0 ? (
              <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                {savedQuickRolls.map((roll) => (
                  <div key={roll.id} className="relative group">
                    <button
                      onClick={() => quickRoll(roll.count, roll.diceType, roll.modifier || 0)}
                      disabled={isRolling}
                      className={`backdrop-blur-md rounded-lg sm:rounded-xl px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base md:text-lg font-bold text-white transition-all duration-300 border-2 ${getButtonClasses(isRolling)}`}
                      title={roll.name !== roll.label ? roll.label : ''}
                    >
                      {roll.name || roll.label}
                    </button>
                    <button
                      onClick={() => handleDeleteClick(roll.id)}
                      className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 w-5 h-5 sm:w-6 sm:h-6 rounded-full backdrop-blur-md bg-red-500/80 hover:bg-red-600 border border-white/30 text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center"
                      title="Delete"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-white/60 text-sm sm:text-base text-center">No saved quick rolls yet</p>
            )}
          </div>

          {/* Dice Type Selection - Collapsible */}
          <div className="mb-4 sm:mb-6">
            <button
              onClick={() => setIsDiceTypeExpanded(!isDiceTypeExpanded)}
              className="w-full backdrop-blur-md bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg sm:rounded-xl p-3 sm:p-4 flex items-center justify-between transition-all duration-300"
            >
              <div className="flex items-center gap-3">
                <span className="text-white text-base sm:text-lg font-semibold">Dice Type</span>
                <span className={`backdrop-blur-md rounded-lg px-3 py-1 text-sm sm:text-base font-bold ${getSelectedDiceClasses()} text-white`}>
                  {DICE_TYPES.find(d => d.value === selectedDice)?.label || `d${selectedDice}`}
                </span>
              </div>
              <span className="text-white/60 text-xl">
                {isDiceTypeExpanded ? '−' : '+'}
              </span>
            </button>
            {isDiceTypeExpanded && (
              <div className="mt-3 grid grid-cols-4 sm:grid-cols-7 gap-2 sm:gap-3">
                {DICE_TYPES.map((dice) => (
                  <button
                    key={dice.value}
                    onClick={() => {
                      setSelectedDice(dice.value);
                      setIsDiceTypeExpanded(false);
                    }}
                    className={`backdrop-blur-md rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 transition-all duration-300 border-2 w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 flex items-center justify-center ${
                      selectedDice === dice.value
                        ? `${getSelectedDiceClasses()} text-white shadow-lg scale-105`
                        : 'bg-white/10 border-white/20 text-white/80 hover:bg-white/20 hover:border-white/30'
                    }`}
                  >
                    <div className="text-base sm:text-lg md:text-xl font-bold">{dice.label}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Modifier Section - Collapsible */}
          <div className="mb-4 sm:mb-6">
            <button
              onClick={() => setIsModifierExpanded(!isModifierExpanded)}
              className="w-full backdrop-blur-md bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg sm:rounded-xl p-3 sm:p-4 flex items-center justify-between transition-all duration-300"
            >
              <div className="flex items-center gap-3">
                <span className="text-white text-base sm:text-lg font-semibold">Modifier</span>
                <span className={`backdrop-blur-md rounded-lg px-3 py-1 text-sm sm:text-base font-bold ${modifier !== 0 ? getSelectedDiceClasses() : 'bg-white/10 border-white/20'} text-white border`}>
                  {modifier !== 0 ? (modifier > 0 ? `+${modifier}` : `${modifier}`) : '0'}
                </span>
              </div>
              <span className="text-white/60 text-xl">
                {isModifierExpanded ? '−' : '+'}
              </span>
            </button>
            {isModifierExpanded && (
              <div className="mt-3 space-y-3">
                {/* Quick Modifier Buttons */}
                <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                    <button
                      key={value}
                      onClick={() => {
                        setModifier(value);
                        setIsModifierExpanded(false);
                      }}
                      className={`backdrop-blur-md rounded-lg px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-bold text-white transition-all duration-300 border ${
                        modifier === value
                          ? `${getSelectedDiceClasses()} shadow-lg scale-105`
                          : 'bg-white/10 border-white/20 hover:bg-white/20 hover:border-white/30'
                      }`}
                    >
                      +{value}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 sm:gap-4">
                  <button
                    onClick={() => setModifier(Math.max(-50, modifier - 1))}
                    className="backdrop-blur-md bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 flex items-center justify-center text-white font-bold text-base sm:text-lg transition-all duration-300"
                  >
                    −
                  </button>
                  <div className="flex-1 backdrop-blur-md bg-white/10 border border-white/20 rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 text-center">
                    <input
                      type="number"
                      min="-50"
                      max="50"
                      value={modifier}
                      onChange={(e) => {
                        const value = Math.max(-50, Math.min(50, parseInt(e.target.value) || 0));
                        setModifier(value);
                      }}
                      className="w-full bg-transparent text-white text-xl sm:text-2xl md:text-3xl font-bold text-center outline-none"
                    />
                  </div>
                  <button
                    onClick={() => setModifier(Math.min(50, modifier + 1))}
                    className="backdrop-blur-md bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 flex items-center justify-center text-white font-bold text-base sm:text-lg transition-all duration-300"
                  >
                    +
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Dice Count Selection - Collapsible */}
          <div className="mb-4 sm:mb-6">
            <button
              onClick={() => setIsDiceCountExpanded(!isDiceCountExpanded)}
              className="w-full backdrop-blur-md bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg sm:rounded-xl p-3 sm:p-4 flex items-center justify-between transition-all duration-300"
            >
              <div className="flex items-center gap-3">
                <span className="text-white text-base sm:text-lg font-semibold">Number of Dice</span>
                <span className={`backdrop-blur-md rounded-lg px-3 py-1 text-sm sm:text-base font-bold ${getSelectedDiceClasses()} text-white border`}>
                  {diceCount}
                </span>
              </div>
              <span className="text-white/60 text-xl">
                {isDiceCountExpanded ? '−' : '+'}
              </span>
            </button>
            {isDiceCountExpanded && (
              <div className="mt-3 flex items-center gap-2 sm:gap-4">
                <button
                  onClick={() => {
                    setDiceCount(Math.max(1, diceCount - 1));
                    setIsDiceCountExpanded(false);
                  }}
                  className="backdrop-blur-md bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 flex items-center justify-center text-white font-bold text-base sm:text-lg transition-all duration-300"
                >
                  −
                </button>
                <div className="flex-1 backdrop-blur-md bg-white/10 border border-white/20 rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 text-center">
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={diceCount}
                    onChange={(e) => {
                      const value = Math.max(1, Math.min(20, parseInt(e.target.value) || 1));
                      setDiceCount(value);
                    }}
                    className="w-full bg-transparent text-white text-xl sm:text-2xl md:text-3xl font-bold text-center outline-none"
                  />
                </div>
                <button
                  onClick={() => {
                    setDiceCount(Math.min(20, diceCount + 1));
                    setIsDiceCountExpanded(false);
                  }}
                  className="backdrop-blur-md bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 flex items-center justify-center text-white font-bold text-base sm:text-lg transition-all duration-300"
                >
                  +
                </button>
              </div>
            )}
          </div>

          {/* Roll Button */}
          <button
            onClick={() => rollDice(diceCount, selectedDice, modifier)}
            disabled={isRolling}
            className={`w-full backdrop-blur-md rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 text-base sm:text-lg md:text-xl font-bold text-white transition-all duration-300 border-2 ${getButtonClasses(isRolling)}`}
          >
            {isRolling ? 'Rolling...' : `Roll ${diceCount}d${selectedDice}${modifier !== 0 ? (modifier > 0 ? `+${modifier}` : `${modifier}`) : ''}`}
          </button>

          {/* Results */}
          {(rolls.length > 0 || total !== null) && !isRolling && (
            <div className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
              {/* Total and Highest */}
              {total !== null && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <button
                    onClick={() => rolls.length > 0 && setShowIndividualRollsModal(true)}
                    disabled={rolls.length === 0}
                    className={`backdrop-blur-xl ${getTotalClasses()} border-2 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 text-center animate-fade-in transition-all duration-300 ${
                      rolls.length > 0 
                        ? 'hover:bg-orange-500/60 hover:scale-105 hover:shadow-xl cursor-pointer' 
                        : 'cursor-default'
                    }`}
                    title={rolls.length > 0 ? 'Click to view individual rolls' : ''}
                  >
                    <div className="text-white/80 mb-1 sm:mb-2 text-sm sm:text-base md:text-lg font-semibold">
                      Total {appliedModifier !== 0 ? `(${appliedModifier > 0 ? '+' : ''}${appliedModifier} modifier)` : ''}
                    </div>
                    <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white">{total}</div>
                    {rolls.length > 0 && (
                      <div className="text-white/60 text-xs sm:text-sm mt-2">
                        {rolls.length} roll{rolls.length !== 1 ? 's' : ''} • Click to view
                      </div>
                    )}
                  </button>
                  <div className={`backdrop-blur-xl ${getTotalClasses()} border-2 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 text-center animate-fade-in`}>
                    <div className="text-white/80 mb-1 sm:mb-2 text-sm sm:text-base md:text-lg font-semibold">Highest Roll</div>
                    <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white">{highestRoll}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Individual Rolls Modal */}
          {showIndividualRollsModal && rolls.length > 0 && (
            <div 
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowIndividualRollsModal(false)}
            >
              <div 
                className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-4 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-white text-xl sm:text-2xl font-bold">
                    Individual Rolls
                  </h2>
                  <button
                    onClick={() => setShowIndividualRollsModal(false)}
                    className="text-white/60 hover:text-white text-2xl leading-none"
                  >
                    ×
                  </button>
                </div>
                <div className="mb-4">
                  <div className="text-white/80 text-sm sm:text-base font-semibold text-center">
                    Total dice roll = <span className="text-white font-bold text-lg sm:text-xl">{diceTotal}</span>
                  </div>
                </div>
                <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
                  {rolls.map((roll, index) => (
                    <div
                      key={index}
                      className="backdrop-blur-md bg-white/15 border border-white/30 rounded-xl p-4 sm:p-5 min-w-[70px] sm:min-w-[80px] text-center"
                    >
                      <div className="text-white/60 text-xs sm:text-sm mb-1">Roll {index + 1}</div>
                      <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">{roll}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DiceRoller;

