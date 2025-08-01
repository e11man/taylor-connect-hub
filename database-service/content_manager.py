#!/usr/bin/env python3
"""
Content Management Script for Taylor Connect Hub
Handles all database operations for content management using Supabase REST API
"""

import os
import sys
import json
import requests
from typing import Dict, List, Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class ContentManager:
    def __init__(self):
        self.supabase_url = os.getenv('VITE_SUPABASE_URL', 'https://gzzbjifmrwvqbkwbyvhm.supabase.co')
        # Use anon key for now - this should work for read operations
        self.supabase_key = os.getenv('VITE_SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6emJqaWZtcnd2cWJrd2J5dmhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMDI1NDUsImV4cCI6MjA2ODg3ODU0NX0.vf4y-DvpEemwUJiqguqI1ot-g0LrlpQZbhW0tIEs03o')
        
        self.headers = {
            'apikey': self.supabase_key,
            'Authorization': f'Bearer {self.supabase_key}',
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        }
        
        print("✅ Content Manager initialized")
        
    def get_all_content(self) -> List[Dict]:
        """Get all content from the database"""
        try:
            url = f"{self.supabase_url}/rest/v1/content"
            params = {
                'select': '*',
                'order': 'page,section,key'
            }
            
            response = requests.get(url, headers=self.headers, params=params)
            response.raise_for_status()
            
            return response.json()
        except Exception as e:
            print(f"❌ Error fetching content: {e}")
            return []
    
    def update_content(self, content_id: str, new_value: str) -> bool:
        """Update content value by ID"""
        try:
            url = f"{self.supabase_url}/rest/v1/content"
            params = {
                'id': f'eq.{content_id}'
            }
            data = {
                'value': new_value
            }
            
            response = requests.patch(url, headers=self.headers, params=params, json=data)
            response.raise_for_status()
            
            result = response.json()
            if result:
                print(f"✅ Updated content ID {content_id} with value: {new_value}")
                return True
            else:
                print(f"❌ No content found with ID {content_id}")
                return False
        except Exception as e:
            print(f"❌ Error updating content: {e}")
            return False
    
    def create_content(self, page: str, section: str, key: str, value: str, language_code: str = 'en') -> bool:
        """Create new content entry"""
        try:
            url = f"{self.supabase_url}/rest/v1/content"
            data = {
                'page': page,
                'section': section,
                'key': key,
                'value': value,
                'language_code': language_code
            }
            
            response = requests.post(url, headers=self.headers, json=data)
            response.raise_for_status()
            
            result = response.json()
            if result:
                print(f"✅ Created content: {page}.{section}.{key} = {value}")
                return True
            else:
                print(f"❌ Failed to create content")
                return False
        except Exception as e:
            print(f"❌ Error creating content: {e}")
            return False
    
    def delete_content(self, content_id: str) -> bool:
        """Delete content by ID"""
        try:
            url = f"{self.supabase_url}/rest/v1/content"
            params = {
                'id': f'eq.{content_id}'
            }
            
            response = requests.delete(url, headers=self.headers, params=params)
            response.raise_for_status()
            
            result = response.json()
            if result:
                print(f"✅ Deleted content ID {content_id}")
                return True
            else:
                print(f"❌ No content found with ID {content_id}")
                return False
        except Exception as e:
            print(f"❌ Error deleting content: {e}")
            return False
    
    def list_content(self):
        """List all content in a readable format"""
        content = self.get_all_content()
        if not content:
            print("📝 No content found in database")
            return
        
        print(f"\n📝 Found {len(content)} content items:")
        print("=" * 80)
        
        current_page = None
        current_section = None
        
        for item in content:
            # Print page header
            if item['page'] != current_page:
                current_page = item['page']
                current_section = None
                print(f"\n📄 PAGE: {current_page.upper()}")
                print("-" * 40)
            
            # Print section header
            if item['section'] != current_section:
                current_section = item['section']
                print(f"\n  📂 Section: {current_section}")
            
            # Print content item
            print(f"    🔑 {item['key']}: {item['value']}")
            print(f"        ID: {item['id']}")
    
    def interactive_mode(self):
        """Run interactive content management"""
        print("\n🎛️  Content Management Interactive Mode")
        print("=" * 50)
        
        while True:
            print("\nOptions:")
            print("1. List all content")
            print("2. Update content")
            print("3. Create new content")
            print("4. Delete content")
            print("5. Exit")
            
            choice = input("\nEnter your choice (1-5): ").strip()
            
            if choice == '1':
                self.list_content()
            
            elif choice == '2':
                content = self.get_all_content()
                if not content:
                    print("❌ No content to update")
                    continue
                
                print("\nAvailable content:")
                for i, item in enumerate(content[:20]):  # Show first 20 items
                    print(f"{i+1}. {item['page']}.{item['section']}.{item['key']} = {item['value'][:50]}...")
                
                try:
                    idx = int(input("Enter item number to update: ")) - 1
                    if 0 <= idx < len(content):
                        item = content[idx]
                        new_value = input(f"Enter new value for '{item['key']}': ")
                        self.update_content(item['id'], new_value)
                    else:
                        print("❌ Invalid selection")
                except ValueError:
                    print("❌ Please enter a valid number")
            
            elif choice == '3':
                page = input("Enter page (e.g., 'home'): ").strip()
                section = input("Enter section (e.g., 'hero'): ").strip()
                key = input("Enter key (e.g., 'title'): ").strip()
                value = input("Enter value: ").strip()
                
                if page and section and key and value:
                    self.create_content(page, section, key, value)
                else:
                    print("❌ All fields are required")
            
            elif choice == '4':
                content = self.get_all_content()
                if not content:
                    print("❌ No content to delete")
                    continue
                
                print("\nAvailable content:")
                for i, item in enumerate(content[:20]):  # Show first 20 items
                    print(f"{i+1}. {item['page']}.{item['section']}.{item['key']} = {item['value'][:50]}...")
                
                try:
                    idx = int(input("Enter item number to delete: ")) - 1
                    if 0 <= idx < len(content):
                        item = content[idx]
                        confirm = input(f"Are you sure you want to delete '{item['key']}'? (y/N): ")
                        if confirm.lower() == 'y':
                            self.delete_content(item['id'])
                    else:
                        print("❌ Invalid selection")
                except ValueError:
                    print("❌ Please enter a valid number")
            
            elif choice == '5':
                print("👋 Goodbye!")
                break
            
            else:
                print("❌ Invalid choice. Please enter 1-5.")

