# Windows Troubleshooting Guide
## Accessing Ubuntu Server from Windows on Different Subnet

---

## 🪟 Step 1: Get Your Windows IP Address

Open **Command Prompt** and run:

```cmd
ipconfig
```

Look for:
```
Ethernet adapter Ethernet:
   IPv4 Address. . . . . . . . . . : 192.168.20.100
   Subnet Mask . . . . . . . . . . : 255.255.255.0
   Default Gateway . . . . . . . . : 192.168.20.1
```

**Note your IPv4 Address** (e.g., 192.168.20.100)

---

## 🧪 Step 2: Test Connectivity

### Test 1: Ping Ubuntu Server

```cmd
ping 192.168.10.50
```

**Expected output:**
```
Pinging 192.168.10.50 with 32 bytes of data:
Reply from 192.168.10.50: bytes=32 time=5ms TTL=64
Reply from 192.168.10.50: bytes=32 time=4ms TTL=64
Reply from 192.168.10.50: bytes=32 time=4ms TTL=64
Reply from 192.168.10.50: bytes=32 time=5ms TTL=64

Ping statistics for 192.168.10.50:
    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),
```

**If ping fails:**
- ❌ Machines are not on same network
- ❌ Router not routing between subnets
- ❌ Ubuntu firewall blocking ICMP
- ❌ Network cable disconnected

---

### Test 2: Check Port Connectivity

```cmd
telnet 192.168.10.50 3001
```

**Expected result:**
- Connection succeeds (blank screen appears)
- You can type but nothing shows (normal for telnet)
- Press `Ctrl+]` then `quit` to exit

**If connection fails:**
- ❌ Port 3001 is blocked by firewall
- ❌ Node.js server not running
- ❌ Server not listening on port 3001

---

### Test 3: Test HTTP Request

**Option A: Using PowerShell**

```powershell
Invoke-WebRequest -Uri "http://192.168.10.50:3001" -UseBasicParsing
```

**Option B: Using curl (if installed)**

```cmd
curl http://192.168.10.50:3001
```

**Option C: Using browser**

Open browser and go to:
```
http://192.168.10.50:3001
```

---

## ❌ Troubleshooting Steps

### Problem 1: Ping Fails

**Symptoms:**
```
Pinging 192.168.10.50 with 32 bytes of data:
Request timed out.
Request timed out.
```

**Solutions:**

1. **Check if Ubuntu is on same network:**
   ```cmd
   ipconfig
   ```
   - Your subnet: 192.168.20.x
   - Ubuntu subnet: 192.168.10.x
   - These are different subnets ✓ (expected)

2. **Check if router allows inter-subnet communication:**
   - Access router admin panel: `http://192.168.1.1`
   - Look for "Routing" or "Inter-VLAN" settings
   - Enable if disabled

3. **Check Ubuntu firewall:**
   - On Ubuntu, run: `sudo ufw status`
   - If blocking ICMP, run: `sudo ufw allow in icmp`

4. **Check network cables:**
   - Ensure both machines are connected to network
   - Try different network cable if available

5. **Restart router:**
   - Power off router for 30 seconds
   - Power back on
   - Wait 2 minutes for full boot

---

### Problem 2: Ping Works but Telnet Fails

**Symptoms:**
```
Pinging 192.168.10.50 with 32 bytes of data:
Reply from 192.168.10.50: bytes=32 time=5ms TTL=64
```

But telnet fails:
```
Connecting to 192.168.10.50...Could not open connection to the host, on port 3001: Connect failed
```

**Solutions:**

1. **Check if Node.js server is running:**
   ```bash
   # On Ubuntu
   ps aux | grep node
   ```
   If not running, start it:
   ```bash
   node server.js
   ```

2. **Check if port 3001 is listening:**
   ```bash
   # On Ubuntu
   sudo netstat -tlnp | grep 3001
   ```
   Should show:
   ```
   tcp  0  0  0.0.0.0:3001  0.0.0.0:*  LISTEN
   ```

3. **Check Ubuntu firewall:**
   ```bash
   # On Ubuntu
   sudo ufw status
   ```
   If port 3001 not listed, add it:
   ```bash
   sudo ufw allow 3001/tcp
   sudo ufw reload
   ```

4. **Check if server is listening on 0.0.0.0:**
   ```bash
   # On Ubuntu
   sudo netstat -tlnp | grep 3001
   ```
   Should show `0.0.0.0:3001` not `127.0.0.1:3001`

