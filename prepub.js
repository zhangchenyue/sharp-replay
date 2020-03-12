const path = require('path');
const fs = require('fs');
const packageJson = require('./package.json');

packageJson.bin.sprt = './startup.js';
packageJson.main = './startup.js';
delete packageJson.commitlint;
delete packageJson.config;
delete packageJson.devDependencies;
delete packageJson.husky;
delete packageJson.scripts;
delete packageJson['lint-staged'];

fs.writeFileSync(path.join(__dirname, 'dist', 'package.json'), JSON.stringify(packageJson), { encoding: 'utf8' });
