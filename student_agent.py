
import psutil
import socket
import requests
import time
import subprocess
import platform
from datetime import datetime

# ============================================================
# 🔧 CONFIGURATION - CHANGE THIS FOR YOUR FRIEND
# ============================================================
BACKEND_SERVER_IP = "10.154.216.252"   # ⬅️ CHANGE TO YOUR BACKEND IP
BACKEND_SERVER_PORT = 8001             # Backend port (usually 8000)

SEND_INTERVAL = 5   # Send data every 5 seconds
POLL_INTERVAL = 3   # Check for commands every 3 seconds

# ============================================================
# AUTO-CONFIGURATION (Don't change below)
# ============================================================
API_URL = f"http://{BACKEND_SERVER_IP}:{BACKEND_SERVER_PORT}/activity"
COMMANDS_URL = f"http://{BACKEND_SERVER_IP}:{BACKEND_SERVER_PORT}/commands"
STUDENT_ID = socket.gethostname()  # Automatically uses this computer's name


# ----------------------------------------------------------
# Get active network destinations (IP + domain)
# ----------------------------------------------------------
def get_active_destinations():
    """
    Captures all active network connections and resolves domains.
    Returns list of destinations with IP, port, and domain name.
    """
    destinations = []
    seen_domains = set()  # Avoid duplicates

    try:
        connections = psutil.net_connections(kind='inet')

        for conn in connections:
            if conn.raddr:  # remote address exists
                ip = conn.raddr.ip
                port = conn.raddr.port

                # Try reverse DNS lookup (domain)
                try:
                    domain = socket.gethostbyaddr(ip)[0]
                except:
                    domain = None  # if DNS fails, only IP is sent

                # Add to list if domain is new
                if domain and domain not in seen_domains:
                    destinations.append({
                        "ip": ip,
                        "port": port,
                        "domain": domain
                    })
                    seen_domains.add(domain)
                elif not domain:
                    # Include IP-only connections
                    destinations.append({
                        "ip": ip,
                        "port": port,
                        "domain": None
                    })

        return destinations[:50]  # Limit to 50 destinations to avoid huge payloads

    except Exception as e:
        print(f"❌ Error capturing destinations: {e}")
        return []


# ----------------------------------------------------------
# Collect system data (apps, network usage, websites)
# ----------------------------------------------------------
def collect_system_data():
    """
    Collects comprehensive system data:
    - Hostname
    - Network usage (bytes sent/received)
    - CPU usage percentage
    - Running processes
    - Active network destinations (websites)
    """
    try:
        net = psutil.net_io_counters()
        cpu_percent = psutil.cpu_percent(interval=0.5)
        memory_percent = psutil.virtual_memory().percent
        disk_percent = psutil.disk_usage('/').percent

        # Active connections count
        try:
            active_connections = len([c for c in psutil.net_connections(kind='inet') if c.raddr])
        except:
            active_connections = 0

        # Rates placeholders (could compute deltas over time)
        upload_rate_kbps = 0.0
        download_rate_kbps = 0.0

        processes = []
        for proc in psutil.process_iter(['name']):
            try:
                if proc.info["name"]:
                    processes.append(proc.info["name"])
            except:
                pass

        destinations = get_active_destinations()

        return {
            "hostname": STUDENT_ID,
            "timestamp": str(datetime.now()),
            "bytes_sent": net.bytes_sent,
            "bytes_recv": net.bytes_recv,
            "cpu_percent": cpu_percent,
            "memory_percent": memory_percent,
            "disk_percent": disk_percent,
            "active_connections": active_connections,
            "upload_rate_kbps": upload_rate_kbps,
            "download_rate_kbps": download_rate_kbps,
            "processes": list(set(processes[:25])),  # Unique processes, limit to 25
            "destinations": destinations
        }

    except Exception as e:
        print(f"❌ Error collecting system data: {e}")
        return None


