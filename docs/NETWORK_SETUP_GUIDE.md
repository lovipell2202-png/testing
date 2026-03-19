# Cross-Subnet Network Access Guide
## Ubuntu Server (10.x subnet) ↔ Windows Client (20.x subnet)

This guide helps you access your Node.js application running on Ubuntu from a Windows machine on a different subnet.

---

## 📋 Network Setup Overview

```
┌─────────────────────────────────────────────────────────┐
│                    ROUTER/GATEWAY                        │
│              (Connects 10.x and 20.x subnets)           │
└─────────────────────────────────────────────────────────┘
           ↓                                    ↓
    ┌──────────────┐                    ┌──────────────┐
    │  Ubuntu 10.x │                    │ Windows 20.x │
    │  Port 3001   │◄──────────────────►│  Browser     │
    │  (Server)    │                    │  (Client)    │
    └──────────────┘                    └──────────────┘
```

---

## ✅ Step 1: Configure Node.js Server (Ubuntu)

### 1.1 Update server.js to Listen on All Interfaces

Your server.js has been updated to listen on `0.0.0.0`:

```javascript
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running at http://0.0.0.0:${PORT}`);
  console.log(`🌐 Accessible from other machines at: http://<your-ubuntu-ip>:${PORT}`);
});
```

### 1.2 Restart Node.js Server

```bash
# Stop the current server
pkill -f "node server.js"

# Or if using PM2
pm2 restart server

# Start the server again
node server.js
```

You should see:
```
🚀 Server running at http://0.0.0.0:3001
🌐 Accessible from other machines at: http://<your-ubuntu-ip>:3001
```

### 1.3 Verify Server is Listening

```bash
# Check if port 3001 is listening on all interfaces
sudo netstat -tlnp | grep 3001

# Or using ss command
sudo ss -tlnp | grep 3001
```

Expected output:
```
tcp  0  0  0.0.0.0:3001  0.0.0.0:*  LISTEN  12345/node
```

---

## 🔥 Step 2: Configure Ubuntu Firewall (UFW)

### 2.1 Check UFW Status

```bash
sudo ufw status
```

Output will show:
- `Status: active` - Firewall is enabled
- `Status: inactive` - Firewall is disabled

### 2.2 Enable UFW (if not already enabled)

```bash
sudo ufw enable
```

### 2.3 Allow Port 3001

```bash
# Allow port 3001 from any source
sudo ufw allow 3001/tcp

# Or allow only from specific subnet (more secure)
sudo ufw allow from 192.168.20.0/24 to any port 3001
```

### 2.4 Verify Firewall Rules

```bash
sudo ufw status numbered
```

You should see:
```
     To                         Action      From
     --                         ------      ----
[ 1] 3001/tcp                   ALLOW       Anywhere
[ 2] 3001/tcp (v6)              ALLOW       Anywhere (v6)
```

### 2.5 Reload Firewall

```bash
sudo ufw reload
```

---

## 🔍 Step 3: Find Your Ubuntu Server IP Address

### 3.1 Get Ubuntu IP Address

```bash
# Method 1: Using hostname
hostname -I

# Method 2: Using ifconfig
ifconfig

# Method 3: Using ip command
ip addr show

# Method 4: Using nmcli
nmcli device show
```

Look for an IP address in the format: `xxx.xxx.10.xxx`

Example output:
```
192.168.10.50
```

**Note this IP address - you'll need it to access from Windows!**

---

## 🧪 Step 4: Test Connectivity (Ubuntu)

### 4.1 Test Local Connection

```bash
# Test from Ubuntu itself
curl http://localhost:3001

# Or
curl http://127.0.0.1:3001

# Or using your Ubuntu IP
curl http://192.168.10.50:3001
```

Expected response: HTML content or JSON data

### 4.2 Check Network Connectivity

```bash
# See all listening ports
sudo netstat -tlnp

# Or
sudo ss -tlnp
```

---

## 🪟 Step 5: Test from Windows Machine

### 5.1 Find Windows IP Address

Open Command Prompt and run:
```cmd
ipconfig
```

Look for IPv4 Address in the format: `xxx.xxx.20.xxx`

Example:
```
IPv4 Address. . . . . . . . . . : 192.168.20.100
```

### 5.2 Test Ping from Windows to Ubuntu

Open Command Prompt and run:
```cmd
ping 192.168.10.50
```

Expected output:
```
Pinging 192.168.10.50 with 32 bytes of data:
Reply from 192.168.10.50: bytes=32 time=5ms TTL=64
Reply from 192.168.10.50: bytes=32 time=4ms TTL=64
```

**If ping fails:**
- Check if both machines are on the same network
- Verify router allows communication between subnets
- Check Ubuntu firewall isn't blocking ICMP

### 5.3 Test Port Connectivity from Windows

Open Command Prompt and run:
```cmd
# Test if port 3001 is open
telnet 192.168.10.50 3001
```

Expected: Connection succeeds (blank screen)

**If connection fails:**
- Port 3001 is blocked by firewall
- Server isn't listening on that port
- Network doesn't allow communication between subnets

### 5.4 Test HTTP Request from Windows

Open Command Prompt and run:
```cmd
# Using curl (if installed)
curl http://192.168.10.50:3001

