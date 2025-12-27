#!/usr/bin/env node

/**
 * Script to fix empty PathParams interfaces in Kubb generated types
 * This is a workaround for Kubb not properly generating path parameters
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const genTypesDir = path.join(__dirname, '../gen/types');

// Map of files to fix and their required id property
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

function fixPathParamsInterface(filePath, interfaceName) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace empty interface with interface containing id property
    const emptyInterfaceRegex = new RegExp(`export interface ${interfaceName} \\{\\}`, 'g');
    const fixedInterface = `export interface ${interfaceName} {
  id: string;
}`;
    
    if (emptyInterfaceRegex.test(content)) {
      content = content.replace(emptyInterfaceRegex, fixedInterface);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed ${interfaceName} in ${path.basename(filePath)}`);
      return true;
    } else {
      console.log(`⚠️  ${interfaceName} not found or already fixed in ${path.basename(filePath)}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🔧 Fixing empty PathParams interfaces...\n');
  
  let fixedCount = 0;
  
  for (const [fileName, interfaceName] of Object.entries(filesToFix)) {
    const filePath = path.join(genTypesDir, fileName);
    
    if (fs.existsSync(filePath)) {
      if (fixPathParamsInterface(filePath, interfaceName)) {
        fixedCount++;
      }
    } else {
      console.log(`⚠️  File not found: ${fileName}`);
    }
  }
  
  console.log(`\n🎉 Fixed ${fixedCount} PathParams interfaces`);
}

main();