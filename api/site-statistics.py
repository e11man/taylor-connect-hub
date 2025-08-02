"""
Site Statistics API endpoint for Vercel
Handles automatic calculation and manual override of site statistics
"""

import os
import json
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
            # Get all statistics using the database function
            response = supabase.rpc('get_all_site_statistics').execute()
            
            if response.error:
                raise Exception(f"Database error: {response.error}")
            
            # Format the data for frontend consumption
            stats_data = {}
            for stat in response.data:
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
                'data': stats_data
            }
            self.wfile.write(json.dumps(result).encode())
            
        except Exception as e:
            self.send_error_response(500, str(e))
    
    def do_POST(self):
        """Recalculate all statistics"""
        try:
            # Trigger recalculation of all statistics
            response = supabase.rpc('update_site_statistics').execute()
            
            if response.error:
                raise Exception(f"Database error: {response.error}")
            
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