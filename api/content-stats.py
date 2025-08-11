"""
Content-based statistics API endpoint for Vercel
Returns compact stats for hero/about sections and keeps `content` table in sync
"""

import os
import json
import datetime
from http.server import BaseHTTPRequestHandler
from supabase import create_client, Client

# Initialize Supabase client (service role preferred; fall back to anon)
SUPABASE_URL = os.environ.get('VITE_SUPABASE_URL', 'https://gzzbjifmrwvqbkwbyvhm.supabase.co')
SUPABASE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', os.environ.get('VITE_SUPABASE_SERVICE_ROLE_KEY', ''))
if not SUPABASE_KEY:
    SUPABASE_KEY = os.environ.get('VITE_SUPABASE_ANON_KEY', '')

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

HOMEPAGE = 'homepage'
IMPACT = 'impact'

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        try:
            stats = self.calculate_stats()
            # Best-effort sync of content table (non-blocking effect not available here; just try/catch)
            try:
                self.sync_content(stats)
            except Exception as sync_err:
                # Log but do not fail the request
                print(f"Warning: failed to sync content: {sync_err}")

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({ 'success': True, 'data': stats }).encode())
        except Exception as e:
            # Fallback to reading from content table on error
            print(f"Error computing content stats: {e}")
            try:
                content_stats = self.read_content_fallback()
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({ 'success': True, 'data': content_stats }).encode())
            except Exception as inner:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'success': False,
                    'error': str(inner),
                    'data': {
                        'volunteers_count': '0',
                        'hours_served_total': '0',
                        'partner_orgs_count': '0'
                    }
                }).encode())

    def calculate_stats(self):
        """Compute live statistics from database tables.
        - volunteers_count: count active volunteers in profiles
        - partner_orgs_count: count organizations (prefer approved if available)
        - hours_served_total: sum per signup of event duration; fallback 2 hours if missing times
        Returns string values for frontend display.
        """
        # Volunteers
        volunteers_count = 0
        try:
            profiles_resp = supabase.table('profiles').select('id, user_type, status').execute()
            if profiles_resp.data:
                volunteers_count = sum(1 for p in profiles_resp.data if (p.get('user_type') == 'volunteer' and (p.get('status') or '').lower() == 'active'))
        except Exception as e:
            print(f"volunteers calc error: {e}")

        # Partner organizations
        partner_orgs_count = 0
        try:
            # Prefer approved organizations if status column exists
            orgs_resp = supabase.table('organizations').select('id, status').execute()
            if orgs_resp.data:
                approved = [o for o in orgs_resp.data if (o.get('status') or '').lower() == 'approved']
                partner_orgs_count = len(approved) if len(approved) > 0 else len(orgs_resp.data)
        except Exception as e:
            print(f"organizations calc error: {e}")

        # Hours contributed
        hours_served_total = 0
        try:
            # Join to events for arrival/estimated_end_time
            ue_resp = supabase.table('user_events').select('event_id, events(arrival_time, estimated_end_time)').execute()
            if ue_resp.data:
                for ue in ue_resp.data:
                    ev = ue.get('events')
                    if ev and ev.get('arrival_time') and ev.get('estimated_end_time'):
                        try:
                            start = datetime.datetime.fromisoformat(str(ev['arrival_time']).replace('Z', '+00:00'))
                            end = datetime.datetime.fromisoformat(str(ev['estimated_end_time']).replace('Z', '+00:00'))
                            hours = max(1, int((end - start).total_seconds() / 3600))
                            hours_served_total += hours
                        except Exception:
                            hours_served_total += 2
                    else:
                        hours_served_total += 2
        except Exception as e:
            print(f"hours calc error: {e}")

        return {
            'volunteers_count': str(volunteers_count or 0),
            'hours_served_total': str(hours_served_total or 0),
            'partner_orgs_count': str(partner_orgs_count or 0)
        }

    def sync_content(self, stats):
        """Upsert computed stats into content table under homepage/impact."""
        mapping = {
            'active_volunteers': stats['volunteers_count'],
            'hours_contributed': stats['hours_served_total'],
            'partner_organizations': stats['partner_orgs_count']
        }
        for key, value in mapping.items():
            # Find existing row
            existing = supabase.table('content').select('id').eq('page', HOMEPAGE).eq('section', IMPACT).eq('key', key).execute()
            if existing.data and len(existing.data) > 0:
                cid = existing.data[0]['id']
                supabase.table('content').update({ 'value': value }).eq('id', cid).execute()
            else:
                supabase.table('content').insert({
                    'page': HOMEPAGE,
                    'section': IMPACT,
                    'key': key,
                    'value': value,
                    'language_code': 'en'
                }).execute()

    def read_content_fallback(self):
        resp = supabase.table('content').select('key, value').eq('page', HOMEPAGE).eq('section', IMPACT).in_('key', ['active_volunteers', 'hours_contributed', 'partner_organizations']).execute()
        stats = { k['key']: k['value'] for k in (resp.data or []) }
        return {
            'volunteers_count': stats.get('active_volunteers', '0'),
            'hours_served_total': stats.get('hours_contributed', '0'),
            'partner_orgs_count': stats.get('partner_organizations', '0')
        }