
import psutil
import socket
import requests
import time
import subprocess
import platform
from datetime import datetime

# ============================================================
# 🔧 CHANGE THIS LINE - Put your backend server IP here
# =======================================================gi=====
BACKEND_SERVER_IP = "10.70.248.252"   # ⬅️ CHANGE THIS
BACKEND_SERVER_PORT = 8000

# ============================================================
# Don't change anything below this line
# ============================================================
SEND_INTERVAL = 5
POLL_INTERVAL = 3
API_URL = f"http://{BACKEND_SERVER_IP}:{BACKEND_SERVER_PORT}/activity"
COMMANDS_URL = f"http://{BACKEND_SERVER_IP}:{BACKEND_SERVER_PORT}/commands"
STUDENT_ID = socket.gethostname()


def get_active_destinations():
    """Captures active network connections and resolves domains."""
    destinations = []
    seen_domains = set()
    
    try:
        connections = psutil.net_connections(kind='inet')
        for conn in connections:
            if conn.raddr:
                ip = conn.raddr.ip
                port = conn.raddr.port
                
                try:
                    domain = socket.gethostbyaddr(ip)[0]
                except:
                    domain = None
                
                if domain and domain not in seen_domains:
                    destinations.append({"ip": ip, "port": port, "domain": domain})
                    seen_domains.add(domain)
                elif not domain:
                    destinations.append({"ip": ip, "port": port, "domain": None})
        
        return destinations[:50]
    except Exception as e:
        print(f"❌ Error capturing destinations: {e}")
        return []


def collect_system_data():
    """Collects system data: hostname, network, processes, websites."""
    try:
        net = psutil.net_io_counters()
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
            "processes": list(set(processes[:25])),
            "destinations": destinations
        }
    except Exception as e:
        print(f"❌ Error collecting data: {e}")
        return None


def send_to_admin(data):
    """Sends collected data to backend."""
    try:
        response = requests.post(API_URL, json=data, timeout=5)
        if response.status_code == 201:
            print(f"✅ [SENT] {datetime.now().strftime('%H:%M:%S')} - {len(data.get('destinations', []))} websites tracked")
        else:
            print(f"⚠️  [WARN] Server responded: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"❌ [ERROR] Could not reach admin server: {e}")


def check_for_commands():
    """Polls backend for pending commands."""
    try:
        response = requests.get(COMMANDS_URL, params={"student_id": STUDENT_ID}, timeout=3)
        if response.status_code == 200:
            return response.json().get("commands", [])
        return []
    except:
        return []


def block_domain_local(domain, reason="Admin policy"):
    """Blocks a domain locally using Windows Firewall."""
    if platform.system() != "Windows":
        print("❌ Firewall blocking only supported on Windows")
        return False
    
    print(f"🚫 Blocking domain: {domain} (Reason: {reason})")
    
    try:
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
        
        blocked_count = 0
        for ip in ip_addresses:
            rule_name = f"Block_{domain}_{ip}"
            command = [
                'netsh', 'advfirewall', 'firewall', 'add', 'rule',
                f'name={rule_name}', 'dir=out', 'action=block', f'remoteip={ip}'
            ]
            
            try:
                result = subprocess.run(command, capture_output=True, text=True, timeout=10)
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


def unblock_domain_local(domain):
    """Removes firewall rules blocking a domain."""
    if platform.system() != "Windows":
        print("❌ Firewall management only supported on Windows")
        return False
    
    print(f"✅ Unblocking domain: {domain}")
    
    try:
        list_command = 'netsh advfirewall firewall show rule name=all'
        result = subprocess.run(list_command, capture_output=True, text=True, shell=True)
        
        lines = result.stdout.split('\n')
        rules_to_delete = []
        
        for line in lines:
            if 'Rule Name:' in line and domain in line:
                rule_name = line.split('Rule Name:')[1].strip()
                rules_to_delete.append(rule_name)
        
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


def execute_command(command):
    """Executes commands from backend."""
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


def main():
    """Main loop."""
    print("=" * 60)
    print("🚀 STUDENT AGENT STARTED")
    print("=" * 60)
    print(f"📌 Student ID: {STUDENT_ID}")
    print(f"📡 Backend Server: {BACKEND_SERVER_IP}:{BACKEND_SERVER_PORT}")
    print(f"⏱️  Data: Every {SEND_INTERVAL}s | Commands: Every {POLL_INTERVAL}s")
    print()
    print("🔍 Monitoring: websites, processes, network usage")
    print("🎯 Remote control: block/unblock websites")
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
        
        # Send activity data
        if current_time - last_send_time >= SEND_INTERVAL:
            payload = collect_system_data()
            if payload:
                send_to_admin(payload)
            last_send_time = current_time
        
        # Poll for commands
        if current_time - last_poll_time >= POLL_INTERVAL:
            commands = check_for_commands()
            if commands:
                print(f"\n📥 Received {len(commands)} command(s) from admin:")
                for cmd in commands:
                    execute_command(cmd)
                print()
            last_poll_time = current_time
        
        time.sleep(0.5)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⏹️  Student Agent stopped by user")
    except Exception as e:
        print(f"\n\n❌ Fatal error: {e}")
