#!/usr/bin/env node
import { Command } from 'commander';
import { save, restore, listSessions, deleteSession } from './index';

const program = new Command();

program
    .name('yg')
    .description('Session Hoarder - Save and restore your desktop state')
    .version('1.0.0');

program.command('save')
    .argument('<name>', 'name of the session')
    .description('Save the current desktop session')
    .action(async (name) => {
        try {
            await save(name);
        } catch (e) {
            console.error('Failed to save session:', e);
        }
    });

program.command('restore')
    .argument('<name>', 'name of the session')
    .description('Restore a saved session')
    .action(async (name) => {
        try {
            await restore(name);
        } catch (e) {
            console.error('Failed to restore session:', e);
        }
    });

program.command('list')
    .description('List all saved sessions')
    .action(async () => {
        const sessions = await listSessions();
        if (sessions.length === 0) {
            console.log('No saved sessions.');
        } else {
            console.log('Saved Sessions:');
            sessions.forEach(s => console.log(` - ${s}`));
        }
    });

program.command('delete')
    .argument('<name>', 'name of the session to delete')
    .description('Delete a saved session')
    .action(async (name) => {
        await deleteSession(name);
        console.log(`Session "${name}" deleted.`);
    });

program.parse();
