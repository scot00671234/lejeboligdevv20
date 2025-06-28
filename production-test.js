#!/usr/bin/env node

/**
 * Production deployment verification script
 * Tests all critical endpoints and functionality
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const BASE_URL = process.env.TEST_URL || 'http://localhost:5000';
const TIMEOUT = 30000; // 30 seconds

async function runTests() {
  console.log('🚀 Starting production deployment tests...\n');

  const tests = [
    {
      name: 'Health Check',
      test: () => fetch(`${BASE_URL}/health`).then(r => r.json()),
      validate: (data) => data.status === 'ok'
    },
    {
      name: 'Ready Check',
      test: () => fetch(`${BASE_URL}/ready`).then(r => r.json()),
      validate: (data) => data.status === 'ready'
    },
    {
      name: 'Frontend Loading',
      test: () => fetch(`${BASE_URL}/`).then(r => r.text()),
      validate: (html) => html.includes('<!DOCTYPE html>')
    },
    {
      name: 'API Properties Endpoint',
      test: () => fetch(`${BASE_URL}/api/properties`).then(r => r.json()),
      validate: (data) => Array.isArray(data) || data.message === 'Access token required'
    },
    {
      name: 'API Rate Limiting',
      test: async () => {
        const requests = Array(10).fill().map(() => 
          fetch(`${BASE_URL}/api/properties`)
        );
        const responses = await Promise.all(requests);
        return responses.some(r => r.status === 429);
      },
      validate: (rateLimited) => rateLimited === true
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      console.log(`Testing: ${test.name}...`);
      const result = await Promise.race([
        test.test(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), TIMEOUT)
        )
      ]);
      
      if (test.validate(result)) {
        console.log(`✅ ${test.name} - PASSED`);
        passed++;
      } else {
        console.log(`❌ ${test.name} - FAILED (validation failed)`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name} - FAILED (${error.message})`);
      failed++;
    }
  }

  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('🎉 All tests passed! Production deployment is ready.');
    process.exit(0);
  } else {
    console.log('💥 Some tests failed. Please check the deployment.');
    process.exit(1);
  }
}

// Add global fetch if not available (Node.js < 18)
if (typeof fetch === 'undefined') {
  import('node-fetch').then(({ default: fetch }) => {
    global.fetch = fetch;
    runTests();
  }).catch(() => {
    console.log('❌ node-fetch not available. Please run: npm install node-fetch');
    process.exit(1);
  });
} else {
  runTests();
}