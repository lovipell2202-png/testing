# Network Setup - Quick Reference Card

## 🎯 Goal
Access Node.js app on Ubuntu (192.168.10.x) from Windows (192.168.20.x)

---

## ⚡ Quick Setup (5 Minutes)

### On Ubuntu Server:

```bash
# 1. Verify server is running
ps aux | grep node

# 2. Check port 3001 is listening
sudo netstat -tlnp | grep 3001

# 3. Allow firewall
sudo ufw allow 3001/tcp
sudo ufw reload

# 4. Get your IP
hostname -I
```

### On Windows Machine:

```cmd
# 1. Get your IP
ipconfig

# 2. Ping Ubuntu (replace IP)
ping 192.168.10.50

# 3. Test port (replace IP)
telnet 192.168.10.50 3001

# 4. Open browser
http://192.168.10.50:3001
```

---

## 📋 Checklist

| Step | Ubuntu | Windows | Status |
|------|--------|---------|--------|
| 1 | Server running | - | ✓ |
| 2 | Port 3001 listening | - | ✓ |
| 3 | Firewall allows 3001 | - | ✓ |
| 4 | Get Ubuntu IP | Get Windows IP | ✓ |
| 5 | - | Ping Ubuntu | ✓ |
| 6 | - | Telnet port 3001 | ✓ |
| 7 | - | Open browser | ✓ |

---

## 🔧 Common Commands

### Ubuntu
```bash
# Start server
node server.js

# Check if running
ps aux | grep node

# Check port
sudo netstat -tlnp | grep 3001

# Allow firewall
sudo ufw allow 3001/tcp

# Get IP
hostname -I

# Restart server
pkill -f "node server.js"
node server.js
```

### Windows
```cmd
# Get IP
ipconfig

# Ping
ping 192.168.10.50

# Telnet
telnet 192.168.10.50 3001

# Test HTTP
curl http://192.168.10.50:3001

# PowerShell test
Invoke-WebRequest -Uri "http://192.168.10.50:3001"
```

---

## ❌ Quick Fixes

| Problem | Solution |
|---------|----------|
| Server not running | `node server.js` |
| Port not listening | Restart server |
| Firewall blocking | `sudo ufw allow 3001/tcp` |
| Ping fails | Check router routing |
| Telnet fails | Check firewall |
| Browser fails | Check server logs |

---

## 📊 Network Diagram

```
┌─────────────────────────────────────────┐
│         ROUTER (192.168.1.1)            │
│  Connects 10.x and 20.x subnets         │
└─────────────────────────────────────────┘
         ↓                        ↓
    Ubuntu 10.x              Windows 20.x
    192.168.10.50            192.168.20.100
    Port 3001                Browser
    Node.js App              http://192.168.10.50:3001
```

---

## 🧪 Test Sequence

1. **Ubuntu**: `ps aux | grep node` → Server running?
2. **Ubuntu**: `sudo netstat -tlnp | grep 3001` → Port listening?
3. **Ubuntu**: `sudo ufw status` → Firewall allows 3001?
4. **Windows**: `ipconfig` → Get Windows IP
5. **Windows**: `ping 192.168.10.50` → Network connected?
6. **Windows**: `telnet 192.168.10.50 3001` → Port open?
7. **Windows**: Open browser → `http://192.168.10.50:3001`

---

## 📞 Emergency Restart

If everything fails, restart everything:

### Ubuntu:
```bash
# Stop server
pkill -f "node server.js"

# Reset firewall
sudo ufw reset
sudo ufw enable
sudo ufw allow 22/tcp
sudo ufw allow 3001/tcp
sudo ufw reload

# Start server
node server.js
```

### Windows:
```cmd
# Flush DNS
ipconfig /flushdns

# Renew IP
ipconfig /release
ipconfig /renew

# Restart browser
```

---

## 🎯 Success Indicators

✅ Ping succeeds (network connected)
✅ Telnet succeeds (port open)
✅ Browser loads (server responding)
✅ Forms work (application functional)

---

## 📚 Full Guides

- **NETWORK_SETUP_GUIDE.md** - Complete setup instructions
- **WINDOWS_TROUBLESHOOTING.md** - Windows-specific issues
- **network-troubleshoot.sh** - Ubuntu diagnostic script

---

## 🚀 Access URL

```
http://192.168.10.50:3001
```

Replace `192.168.10.50` with your actual Ubuntu IP address!

---

## 💡 Tips

- **Bookmark the URL** for quick access
- **Test from multiple browsers** if one fails
- **Check server logs** for errors
- **Restart router** if network issues persist
- **Contact IT** if router settings need changes

---

## ✨ You're All Set!

Your HR Training System is now accessible from Windows! 🎉

Questions? Check the full guides or run the troubleshooting script.
