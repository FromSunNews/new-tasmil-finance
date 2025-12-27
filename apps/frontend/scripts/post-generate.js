#!/usr/bin/env node

/**
 * Post-generation script to fix Kubb generated code issues
 * This script should be run after `pnpm generate:api`
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const genDir = path.join(__dirname, '../gen');

// Fix empty PathParams interfaces
function fixPathParams() {
  console.log('🔧 Fixing empty PathParams interfaces...\n');
  
  const genTypesDir = path.join(genDir, 'types');
  
  const filesToFix = {
    'agents-controller-get-agent.ts': 'AgentsControllerGetAgentPathParams',
    'chat-controller-get-chat.ts': 'ChatControllerGetChatPathParams',
    'chat-controller-get-stream.ts': 'ChatControllerGetStreamPathParams',
    'chat-controller-delete-trailing-messages.ts': 'ChatControllerDeleteTrailingMessagesPathParams',
    'chat-controller-update-chat-visibility.ts': 'ChatControllerUpdateChatVisibilityPathParams',
    'links-controller-find-one.ts': 'LinksControllerFindOnePathParams',
    'links-controller-remove.ts': 'LinksControllerRemovePathParams',
    'links-controller-update.ts': 'LinksControllerUpdatePathParams',
  };

  let fixedCount = 0;
  
  for (const [fileName, interfaceName] of Object.entries(filesToFix)) {
    const filePath = path.join(genTypesDir, fileName);
    
    if (fs.existsSync(filePath)) {
      try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        const emptyInterfaceRegex = new RegExp(`export interface ${interfaceName} \\{\\}`, 'g');
        const fixedInterface = `export interface ${interfaceName} {
  id: string;
}`;
        
        if (emptyInterfaceRegex.test(content)) {
          content = content.replace(emptyInterfaceRegex, fixedInterface);
          fs.writeFileSync(filePath, content, 'utf8');
          console.log(`✅ Fixed ${interfaceName} in ${fileName}`);
          fixedCount++;
        }
      } catch (error) {
        console.error(`❌ Error fixing ${fileName}:`, error.message);
      }
    }
  }
  
  console.log(`\n🎉 Fixed ${fixedCount} PathParams interfaces\n`);
}

// Fix duplicate enum exports
function fixEnumExports() {
  console.log('🔧 Fixing enum exports...\n');
  
  const indexFiles = [
    path.join(genDir, 'index.ts'),
    path.join(genDir, 'types/index.ts')
  ];
  
  const enumsToRemove = [
    'documentControllerCreateDocumentMutationRequestKindEnum',
    'updateChatVisibilityDtoVisibilityEnum', 
    'voteControllerVoteMutationRequestTypeEnum',
    'DocumentControllerCreateDocumentMutationRequestKindEnumKey',
    'UpdateChatVisibilityDtoVisibilityEnumKey',
    'VoteControllerVoteMutationRequestTypeEnumKey'
  ];
  
  for (const filePath of indexFiles) {
    if (fs.existsSync(filePath)) {
      try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;
        
        for (const enumName of enumsToRemove) {
          const exportRegex = new RegExp(`export \\{ ${enumName} \\} from [^;]+;\\s*`, 'g');
          if (exportRegex.test(content)) {
            content = content.replace(exportRegex, '');
            modified = true;
          }
        }
        
        if (modified) {
          fs.writeFileSync(filePath, content, 'utf8');
          console.log(`✅ Fixed enum exports in ${path.basename(filePath)}`);
        }
      } catch (error) {
        console.error(`❌ Error fixing ${filePath}:`, error.message);
      }
    }
  }
  
  console.log('🎉 Fixed enum exports\n');
}

function main() {
  console.log('🚀 Running post-generation fixes...\n');
  
  fixPathParams();
  fixEnumExports();
  
  console.log('✨ All fixes completed!');
}

main();