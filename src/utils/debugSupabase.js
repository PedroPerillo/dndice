/**
 * Debug utility to test Supabase connection and table access
 * Run this in the browser console to diagnose issues
 */

import { supabase } from '../lib/supabase';

export const testSupabaseConnection = async () => {
  console.log('🔍 Testing Supabase Connection...\n');
  
  // 1. Check if Supabase is configured
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  console.log('1. Environment Variables:');
  console.log('   VITE_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.log('   VITE_SUPABASE_ANON_KEY:', supabaseKey ? '✅ Set' : '❌ Missing');
  console.log('');
  
  // 2. Check current session
  console.log('2. Current Session:');
  const { data: session, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    console.error('   ❌ Error getting session:', sessionError);
  } else if (session?.session?.user) {
    console.log('   ✅ User logged in:', session.session.user.email);
    console.log('   User ID:', session.session.user.id);
  } else {
    console.log('   ⚠️ No user logged in');
  }
  console.log('');
  
  // 3. Test table access
  if (session?.session?.user) {
    const userId = session.session.user.id;
    console.log('3. Testing Table Access:');
    
    // Test SELECT
    console.log('   Testing SELECT...');
    const { data: selectData, error: selectError } = await supabase
      .from('quick_rolls')
      .select('*')
      .eq('user_id', userId)
      .limit(5);
    
    if (selectError) {
      console.error('   ❌ SELECT Error:', selectError);
      console.error('   Error details:', {
        message: selectError.message,
        details: selectError.details,
        hint: selectError.hint,
        code: selectError.code,
      });
    } else {
      console.log('   ✅ SELECT Success:', selectData?.length || 0, 'rows');
      if (selectData && selectData.length > 0) {
        console.log('   Sample data:', selectData[0]);
      }
    }
    console.log('');
    
    // Test INSERT
    console.log('   Testing INSERT...');
    const testRoll = {
      user_id: userId,
      name: 'Test Roll',
      count: 1,
      dice_type: 20,
      modifier: 0,
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('quick_rolls')
      .insert(testRoll)
      .select()
      .single();
    
    if (insertError) {
      console.error('   ❌ INSERT Error:', insertError);
      console.error('   Error details:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code,
      });
      console.error('   Attempted data:', testRoll);
    } else {
      console.log('   ✅ INSERT Success:', insertData);
      
      // Clean up test data
      if (insertData?.id) {
        const { error: deleteError } = await supabase
          .from('quick_rolls')
          .delete()
          .eq('id', insertData.id);
        
        if (deleteError) {
          console.error('   ⚠️ Failed to clean up test data:', deleteError);
        } else {
          console.log('   ✅ Test data cleaned up');
        }
      }
    }
    console.log('');
    
    // Check RLS policies
    console.log('4. RLS Policy Check:');
    console.log('   ⚠️ Note: RLS policies can only be checked in Supabase dashboard');
    console.log('   Go to: Authentication > Policies > quick_rolls');
    console.log('   Make sure policies allow:');
    console.log('     - SELECT: auth.uid() = user_id');
    console.log('     - INSERT: auth.uid() = user_id');
    console.log('     - UPDATE: auth.uid() = user_id');
    console.log('     - DELETE: auth.uid() = user_id');
  } else {
    console.log('3. Skipping table tests (not logged in)');
  }
  
  console.log('\n✅ Debug complete!');
};

// Make it available globally for easy console access
if (typeof window !== 'undefined') {
  window.testSupabaseConnection = testSupabaseConnection;
}

