#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const index_1 = require("./index");
const program = new commander_1.Command();
program
    .name('yg')
    .description('Session Hoarder - Save and restore your desktop state')
    .version('1.0.0');
program.command('save')
    .argument('<name>', 'name of the session')
    .description('Save the current desktop session')
    .action(async (name) => {
    try {
        await (0, index_1.save)(name);
    }
    catch (e) {
        console.error('Failed to save session:', e);
    }
});
program.command('restore')
    .argument('<name>', 'name of the session')
    .description('Restore a saved session')
    .action(async (name) => {
    try {
        await (0, index_1.restore)(name);
    }
    catch (e) {
        console.error('Failed to restore session:', e);
    }
});
program.command('list')
    .description('List all saved sessions')
    .action(async () => {
    const sessions = await (0, index_1.listSessions)();
    if (sessions.length === 0) {
        console.log('No saved sessions.');
    }
    else {
        console.log('Saved Sessions:');
        sessions.forEach(s => console.log(` - ${s}`));
    }
});
program.command('delete')
    .argument('<name>', 'name of the session to delete')
    .description('Delete a saved session')
    .action(async (name) => {
    await (0, index_1.deleteSession)(name);
    console.log(`Session "${name}" deleted.`);
});
program.parse();
