# 🔒 Blocking & Security Guide

## How Blocking Works in This System

### Overview

This system provides **TWO types of blocking/monitoring**:

1. **Website/Domain/IP Blocking** - Blocks network access
2. **Process Monitoring** - Detects and alerts on unauthorized applications

---

## 🌐 Website/Domain/IP Blocking

### What Gets Blocked?

**ANSWER: The IP address or domain name is blocked**, NOT the process.

When you block a domain or IP:

- Windows Firewall creates an outbound rule blocking that specific IP or resolving that domain
- **ALL processes** trying to connect to that IP/domain will be blocked system-wide
- This affects network traffic, not application execution

### How It Works

```
User visits blocked-site.com
  ↓
Student Agent captures: {domain: "blocked-site.com", ip: "1.2.3.4", port: 80}
  ↓
Admin clicks "Block" in Dashboard
  ↓
Backend stores command in database (BLOCK_DOMAIN)
  ↓
Student Agent polls for commands every 3 seconds
  ↓
Agent executes: netsh advfirewall firewall add rule name="Block blocked-site.com" dir=out action=block remoteip=1.2.3.4
  ↓
Windows Firewall blocks ALL traffic to that IP
```

### Example: ADC1.ssn.in (10.101.1.51:53)

**Question**: Why does blocking this affect WiFi access?

**Answer**: Port 53 is DNS (Domain Name System). This IP is likely your network's DNS server or gateway.

```
ADC1.ssn.in
├── Domain: ADC1.ssn.in
├── IP: 10.101.1.51
└── Port: 53 (DNS)
```

**When you block this:**

