#!/bin/bash

# Reset PostgreSQL Database Script

echo "Resetting PostgreSQL database..."

# Get the PostgreSQL container ID
CONTAINER_ID=$(docker ps -qf "name=nest_postgres")

if [ -z "$CONTAINER_ID" ]; then
    echo "Error: PostgreSQL container not found. Is it running?"
    exit 1
fi

echo "Found PostgreSQL container: $CONTAINER_ID"

# Connect to the container and execute SQL commands
docker exec -i $CONTAINER_ID psql -U nest_user -d postgres << EOF
-- Terminate all connections to the database
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE datname = 'nest_auth' AND pid <> pg_backend_pid();

-- Drop the database if it exists
DROP DATABASE IF EXISTS nest_auth;

-- Create a new database
CREATE DATABASE nest_auth WITH OWNER nest_user;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE nest_auth TO nest_user;
EOF

# Check if the commands were successful
if [ $? -eq 0 ]; then
    echo "✅ Database reset successfully!"
    echo "Database 'nest_auth' has been dropped and recreated."
else
    echo "❌ Error resetting database"
    exit 1
fi