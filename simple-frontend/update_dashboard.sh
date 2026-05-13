#!/bin/bash
# 1. Update the data from the database and logs
python3 data_bridge.py

# 2. Upload to GitHub
git add public/data.json src/components/Dashboard.tsx data_bridge.py
git commit -m "Update dashboard with Live Logs: $(date)"
git push origin main