---

### Problem 3: Telnet Works but Browser Shows Error

**Symptoms:**
- Telnet connects successfully
- But browser shows: "ERR_CONNECTION_REFUSED" or "Cannot reach server"

**Solutions:**

1. **Check if server is responding:**
   ```cmd
   # On Windows PowerShell
   Invoke-WebRequest -Uri "http://192.168.10.50:3001"
   ```

2. **Check server logs:**
   ```bash
   # On Ubuntu
   # Look at console output where server is running
   # Should show requests coming in
   ```

3. **Try different port:**
   ```bash
   # On Ubuntu, allow another port
   sudo ufw allow 8080/tcp
   
   # Then test from Windows
   http://192.168.10.50:8080
   ```

4. **Check if server crashed:**
   ```bash
   # On Ubuntu
   ps aux | grep node
   
   # If not running, restart
   node server.js
   ```

---

### Problem 4: Browser Shows "Cannot Reach Server"

**Symptoms:**
```
This site can't be reached
192.168.10.50 refused to connect
```

**Solutions:**

1. **Verify Ubuntu IP address:**
   ```bash
   # On Ubuntu
   hostname -I
   ```
   Make sure you're using correct IP

2. **Check if server is running:**
   ```bash
   # On Ubuntu
   ps aux | grep node
   ```

3. **Check firewall on Ubuntu:**
   ```bash
   # On Ubuntu
   sudo ufw status
   sudo ufw allow 3001/tcp
   sudo ufw reload
   ```

4. **Check Windows firewall:**
   - Open Windows Defender Firewall
   - Click "Allow an app through firewall"
   - Make sure browser is allowed

5. **Try with IP instead of hostname:**
   - Use: `http://192.168.10.50:3001`
   - Not: `http://ubuntu-server:3001`

---

## 🔧 Advanced Troubleshooting

### Check Network Route

```cmd
route print
```

Look for routes to 192.168.10.0 subnet. Should show gateway.

### Check DNS

```cmd
nslookup 192.168.10.50
```

### Flush DNS Cache

```cmd
ipconfig /flushdns
```

### Reset Network Stack

```cmd
ipconfig /release
ipconfig /renew
```

### Check Windows Firewall

```cmd
netsh advfirewall show allprofiles
```

---

## 📋 Complete Checklist

- [ ] Ubuntu IP address identified (e.g., 192.168.10.50)
- [ ] Windows IP address identified (e.g., 192.168.20.100)
- [ ] Ping test successful: `ping 192.168.10.50`
- [ ] Telnet test successful: `telnet 192.168.10.50 3001`
- [ ] PowerShell test successful: `Invoke-WebRequest -Uri "http://192.168.10.50:3001"`
- [ ] Browser access working: `http://192.168.10.50:3001`
- [ ] Can see HR Training System homepage
- [ ] Can navigate to different pages
- [ ] Can interact with forms

---

## 🚀 Quick Test Commands

Copy and paste these commands in Windows Command Prompt:

```cmd
REM Get your IP
ipconfig

REM Ping Ubuntu (replace with actual Ubuntu IP)
ping 192.168.10.50

REM Test port (replace with actual Ubuntu IP)
telnet 192.168.10.50 3001

REM Test HTTP (replace with actual Ubuntu IP)
powershell -Command "Invoke-WebRequest -Uri 'http://192.168.10.50:3001' -UseBasicParsing"
```

---

## 📞 If Still Not Working

1. **Verify Ubuntu server is running:**
   ```bash
   # On Ubuntu
   ps aux | grep node
   ```

2. **Check Ubuntu firewall:**
   ```bash
   # On Ubuntu
   sudo ufw status
   sudo ufw allow 3001/tcp
   ```

3. **Check router settings:**
   - Access router admin panel
   - Verify inter-subnet routing enabled
   - Check firewall rules

4. **Try different network:**
   - Connect both machines to same subnet temporarily
   - If it works, issue is with router/network config
   - If it doesn't work, issue is with server/firewall

5. **Contact network administrator:**
   - If your network is managed by IT
   - Ask them to enable inter-subnet routing
   - Ask them to allow port 3001

---

## ✨ Success!

Once everything works, you should see:

1. **Ping succeeds** - Network connectivity confirmed
2. **Telnet succeeds** - Port 3001 is open
3. **Browser loads** - HR Training System is accessible
4. **Forms work** - Can interact with application

Enjoy your cross-subnet access! 🎉
