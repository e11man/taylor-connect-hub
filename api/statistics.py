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
    """Fetch both confirmed and estimate statistics from site_stats table"""
    try:
        # Get all stats from site_stats table
        response = supabase.table('site_stats').select('*').execute()
        
        # Create dictionaries for both values
        confirmed = {}
        estimates = {}
        
        if response.data:
            for stat in response.data:
                stat_type = stat['stat_type']
                confirmed[stat_type] = stat['confirmed_total']
                estimates[stat_type] = stat['current_estimate']
        
        # Return with defaults if not found
        return {
            'confirmed': {
                'active_volunteers': confirmed.get('active_volunteers', 2500),
                'hours_contributed': confirmed.get('hours_contributed', 5000),
                'partner_organizations': confirmed.get('partner_organizations', 50)
            },
            'estimates': {
                'active_volunteers': estimates.get('active_volunteers', 2500),
                'hours_contributed': estimates.get('hours_contributed', 5000),
                'partner_organizations': estimates.get('partner_organizations', 50)
            }
        }
    except Exception as e:
        print(f"Error fetching statistics: {str(e)}")
        # Return default values on error
        return {
            'confirmed': {
                'active_volunteers': 2500,
                'hours_contributed': 5000,
                'partner_organizations': 50
            },
            'estimates': {
                'active_volunteers': 2500,
                'hours_contributed': 5000,
                'partner_organizations': 50
            }
        }

def calculate_live_statistics():
    """Calculate live statistics based on current data"""
    try:
        live_stats = {}
        
        # Calculate active volunteers (ONLY actual users, not organizations)
        profiles_response = supabase.table('profiles').select('*', count='exact').neq('user_type', 'organization').execute()
        
        if profiles_response.data:
            # Count only actual users, excluding organizations
            live_stats['active_volunteers'] = len(profiles_response.data)
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
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        
    def do_GET(self):
        """Get statistics"""
        try:
            # Get statistics from database
            stats = get_statistics()
            
            # Format the response
            result = {
                'success': True,
                'data': {
                    'recorded': stats['confirmed'],
                    'live': stats['estimates']
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
        """Update statistics - supports updating both confirmed and estimate values"""
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            data = json.loads(body.decode())
            
            # Validate input
            stat_type = data.get('stat_type')
            field_type = data.get('field_type')  # 'confirmed' or 'estimate'
            value = data.get('value')
            
            if not stat_type or not field_type or value is None:
                self.send_error_response(400, 'Missing required fields: stat_type, field_type, value')
                return
            
            # Validate value is non-negative integer
            try:
                value = int(value)
                if value < 0:
                    self.send_error_response(400, 'Value must be a non-negative integer')
                    return
            except ValueError:
                self.send_error_response(400, 'Value must be a valid integer')
                return
            
            # Validate stat_type
            valid_stat_types = ['active_volunteers', 'hours_contributed', 'partner_organizations']
            if stat_type not in valid_stat_types:
                self.send_error_response(400, f'Invalid stat_type. Must be one of: {valid_stat_types}')
                return
            
            # Update the appropriate field
            update_field = 'confirmed_total' if field_type == 'confirmed' else 'current_estimate'
            
            # Update the statistic
            response = supabase.table('site_stats').update({
                update_field: value,
                'updated_at': datetime.now().isoformat()
            }).eq('stat_type', stat_type).execute()
            
            if not response.data:
                self.send_error_response(404, f'Statistic not found: {stat_type}')
                return
            
            # Return updated statistics
            stats = get_statistics()
            
            result = {
                'success': True,
                'data': {
                    'recorded': stats['confirmed'],
                    'live': stats['estimates']
                }
            }
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            self.wfile.write(json.dumps(result).encode())
            
        except Exception as e:
            self.send_error_response(500, str(e))
    
    def do_PATCH(self):
        """Handle PATCH requests - same as POST for updating statistics"""
        self.do_POST()
    
    def do_PUT(self):
        """Handle PUT requests - same as POST for updating statistics"""
        self.do_POST()
    
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