def main():
    """Main function"""
    if len(sys.argv) > 1:
        # Command line mode
        command = sys.argv[1]
        manager = ContentManager()
        
        try:
            if command == 'list':
                manager.list_content()
            elif command == 'update':
                if len(sys.argv) < 4:
                    print("Usage: python content_manager.py update <content_id> <new_value>")
                    sys.exit(1)
                content_id = sys.argv[2]
                new_value = sys.argv[3]
                success = manager.update_content(content_id, new_value)
                sys.exit(0 if success else 1)
            elif command == 'create':
                if len(sys.argv) < 6:
                    print("Usage: python content_manager.py create <page> <section> <key> <value>")
                    sys.exit(1)
                page = sys.argv[2]
                section = sys.argv[3]
                key = sys.argv[4]
                value = sys.argv[5]
                success = manager.create_content(page, section, key, value)
                sys.exit(0 if success else 1)
            elif command == 'delete':
                if len(sys.argv) < 3:
                    print("Usage: python content_manager.py delete <content_id>")
                    sys.exit(1)
                content_id = sys.argv[2]
                success = manager.delete_content(content_id)
                sys.exit(0 if success else 1)
            else:
                print("Unknown command. Use: list, update, create, delete, or interactive")
                sys.exit(1)
        except Exception as e:
            print(f"❌ Error: {e}")
            sys.exit(1)
    else:
        # Interactive mode
        manager = ContentManager()
        manager.interactive_mode()

if __name__ == "__main__":
    main() 