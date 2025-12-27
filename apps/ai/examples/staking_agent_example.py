"""
Example usage of the Staking Agent with MCP.

This script demonstrates how to use the staking agent to interact with
blockchain staking operations through the MCP server.

Prerequisites:
1. Start the MCP server: cd apps/mcp && npm run dev
2. Set environment variables: OPENAI_API_KEY, MCP_SERVER_URL (optional)
"""

import asyncio

from dotenv import load_dotenv

from app.builtin.staking_agent import create_staking_agent

load_dotenv()


async def main():
    """Run example staking agent interactions."""
    print("🚀 Creating Staking Agent with MCP tools...")
    
    try:
        # Create the agent with MCP tools
        agent, client = await create_staking_agent()
        
        print("✅ Agent created successfully!")
        print("\n--- Example 1: Get Supported Chains ---")
        
        # Example 1: Query supported chains
        response = await agent.ainvoke({
            "messages": [{"role": "user", "content": "What blockchain networks do you support?"}]
        })
        print(f"Response: {response['messages'][-1].content}")
        
        print("\n--- Example 2: Build a Transaction ---")
        
        # Example 2: Ask to build a staking transaction
        response = await agent.ainvoke({
            "messages": [{
                "role": "user", 
                "content": """
                I want to stake 1 U2U on U2U Mainnet (chain ID 39). 
                The staking contract address is 0x1234567890123456789012345678901234567890.
                Can you build the transaction for me?
                """
            }]
        })
        print(f"Response: {response['messages'][-1].content}")
        
        print("\n--- Example 3: Query Contract ---")
        
        # Example 3: Query a staking contract
        response = await agent.ainvoke({
            "messages": [{
                "role": "user",
                "content": """
                Query the staking contract at 0x1234567890123456789012345678901234567890 
                on Ethereum mainnet to check my staked balance.
                Function signature: balanceOf(address) 
                My address: 0xabcdef1234567890123456789012345678901234
                """
            }]
        })
        print(f"Response: {response['messages'][-1].content}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        print("\nMake sure the MCP server is running:")
        print("  cd apps/mcp && npm run dev")


async def simple_example():
    """Run a simple example without MCP (for testing agent structure)."""
    from app.builtin.staking_agent import create_simple_staking_agent
    
    print("🚀 Creating Simple Staking Agent (no MCP)...")
    
    agent = create_simple_staking_agent()
    
    print("✅ Agent created successfully!")
    
    response = await agent.ainvoke({
        "messages": [{"role": "user", "content": "What is staking in blockchain?"}]
    })
    print(f"Response: {response['messages'][-1].content}")


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "--simple":
        asyncio.run(simple_example())
    else:
        asyncio.run(main())
