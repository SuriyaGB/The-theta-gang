from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sqlite3
import json
import os
from datetime import datetime

app = FastAPI()

# Enable CORS so your Vercel frontend can talk to your VPS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = "data/thetagang.db"
LOG_PATH = "bot.log"
CONFIG_PATH = "thetagang.toml"

def get_logs():
    if not os.path.exists(LOG_PATH):
        return []
    try:
        with open(LOG_PATH, 'r') as f:
            lines = f.readlines()
            return [line.strip() for line in lines[-50:]]
    except:
        return []

def get_config_symbols():
    if not os.path.exists(CONFIG_PATH):
        return []
    try:
        symbols = []
        with open(CONFIG_PATH, 'r') as f:
            content = f.read()
            # Simple parser for symbols in toml
            if '[[symbol]]' in content:
                for part in content.split('[[symbol]]')[1:]:
                    for line in part.split('\n'):
                        if 'name =' in line:
                            symbols.append(line.split('=')[1].strip().replace('"', '').replace("'", ""))
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
                    "id": pos['id'],
                    "symbol": pos['symbol'],
                    "type": pos['sec_type'],
                    "quantity": pos['position'],
                    "entryPrice": pos['avg_cost'],
                    "marketPrice": pos['market_price'],
                    "pnl": pos['unrealized_pnl'],
                    "pnlPercent": (pos['unrealized_pnl'] / (pos['avg_cost'] * abs(pos['position']))) * 100 if pos['avg_cost'] and pos['position'] else 0,
                    "theta": 0
                })

        # 3. History
        cursor.execute('SELECT * FROM executions ORDER BY execution_time DESC LIMIT 10')
        rows = cursor.fetchall()
        history = []
        for exec in rows:
            history.append({
                "id": exec['id'],
                "time": exec['execution_time'].split('T')[-1].split('.')[0] if 'T' in exec['execution_time'] else exec['execution_time'],
                "symbol": exec['symbol'],
                "action": f"{exec['side']} ({exec['shares']}@{exec['price']})",
                "status": "FILLED"
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
                performance.append({"name": dt.strftime('%b %d'), "value": float(val)})
            except: continue

        # 5. Live Logs and Shopping List
        logs = get_logs()
        symbols = get_config_symbols()

        # 6. Challenge Progress
        start_date = datetime(2026, 5, 13)
        end_date = datetime(2026, 6, 12)
        today = datetime.now()
        days_elapsed = (today - start_date).days + 1
        days_remaining = (end_date - today).days
        
        challenge = {
            "day": max(1, days_elapsed),
            "remaining": max(0, days_remaining),
            "total": 30,
            "percent": min(100, (days_elapsed / 30) * 100)
        }

        return {
            "source": "live-vps",
            "summary": summary,
            "positions": positions,
            "history": history,
            "performance": performance,
            "logs": logs,
            "symbols": symbols,
            "challenge": challenge,
            "lastUpdate": datetime.now().strftime("%H:%M:%S")
        }

    except Exception as e:
        return {"source": "error", "message": str(e)}
    finally:
        conn.close()

@app.get("/api/data")
async def data_endpoint():
    return get_live_data()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
