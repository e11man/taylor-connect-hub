"""
Very simple stats endpoint for Vercel
- Reads three numbers from `content` under homepage/impact
- If any are missing, seeds them with '100'
- Returns values as strings the frontend expects
"""

import os
import json
from http.server import BaseHTTPRequestHandler
from supabase import create_client, Client

SUPABASE_URL = os.environ.get('VITE_SUPABASE_URL', 'https://gzzbjifmrwvqbkwbyvhm.supabase.co')
SUPABASE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', os.environ.get('VITE_SUPABASE_SERVICE_ROLE_KEY', ''))
if not SUPABASE_KEY:
    SUPABASE_KEY = os.environ.get('VITE_SUPABASE_ANON_KEY', '')

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

PAGE = 'homepage'
SECTION = 'impact'
K_VOL = 'active_volunteers'
K_HOURS = 'hours_contributed'
K_ORGS = 'partner_organizations'

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        try:
            stats = self.read_or_seed()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({ 'success': True, 'data': stats }).encode())
        except Exception as e:
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            # Always return sensible defaults
            self.wfile.write(json.dumps({
                'success': True,
                'data': {
                    'volunteers_count': '100',
                    'hours_served_total': '100',
                    'partner_orgs_count': '100'
                },
                'error': str(e)
            }).encode())

    def read_or_seed(self):
        resp = supabase.table('content').select('key, value').eq('page', PAGE).eq('section', SECTION).in_('key', [K_VOL, K_HOURS, K_ORGS]).execute()
        existing = { (row['key']): row for row in (resp.data or []) }

        to_insert = []
        for key in [K_VOL, K_HOURS, K_ORGS]:
            if key not in existing:
                to_insert.append({ 'page': PAGE, 'section': SECTION, 'key': key, 'value': '100', 'language_code': 'en' })

        if to_insert:
            ins = supabase.table('content').insert(to_insert).execute()
            if ins.data:
                for row in ins.data:
                    existing[row['key']] = row

        # Reload values to be safe
        if not existing or len(existing) < 3:
            resp2 = supabase.table('content').select('key, value').eq('page', PAGE).eq('section', SECTION).in_('key', [K_VOL, K_HOURS, K_ORGS]).execute()
            existing = { (row['key']): row for row in (resp2.data or []) }

        return {
            'volunteers_count': (existing.get(K_VOL, {}).get('value') or '100'),
            'hours_served_total': (existing.get(K_HOURS, {}).get('value') or '100'),
            'partner_orgs_count': (existing.get(K_ORGS, {}).get('value') or '100')
        }