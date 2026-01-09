module.exports = {
  // TypeScript and JavaScript files
  '**/*.{ts,tsx,js,jsx}': [
    'biome check --write',
    'eslint --fix',
    'jest --bail --findRelatedTests --passWithNoTests',
  ],
  
  // JSON files
  '**/*.json': ['biome format --write'],
  
  // Markdown files
  '**/*.md': ['biome format --write'],
  
  // Package.json files
  '**/package.json': ['biome format --write'],
  
  // Type check all TypeScript files
  '**/*.{ts,tsx}': () => 'tsc --noEmit',
}