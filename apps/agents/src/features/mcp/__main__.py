import asyncio
import logging
import sys

logging.basicConfig(level=logging.INFO, stream=sys.stderr)


async def main() -> None:
    from mcp.server.stdio import stdio_server
    from .server import create_mcp_server

    server = create_mcp_server()
    async with stdio_server() as (read_stream, write_stream):
        await server.run(read_stream, write_stream, server.create_initialization_options())


if __name__ == "__main__":
    asyncio.run(main())
