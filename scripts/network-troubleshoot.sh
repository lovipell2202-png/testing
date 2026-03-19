#!/bin/bash

# Network Troubleshooting Script for Ubuntu Server
# This script helps diagnose connectivity issues

echo "🔍 Network Troubleshooting Script"
echo "=================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ PASS${NC}: $2"
    else
        echo -e "${RED}❌ FAIL${NC}: $2"
    fi
}

# 1. Check if Node.js is running
echo "1️⃣  Checking if Node.js server is running..."
if pgrep -f "node server.js" > /dev/null; then
    print_status 0 "Node.js server is running"
else
    print_status 1 "Node.js server is NOT running"
    echo "   Start it with: node server.js"
fi
echo ""

# 2. Check if port 3001 is listening
echo "2️⃣  Checking if port 3001 is listening..."
if sudo netstat -tlnp 2>/dev/null | grep -q ":3001"; then
    print_status 0 "Port 3001 is listening"
    echo "   Details:"
    sudo netstat -tlnp 2>/dev/null | grep ":3001"
else
    print_status 1 "Port 3001 is NOT listening"
    echo "   Make sure server is running and listening on 0.0.0.0:3001"
fi
echo ""

# 3. Check UFW firewall status
echo "3️⃣  Checking UFW firewall status..."
if sudo ufw status | grep -q "Status: active"; then
    print_status 0 "UFW firewall is active"
    echo "   Firewall rules:"
    sudo ufw status | grep 3001
    if ! sudo ufw status | grep -q "3001"; then
        echo -e "   ${YELLOW}⚠️  Port 3001 is NOT in firewall rules!${NC}"
        echo "   Run: sudo ufw allow 3001/tcp"
    fi
else
    print_status 1 "UFW firewall is NOT active"
    echo "   Enable it with: sudo ufw enable"
fi
echo ""

# 4. Get Ubuntu IP address
echo "4️⃣  Getting Ubuntu IP address..."
UBUNTU_IP=$(hostname -I | awk '{print $1}')
if [ -n "$UBUNTU_IP" ]; then
    print_status 0 "Ubuntu IP address: $UBUNTU_IP"
else
    print_status 1 "Could not determine Ubuntu IP address"
fi
echo ""

# 5. Test local connection
echo "5️⃣  Testing local connection to server..."
if curl -s http://localhost:3001 > /dev/null 2>&1; then
    print_status 0 "Local connection successful"
else
    print_status 1 "Local connection failed"
    echo "   Try: curl http://localhost:3001"
fi
echo ""

# 6. Check network interfaces
echo "6️⃣  Network interfaces:"
echo "   Available interfaces:"
ip addr show | grep "inet " | grep -v "127.0.0.1"
echo ""

# 7. Check routing table
echo "7️⃣  Checking routing table..."
echo "   Routes:"
ip route show
echo ""

# 8. Check DNS resolution
echo "8️⃣  Checking DNS resolution..."
if command -v nslookup &> /dev/null; then
    nslookup localhost
else
    echo "   nslookup not available"
fi
echo ""

# 9. Summary
echo "📋 Summary:"
echo "=================================="
echo ""
echo "To access from Windows machine:"
echo "  1. Open browser on Windows"
echo "  2. Go to: http://$UBUNTU_IP:3001"
echo ""
echo "To test from Windows Command Prompt:"
echo "  ping $UBUNTU_IP"
echo "  telnet $UBUNTU_IP 3001"
echo "  curl http://$UBUNTU_IP:3001"
echo ""

# 10. Quick fixes
echo "🔧 Quick Fixes:"
echo "=================================="
echo ""
echo "If server is not running:"
echo "  node server.js"
echo ""
echo "If port 3001 is not in firewall:"
echo "  sudo ufw allow 3001/tcp"
echo "  sudo ufw reload"
echo ""
echo "If you need to restart everything:"
echo "  pkill -f 'node server.js'"
echo "  sudo ufw reload"
echo "  node server.js"
echo ""

echo "✨ Troubleshooting complete!"
