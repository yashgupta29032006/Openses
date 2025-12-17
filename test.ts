import assert from 'assert';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { saveSession, loadSession, deleteSession, SessionData } from './src/storage/session';

async function runTests() {
    console.log('Running storage tests...');

    const testName = 'unit-test-session';
    const testData: SessionData = {
        name: testName,
        timestamp: 123456789,
        browsers: [],
        apps: []
    };

    // Test Save
    await saveSession(testName, testData);
    const exists = await fs.pathExists(path.join(os.homedir(), '.yg', 'sessions', `${testName}.json`));
    assert.ok(exists, 'Session file should exist after save');
    console.log('✓ Save Test Passed');

    // Test Load
    const loaded = await loadSession(testName);
    assert.deepStrictEqual(loaded, testData, 'Loaded data should match saved data');
    console.log('✓ Load Test Passed');

    // Test Delete
    await deleteSession(testName);
    const existsAfterDelete = await fs.pathExists(path.join(os.homedir(), '.yg', 'sessions', `${testName}.json`));
    assert.strictEqual(existsAfterDelete, false, 'Session file should be gone after delete');
    console.log('✓ Delete Test Passed');
}

runTests().catch(e => {
    console.error('✗ Test Failed:', e);
    process.exit(1);
});
