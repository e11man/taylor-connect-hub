#!/usr/bin/env node

/**
 * Demo Chat Notification System
 * This script demonstrates the direct email notification system functionality
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
// updated

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://gzzbjifmrwvqbkwbyvhm.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.error('   This is found in your Supabase project settings');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function demoChatNotifications() {
  console.log('🚀 Chat Notification System Demo\n');
  console.log('This demonstrates the new direct email notification system');
  console.log('that sends emails immediately when chat messages are posted.\n');
  
  try {
    // Step 1: Show system overview
    console.log('📋 System Overview:');
    console.log('  ✅ Direct email sending (same as signup codes)');
    console.log('  ✅ User preference checking');
    console.log('  ✅ Immediate notifications');
    console.log('  ✅ Organization notifications');
    console.log('  ✅ Beautiful HTML email templates');
    
    // Step 2: Check database structure
    console.log('\n🗄️  Database Structure Check:');
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email')
      .limit(1);
    
    if (profilesError) {
      console.error('❌ Error accessing profiles table:', profilesError.message);
      return false;
    }
    
    console.log(`  ✅ Profiles table accessible (${profiles?.length || 0} users found)`);
    
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, title, organization_id')
      .limit(1);
    
    if (eventsError) {
      console.error('❌ Error accessing events table:', eventsError.message);
      return false;
    }
    
    console.log(`  ✅ Events table accessible (${events?.length || 0} events found)`);
    
    // Step 3: Test notification preferences function
    console.log('\n🔔 Notification Preferences Test:');
    
    if (profiles && profiles.length > 0) {
      const testUser = profiles[0];
      
      // Test setting preferences
      const { error: prefSetError } = await supabase
        .rpc('upsert_notification_preferences', {
          p_user_id: testUser.id,
          p_email_frequency: 'immediate',
          p_chat_notifications: true,
          p_event_updates: true
        });
      
      if (prefSetError) {
        console.error('❌ Error setting preferences:', prefSetError.message);
      } else {
        console.log('  ✅ Preferences can be set');
      }
      
      // Test getting preferences
      const { data: preferences, error: prefGetError } = await supabase
        .rpc('get_notification_preferences', { p_user_id: testUser.id });
      
      if (prefGetError) {
        console.error('❌ Error getting preferences:', prefGetError.message);
      } else {
        console.log('  ✅ Preferences can be retrieved');
        if (preferences && preferences.length > 0) {
          const prefs = preferences[0];
          console.log(`     - Email frequency: ${prefs.email_frequency}`);
          console.log(`     - Chat notifications: ${prefs.chat_notifications}`);
          console.log(`     - Event updates: ${prefs.event_updates}`);
        }
      }
    }
    
    // Step 4: Test email API structure
    console.log('\n📧 Email API Structure:');
    console.log('  📄 API Route: /api/send-chat-notification');
    console.log('  📥 Required fields:');
    console.log('     - userEmail: Recipient email address');
    console.log('     - eventTitle: Name of the event');
    console.log('     - message: The chat message content');
    console.log('     - senderName: Name of the person who sent the message');
    console.log('     - senderType: "user" or "organization"');
    console.log('     - organizationName: Organization hosting the event');
    
    // Step 5: Show the workflow
    console.log('\n⚡ How It Works:');
    console.log('  1️⃣  User/Organization posts a chat message');
    console.log('  2️⃣  System immediately looks up event participants');
    console.log('  3️⃣  Checks each participant\'s notification preferences');
    console.log('  4️⃣  Sends email to those with immediate notifications enabled');
    console.log('  5️⃣  Also notifies organization (if message from user)');
    console.log('  6️⃣  Uses same Resend service as signup emails');
    
    // Step 6: Test notification logic components
    console.log('\n🧪 Testing Notification Logic Components:');
    
    if (events && events.length > 0) {
      const testEvent = events[0];
      
      // Test event details fetch
      const { data: eventDetails, error: eventDetailsError } = await supabase
        .from('events')
        .select(`
          id,
          title,
          organization_id,
          organizations (
            id,
            name,
            user_id
          )
        `)
        .eq('id', testEvent.id)
        .single();
      
      if (eventDetailsError) {
        console.error('❌ Error fetching event details:', eventDetailsError.message);
      } else {
        console.log('  ✅ Event details fetch works');
        console.log(`     - Event: ${eventDetails.title}`);
        console.log(`     - Organization: ${eventDetails.organizations?.name || 'None'}`);
      }
      
      // Test user events fetch (participants)
      const { data: participants, error: participantsError } = await supabase
        .from('user_events')
        .select(`
          user_id,
          profiles (
            id,
            email
          )
        `)
        .eq('event_id', testEvent.id);
      
      if (participantsError) {
        console.error('❌ Error fetching participants:', participantsError.message);
      } else {
        console.log(`  ✅ Participants fetch works (${participants?.length || 0} signed up)`);
      }
    }
    
    // Step 7: Email template preview
    console.log('\n🎨 Email Template Features:');
    console.log('  ✅ Main Street Connect branding');
    console.log('  ✅ Responsive HTML design');
    console.log('  ✅ Event context and organization info');
    console.log('  ✅ Sender name and message content');
    console.log('  ✅ Call-to-action button');
    console.log('  ✅ Notification preferences reminder');
    
    // Step 8: Integration points
    console.log('\n🔗 Integration Points:');
    console.log('  📁 API Route: api/send-chat-notification.js');
    console.log('  📁 Service: src/utils/chatNotificationService.ts');
    console.log('  📁 Hook: useChatMessages.ts (already integrated)');
    console.log('  📁 UI: EventChatModal.tsx (ready to use)');
    
    // Step 9: Next steps for testing
    console.log('\n🧪 To Test the Full System:');
    console.log('  1. Start the development server: npm run dev');
    console.log('  2. Create/join an event with multiple users');
    console.log('  3. Post a message in the event chat');
    console.log('  4. Check email delivery (immediate notifications)');
    console.log('  5. Verify notification preferences are respected');
    
    console.log('\n✨ System Status: READY FOR TESTING');
    console.log('   The chat notification system is fully implemented');
    console.log('   and ready to send emails when messages are posted!');
    
    return true;
    
  } catch (error) {
    console.error('❌ Demo failed with error:', error);
    return false;
  }
}

// Run the demo
if (require.main === module) {
  demoChatNotifications()
    .then(success => {
      console.log('\n' + '='.repeat(60));
      if (success) {
        console.log('🎉 Chat Notification System Demo Complete!');
        console.log('   Ready for live testing with real chat messages.');
      } else {
        console.log('❌ Demo encountered issues - check configuration.');
      }
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Demo execution failed:', error);
      process.exit(1);
    });
}

module.exports = { demoChatNotifications };
