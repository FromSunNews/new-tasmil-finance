#!/usr/bin/env node

/**
 * Test script to verify the MCP server can start and list its tools
 * This is useful for debugging and development
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testServer() {
    console.log("🚀 Starting MCP Server Test...\n");

    // Start the server process
    const serverPath = join(__dirname, "dist", "server.js");
    const serverProcess = spawn("node", [serverPath], {
        stdio: ["pipe", "pipe", "pipe"],
    });

    // Create client
    const transport = new StdioClientTransport({
        command: "node",
        args: [serverPath],
    });

    const client = new Client(
        {
            name: "test-client",
            version: "1.0.0",
        },
        {
            capabilities: {},
        }
    );

    try {
        // Connect to server
        await client.connect(transport);
        console.log("✅ Connected to MCP server\n");

        // List available tools
        const tools = await client.listTools();
        console.log("📋 Available Tools:\n");

        tools.tools.forEach((tool, index) => {
            console.log(`${index + 1}. ${tool.name}`);
            console.log(`   Description: ${tool.description}`);
            console.log(`   Input Schema:`, JSON.stringify(tool.inputSchema, null, 2));
            console.log("");
        });

        console.log(`\n✅ Server is working! Found ${tools.tools.length} tools.\n`);

        // Test get_supported_chains tool
        console.log("🧪 Testing get_supported_chains tool...\n");
        const result = await client.callTool({
            name: "get_supported_chains",
            arguments: {},
        });

        console.log("Result:", JSON.stringify(result, null, 2));

    } catch (error) {
        console.error("❌ Error:", error);
        process.exit(1);
    } finally {
        await client.close();
        serverProcess.kill();
    }
}

testServer().catch(console.error);
