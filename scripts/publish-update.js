#!/usr/bin/env node

/**
 * This script is used to publish updates to EAS Update.
 * It can be run manually or integrated into a CI/CD pipeline.
 * 
 * Usage: node ./scripts/publish-update.js [branch] [message]
 * Example: node ./scripts/publish-update.js production "Fix navigation styling"
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Default values
const DEFAULT_BRANCH = 'production';
const DEFAULT_MESSAGE = 'Design update ' + new Date().toISOString().split('T')[0];

// Parse command line arguments
const branch = process.argv[2] || DEFAULT_BRANCH;
const message = process.argv[3] || DEFAULT_MESSAGE;

console.log(`🚀 Publishing update to branch: ${branch}`);
console.log(`📝 Update message: ${message}`);

try {
  // Run EAS Update command
  const command = `npx eas-cli update --branch=${branch} --message="${message}"`;
  console.log(`Executing: ${command}`);
  
  const output = execSync(command, { stdio: 'inherit' });
  
  console.log('\n✅ Update successfully published!');
  console.log('Changes will be automatically applied to users when they open the app.');
} catch (error) {
  console.error('❌ Failed to publish update:', error.message);
  process.exit(1);
} 