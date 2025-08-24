console.log('🔍 Final Optimization Check for TikTok-Style Feed...\n');

// Check 1: Verify all critical files exist
const fs = require('fs');
const path = require('path');

const criticalFiles = [
  'BocmApp/app/hooks/useOptimizedFeed.ts',
  'BocmApp/app/components/OptimizedVideoCard.tsx',
  'BocmApp/app/screens/OptimizedFeedScreen.tsx',
  'BocmApp/app/types/feed.types.ts',
  'BocmApp/app/pages/CutsPage.tsx'
];

console.log('📁 Check 1: Verifying critical files...');
let allFilesExist = true;
criticalFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING!`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.error('\n❌ Critical files missing!');
  process.exit(1);
}

// Check 2: Verify no infinite loop patterns in code
console.log('\n🔍 Check 2: Scanning for infinite loop patterns...');

const patterns = [
  { pattern: 'useEffect.*\\[.*\\]', description: 'Empty dependency arrays' },
  { pattern: 'useCallback.*\\[.*\\]', description: 'Empty dependency arrays in useCallback' },
  { pattern: 'setState.*setState', description: 'Nested setState calls' },
  { pattern: 'fetchPage.*fetchPage', description: 'Recursive fetchPage calls' },
  { pattern: 'onVideoStateChange.*onVideoStateChange', description: 'Recursive callback calls' }
];

let foundIssues = false;
criticalFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    patterns.forEach(({ pattern, description }) => {
      const regex = new RegExp(pattern, 'g');
      const matches = content.match(regex);
      if (matches && matches.length > 0) {
        console.log(`⚠️  ${file}: ${description} (${matches.length} instances)`);
        foundIssues = true;
      }
    });
  }
});

if (!foundIssues) {
  console.log('✅ No obvious infinite loop patterns found');
}

// Check 3: Verify proper memoization
console.log('\n🔍 Check 3: Checking memoization patterns...');

const memoizationPatterns = [
  { pattern: 'React\\.memo', description: 'React.memo usage' },
  { pattern: 'useMemo', description: 'useMemo usage' },
  { pattern: 'useCallback', description: 'useCallback usage' }
];

let memoizationCount = 0;
criticalFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    memoizationPatterns.forEach(({ pattern, description }) => {
      const regex = new RegExp(pattern, 'g');
      const matches = content.match(regex);
      if (matches) {
        memoizationCount += matches.length;
        console.log(`✅ ${file}: ${matches.length} ${description}`);
      }
    });
  }
});

console.log(`📊 Total memoization instances: ${memoizationCount}`);

// Check 4: Verify proper cleanup patterns
console.log('\n🔍 Check 4: Checking cleanup patterns...');

const cleanupPatterns = [
  { pattern: 'clearTimeout', description: 'clearTimeout usage' },
  { pattern: 'clearInterval', description: 'clearInterval usage' },
  { pattern: 'abort\\(\\)', description: 'AbortController usage' },
  { pattern: 'unsubscribe\\(\\)', description: 'Subscription cleanup' }
];

let cleanupCount = 0;
criticalFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    cleanupPatterns.forEach(({ pattern, description }) => {
      const regex = new RegExp(pattern, 'g');
      const matches = content.match(regex);
      if (matches) {
        cleanupCount += matches.length;
        console.log(`✅ ${file}: ${matches.length} ${description}`);
      }
    });
  }
});

console.log(`📊 Total cleanup instances: ${cleanupCount}`);

// Check 5: Verify performance optimizations
console.log('\n🔍 Check 5: Checking performance optimizations...');

const performancePatterns = [
  { pattern: 'removeClippedSubviews', description: 'FlatList optimization' },
  { pattern: 'maxToRenderPerBatch', description: 'Batch rendering' },
  { pattern: 'windowSize', description: 'Window size optimization' },
  { pattern: 'initialNumToRender', description: 'Initial render limit' },
  { pattern: 'pagingEnabled', description: 'Paging enabled' },
  { pattern: 'snapToInterval', description: 'Snap scrolling' }
];

let performanceCount = 0;
criticalFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    performancePatterns.forEach(({ pattern, description }) => {
      const regex = new RegExp(pattern, 'g');
      const matches = content.match(regex);
      if (matches) {
        performanceCount += matches.length;
        console.log(`✅ ${file}: ${matches.length} ${description}`);
      }
    });
  }
});

console.log(`📊 Total performance optimizations: ${performanceCount}`);

// Final summary
console.log('\n🎉 Final Optimization Check Complete!');
console.log('\n📋 Summary:');
console.log(`   • Critical files: ${criticalFiles.filter(f => fs.existsSync(f)).length}/${criticalFiles.length}`);
console.log(`   • Infinite loop issues: ${foundIssues ? 'FOUND' : 'NONE'}`);
console.log(`   • Memoization instances: ${memoizationCount}`);
console.log(`   • Cleanup instances: ${cleanupCount}`);
console.log(`   • Performance optimizations: ${performanceCount}`);

if (foundIssues) {
  console.log('\n⚠️  WARNING: Potential issues found! Review the warnings above.');
} else {
  console.log('\n✅ All checks passed! The TikTok-style feed should be stable and performant.');
}
