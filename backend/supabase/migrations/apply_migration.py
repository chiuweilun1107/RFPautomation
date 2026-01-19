
import psycopg2
import os
import sys

# Configuration
DB_POOLER_HOSTS = [
    "aws-0-ap-northeast-1.pooler.supabase.com", # Tokyo
    "aws-0-ap-southeast-1.pooler.supabase.com", # Singapore
    "aws-0-us-east-1.pooler.supabase.com",      # US East
    "files.goyonrowhfphooryfzif.supabase.co"    # Direct (unlikely to work if ping failed)
]
DB_PORT = 6543
DB_NAME = "postgres"
DB_USER = "postgres.goyonrowhfphooryfzif"
DB_PASS = "Allychiu0323"

SQL_COMMAND = "ALTER TABLE public.sources DROP CONSTRAINT IF EXISTS sources_type_check;"

def try_connect_and_execute():
    for host in DB_POOLER_HOSTS:
        print(f"Trying to connect to {host}...")
        try:
            conn = psycopg2.connect(
                host=host,
                port=DB_PORT,
                database=DB_NAME,
                user=DB_USER,
                password=DB_PASS
            )
            print(f"Connected to {host}!")
            
            cur = conn.cursor()
            print("Executing SQL...")
            cur.execute(SQL_COMMAND)
            conn.commit()
            print("SQL executed successfully!")
            
            cur.close()
            conn.close()
            return True
        except Exception as e:
            print(f"Failed to connect to {host}: {e}")
    
    return False

if __name__ == "__main__":
    if try_connect_and_execute():
        print("Migration applied successfully.")
        sys.exit(0)
    else:
        print("Failed to apply migration on all tried hosts.")
        sys.exit(1)
