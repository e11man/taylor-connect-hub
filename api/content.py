"""
Content Management API endpoint for Vercel
Handles CRUD operations for content using Supabase
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
        """Get all content"""
        try:
            # Query content from Supabase
            response = supabase.table('content').select('*').order('page').order('section').order('key').execute()
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            result = {
                'success': True,
                'data': response.data
            }
            self.wfile.write(json.dumps(result).encode())
            
        except Exception as e:
            self.send_error_response(500, str(e))
    
    def do_POST(self):
        """Create new content"""
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            data = json.loads(body.decode())
            
            # Validate required fields
            required_fields = ['page', 'section', 'key', 'value']
            for field in required_fields:
                if field not in data:
                    self.send_error_response(400, f'Missing required field: {field}')
                    return
            
            # Insert into Supabase
            new_content = {
                'page': data['page'],
                'section': data['section'],
                'key': data['key'],
                'value': data['value'],
                'language_code': data.get('language_code', 'en')
            }
            
            response = supabase.table('content').insert(new_content).execute()
            
            self.send_response(201)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            result = {
                'success': True,
                'data': response.data[0] if response.data else None
            }
            self.wfile.write(json.dumps(result).encode())
            
        except Exception as e:
            self.send_error_response(500, str(e))
    
    def do_PUT(self):
        """Update existing content"""
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            data = json.loads(body.decode())
            
            # Validate required fields
            if 'id' not in data or 'value' not in data:
                self.send_error_response(400, 'Missing required fields: id and value')
                return
            
            # Update in Supabase
            response = supabase.table('content').update({'value': data['value']}).eq('id', data['id']).execute()
            
            if not response.data:
                self.send_error_response(404, 'Content not found')
                return
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            result = {
                'success': True,
                'data': response.data[0] if response.data else None
            }
            self.wfile.write(json.dumps(result).encode())
            
        except Exception as e:
            self.send_error_response(500, str(e))
    
    def do_DELETE(self):
        """Delete content"""
        try:
            # Parse query parameters
            url_parts = urlparse(self.path)
            query_params = parse_qs(url_parts.query)
            
            content_id = query_params.get('id', [None])[0]
            if not content_id:
                self.send_error_response(400, 'Missing content ID')
                return
            
            # Delete from Supabase
            response = supabase.table('content').delete().eq('id', content_id).execute()
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            result = {'success': True}
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