#!/bin/bash

echo "=== COMPLETE POSTGRESQL FRESH RESET ==="

echo "1. Stopping and removing all containers..."
sudo docker-compose down

echo "2. Removing PostgreSQL data volume..."
sudo docker volume rm taskflowapipostgres_data 2>/dev/null || echo "Volume already removed or doesn't exist"

echo "3. Removing the network..."
sudo docker network rm taskflowapinest_network 2>/dev/null || echo "Network already removed or doesn't exist"

echo "4. Starting fresh PostgreSQL instance..."
sudo docker-compose up -d postgres

echo "5. Waiting for PostgreSQL to initialize..."
sleep 4

echo "6. Verifying PostgreSQL is ready..."
until sudo docker exec nest_postgres pg_isready -U nest_user -d nest_auth; do
    echo "Waiting for PostgreSQL to be ready..."
    sleep 2
done

echo "=== RESET COMPLETE ==="
echo "PostgreSQL is now fresh and empty:"
echo "- Database: nest_auth"
echo "- User: nest_user"
echo "- All tables: EMPTY"
echo "- Ready for TypeORM migrations"