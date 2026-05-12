import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const dataPath = path.resolve(process.cwd(), 'public/data.json');

    if (!fs.existsSync(dataPath)) {
      return NextResponse.json({
        source: 'mock',
        message: 'Real data not exported yet. Please run: python3 data_bridge.py'
      });
    }

    const fileContent = fs.readFileSync(dataPath, 'utf8');
    const data = JSON.parse(fileContent);

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ source: 'error', message: (error as Error).message }, { status: 500 });
  }
}
