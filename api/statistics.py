"""
Statistics API endpoint for Vercel
Handles fetching recorded and live statistics from Supabase
"""

import os
import json
from http.server import BaseHTTPRequestHandler
from datetime import datetime
from supabase import create_client, Client

# Initialize Supabase client
supabase_url = os.environ.get('VITE_SUPABASE_URL', 'https://gzzbjifmrwvqbkwbyvhm.supabase.co')
supabase_key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', os.environ.get('VITE_SUPABASE_SERVICE_ROLE_KEY', ''))

# If service role key is not available, try anon key
if not supabase_key:
    supabase_key = os.environ.get('VITE_SUPABASE_ANON_KEY', '')

supabase: Client = create_client(supabase_url, supabase_key)

def get_statistics():
    """Fetch confirmed statistics from site_stats table"""
    try:
        # Get all stats from site_stats table
        response = supabase.table('site_stats').select('*').execute()
        
        # Create a dictionary for easy lookup
        stats_dict = {}
        if response.data:
            for stat in response.data:
                stats_dict[stat['stat_name']] = stat['value']
        
        # Return with defaults if not found
        return {
            'active_volunteers': stats_dict.get('active_volunteers', 2500),
            'hours_contributed': stats_dict.get('hours_contributed', 5000),
            'partner_organizations': stats_dict.get('partner_organizations', 50)
        }
    except Exception as e:
        print(f"Error fetching statistics: {str(e)}")
        # Return default values on error
        return {
            'active_volunteers': 2500,
            'hours_contributed': 5000,
            'partner_organizations': 50
        }

def calculate_live_statistics():
    """Calculate live statistics based on current data"""
    try:
        live_stats = {}
        
        # Calculate active volunteers (unique users who have signed up for events)
        user_events_response = supabase.table('user_events').select('user_id', count='exact').execute()
        unique_users_response = supabase.table('user_events').select('user_id').execute()
        
        if unique_users_response.data:
            unique_user_ids = set(event['user_id'] for event in unique_users_response.data)
            live_stats['active_volunteers'] = len(unique_user_ids)
        else:
            live_stats['active_volunteers'] = 0
        
        # Calculate hours contributed (count of signups * 2 hours default)
        if user_events_response.count is not None:
            live_stats['hours_contributed'] = user_events_response.count * 2
        else:
            live_stats['hours_contributed'] = 0
        
        # Calculate partner organizations
        orgs_response = supabase.table('organizations').select('*', count='exact').execute()
        live_stats['partner_organizations'] = orgs_response.count if orgs_response.count else 0
        
        return live_stats
    except Exception as e:
        print(f"Error calculating live statistics: {str(e)}")
        # Return zeros on error
        return {
            'active_volunteers': 0,
            'hours_contributed': 0,
            'partner_organizations': 0
        }

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        """Handle preflight CORS requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        
    def do_GET(self):
        """Get statistics"""
        try:
            # Get both recorded and live statistics
            recorded_stats = get_statistics()
            live_stats = calculate_live_statistics()
            
            # Format the response
            result = {
                'success': True,
                'data': {
                    'recorded': recorded_stats,
                    'live': live_stats
                }
            }
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            self.wfile.write(json.dumps(result).encode())
            
        except Exception as e:
            self.send_error_response(500, str(e))
    
    def do_POST(self):
        """Update recorded statistics"""
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            data = json.loads(body.decode())
            
            # Update each statistic
            for stat_name, value in data.items():
                if stat_name in ['active_volunteers', 'hours_contributed', 'partner_organizations']:
                    # Check if stat exists
                    existing = supabase.table('site_stats').select('*').eq('stat_name', stat_name).execute()
                    
                    if existing.data:
                        # Update existing
                        supabase.table('site_stats').update({
                            'value': value,
                            'updated_at': datetime.now().isoformat()
                        }).eq('stat_name', stat_name).execute()
                    else:
                        # Insert new
                        supabase.table('site_stats').insert({
                            'stat_name': stat_name,
                            'value': value
                        }).execute()
            
            # Return updated statistics
            recorded_stats = get_statistics()
            live_stats = calculate_live_statistics()
            
            result = {
                'success': True,
                'data': {
                    'recorded': recorded_stats,
                    'live': live_stats
                }
            }
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            self.wfile.write(json.dumps(result).encode())
            
        except Exception as e:
            self.send_error_response(500, str(e))
    
    def send_error_response(self, status_code, error_message):
        """Send error response"""
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        result = {
            'success': False,
            'error': error_message
        }
        self.wfile.write(json.dumps(result).encode())