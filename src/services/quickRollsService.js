import { supabase } from '../lib/supabase';

/**
 * Quick Rolls CRUD Service
 * Handles all database operations for quick rolls
 */

// CREATE - Add a new quick roll
export const createQuickRoll = async (userId, rollData) => {
  try {
    const { name, count, diceType, modifier } = rollData;
    
    const { data, error } = await supabase
      .from('quick_rolls')
      .insert({
        user_id: userId,
        name: name || null,
        count: count,
        dice_type: diceType,
        modifier: modifier || 0,
      })
      .select()
      .single();

    if (error) {
      console.error('CREATE Error:', error);
      throw new Error(`Failed to create quick roll: ${error.message}`);
    }

    console.log('✅ Created quick roll:', data);
    return {
      id: data.id,
      count: data.count,
      diceType: data.dice_type,
      modifier: data.modifier || 0,
      label: `${data.count}d${data.dice_type}${data.modifier ? (data.modifier > 0 ? `+${data.modifier}` : `${data.modifier}`) : ''}`,
      name: data.name,
    };
  } catch (error) {
    console.error('createQuickRoll error:', error);
    throw error;
  }
};

// READ - Get all quick rolls for a user
export const getQuickRolls = async (userId) => {
  try {
    console.log('📖 Fetching quick rolls for user:', userId);
    
    const { data, error } = await supabase
      .from('quick_rolls')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('READ Error:', error);
      throw new Error(`Failed to fetch quick rolls: ${error.message}`);
    }

    console.log(`✅ Loaded ${data?.length || 0} quick rolls`);
    
    return (data || []).map(roll => ({
      id: roll.id,
      count: roll.count,
      diceType: roll.dice_type,
      modifier: roll.modifier || 0,
      label: `${roll.count}d${roll.dice_type}${roll.modifier ? (roll.modifier > 0 ? `+${roll.modifier}` : `${roll.modifier}`) : ''}`,
      name: roll.name,
    }));
  } catch (error) {
    console.error('getQuickRolls error:', error);
    throw error;
  }
};

// UPDATE - Update an existing quick roll
export const updateQuickRoll = async (userId, rollId, updates) => {
  try {
    const updateData = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.count !== undefined) updateData.count = updates.count;
    if (updates.diceType !== undefined) updateData.dice_type = updates.diceType;
    if (updates.modifier !== undefined) updateData.modifier = updates.modifier;

    console.log('🔄 Updating quick roll:', rollId, updateData);

    const { data, error } = await supabase
      .from('quick_rolls')
      .update(updateData)
      .eq('id', rollId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('UPDATE Error:', error);
      throw new Error(`Failed to update quick roll: ${error.message}`);
    }

    console.log('✅ Updated quick roll:', data);
    return {
      id: data.id,
      count: data.count,
      diceType: data.dice_type,
      modifier: data.modifier || 0,
      label: `${data.count}d${data.dice_type}${data.modifier ? (data.modifier > 0 ? `+${data.modifier}` : `${data.modifier}`) : ''}`,
      name: data.name,
    };
  } catch (error) {
    console.error('updateQuickRoll error:', error);
    throw error;
  }
};

// DELETE - Delete a quick roll
export const deleteQuickRoll = async (userId, rollId) => {
  try {
    console.log('🗑️ Deleting quick roll:', rollId);

    const { error } = await supabase
      .from('quick_rolls')
      .delete()
      .eq('id', rollId)
      .eq('user_id', userId);

    if (error) {
      console.error('DELETE Error:', error);
      throw new Error(`Failed to delete quick roll: ${error.message}`);
    }

    console.log('✅ Deleted quick roll:', rollId);
    return true;
  } catch (error) {
    console.error('deleteQuickRoll error:', error);
    throw error;
  }
};

// Get a single quick roll by ID
export const getQuickRollById = async (userId, rollId) => {
  try {
    const { data, error } = await supabase
      .from('quick_rolls')
      .select('*')
      .eq('id', rollId)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('READ Error:', error);
      throw new Error(`Failed to fetch quick roll: ${error.message}`);
    }

    return {
      id: data.id,
      count: data.count,
      diceType: data.dice_type,
      modifier: data.modifier || 0,
      label: `${data.count}d${data.dice_type}${data.modifier ? (data.modifier > 0 ? `+${data.modifier}` : `${data.modifier}`) : ''}`,
      name: data.name,
    };
  } catch (error) {
    console.error('getQuickRollById error:', error);
    throw error;
  }
};

