from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sqlite3
import json
import os
import re
from datetime import datetime

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = "/opt/hermes/data/thetagang.db"
CONFIG_PATH = "/opt/hermes/thetagang.toml"
LOG_PATH = "/opt/hermes/data/thetagang_30_days.log"

def init_db():
    """Create necessary tables if they don't exist."""
    if not os.path.exists(os.path.dirname(DB_PATH)):
        os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS api_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT,
            symbol TEXT,
            action TEXT,
            detail TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

init_db()

def get_logs():
    """Reads the latest logs from the master log file."""
    if os.path.exists(LOG_PATH):
        try:
            with open(LOG_PATH, 'r') as f:
                lines = f.readlines()
                return [line.strip() for line in lines[-500:]]
        except:
            return ["Error reading mission log file."]
    return ["Waiting for mission logs to generate..."]

def get_active_orders(logs):
    """Parses logs for submitted but not yet filled orders."""
    orders = []
    for line in reversed(logs):
        if "Submitted order" in line:
            match = re.search(r'Submitted order for (\w+): (.*)', line)
            if match:
                orders.append({
                    "symbol": match.group(1),
                    "detail": match.group(2),
                    "status": "WORKING"
                })
    return orders

def get_config_symbols():
    if not os.path.exists(CONFIG_PATH):
        return []
    try:
        with open(CONFIG_PATH, 'r') as f:
            content = f.read()
            matches = re.findall(r'\[portfolio\.symbols\.([A-Za-z]+)\]', content)
            if matches:
                return list(set([m.upper() for m in matches if m.lower() != 'defaults']))
        return []
    except:
        return []

def get_decision_history(logs):
    """Parses logs for trading decisions (writing/skipping)."""
    decisions = []
    # Look for table rows in the summary sections
    for line in logs:
        # Regex to handle [TIMESTAMP] and then the table row | SYMBOL | ACTION | DETAIL |
        match = re.search(r'│\s+([A-Z]+)\s+│\s+([A-Za-z]+)\s+│\s+(.*?)\s+│', line)
        if match:
            symbol = match.group(1)
            action = match.group(2)
            detail = match.group(3)
            
            # Use the timestamp from the beginning of the line if available
            time_match = re.search(r'^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})', line)
            log_time = time_match.group(1).replace('T', ' ') if time_match else "Just now"
            
            decisions.append({
                "symbol": symbol,
                "action": action,
                "detail": detail,
                "time": log_time
            })
    return decisions

@app.get("/live-proxy")
async def get_live_data():
    if not os.path.exists(DB_PATH):
        return {"source": "error", "message": "Database not found"}

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    try:
        # 1. Summary
        cursor.execute('SELECT summary_json FROM account_snapshots ORDER BY created_at DESC LIMIT 1')
        row = cursor.fetchone()
        summary = {"totalValue": 0, "availableCash": 0, "targetBP": 0, "netTheta": 0, "deltaExposure": 0, "change24h": 0}
        if row:
            data = json.loads(row['summary_json'])
            total_val = data.get('NetLiquidation', {}).get('value', 0)
            summary = {
                "totalValue": float(total_val),
                "availableCash": float(data.get('AvailableFunds', {}).get('value', 0)),
                "targetBP": float(total_val) * 0.5,
                "netTheta": 0,
                "deltaExposure": 0,
                "change24h": 0
            }

        # 2. Performance
        cursor.execute('SELECT created_at, summary_json FROM account_snapshots ORDER BY created_at ASC')
        perf_rows = cursor.fetchall()
        performance = []
        for r in perf_rows:
            try:
                s_data = json.loads(r['summary_json'])
                val = s_data.get('NetLiquidation', {}).get('value', 0)
                dt = datetime.fromisoformat(r['created_at'].split('.')[0].replace(' ', 'T'))
                performance.append({
                    "name": dt.strftime('%b %d %H:%M'), 
                    "fullTime": dt.strftime('%Y-%m-%d %H:%M'),
                    "value": float(val)
                })
            except: continue

        # 3. History
        cursor.execute('SELECT symbol, side, shares, price, execution_time FROM executions ORDER BY execution_time DESC LIMIT 15')
        history = [{"symbol": r[0], "action": f"{r[1]} ({r[2]}@{r[3]})", "time": r[4], "status": "FILLED"} for r in cursor.fetchall()]

        logs = get_logs()
        
        return {
            "source": "live-proxy",
            "status": {"database": "Healthy", "timezone": "UTC", "server": "Online"},
            "summary": summary,
            "performance": performance,
            "logs": logs,
            "symbols": get_config_symbols(),
            "activeOrders": get_active_orders(logs),
            "shoppingList": get_decision_history(logs),
            "history": history,
            "challenge": {"day": 3, "remaining": 27, "total": 30, "percent": 10},
            "lastUpdate": datetime.now().strftime("%H:%M:%S")
        }
    except Exception as e:
        return {"source": "error", "message": str(e)}
    finally:
        conn.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