# Or using PowerShell
Invoke-WebRequest -Uri "http://192.168.10.50:3001"
```

---

## 🌐 Step 6: Access Web Application from Windows

### 6.1 Open Browser on Windows

1. Open any web browser (Chrome, Firefox, Edge, etc.)
2. Type in address bar:
```
http://192.168.10.50:3001
```

Replace `192.168.10.50` with your actual Ubuntu IP address.

### 6.2 Expected Result

You should see your HR Training Management System homepage!

---

## 🔧 Step 7: Router Configuration (If Needed)

### 7.1 Check Router Settings

If Windows still can't reach Ubuntu, check your router:

1. **Access Router Admin Panel**
   - Open browser: `http://192.168.1.1` or `http://192.168.0.1`
   - Login with admin credentials

2. **Check Subnet Routing**
   - Verify both subnets (10.x and 20.x) are configured
   - Ensure routing between subnets is enabled
   - Check if there are any firewall rules blocking inter-subnet traffic

3. **Enable Inter-Subnet Communication**
   - Look for "Routing" or "Inter-VLAN Routing" settings
   - Enable if disabled
   - Save and reboot router if needed

### 7.2 Common Router Issues

| Issue | Solution |
|-------|----------|
| Subnets isolated | Enable inter-VLAN routing in router |
| Firewall blocking | Disable inter-subnet firewall rules |
| DHCP issues | Ensure both subnets have DHCP enabled |
| Gateway issues | Verify default gateway is set correctly |

---

## ❌ Troubleshooting

### Problem: "Connection Refused" or "Cannot Connect"

**Check 1: Is server running?**
```bash
# On Ubuntu
ps aux | grep node
```

**Check 2: Is port 3001 listening?**
```bash
# On Ubuntu
sudo netstat -tlnp | grep 3001
```

**Check 3: Is firewall blocking?**
```bash
# On Ubuntu
sudo ufw status
sudo ufw allow 3001/tcp
```

**Check 4: Can you ping?**
```cmd
# On Windows
ping 192.168.10.50
```

---

### Problem: Ping Works but HTTP Fails

**Possible causes:**
1. Node.js server crashed
2. Port 3001 not listening
3. Firewall blocking TCP port 3001

**Solutions:**
```bash
# On Ubuntu - restart server
node server.js

# Check if listening
sudo netstat -tlnp | grep 3001

# Allow firewall
sudo ufw allow 3001/tcp
```

---

### Problem: Firewall Rules Not Working

**Reset and reconfigure:**
```bash
# On Ubuntu
sudo ufw reset
sudo ufw enable
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 3001/tcp  # Node.js
sudo ufw reload
```

---

### Problem: Router Not Routing Between Subnets

**Check router configuration:**
1. Access router admin panel
2. Look for "Routing" or "Static Routes"
3. Verify routes exist for both subnets
4. Check if inter-VLAN routing is enabled
5. Reboot router if needed

---

## 📊 Complete Checklist

- [ ] Node.js server updated to listen on `0.0.0.0`
- [ ] Server restarted and running
- [ ] Port 3001 verified listening with `netstat`
- [ ] UFW firewall enabled
- [ ] Port 3001 allowed in UFW: `sudo ufw allow 3001/tcp`
- [ ] Ubuntu IP address identified (e.g., 192.168.10.50)
- [ ] Windows IP address identified (e.g., 192.168.20.100)
- [ ] Ping test successful from Windows to Ubuntu
- [ ] Telnet test successful: `telnet 192.168.10.50 3001`
- [ ] HTTP request successful: `curl http://192.168.10.50:3001`
- [ ] Web browser access working from Windows
- [ ] Router allows inter-subnet communication

---

## 🚀 Quick Reference Commands

### Ubuntu Commands
```bash
# Check server status
ps aux | grep node

# Check listening ports
sudo netstat -tlnp | grep 3001

# Get Ubuntu IP
hostname -I

# Allow firewall port
sudo ufw allow 3001/tcp

# Restart server
pkill -f "node server.js"
node server.js
```

### Windows Commands
```cmd
# Get Windows IP
ipconfig

# Ping Ubuntu
ping 192.168.10.50

# Test port connectivity
telnet 192.168.10.50 3001

# Test HTTP
curl http://192.168.10.50:3001
```

---

## 📞 Support

If you still have issues:

1. **Check Ubuntu logs:**
   ```bash
   journalctl -u node -n 50
   ```

2. **Check network connectivity:**
   ```bash
   tracert 192.168.10.50  # Windows
   traceroute 192.168.10.50  # Ubuntu
   ```

3. **Verify firewall rules:**
   ```bash
   sudo ufw show added
   ```

4. **Test with different ports:**
   ```bash
   sudo ufw allow 8080/tcp
   # Then access http://192.168.10.50:8080
   ```

---

## ✨ Success!

Once everything is configured, you should be able to:
- Access your HR Training System from Windows
- Use all features (employees, training records, exams)
- Upload files and generate reports
- Print forms and evaluations

Enjoy your cross-subnet network setup! 🎉
