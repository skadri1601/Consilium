# Windows Socket Buffer Exhaustion Troubleshooting

## Problem

On Windows, you may encounter the following error when running uvicorn:

```
OSError: [WinError 10055] An operation on a socket could not be performed because the system lacked sufficient buffer space or because a queue was full
```

This is a Windows-specific issue caused by:
1. Windows TCP/IP stack having stricter limits on socket buffer space
2. Uvicorn's reload mechanism creating many file watchers/sockets
3. Default asyncio event loop policy on Windows having issues with many concurrent connections

## Solution 1: Code Fix (Already Applied)

The `main.py` file has been updated with Windows-specific optimizations:
- Sets `WindowsSelectorEventLoopPolicy` for better Windows compatibility
- Limits connection backlog to 128
- Reduces reload delay and limits file watchers

## Solution 2: Increase Windows Socket Buffer Size (Requires Admin)

If the error persists, you can increase Windows socket buffer sizes:

### Option A: Using Registry Editor (Recommended)

1. Press `Win + R`, type `regedit`, and press Enter
2. Navigate to: `HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Services\Tcpip\Parameters`
3. Create or modify these DWORD values:
   - `TcpNumConnections` = `16777214` (decimal)
   - `MaxUserPort` = `65534` (decimal)
   - `TcpTimedWaitDelay` = `30` (decimal)
4. Restart your computer

### Option B: Using PowerShell (Run as Administrator)

```powershell
# Set TCP connection limits
New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Services\Tcpip\Parameters" -Name "TcpNumConnections" -Value 16777214 -PropertyType DWORD -Force
New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Services\Tcpip\Parameters" -Name "MaxUserPort" -Value 65534 -PropertyType DWORD -Force
New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Services\Tcpip\Parameters" -Name "TcpTimedWaitDelay" -Value 30 -PropertyType DWORD -Force

# Restart required
Restart-Computer
```

## Solution 3: Disable Reload in Development

If you're still experiencing issues, temporarily disable reload:

```powershell
# In apps/agents directory
poetry run python -m src.main
```

Or set `DEBUG=false` in your `.env` file.

## Solution 4: Use WSL2 (Alternative)

If the issue persists, consider using Windows Subsystem for Linux (WSL2):

1. Install WSL2: `wsl --install`
2. Run the application in WSL2 where socket limits are more generous
3. Access via `http://localhost:8000` from Windows

## Solution 5: Check for Connection Leaks

If you're making many HTTP requests, ensure you're using connection pooling:

```python
# Good: Reuse client
import httpx
async with httpx.AsyncClient() as client:
    response = await client.get("https://api.example.com")

# Bad: Creating new client each time
response = await httpx.AsyncClient().get("https://api.example.com")
```

## Verification

After applying fixes, verify the server starts without errors:

```powershell
cd apps/agents
poetry run python -m src.main
```

You should see:
```
Starting Consilium Agents on 0.0.0.0:8000
INFO:     Uvicorn running on http://0.0.0.0:8000
```

## Additional Resources

- [Windows TCP/IP Tuning](https://docs.microsoft.com/en-us/troubleshoot/windows-server/networking/description-tcp-features)
- [Uvicorn Windows Issues](https://github.com/encode/uvicorn/issues)
- [Python asyncio on Windows](https://docs.python.org/3/library/asyncio-platforms.html#windows)