- ✅ Blocks the IP address `10.101.1.51`
- ⚠️ This is your DNS server - computers can't resolve domain names
- ❌ Result: No internet access (can't resolve google.com, etc.)

**⚠️ WARNING**: Do NOT block:

- DNS servers (port 53)
- Default gateways (typically 192.168.x.1 or 10.x.x.1)
- DHCP servers (port 67/68)
- Your router's IP address

### Safe Blocking Examples

✅ Safe to block:

- Social media: `facebook.com`, `instagram.com`
- Gaming sites: `steam.com`, `epicgames.com`
- Streaming: `netflix.com`, `youtube.com`
- Torrent trackers
- Proxy/VPN services

### Unblocking

To unblock a domain/IP:

1. Go to **Endpoints** page
2. Expand the student row
3. See "Currently Blocked" section
4. Click **Unblock** button next to the domain

---

## 🖥️ Process Monitoring (NOT Blocking)

### What Happens?

**Processes are NOT blocked** - they are only **detected and reported**.

When a blocked process is detected:

```
Student runs "torrent.exe"
  ↓
Agent sends process list to backend
  ↓
Backend detects "torrent" keyword in process name
  ↓
Alert created: "Blocked application detected: torrent.exe"
  ↓
Appears in Security Alerts page
```

### Blocked Keywords (Configurable in config.py)

Default blocked processes:

- **torrent** - BitTorrent clients
- **proxy** - Proxy software
- **nmap** - Network scanning
- **wireshark** - Packet sniffing
- **metasploit** - Penetration testing
- **cheat** - Game cheats
- **hack** - Hacking tools

### Why Only Alert, Not Block?

1. **Legitimate uses**: Some tools (like Wireshark) have legitimate educational purposes
2. **Admin decision**: Alerts allow admins to investigate before taking action
3. **Flexibility**: Admins can manually intervene on a case-by-case basis

### Future Enhancement: Process Blocking

If you want to ACTUALLY block processes, you would need to add:

```python
# In student agent - add process termination
if process_name in blocked_keywords:
    subprocess.run(['taskkill', '/F', '/IM', process_name])
```

⚠️ **Warning**: Forcefully killing processes can cause data loss or system instability.

---

## 📊 Real-Time Monitoring Features

### 1. CPU Usage Monitoring

- Collects real-time CPU percentage from student machines
- Displays in Dashboard with live chart
- Alerts when CPU > 90% (potential mining or resource abuse)

### 2. Network Destinations

Shows EXACT connections with:

- **Domain name** (if DNS resolves)
- **IP address** (raw connection endpoint)
- **Port number** (service type)

Example: `google.com (142.250.80.46:443)`

- Domain: google.com
- IP: 142.250.80.46
- Port: 443 (HTTPS)

### 3. Alert Types (Enhanced)

Now detects:

1. ⚠️ **Blocked processes** (unauthorized apps)
2. 📊 **Bandwidth exceeded** (over 500 MB default)
3. 🌐 **Suspicious domains** (torrent, proxy, vpn keywords in domain)
4. 🔗 **Excessive connections** (more than 50 concurrent connections)
5. 💻 **High CPU usage** (over 90%)

---

## 🔧 Configuration

### Backend Settings (`Backend/config.py`)

```python
# Bandwidth threshold (MB)
BANDWIDTH_THRESHOLD_MB = 500

# Blocked process keywords
BLOCKED_KEYWORDS = "torrent,proxy,nmap,wireshark,metasploit"
```

### Policy Management (`Backend/policies.json`)

```json
{
  "blocked_domains": ["facebook.com", "youtube.com", "torrentsite.com"],
  "allowed_domains": ["google.com", "github.com"]
}
```

---

## 🎯 Best Practices

### Network Blocking

1. **Test first**: Block on one machine before applying campus-wide
2. **Check dependencies**: Ensure site isn't required for coursework
3. **Document reasons**: Keep track of why each site is blocked
4. **Review regularly**: Unblock when policies change

### Process Monitoring

1. **Investigate alerts**: Don't assume all blocked processes are malicious
2. **Talk to students**: Some may have legitimate needs
3. **Update keywords**: Add new threats as they emerge
4. **Balance security and usability**: Over-blocking reduces productivity

### DNS/Gateway Safety

⚠️ **NEVER block**:

- Your DNS server
- Default gateway
- DHCP server
- Network infrastructure IPs

### Unblocking Procedure

If you accidentally blocked critical infrastructure:

1. Go to **Network Health** → **Firewall Rules**
2. Click **Unblock** next to the problematic rule
3. Or use PowerShell: `netsh advfirewall firewall delete rule name="[RULE_NAME]"`

---

## 🐛 Troubleshooting

### "Student has no internet after blocking"

- Check if you blocked DNS (port 53) or gateway
- Unblock the IP immediately
- Review blocked IPs in Endpoints page

### "Block doesn't work"

- Ensure backend is running as **Administrator**
- Check Windows Firewall is enabled
- Verify student agent is running
- Check backend logs for errors

### "Process still running after block"

- Processes are NOT killed, only alerted
- To actually block: modify student agent (see above)
- Or manually terminate on student machine

---

## 📞 Summary of Your Questions

**Q1: Is it the IP or the process that's blocked?**
**A**: The **IP/domain is blocked** (network level), NOT the process. Processes are only monitored and alerted.

**Q2: Why does blocking ADC1.ssn.in (10.101.1.51:53) block WiFi?**
**A**: Port 53 is DNS. You're blocking your DNS server, which breaks name resolution and internet access. Don't block DNS servers!

**Q3: Can I block both websites and processes?**
**A**:

- **Websites**: ✅ Yes, fully supported via Windows Firewall
- **Processes**: ⚠️ Currently alert-only. To actually block processes, you need to enhance the student agent with process termination code.

---

## 🚀 What's New (Latest Updates)

### Backend Enhancements

- ✅ Multi-violation detection (processes, bandwidth, domains, CPU, connections)
- ✅ Suspicious domain detection
- ✅ CPU usage monitoring
- ✅ Enhanced alert severity levels

### Frontend Enhancements

- ✅ Real-time CPU usage chart in Dashboard
- ✅ Block/Unblock buttons for domains in Endpoints page
- ✅ Network destinations table shows Domain + IP + Port
- ✅ Security Alerts page cleaned up (removed Actions column)
- ✅ Better visual feedback for blocked domains
- ✅ Warning messages for critical infrastructure

### Student Agent

- ✅ CPU monitoring added
- ✅ Enhanced destination tracking
- ✅ Remote block/unblock commands

---

**Need Help?**

- Check `Backend/QUICK_REFERENCE.md` for API details
- See `Backend/ARCHITECTURE.md` for system design
- Review backend logs in PowerShell for debugging
