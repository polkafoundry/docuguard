#!/usr/bin/env node

const { spawn } = require('child_process')
const join = require('path').join

spawn('npm', ['start'], { 
  stdio: 'inherit',
  cwd: join(__dirname, '..') 
}).on('exit', function (i, m) {
  process.exit()
})