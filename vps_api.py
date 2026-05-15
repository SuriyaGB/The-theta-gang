from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sqlite3
import json
import os
import re
from datetime import datetime, timezone

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

def init_db():
    """Create a table to store parsed history so it is permanent."""
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

import subprocess

LOG_PATH = "/opt/hermes/data/thetagang_30_days.log"

def get_logs():
    """Reads the latest logs from the master log file."""
    if os.path.exists(LOG_PATH):
        try:
            with open(LOG_PATH, 'r') as f:
                # Read all lines and take the last 500
                lines = f.readlines()
                return [line.strip() for line in lines[-500:]]
        except Exception as e:
            return [f"Error reading log file: {str(e)}"]
    
    # Fallback to docker logs during transition
    try:
        result = subprocess.run(
            ['docker', 'logs', '--tail', '500', 'thetagang-bot-live'],
            capture_output=True, text=True
        )
        return [line.strip() for line in result.stdout.splitlines()] + [line.strip() for line in result.stderr.splitlines()]
    except:
        return ["Waiting for mission logs to generate..."]

def update_persistent_history(logs_all):
    """Parses logs and saves new unique decisions to the database."""
    decisions = []
    capture_table = False
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    for line in logs_all:
        if "Skipping because" in line:
            # Better regex to catch the symbol at the start of the line or before the colon
            symbol_match = re.search(r'([A-Z]+):\s*Skipping|Skipping\s+([A-Z]+)', line)
            symbol = symbol_match.group(1) or symbol_match.group(2) if symbol_match else "AAPL" # Default to AAPL if unclear
            detail = line.strip()
            # Check if we already saved this exact decision recently
            cursor.execute('SELECT id FROM api_history WHERE detail = ? ORDER BY timestamp DESC LIMIT 1', (detail,))
            if not cursor.fetchone():
                cursor.execute('INSERT INTO api_history (type, symbol, action, detail) VALUES (?, ?, ?, ?)', 
                             ('Decision', symbol, 'Skip', detail))
            
        if "Put writing summary" in line or "Call writing summary" in line:
            capture_table = True
            continue
        if capture_table and "│" in line and "Symbol" not in line:
            parts = [p.strip() for p in line.split("│")]
            if len(parts) >= 4:
                symbol, action, detail = parts[1], parts[2], parts[3]
                cursor.execute('SELECT id FROM api_history WHERE symbol = ? AND detail = ? ORDER BY timestamp DESC LIMIT 1', (symbol, detail))
                if not cursor.fetchone():
                    cursor.execute('INSERT INTO api_history (type, symbol, action, detail) VALUES (?, ?, ?, ?)', 
                                 ('Decision', symbol, action, detail))
        if capture_table and "└" in line:
            capture_table = False
            
    conn.commit()
    conn.close()

def get_active_orders(logs_all):
    orders = []
    capture = False
    for line in reversed(logs_all):
        if "╵" in line and "─────" in line:
            capture = True
            continue
        if "Symbol" in line and "Exchange" in line and "Contract" in line and capture:
            capture = False
            if orders: break

        if capture and "│" in line:
            clean_line = re.sub(r'\[\d+\]', '', line)
            parts = [p.strip() for p in clean_line.split("│")]
            if len(parts) >= 8 and parts[0].isupper() and parts[0] != "SYMBOL":
                orders.append({
                    "symbol": parts[0],
                    "contract": parts[2],
                    "action": parts[3],
                    "price": parts[4],
                    "qty": parts[5],
                    "status": parts[6]
                })
    return orders

def get_config_symbols():
    if not os.path.exists(CONFIG_PATH):
        return []
    try:
        symbols = []
        with open(CONFIG_PATH, 'r') as f:
            content = f.read()
            matches = re.findall(r'\[portfolio\.symbols\.([A-Za-z]+)\]', content)
            if matches:
                return list(set([m.upper() for m in matches if m.lower() != 'defaults']))
        return symbols
    except:
        return []

def get_live_data():
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
            total_val = data.get('NetLiquidation', {}).get('value', 
                        data.get('EquityWithLoanValue', {}).get('value', 0))
            summary = {
                "totalValue": float(total_val),
                "availableCash": float(data.get('AvailableFunds', {}).get('value', 0)),
                "targetBP": float(total_val) * 0.5,
                "netTheta": 0,
                "deltaExposure": 0,
                "change24h": 0
            }

        # 2. Positions
        cursor.execute('SELECT id FROM runs ORDER BY started_at DESC LIMIT 1')
        run = cursor.fetchone()
        positions = []
        if run:
            cursor.execute('SELECT * FROM position_snapshots WHERE run_id = ?', (run['id'],))
            rows = cursor.fetchall()
            for pos in rows:
                positions.append({
                    "id": pos['id'], "symbol": pos['symbol'], "type": pos['sec_type'], "quantity": pos['position'],
                    "entryPrice": pos['avg_cost'], "marketPrice": pos['market_price'], "pnl": pos['unrealized_pnl'],
                    "pnlPercent": (pos['unrealized_pnl'] / (pos['avg_cost'] * abs(pos['position']))) * 100 if pos['avg_cost'] and pos['position'] else 0,
                    "theta": 0
                })

        # 3. History
        cursor.execute('SELECT * FROM executions ORDER BY execution_time DESC LIMIT 30')
        rows = cursor.fetchall()
        history = []
        for exec in rows:
            history.append({
                "id": exec['id'], "time": exec['execution_time'], "symbol": exec['symbol'],
                "action": f"{exec['side']} ({exec['shares']}@{exec['price']})", "status": "FILLED"
            })

        # 4. Performance
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

        # 5. Logs and Persistent Parsing (Now from Docker!)
        all_lines = get_logs()
        if all_lines and len(all_lines) > 1:
            update_persistent_history(all_lines)
            active_orders = get_active_orders(all_lines)
        else:
            active_orders = []

        # Pull persistent history for the dashboard
        cursor.execute('SELECT symbol, action, detail, timestamp FROM api_history ORDER BY timestamp DESC LIMIT 15')
        shopping_list = [{"symbol": r[0], "action": r[1], "detail": r[2], "time": r[3]} for r in cursor.fetchall()]

        logs = get_logs()
        symbols = get_config_symbols()

        # 6. Challenge Progress
        start_date = datetime(2026, 5, 13, tzinfo=timezone.utc)
        end_date = datetime(2026, 6, 12, tzinfo=timezone.utc)
        today = datetime.now(timezone.utc)
        days_elapsed = (today - start_date).days + 1
        challenge = {
            "day": max(1, days_elapsed),
            "remaining": max(0, (end_date - today).days),
            "total": 30,
            "percent": min(100, (days_elapsed / 30) * 100)
        }

        return {
            "source": "live-vps-pro",
            "status": {
                "database": "Healthy",
                "timezone": "UTC",
                "server": "Online"
            },
            "summary": summary, "positions": positions, "history": history, "performance": performance,
            "logs": logs, "symbols": symbols, "shoppingList": shopping_list, "activeOrders": active_orders,
            "challenge": challenge, "lastUpdate": datetime.now(timezone.utc).strftime("%H:%M:%S")
        }

    except Exception as e:
        return {
            "source": "error", 
            "status": {
                "database": "Error",
                "timezone": "UTC",
                "server": "Degraded"
            },
            "message": str(e)
        }
    finally:
        conn.close()

@app.get("/api/data")
async def data_endpoint():
    return get_live_data()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
