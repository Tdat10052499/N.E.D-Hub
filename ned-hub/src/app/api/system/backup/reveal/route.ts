import { NextResponse } from 'next/server';
import os from 'os';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { filename } = body;

    if (!filename || typeof filename !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Thiếu hoặc sai tên tệp sao lưu (filename)' },
        { status: 400 }
      );
    }

    // Determine user's default Downloads folder
    const homeDir = os.homedir();
    const downloadsDir = path.join(homeDir, 'Downloads');
    const targetFilePath = path.join(downloadsDir, path.basename(filename));

    const platform = process.platform;

    // Small delay helper to let browser finish saving the file if called immediately
    await new Promise((resolve) => setTimeout(resolve, 350));

    const fileExists = fs.existsSync(targetFilePath);

    // Execute OS-specific file highlight / folder reveal command
    if (platform === 'win32') {
      // Windows: explorer.exe /select,"C:\path\to\file"
      if (fileExists) {
        exec(`explorer.exe /select,"${targetFilePath}"`, (err) => {
          if (err) console.warn('Windows reveal exec warning:', err.message);
        });
      } else {
        // Fallback: open Downloads folder
        exec(`explorer.exe "${downloadsDir}"`, (err) => {
          if (err) console.warn('Windows open folder exec warning:', err.message);
        });
      }
    } else if (platform === 'darwin') {
      // macOS: open -R "/path/to/file"
      if (fileExists) {
        exec(`open -R "${targetFilePath}"`, (err) => {
          if (err) console.warn('macOS reveal exec warning:', err.message);
        });
      } else {
        exec(`open "${downloadsDir}"`, (err) => {
          if (err) console.warn('macOS open folder exec warning:', err.message);
        });
      }
    } else {
      // Linux / Unix
      const dirToOpen = fileExists ? path.dirname(targetFilePath) : downloadsDir;
      exec(`xdg-open "${dirToOpen}"`, (err) => {
        if (err) console.warn('Linux reveal exec warning:', err.message);
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Đã gửi lệnh mở vị trí tệp trên hệ điều hành!',
      platform,
      path: targetFilePath,
      fileExists,
    });
  } catch (err: unknown) {
    console.error('API /api/system/backup/reveal error:', err);
    return NextResponse.json(
      { success: false, error: 'Lỗi khi mở File Explorer hệ điều hành' },
      { status: 500 }
    );
  }
}
