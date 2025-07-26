import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const WAITLIST_PASSWORD = 'Yasaddybocm123!';

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  if (password !== WAITLIST_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const filePath = path.resolve(process.cwd(), 'data/waitlist.txt');
    const content = await fs.readFile(filePath, 'utf8');
    const emails = content.split('\n').filter(Boolean);
    return NextResponse.json({ emails });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to read waitlist' }, { status: 500 });
  }
} 