import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import path from 'path';

export async function POST() {
  try {
    const scriptPath = path.resolve(process.cwd(), 'scripts/sync-species.ts');
    const output = execSync(`npx tsx "${scriptPath}"`, {
      encoding: 'utf-8',
      stdio: 'pipe',
      env: process.env,
    });

    return NextResponse.json({ success: true, output });
  } catch (err) {
    const errorOutput = (err as Error & { stdout?: string; stderr?: string }).stderr ?? (err as Error).message;
    console.error('Sync failed:', errorOutput);
    return NextResponse.json({ success: false, error: errorOutput }, { status: 500 });
  }
}
