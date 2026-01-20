import { spawn } from 'child_process';

export async function runAppleScript(script: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const child = spawn('osascript', ['-e', script]);

        let stdout = '';
        let stderr = '';
        let timedOut = false;

        // 5 second timeout for any AppleScript
        const timer = setTimeout(() => {
            timedOut = true;
            child.kill();
            reject(new Error('AppleScript timed out'));
        }, 5000);

        child.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        child.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        child.on('close', (code) => {
            clearTimeout(timer);
            if (timedOut) return;

            if (code === 0) {
                resolve(stdout.trim());
            } else {
                if (stderr.includes('User canceled')) {
                    resolve('');
                } else {
                    reject(new Error(`AppleScript failed (code ${code}): ${stderr}`));
                }
            }
        });

        child.on('error', (err) => {
            clearTimeout(timer);
            if (!timedOut) reject(err);
        });
    });
}

export async function runJxa(script: string): Promise<any> {
    return new Promise((resolve, reject) => {
        const child = spawn('osascript', ['-l', 'JavaScript', '-e', script]);


        let stdout = '';
        child.stdout.on('data', d => stdout += d.toString());
        child.on('close', (code) => {
            if (code === 0) resolve(stdout.trim());
            else reject(new Error('JXA failed'));
        });
    });
}
