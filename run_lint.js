const { execSync } = require('child_process');
const fs = require('fs');
try {
    console.log('Running eslint...');
    const out = execSync('npx eslint src --format json', { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
    fs.writeFileSync('lint_res.json', out);
    console.log('Success');
} catch (e) {
    fs.writeFileSync('lint_res.json', e.stdout);
    console.log('Finished with errors');
}