# ----------------------------------------------------------
# Send data to admin backend
# ----------------------------------------------------------
def send_to_admin(data):
    """
    Sends collected system data to backend server.
    Backend logs this and makes it available to admin dashboard.
    """
    try:
        response = requests.post(API_URL, json=data, timeout=5)
        if response.status_code == 201:
            print(f"✅ [SENT] {datetime.now().strftime('%H:%M:%S')} - {len(data.get('destinations', []))} websites tracked")
        else:
            print(f"⚠️  [WARN] Server responded: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"❌ [ERROR] Could not reach admin server: {e}")


# ----------------------------------------------------------
# Poll backend for commands (e.g., block domain)
# ----------------------------------------------------------
def check_for_commands():
    """
    Polls backend for pending commands.
    Backend may instruct this agent to block websites, unblock, etc.
    
    Returns: List of command objects or empty list
    """
    try:
        response = requests.get(
            COMMANDS_URL,
            params={"student_id": STUDENT_ID},
            timeout=3
        )
        
        if response.status_code == 200:
            commands = response.json().get("commands", [])
            return commands
        else:
            return []
            
    except requests.exceptions.RequestException:
        # Silent fail - backend might be temporarily unreachable
        return []


# ----------------------------------------------------------
# Execute firewall block command locally
# ----------------------------------------------------------
def block_domain_local(domain, reason="Admin policy"):
    """
    Blocks a domain on THIS student machine using Windows Firewall.
    
    Process:
    1. Resolve domain to IP addresses
    2. Add firewall rule to block each IP
    
    Args:
        domain: Domain name to block (e.g., "youtube.com")
        reason: Reason for blocking
        
    Returns:
        bool: True if successful, False otherwise
    """
    if platform.system() != "Windows":
        print("❌ Firewall blocking only supported on Windows")
        return False
    
    print(f"🚫 Blocking domain: {domain} (Reason: {reason})")
    
    try:
        # Resolve domain to IP addresses
        ip_addresses = []
        addr_info = socket.getaddrinfo(domain, None)
        for info in addr_info:
            ip = info[4][0]
            if ip not in ip_addresses:
                ip_addresses.append(ip)
        
        if not ip_addresses:
            print(f"❌ Could not resolve {domain}")
            return False
        
        print(f"📡 Resolved {domain} to {len(ip_addresses)} IP(s)")
        
        # Block each IP
        blocked_count = 0
        for ip in ip_addresses:
            rule_name = f"Block_{domain}_{ip}"
            command = [
                'netsh', 'advfirewall', 'firewall', 'add', 'rule',
                f'name={rule_name}',
                'dir=out',
                'action=block',
                f'remoteip={ip}'
            ]
            
            try:
                result = subprocess.run(
                    command,
                    capture_output=True,
                    text=True,
                    timeout=10
                )
                
                if result.returncode == 0:
                    blocked_count += 1
                    print(f"  ✅ Blocked IP: {ip}")
                else:
                    error = result.stderr.strip()
                    if "access is denied" in error.lower() or "elevation" in error.lower():
                        print("❌ Administrator privileges required! Run as Admin.")
                        return False
                    print(f"  ⚠️  Failed to block {ip}: {error}")
                    
            except subprocess.TimeoutExpired:
                print(f"  ⏱️  Timeout blocking {ip}")
        
        if blocked_count > 0:
            print(f"✅ Successfully blocked {domain} ({blocked_count}/{len(ip_addresses)} IPs)")
            return True
        else:
            print(f"❌ Failed to block {domain}")
            return False
            
    except Exception as e:
        print(f"❌ Error blocking {domain}: {e}")
        return False


# ----------------------------------------------------------
# Unblock domain
# ----------------------------------------------------------
def unblock_domain_local(domain):
    """
    Removes firewall rules blocking a domain.
    
    Args:
        domain: Domain name to unblock
    """
    if platform.system() != "Windows":
        print("❌ Firewall management only supported on Windows")
        return False
    
    print(f"✅ Unblocking domain: {domain}")
    
    try:
        # List all rules and delete matching ones
        list_command = 'netsh advfirewall firewall show rule name=all'
        result = subprocess.run(list_command, capture_output=True, text=True, shell=True)
        
        # Find rules containing the domain name
        lines = result.stdout.split('\n')
        rules_to_delete = []
        
        for i, line in enumerate(lines):
            if 'Rule Name:' in line and domain in line:
                rule_name = line.split('Rule Name:')[1].strip()
                rules_to_delete.append(rule_name)
        
        # Delete each matching rule
        for rule_name in rules_to_delete:
            delete_command = f'netsh advfirewall firewall delete rule name="{rule_name}"'
            subprocess.run(delete_command, shell=True, capture_output=True)
            print(f"  🗑️  Removed rule: {rule_name}")
        
        if rules_to_delete:
            print(f"✅ Unblocked {domain} ({len(rules_to_delete)} rules removed)")
            return True
        else:
            print(f"⚠️  No blocking rules found for {domain}")
            return False
            
    except Exception as e:
        print(f"❌ Error unblocking {domain}: {e}")
        return False


# ----------------------------------------------------------
# Process commands from backend
# ----------------------------------------------------------
def execute_command(command):
    """
    Executes a command received from backend.
    
    Command formats:
    {
        "action": "BLOCK_DOMAIN",
        "domain": "youtube.com",
        "reason": "Policy violation"
    }
    """
    action = command.get("action")
    
    if action == "BLOCK_DOMAIN":
        domain = command.get("domain")
        reason = command.get("reason", "Admin policy")
        if domain:
            block_domain_local(domain, reason)
    
    elif action == "UNBLOCK_DOMAIN":
        domain = command.get("domain")
        if domain:
            unblock_domain_local(domain)
    
    elif action == "PING":
        print("🏓 PING received from admin")
    
    else:
        print(f"⚠️  Unknown command: {action}")


# ----------------------------------------------------------
# MAIN LOOP
# ----------------------------------------------------------
def main():
    print("=" * 60)
    print("🚀 STUDENT AGENT STARTED (Member 2)")
    print("=" * 60)
    print(f"📌 Student ID: {STUDENT_ID}")
    print(f"📡 Backend Server: {BACKEND_SERVER_IP}:{BACKEND_SERVER_PORT}")
    print(f"⏱️  Data Send Interval: {SEND_INTERVAL}s")
    print(f"⏱️  Command Poll Interval: {POLL_INTERVAL}s")
    print()
    print("🔍 Monitoring:")
    print("   ✅ Network connections (websites, IPs)")
    print("   ✅ Running processes")
    print("   ✅ Bandwidth usage")
    print("   ✅ Remote commands from admin")
    print()
    
    if platform.system() == "Windows":
        print("⚠️  NOTE: Run as Administrator for firewall management")
    else:
        print("⚠️  WARNING: Firewall blocking requires Windows OS")
    
    print("=" * 60)
    print()

    last_send_time = 0
    last_poll_time = 0

    while True:
        current_time = time.time()
        
        # Send activity data every SEND_INTERVAL seconds
        if current_time - last_send_time >= SEND_INTERVAL:
            payload = collect_system_data()
            if payload:
                send_to_admin(payload)
            last_send_time = current_time
        
        # Poll for commands every POLL_INTERVAL seconds
        if current_time - last_poll_time >= POLL_INTERVAL:
            commands = check_for_commands()
            if commands:
                print(f"\n📥 Received {len(commands)} command(s) from admin:")
                for cmd in commands:
                    execute_command(cmd)
                print()
            last_poll_time = current_time
        
        # Sleep briefly to avoid busy waiting
        time.sleep(0.5)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⏹️  Student Agent stopped by user")
    except Exception as e:
        print(f"\n\n❌ Fatal error: {e}")
