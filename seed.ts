import { saveSession, SessionData } from './src/storage/session';

async function seed() {
    const seedData: SessionData = {
        name: 'demo-seed',
        timestamp: Date.now(),
        browsers: [
            {
                appName: 'Google Chrome',
                windows: [
                    {
                        activeTabIndex: 0,
                        bounds: { x: 0, y: 0, w: 1200, h: 800 },
                        tabs: [
                            { url: 'https://example.com', scrollRatio: 0.5 },
                            { url: 'https://github.com', scrollRatio: 0 }
                        ]
                    }
                ]
            }
        ],
        apps: [
            {
                appName: 'Finder',
                windows: [
                    { title: '/Users/Shared', bounds: { x: 100, y: 100, w: 500, h: 400 } }
                ]
            }
        ]
    };

    await saveSession('demo-seed', seedData);
    console.log('Seeded session "demo-seed" created.');
}

seed().catch(console.error);
