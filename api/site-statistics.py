"""
Site Statistics API endpoint for Vercel
Handles automatic calculation and manual override of site statistics
"""

import os
import json
import datetime
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from supabase import create_client, Client

# Initialize Supabase client
supabase_url = os.environ.get('VITE_SUPABASE_URL', 'https://gzzbjifmrwvqbkwbyvhm.supabase.co')
supabase_key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', os.environ.get('VITE_SUPABASE_SERVICE_ROLE_KEY', ''))

# If service role key is not available, try anon key
if not supabase_key:
    supabase_key = os.environ.get('VITE_SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6emJqaWZtcnd2cWJrd2J5dmhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMDI1NDUsImV4cCI6MjA2ODg3ODU0NX0.vf4y-DvpEemwUJiqguqI1ot-g0LrlpQZbhW0tIEs03o')

supabase: Client = create_client(supabase_url, supabase_key)

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        """Handle preflight CORS requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        
    def do_GET(self):
        """Get all site statistics with calculated and manual values"""
        try:
            # Calculate statistics directly from database tables
            stats_data = self.calculate_statistics()
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            result = {
                'success': True,
                'data': stats_data
            }
            self.wfile.write(json.dumps(result).encode())
            
        except Exception as e:
            self.send_error_response(500, str(e))
    
    def calculate_statistics(self):
        """Calculate statistics directly from database tables"""
        print("DEBUG: calculate_statistics function called!")
        try:
            # Calculate active volunteers (unique users who signed up for events)
            user_events_response = supabase.table('user_events').select('user_id').execute()
            print(f"Debug: user_events_response.data = {user_events_response.data}")
            print(f"Debug: user_events_response.error = {user_events_response.error}")
            unique_user_ids = set()
            if user_events_response.data:
                unique_user_ids = set(event['user_id'] for event in user_events_response.data)
            active_volunteers = len(unique_user_ids)
            print(f"Debug: unique_user_ids = {unique_user_ids}")
            print(f"Debug: active_volunteers = {active_volunteers}")
            
            # Calculate hours contributed
            hours_contributed = 0
            if user_events_response.data:
                # Get event details for hours calculation
                event_ids = list(set(event['event_id'] for event in user_events_response.data))
                if event_ids:
                    events_response = supabase.table('events').select('arrival_time, estimated_end_time').in_('id', event_ids).execute()
                    if events_response.data:
                        for event in events_response.data:
                            if event['arrival_time'] and event['estimated_end_time']:
                                # Calculate hours between arrival and estimated end time
                                arrival = datetime.datetime.fromisoformat(event['arrival_time'].replace('Z', '+00:00'))
                                end = datetime.datetime.fromisoformat(event['estimated_end_time'].replace('Z', '+00:00'))
                                hours = max(1, int((end - arrival).total_seconds() / 3600))
                                hours_contributed += hours
                            else:
                                # Default 2 hours if no time specified
                                hours_contributed += 2
            
            # Calculate partner organizations (unique organizations with events)
            events_response = supabase.table('events').select('organization_id').execute()
            unique_org_ids = set()
            if events_response.data:
                unique_org_ids = set(event['organization_id'] for event in events_response.data if event['organization_id'])
            partner_organizations = len(unique_org_ids)
            
            # Return formatted statistics
            result = {
                'active_volunteers': {
                    'calculated_value': active_volunteers,
                    'manual_override': None,
                    'display_value': active_volunteers,
                    'last_calculated_at': datetime.datetime.now().isoformat()
                },
                'hours_contributed': {
                    'calculated_value': hours_contributed,
                    'manual_override': None,
                    'display_value': hours_contributed,
                    'last_calculated_at': datetime.datetime.now().isoformat()
                },
                'partner_organizations': {
                    'calculated_value': partner_organizations,
                    'manual_override': None,
                    'display_value': partner_organizations,
                    'last_calculated_at': datetime.datetime.now().isoformat()
                }
            }
            
            print(f"Debug: Final result = {result}")
            return result
            
        except Exception as e:
            print(f"Error calculating statistics: {str(e)}")
            # Return zeros on error
            return {
                'active_volunteers': {
                    'calculated_value': 0,
                    'manual_override': None,
                    'display_value': 0,
                    'last_calculated_at': datetime.datetime.now().isoformat()
                },
                'hours_contributed': {
                    'calculated_value': 0,
                    'manual_override': None,
                    'display_value': 0,
                    'last_calculated_at': datetime.datetime.now().isoformat()
                },
                'partner_organizations': {
                    'calculated_value': 0,
                    'manual_override': None,
                    'display_value': 0,
                    'last_calculated_at': datetime.datetime.now().isoformat()
                }
            }
    
    def do_POST(self):
        """Recalculate all statistics"""
        try:
            # Calculate statistics directly from database tables
            stats_data = self.calculate_statistics()
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            result = {
                'success': True,
                'message': 'Statistics recalculated successfully',
                'data': stats_data
            }
            self.wfile.write(json.dumps(result).encode())
            
        except Exception as e:
            self.send_error_response(500, str(e))
    
    def do_PUT(self):
        """Update manual override for a specific statistic"""
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            data = json.loads(body.decode())
            
            # Validate required fields
            if 'stat_type' not in data or 'manual_override' not in data:
                self.send_error_response(400, 'Missing required fields: stat_type and manual_override')
                return
            
            stat_type = data['stat_type']
            manual_override = data['manual_override']
            
            # Validate stat_type
            valid_types = ['active_volunteers', 'hours_contributed', 'partner_organizations']
            if stat_type not in valid_types:
                self.send_error_response(400, f'Invalid stat_type. Must be one of: {", ".join(valid_types)}')
                return
            
            # Update the manual override
            response = supabase.table('site_stats').update({
                'manual_override': manual_override if manual_override is not None else None
            }).eq('stat_type', stat_type).execute()
            
            if response.error:
                raise Exception(f"Database error: {response.error}")
            
            if not response.data:
                self.send_error_response(404, 'Statistic not found')
                return
            
            # Get updated statistics
            stats_response = supabase.rpc('get_all_site_statistics').execute()
            
            if stats_response.error:
                raise Exception(f"Database error: {stats_response.error}")
            
            # Format the data
            stats_data = {}
            for stat in stats_response.data:
                stats_data[stat['stat_type']] = {
                    'calculated_value': stat['calculated_value'],
                    'manual_override': stat['manual_override'],
                    'display_value': stat['display_value'],
                    'last_calculated_at': stat['last_calculated_at']
                }
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            result = {
                'success': True,
                'message': f'{stat_type} manual override updated successfully',
                'data': stats_data
            }
            self.wfile.write(json.dumps(result).encode())
            
        except Exception as e:
            self.send_error_response(500, str(e))
    
    def do_DELETE(self):
        """Remove manual override for a specific statistic"""
        try:
            # Parse query parameters
            url_parts = urlparse(self.path)
            query_params = parse_qs(url_parts.query)
            
            stat_type = query_params.get('stat_type', [None])[0]
            if not stat_type:
                self.send_error_response(400, 'Missing stat_type parameter')
                return
            
            # Validate stat_type
            valid_types = ['active_volunteers', 'hours_contributed', 'partner_organizations']
            if stat_type not in valid_types:
                self.send_error_response(400, f'Invalid stat_type. Must be one of: {", ".join(valid_types)}')
                return
            
            # Remove manual override (set to NULL)
            response = supabase.table('site_stats').update({
                'manual_override': None
            }).eq('stat_type', stat_type).execute()
            
            if response.error:
                raise Exception(f"Database error: {response.error}")
            
            if not response.data:
                self.send_error_response(404, 'Statistic not found')
                return
            
            # Get updated statistics
            stats_response = supabase.rpc('get_all_site_statistics').execute()
            
            if stats_response.error:
                raise Exception(f"Database error: {stats_response.error}")
            
            # Format the data
            stats_data = {}
            for stat in stats_response.data:
                stats_data[stat['stat_type']] = {
                    'calculated_value': stat['calculated_value'],
                    'manual_override': stat['manual_override'],
                    'display_value': stat['display_value'],
                    'last_calculated_at': stat['last_calculated_at']
                }
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            result = {
                'success': True,
                'message': f'{stat_type} manual override removed successfully',
                'data': stats_data
            }
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