from langgraph_sdk import Auth

# This is our toy user database. Do not do this in production
VALID_TOKENS = {
    "user1-token": {"id": "user1", "name": "Alice"},
    "user2-token": {"id": "user2", "name": "Bob"},
}

# The "Auth" object is a container that LangGraph will use to mark our authentication function
auth = Auth()


# The `authenticate` decorator tells LangGraph to call this function as middleware
# for every request. This will determine whether the request is allowed or not
@auth.authenticate
async def get_current_user(authorization: str | None) -> Auth.types.MinimalUserDict:
    """Check if the user's token is valid."""
    if not authorization:
        raise Auth.exceptions.HTTPException(status_code=401, detail="Missing authorization header")
    scheme, token = authorization.split()
    assert scheme.lower() == "bearer"
    # Check if token is valid
    if token not in VALID_TOKENS:
        raise Auth.exceptions.HTTPException(status_code=401, detail="Invalid token")

    # Return user info if valid
    user_data = VALID_TOKENS[token]
    return {
        "identity": user_data["id"],
    }

@auth.on.threads.create
async def add_owner(
    ctx: Auth.types.AuthContext,
    value: dict,
):
    """Add the owner to the resource metadata and return filters."""
    filters = {"owner": ctx.user.identity, "permissions": {"threads-create": True, "threads-read": True, "threads-update": True, "threads-delete": True}}
    metadata = value.setdefault("metadata", {})
    metadata.update(filters)
    return filters

@auth.on.threads.search
async def search_filter(
    ctx: Auth.types.AuthContext,
    value: dict,
):
    """Add the owner to the resource metadata and return filters."""
    filters = {"owner": ctx.user.identity, "permissions": {"read": True, "write": True}}
    metadata = value.setdefault("metadata", {})
    metadata.update(filters)
    return filters
