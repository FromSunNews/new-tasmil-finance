import asyncio

import httpx


async def main():
    url = "http://localhost:8100/agent/stream"
    params = {"message": "Explain about Bitcoin for a 10 years old boy in 200 words"}

    async with httpx.AsyncClient(timeout=None) as client:
        async with client.stream("GET", url, params=params) as response:
            async for line in response.aiter_lines():
                if not line:
                    continue
                print(line)
                # if line.startswith("event: ping"):
                #     print("ping")
                #     continue
                # if line.startswith("data:"):
                #     print("DATA: ")
                #     print(line.removeprefix("data:").strip())
                # elif line.startswith("event:"):
                #     print(line)


if __name__ == "__main__":
    asyncio.run(main())
