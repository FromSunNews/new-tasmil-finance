"""
Example: Staking Agent with Generative UI

This example demonstrates how to use push_ui_message to emit
custom UI components from the staking agent.

Run this example:
    python -m examples.staking_ui_example
"""

import asyncio
import uuid
from typing import Annotated, Sequence, TypedDict

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage
from langgraph.graph import StateGraph
from langgraph.graph.message import add_messages
from langgraph.graph.ui import AnyUIMessage, ui_message_reducer, push_ui_message


# =============================================================================
# State Definition
# =============================================================================

class StakingState(TypedDict):
    """State with UI support."""
    messages: Annotated[Sequence[BaseMessage], add_messages]
    ui: Annotated[Sequence[AnyUIMessage], ui_message_reducer]


# =============================================================================
# Example Handlers
# =============================================================================

async def handle_balance_query(state: StakingState) -> dict:
    """
    Example: Query account balance and emit staking-result UI.
    """
    # Simulate fetching balance data
    balance_data = {
        "walletAddress": "0x1234567890abcdef1234567890abcdef12345678",
        "balance": "1250.5678",
        "unit": "U2U"
    }
    
    # Create AI message
    message = AIMessage(
        id=str(uuid.uuid4()),
        content=f"Here's your wallet balance."
    )
    
    # Push UI component
    push_ui_message(
        "staking-result",  # Component name from frontend ComponentMap
        {
            "result": {
                "success": True,
                **balance_data
            },
            "toolType": "tool-getAccountBalance"
        },
        message=message
    )
    
    return {"messages": [message]}


async def handle_epoch_query(state: StakingState) -> dict:
    """
    Example: Query current epoch and emit staking-result UI.
    """
    # Simulate fetching epoch data
    epoch_data = {
        "currentEpoch": 12345
    }
    
    message = AIMessage(
        id=str(uuid.uuid4()),
        content=f"Current epoch is {epoch_data['currentEpoch']}."
    )
    
    push_ui_message(
        "staking-result",
        {
            "result": {
                "success": True,
                **epoch_data
            },
            "toolType": "tool-getCurrentEpoch"
        },
        message=message
    )
    
    return {"messages": [message]}


async def handle_delegate_request(state: StakingState) -> dict:
    """
    Example: Prepare delegation and emit staking-operation-result UI.
    """
    # Simulate preparing delegation
    delegation_data = {
        "action": "delegate",
        "validatorID": 5,
        "amount": 1000,
        "amountFormatted": "1,000 U2U",
        "message": "Ready to delegate 1,000 U2U to Validator #5",
        "requiresWallet": True,
        "requiresConfirmation": True,
    }
    
    message = AIMessage(
        id=str(uuid.uuid4()),
        content="I've prepared the delegation transaction for you."
    )
    
    push_ui_message(
        "staking-operation-result",  # Operation component
        {
            "result": {
                "success": True,
                **delegation_data
            },
            "toolType": "tool-delegateStake"
        },
        message=message
    )
    
    return {"messages": [message]}


async def handle_claim_rewards(state: StakingState) -> dict:
    """
    Example: Prepare claim rewards and emit staking-operation-result UI.
    """
    claim_data = {
        "action": "claimRewards",
        "validatorID": 5,
        "amountFormatted": "25.5 U2U",
        "message": "Ready to claim 25.5 U2U rewards from Validator #5",
        "requiresWallet": True,
        "requiresConfirmation": True,
    }
    
    message = AIMessage(
        id=str(uuid.uuid4()),
        content="I've prepared the claim rewards transaction."
    )
    
    push_ui_message(
        "staking-operation-result",
        {
            "result": {
                "success": True,
                **claim_data
            },
            "toolType": "tool-claimRewards"
        },
        message=message
    )
    
    return {"messages": [message]}


async def handle_transaction_completed(state: StakingState) -> dict:
    """
    Example: Show completed transaction UI.
    """
    tx_data = {
        "transactionCompleted": True,
        "hash": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
        "action": "delegate",
        "message": "Successfully delegated 1,000 U2U to Validator #5\n\nYour stake is now active.",
    }
    
    message = AIMessage(
        id=str(uuid.uuid4()),
        content="Transaction completed successfully!"
    )
    
    push_ui_message(
        "staking-operation-result",
        {
            "result": {
                "success": True,
                **tx_data
            },
            "toolType": "tool-delegateStake"
        },
        message=message
    )
    
    return {"messages": [message]}


async def handle_error(state: StakingState) -> dict:
    """
    Example: Show error UI.
    """
    message = AIMessage(
        id=str(uuid.uuid4()),
        content="Sorry, there was an error processing your request."
    )
    
    push_ui_message(
        "staking-operation-result",
        {
            "result": {
                "success": False,
                "error": "Insufficient balance. You need at least 100 U2U to delegate."
            },
            "toolType": "tool-delegateStake"
        },
        message=message
    )
    
    return {"messages": [message]}


# =============================================================================
# Router
# =============================================================================

def route_request(state: StakingState) -> str:
    """Route based on user message content."""
    last_message = state["messages"][-1]
    content = last_message.content.lower() if hasattr(last_message, "content") else ""
    
    if "balance" in content:
        return "balance"
    elif "epoch" in content:
        return "epoch"
    elif "delegate" in content:
        return "delegate"
    elif "claim" in content:
        return "claim"
    elif "completed" in content or "success" in content:
        return "completed"
    elif "error" in content:
        return "error"
    else:
        return "balance"  # Default


# =============================================================================
# Build Graph
# =============================================================================

def build_example_graph():
    """Build example staking graph with UI."""
    workflow = StateGraph(StakingState)
    
    # Add nodes
    workflow.add_node("balance", handle_balance_query)
    workflow.add_node("epoch", handle_epoch_query)
    workflow.add_node("delegate", handle_delegate_request)
    workflow.add_node("claim", handle_claim_rewards)
    workflow.add_node("completed", handle_transaction_completed)
    workflow.add_node("error", handle_error)
    
    # Add conditional routing
    workflow.add_conditional_edges(
        "__start__",
        route_request,
        {
            "balance": "balance",
            "epoch": "epoch",
            "delegate": "delegate",
            "claim": "claim",
            "completed": "completed",
            "error": "error",
        }
    )
    
    return workflow.compile()


# =============================================================================
# Main
# =============================================================================

async def main():
    """Run example."""
    graph = build_example_graph()
    
    # Test different scenarios
    test_messages = [
        "Show my balance",
        "What's the current epoch?",
        "I want to delegate 1000 U2U to validator 5",
        "Claim my rewards",
        "Show completed transaction",
        "Show error example",
    ]
    
    for msg in test_messages:
        print(f"\n{'='*60}")
        print(f"User: {msg}")
        print("="*60)
        
        result = await graph.ainvoke({
            "messages": [HumanMessage(content=msg)],
            "ui": []
        })
        
        # Print messages
        for m in result["messages"]:
            if isinstance(m, AIMessage):
                print(f"AI: {m.content}")
        
        # Print UI messages
        if result.get("ui"):
            print(f"\nUI Messages: {len(result['ui'])}")
            for ui_msg in result["ui"]:
                print(f"  - Component: {ui_msg.get('name', 'unknown')}")
                print(f"    Props: {ui_msg.get('props', {})}")


if __name__ == "__main__":
    asyncio.run(main())
