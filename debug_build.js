console.log('Start');
try {
    const { MacOSPlatform } = require('./dist/platforms/macos');
    console.log('Imported Platform');
    new MacOSPlatform();
    console.log('Instantiated Platform');

    const { StorageManager } = require('./dist/core/storage');
    console.log('Imported Storage');
    new StorageManager();
    console.log('Instantiated Storage');

    const { RelevanceEngine } = require('./dist/core/relevance');
    console.log('Imported Relevance');
} catch (e) {
    console.log('Error:', e.message);
}
console.log('End');
