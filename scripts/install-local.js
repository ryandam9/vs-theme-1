#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const cwd = process.cwd();
const packageFile = path.join(cwd, 'package.json');

if (!fs.existsSync(packageFile)) {
  console.error(`install-local: package.json not found in ${cwd}`);
  process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync(packageFile, 'utf8'));
if (!pkg.name || !pkg.version) {
  console.error('install-local: package.json must contain name and version');
  process.exit(1);
}

const vsixName = `${pkg.name}-${pkg.version}.vsix`;
const vsixPath = path.join(cwd, vsixName);

if (!fs.existsSync(vsixPath)) {
  console.error(`install-local: expected package was not created: ${vsixPath}`);
  process.exit(1);
}

const codeCli = process.env.VSCODE_CLI || 'code';
console.log(`install-local: installing ${vsixName} (${pkg.name}@${pkg.version})`);

const result = spawnSync(
  codeCli,
  ['--install-extension', vsixPath, '--force'],
  {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  },
);

if (result.error) {
  console.error(`install-local: failed to run ${codeCli}: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
