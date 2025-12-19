import { spawn } from 'child_process';

export async function runAppleScript(script: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const child = spawn('osascript', ['-e', script]);

        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        child.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        child.on('close', (code) => {
            if (code === 0) {
                resolve(stdout.trim());
            } else {
                // If user canceled, just return empty
                if (stderr.includes('User canceled')) {
                    resolve('');
                } else {
                    reject(new Error(`AppleScript failed (code ${code}): ${stderr}`));
                }
            }
        });

        child.on('error', (err) => {
            reject(err);
        });
    });
}

export async function runJxa(script: string): Promise<any> {
    return new Promise((resolve, reject) => {
        const child = spawn('osascript', ['-l', 'JavaScript', '-e', script]);

        // ... similar to above but for JXA if needed
        // For now we stick to standard AppleScript as it's often more stable for "System Events"
        let stdout = '';
        child.stdout.on('data', d => stdout += d.toString());
        child.on('close', (code) => {
            if (code === 0) resolve(stdout.trim());
            else reject(new Error('JXA failed'));
        });
    });
}
