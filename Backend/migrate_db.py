"""
Quick database migration script to add missing columns.
Run this to update the database schema without restarting the server.
"""
import sqlite3
import os

DB_PATH = "monitoring.db"

def migrate():
    """Add missing columns to activities table."""
    
    if not os.path.exists(DB_PATH):
        print(f"❌ Database not found at {DB_PATH}")
        return
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Get existing columns
        cursor.execute("PRAGMA table_info(activities)")
        existing_columns = {row[1] for row in cursor.fetchall()}
        
        print(f"📊 Current columns: {existing_columns}")
        
        # Add missing columns
        columns_added = []
        
        if 'website_list' not in existing_columns:
            print("📦 Adding 'website_list' column...")
            cursor.execute("ALTER TABLE activities ADD COLUMN website_list TEXT")
            columns_added.append('website_list')
        
        if 'destinations' not in existing_columns:
            print("📦 Adding 'destinations' column...")
            cursor.execute("ALTER TABLE activities ADD COLUMN destinations TEXT")
            columns_added.append('destinations')
        
        if 'agent_timestamp' not in existing_columns:
            print("📦 Adding 'agent_timestamp' column...")
            cursor.execute("ALTER TABLE activities ADD COLUMN agent_timestamp TEXT")
            columns_added.append('agent_timestamp')
        
        conn.commit()
        
        if columns_added:
            print(f"✅ Migration complete! Added columns: {columns_added}")
        else:
            print("✅ Database already up to date!")
        
        # Verify
        cursor.execute("PRAGMA table_info(activities)")
        final_columns = [row[1] for row in cursor.fetchall()]
        print(f"📊 Final columns: {final_columns}")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    print("🔧 Starting database migration...\n")
    migrate()
    print("\n✅ Done! You can now restart the backend server.")
