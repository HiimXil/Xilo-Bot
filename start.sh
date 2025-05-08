#!/bin/sh

# Exécuter les migrations Prisma
echo "Applying database migrations..."
npx prisma migrate deploy

# Démarrer l'application
echo "Starting the app..."
node dist/index.js
