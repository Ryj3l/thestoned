#!/bin/sh

# Navigate to the project directory
cd ~/theStoned

# Fetch the latest changes from the GitHub repository
git fetch origin

# If there are updates, pull them and rebuild the Docker containers
if git status | grep -q "Your branch is behind"; then
  git pull origin main
  docker-compose build app
  docker-compose up -d
fi