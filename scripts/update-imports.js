const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get all TypeScript and JavaScript files in src directory
const files = execSync('find src -type f -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx"')
  .toString()
  .split('\n')
  .filter(Boolean);

// Update imports in each file
files.forEach(file => {
  try {
    let content = fs.readFileSync(file, 'utf8');
    const originalContent = content;

    // Update imports from @/lib to @/shared/lib
    content = content.replace(
      /from ['"]@\/lib\/([^'"]+)['"]/g,
      'from \'@/shared/lib/$1\''
    );

    // Update imports from @/lib/utils to @/shared/utils
    content = content.replace(
      /from ['"]@\/lib\/utils['"]/g,
      'from \'@/shared/utils\''
    );

    // Only write if content changed
    if (content !== originalContent) {
      fs.writeFileSync(file, content, 'utf8');
      console.log(`Updated imports in ${file}`);
    }
  } catch (error) {
    console.error(`Error processing ${file}:`, error);
  }
}); 