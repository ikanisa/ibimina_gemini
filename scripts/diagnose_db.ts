
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

function loadEnv(filePath: string) {
    try {
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            content.split('\n').forEach(line => {
                const match = line.match(/^([^=]+)=(.*)$/);
                if (match) {
                    const key = match[1].trim();
                    const value = match[2].trim().replace(/^["']|["']$/g, '');
                    if (!process.env[key]) process.env[key] = value;
                }
            });
        }
    } catch (e) { }
}

const rootDir = process.cwd();
loadEnv(path.resolve(rootDir, '.env'));
loadEnv(path.resolve(rootDir, '.env.local'));

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) process.exit(1);

const supabase = createClient(url, key);

async function diagnose() {
    console.log('--- DIAGNOSTICS ---');

    // 1. Check Count
    const { count, error: countError } = await supabase
        .from('institutions')
        .select('*', { count: 'exact', head: true });

    if (countError) {
        console.error('Count Error:', countError.message);
    } else {
        console.log(`Current Count: ${count}`);
    }

    // 2. Try Insert (to check RLS/Permissions)
    const testCode = 'TEST-' + Date.now().toString().slice(-4);
    console.log(`Attempting insert of code: ${testCode}`);

    const { data, error: insertError } = await supabase
        .from('institutions')
        .insert({
            name: 'Diagnostic Test Sacco',
            code: testCode,
            status: 'Pending'
        })
        .select()
        .single();

    if (insertError) {
        console.error('Insert Error:', insertError.code, insertError.message);
        if (insertError.code === '42501') {
            console.log('=> RESULT: RLS is blocking access.');
        } else {
            console.log('=> RESULT: Insert failed with code', insertError.code);
        }
    } else {
        console.log('=> RESULT: Insert SUCCESS. Row created with ID:', data.id);

        // Cleanup
        const { error: delError } = await supabase.from('institutions').delete().eq('id', data.id);
        if (!delError) console.log('Cleanup successful.');
    }
}

diagnose();
