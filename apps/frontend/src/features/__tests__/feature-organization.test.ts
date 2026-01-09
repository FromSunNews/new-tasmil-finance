/**
 * Property-Based Test for Feature Module Organization
 * 
 * Property 1: Feature module organization
 * For any DeFi feature (agents, chat, staking, bridge, yield, research), 
 * it should be organized in the features directory with proper subdirectories 
 * for components, hooks, api, types, and constants
 * 
 * Validates: Requirements 1.1
 */

import { existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

describe('Feature Module Organization Property Tests', () => {
  const FEATURES_DIR = join(__dirname, '..');
  const EXPECTED_FEATURES = ['agents', 'chat', 'staking', 'bridge', 'yield', 'research'];
  const REQUIRED_SUBDIRS = ['components', 'hooks', 'api'];
  const REQUIRED_FILES = ['types.ts', 'constants.ts', 'index.ts'];

  /**
   * Property 1: Feature module organization
   * For any DeFi feature, it should be organized with proper structure
   */
  describe('Property 1: Feature module organization', () => {
    test.each(EXPECTED_FEATURES)(
      'feature %s should have proper directory structure',
      (featureName) => {
        const featurePath = join(FEATURES_DIR, featureName);
        
        // Feature directory should exist
        expect(existsSync(featurePath)).toBe(true);
        expect(statSync(featurePath).isDirectory()).toBe(true);
        
        // Required subdirectories should exist
        REQUIRED_SUBDIRS.forEach(subdir => {
          const subdirPath = join(featurePath, subdir);
          expect(existsSync(subdirPath)).toBe(true);
          expect(statSync(subdirPath).isDirectory()).toBe(true);
        });
        
        // Required files should exist
        REQUIRED_FILES.forEach(file => {
          const filePath = join(featurePath, file);
          expect(existsSync(filePath)).toBe(true);
          expect(statSync(filePath).isFile()).toBe(true);
        });
      }
    );

    test('all features should have barrel exports in index.ts', () => {
      EXPECTED_FEATURES.forEach(featureName => {
        const indexPath = join(FEATURES_DIR, featureName, 'index.ts');
        expect(existsSync(indexPath)).toBe(true);
        
        // Read the index file and verify it has exports
        const fs = require('fs');
        const content = fs.readFileSync(indexPath, 'utf8');
        
        // Should export types and constants
        expect(content).toMatch(/export.*from.*types/);
        expect(content).toMatch(/export.*from.*constants/);
      });
    });

    test('features directory should only contain expected DeFi features', () => {
      const actualFeatures = readdirSync(FEATURES_DIR, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name)
        .filter(name => !name.startsWith('__')); // Exclude test directories
      
      // All actual features should be in expected list
      actualFeatures.forEach(feature => {
        expect(EXPECTED_FEATURES).toContain(feature);
      });
      
      // All expected features should exist
      EXPECTED_FEATURES.forEach(feature => {
        expect(actualFeatures).toContain(feature);
      });
    });

    test('feature components should be properly organized', () => {
      EXPECTED_FEATURES.forEach(featureName => {
        const componentsPath = join(FEATURES_DIR, featureName, 'components');
        
        if (existsSync(componentsPath)) {
          const componentFiles = readdirSync(componentsPath, { withFileTypes: true });
          
          // All component files should be .tsx files or subdirectories
          componentFiles.forEach(file => {
            if (file.isFile()) {
              expect(file.name).toMatch(/\.(tsx|ts)$/);
            }
          });
        }
      });
    });
  });

  /**
   * Property Test: Feature isolation
   * Each feature should be self-contained and not directly import from other features
   */
  describe('Property: Feature isolation', () => {
    test('features should not directly import from other features', () => {
      const fs = require('fs');
      
      function checkFeatureIsolation(featureName: string) {
        const featurePath = join(FEATURES_DIR, featureName);
        
        function scanDirectory(dirPath: string): void {
          if (!existsSync(dirPath)) return;
          
          const items = readdirSync(dirPath, { withFileTypes: true });
          
          items.forEach(item => {
            const itemPath = join(dirPath, item.name);
            
            if (item.isDirectory()) {
              scanDirectory(itemPath);
            } else if (item.name.match(/\.(ts|tsx)$/)) {
              const content = fs.readFileSync(itemPath, 'utf8');
              
              // Check for direct imports from other features
              const otherFeatures = EXPECTED_FEATURES.filter(f => f !== featureName);
              otherFeatures.forEach(otherFeature => {
                const importPattern = new RegExp(`from.*@/features/${otherFeature}`, 'g');
                const matches = content.match(importPattern);
                
                if (matches) {
                  // Allow imports from the main features index (which is the proper way)
                  const directImportPattern = new RegExp(`from.*@/features/${otherFeature}/`, 'g');
                  
                  expect(content.match(directImportPattern)).toBeNull();
                }
              });
            }
          });
        }
        
        scanDirectory(featurePath);
      }
      
      EXPECTED_FEATURES.forEach(checkFeatureIsolation);
    });
  });
});