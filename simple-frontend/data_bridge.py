import sqlite3
import json
import os
from datetime import datetime

DB_PATH = "../data/thetagang.db"
OUTPUT_PATH = "public/data.json"

def export_data():
    if not os.path.exists(DB_PATH):
        print(f"Error: Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    try:
        # 1. Account Summary
        cursor.execute('SELECT summary_json FROM account_snapshots ORDER BY created_at DESC LIMIT 1')
        row = cursor.fetchone()
        summary = {}
        if row:
            data = json.loads(row['summary_json'])
            # Use NetLiquidation first, then fallback to EquityWithLoanValue or AvailableFunds
            total_val = data.get('NetLiquidation', {}).get('value', 
                        data.get('EquityWithLoanValue', {}).get('value', '0'))
            
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

        # Save to JSON
        final_data = {
            "source": "live",
            "summary": summary,
            "positions": positions,
            "history": history,
            "lastUpdate": datetime.now().strftime("%H:%M:%S")
        }

        with open(OUTPUT_PATH, "w") as f:
            json.dump(final_data, f, indent=2)
        
        print(f"✅ Success! Real data exported to {OUTPUT_PATH}")

    except Exception as e:
        print(f"❌ Error exporting data: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    export_data()
