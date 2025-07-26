import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
  }
  try {
    const filePath = path.resolve(process.cwd(), 'data/waitlist.txt');
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.appendFile(filePath, email + '\n', 'utf8');
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to save email' }, { status: 500 });
  }
} 