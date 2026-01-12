#!/usr/bin/env python3
"""
Test script for agents - Run this to verify agents are working correctly.

Usage:
    cd new-project/apps/ai
    python test_agents.py
"""

import asyncio
import sys

# Test 1: Import all agents
def test_imports():
    print("\n" + "="*60)
    print("TEST 1: Importing agents...")
    print("="*60)
    
    try:
        from app.builtin.staking_agent import graph as staking_graph, tools as staking_tools
        print(f"✅ staking_agent: {len(staking_tools)} tools")
        for tool in staking_tools:
            print(f"   - {tool.name}")
    except Exception as e:
        print(f"❌ staking_agent: {e}")
    
    try:
        from app.builtin.research_agent import graph as research_graph, tools as research_tools
        print(f"✅ research_agent: {len(research_tools)} tools")
        for tool in research_tools:
            print(f"   - {tool.name}")
    except Exception as e:
        print(f"❌ research_agent: {e}")
    
    try:
        from app.builtin.yield_agent import graph as yield_graph, tools as yield_tools
        print(f"✅ yield_agent: {len(yield_tools)} tools")
        for tool in yield_tools:
            print(f"   - {tool.name}")
    except Exception as e:
        print(f"❌ yield_agent: {e}")
    
    try:
        from app.builtin.bridge_agent import graph as bridge_graph, tools as bridge_tools
        print(f"✅ bridge_agent: {len(bridge_tools)} tools")
        for tool in bridge_tools:
            print(f"   - {tool.name}")
    except Exception as e:
        print(f"❌ bridge_agent: {e}")


# Test 2: Test research tools directly
def test_research_tools():
    print("\n" + "="*60)
    print("TEST 2: Testing research_agent tools...")
    print("="*60)
    
    try:
        from app.builtin.research_agent.graph import (
            get_crypto_price,
            get_top_coins,
            get_trending_coins,
            get_global_market_data,
            get_defi_tvl,
        )
        
        print("\n📊 Testing get_crypto_price('bitcoin')...")
        result = get_crypto_price("bitcoin")
        print(result[:500] if len(result) > 500 else result)
        
        print("\n📊 Testing get_top_coins(5)...")
        result = get_top_coins(5)
        print(result[:500] if len(result) > 500 else result)
        
        print("\n📊 Testing get_global_market_data()...")
        result = get_global_market_data()
        print(result[:500] if len(result) > 500 else result)
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()


# Test 3: Test yield tools directly
def test_yield_tools():
    print("\n" + "="*60)
    print("TEST 3: Testing yield_agent tools...")
    print("="*60)
    
    try:
        from app.builtin.yield_agent.graph import (
            get_yield_pools,
            get_yield_stats,
            get_stablecoin_yields,
        )
        
        print("\n🌾 Testing get_yield_stats()...")
        result = get_yield_stats(5)
        print(result[:500] if len(result) > 500 else result)
        
        print("\n🌾 Testing get_stablecoin_yields()...")
        result = get_stablecoin_yields(limit=5)
        print(result[:500] if len(result) > 500 else result)
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()


# Test 4: Test bridge tools directly
def test_bridge_tools():
    print("\n" + "="*60)
    print("TEST 4: Testing bridge_agent tools...")
    print("="*60)
    
    try:
        from app.builtin.bridge_agent.graph import (
            get_bridge_pairs,
            get_supported_chains,
            get_bridge_quote,
        )
        
        print("\n🌉 Testing get_supported_chains()...")
        result = get_supported_chains()
        print(result)
        
        print("\n🌉 Testing get_bridge_pairs()...")
        result = get_bridge_pairs()
        print(result)
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()


# Test 5: Check if graphs can be built
def test_graph_builds():
    print("\n" + "="*60)
    print("TEST 5: Testing graph builds...")
    print("="*60)
    
    agents = [
        ("staking_agent", "app.builtin.staking_agent"),
        ("research_agent", "app.builtin.research_agent"),
        ("yield_agent", "app.builtin.yield_agent"),
        ("bridge_agent", "app.builtin.bridge_agent"),
    ]
    
    for name, module_path in agents:
        try:
            module = __import__(module_path, fromlist=["graph"])
            graph = module.graph
            print(f"✅ {name}: Graph built successfully (name={graph.name})")
        except Exception as e:
            print(f"❌ {name}: {e}")


if __name__ == "__main__":
    print("\n🧪 AGENT TEST SUITE")
    print("="*60)
    
    # Run all tests
    test_imports()
    test_graph_builds()
    
    # Only run API tests if --api flag is passed
    if "--api" in sys.argv:
        print("\n⚠️  Running API tests (may hit rate limits)...")
        test_research_tools()
        test_yield_tools()
        test_bridge_tools()
    else:
        print("\n💡 Tip: Run with --api flag to test actual API calls:")
        print("   python test_agents.py --api")
    
    print("\n" + "="*60)
    print("✅ Tests completed!")
    print("="*60)
