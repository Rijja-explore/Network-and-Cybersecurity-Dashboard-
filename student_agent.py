# import psutil
# import socket
# import requests
# import time
# import subprocess
# import platform
# import os
# import sqlite3
# import shutil
# import tempfile
# import re
# from datetime import datetime
# from urllib.parse import urlparse

# # ============================================================
# # 🔧 CONFIGURATION
# # ============================================================
# BACKEND_SERVER_IP   = "10.154.216.252"
# BACKEND_SERVER_PORT = 8000  # Updated to match backend default port

# SEND_INTERVAL = 3   # Send data every 3 seconds (FASTER for real-time alerts)
# POLL_INTERVAL = 2   # Check for commands every 2 seconds (FASTER for instant blocking)

# # ============================================================
# # AUTO-CONFIGURATION
# # ============================================================
# API_URL      = f"http://{BACKEND_SERVER_IP}:{BACKEND_SERVER_PORT}/activity"
# COMMANDS_URL = f"http://{BACKEND_SERVER_IP}:{BACKEND_SERVER_PORT}/commands"
# STUDENT_ID   = socket.gethostname()

# # ============================================================
# # STATE TRACKING FOR RATE CALCULATIONS
# # ============================================================
# _last_bytes_sent = 0
# _last_bytes_recv = 0
# _last_rate_check_time = time.time()

# # ============================================================
# # DNS CACHE  —  IP → website name (from Windows DNS resolver)
# # ============================================================
# _dns_cache = {}

# # Pre-compiled regex for detecting raw IPv4/IPv6 addresses
# _RAW_IP_RE = re.compile(r'^(\d{1,3}\.){3}\d{1,3}$|^[0-9a-fA-F:]+:[0-9a-fA-F:]+$')

# # CDN / infrastructure domains to filter out (not real user destinations)
# _NOISE_DOMAINS = {
#     # Browser internals
#     "", "localhost", "local", "internal", "newtab",
#     # Google infrastructure (CDN, telemetry — not direct user sites)
#     "1e100.net", "googleusercontent.com", "gstatic.com",
#     "googlevideo.com", "google-analytics.com", "googletagmanager.com",
#     "update.googleapis.com", "safebrowsing.googleapis.com",
#     "clients2.google.com", "clients.google.com", "ocsp.pki.goog",
#     "googleapis.com", "ssl.gstatic.com", "fonts.gstatic.com",
#     # Microsoft infrastructure / CDN
#     "live.net", "msecnd.net", "trafficmanager.net", "windows.net",
#     "windowsupdate.com", "msftconnecttest.com", "msftncsi.com",
#     "microsoft.com", "microsoftonline.com", "office.net",
#     # Facebook CDN (fbcdn = Facebook Content Delivery Network)
#     "fbcdn.net", "fbsbx.com", "facebook.net",
#     # Generic CDN / cert infra / telemetry
#     "akamaized.net", "akamai.net", "edgesuite.net", "edgekey.net",
#     "cloudfront.net", "fastly.net", "fastly.com",
#     "digicert.com", "sectigo.com", "letsencrypt.org",
#     "ocsp.usertrust.com", "crl.usertrust.com",
#     "cloudflare-dns.com",
#     # Apple CDN / telemetry
#     "icloud-content.com", "apple-dns.net", "mzstatic.com",
# }


# def refresh_dns_cache():
#     """
#     Reads Windows DNS resolver cache (ipconfig /displaydns).
#     Builds IP → clean domain name map.
#     This works because every DNS lookup the browser makes is cached here.
#     """
#     global _dns_cache
#     new_cache = {}

#     if platform.system() != "Windows":
#         return

#     try:
#         result = subprocess.run(
#             ["ipconfig", "/displaydns"],
#             capture_output=True, text=True, timeout=15,
#             encoding="utf-8", errors="ignore"
#         )
#         output = result.stdout
#         current_domain = None

#         for line in output.splitlines():
#             line = line.strip()

#             # Detect section header (bare domain name)
#             if (line and "." in line and " " not in line and
#                     not line.startswith("-") and
#                     not any(line.startswith(k) for k in
#                             ["Record", "Time", "Section", "Data", "TTL", "Answer"])):
#                 current_domain = line.lower().rstrip(".")

#             # IPv4 A record
#             if current_domain and "A (Host) Record" in line:
#                 ip = line.split(":")[-1].strip()
#                 if ip and _is_valid_ipv4(ip):
#                     new_cache[ip] = _root_domain(current_domain)

#             # IPv6 AAAA record
#             if current_domain and "AAAA" in line:
#                 ipv6 = line.split()[-1].strip()
#                 if ipv6 and ":" in ipv6:
#                     new_cache[ipv6] = _root_domain(current_domain)

#         _dns_cache = new_cache

#     except Exception:
#         pass


# def _is_valid_ipv4(s):
#     parts = s.split(".")
#     if len(parts) != 4:
#         return False
#     try:
#         return all(0 <= int(p) <= 255 for p in parts)
#     except ValueError:
#         return False


# def _root_domain(domain):
#     """
#     Strips subdomains → returns root domain.
#     "mail.google.com" → "google.com"
#     "edge-chat.facebook.com" → "facebook.com"
#     """
#     domain = domain.lower().rstrip(".")
#     parts  = domain.split(".")
#     if len(parts) > 2:
#         return ".".join(parts[-2:])
#     return domain


# def _ip_to_website(ip):
#     """
#     Converts IP → website name using:
#     1. DNS cache (most accurate — real domain names)
#     2. Reverse DNS fallback
#     3. Raw IP as last resort
#     """
#     if ip in _dns_cache:
#         return _dns_cache[ip]
#     try:
#         hostname = socket.gethostbyaddr(ip)[0]
#         return _root_domain(hostname)
#     except Exception:
#         pass
#     return ip


# # ============================================================
# # REAL WEBSITE DETECTION — from Chrome/Edge/Firefox history
# # ============================================================

# def _extract_urls_from_session_binary(filepath):
#     """
#     Reads Chrome/Edge binary session file (SNSS format) and extracts all URLs
#     by scanning for http/https strings embedded in the binary data.
#     This captures currently open tabs — even if never written to history yet.
#     """
#     sites = set()
#     try:
#         tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".snss")
#         tmp.close()
#         shutil.copy2(filepath, tmp.name)
#         with open(tmp.name, "rb") as f:
#             data = f.read()
#         os.unlink(tmp.name)
#         # Extract all readable URLs from binary blob
#         for m in re.finditer(rb'https?://[A-Za-z0-9\-._~:/?#\[\]@!$&\'()*+,;=%]{4,300}', data):
#             try:
#                 url = m.group(0).decode("utf-8", errors="ignore")
#                 parsed = urlparse(url)
#                 if parsed.hostname:
#                     sites.add(_root_domain(parsed.hostname))
#             except Exception:
#                 pass
#     except Exception:
#         pass
#     return sites


# def _get_chrome_open_tabs():
#     """
#     Reads currently open tabs from Chrome's session files (Current Tabs, Current Session).
#     Works even if the tab was just opened and not yet recorded in history.
#     """
#     sites = set()
#     username = os.environ.get("USERNAME", "")
#     base = os.path.join("C:\\Users", username, "AppData", "Local", "Google", "Chrome", "User Data")
#     if not os.path.exists(base):
#         return sites
#     # Check Default profile + numbered profiles (Profile 1, Profile 2, ...)
#     profiles = ["Default"] + [f"Profile {i}" for i in range(1, 6)]
#     session_files = ["Current Tabs", "Current Session", "Last Tabs", "Last Session"]
#     for profile in profiles:
#         for sf in session_files:
#             path = os.path.join(base, profile, sf)
#             if os.path.exists(path):
#                 sites.update(_extract_urls_from_session_binary(path))
#     return sites


# def _get_edge_open_tabs():
#     """
#     Reads currently open tabs from Microsoft Edge's session files.
#     """
#     sites = set()
#     username = os.environ.get("USERNAME", "")
#     base = os.path.join("C:\\Users", username, "AppData", "Local", "Microsoft", "Edge", "User Data")
#     if not os.path.exists(base):
#         return sites
#     profiles = ["Default"] + [f"Profile {i}" for i in range(1, 6)]
#     session_files = ["Current Tabs", "Current Session", "Last Tabs", "Last Session"]
#     for profile in profiles:
#         for sf in session_files:
#             path = os.path.join(base, profile, sf)
#             if os.path.exists(path):
#                 sites.update(_extract_urls_from_session_binary(path))
#     return sites


# def _get_chrome_sites():
#     """
#     Reads recently visited URLs from Chrome's SQLite history database.
#     Returns list of root domain names visited in the last 24 hours.
#     """
#     sites = set()
#     try:
#         username = os.environ.get("USERNAME", "")
#         chrome_history = os.path.join(
#             "C:\\Users", username,
#             "AppData", "Local", "Google", "Chrome",
#             "User Data", "Default", "History"
#         )

#         if not os.path.exists(chrome_history):
#             return sites

#         # Copy DB to temp file (Chrome locks the original)
#         tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".db")
#         tmp.close()
#         shutil.copy2(chrome_history, tmp.name)

#         conn = sqlite3.connect(tmp.name)
#         cursor = conn.cursor()

#         # Get URLs visited in the last 24 hours
#         # Chrome stores time as microseconds since 1601-01-01
#         one_day_ago = (int(time.time()) - 86400) * 1000000 + 11644473600000000
#         cursor.execute(
#             "SELECT url FROM urls WHERE last_visit_time > ? ORDER BY last_visit_time DESC LIMIT 200",
#             (one_day_ago,)
#         )

#         for row in cursor.fetchall():
#             url = row[0]
#             try:
#                 parsed = urlparse(url)
#                 if parsed.hostname:
#                     sites.add(_root_domain(parsed.hostname))
#             except Exception:
#                 pass

#         conn.close()
#         os.unlink(tmp.name)

#     except Exception:
#         pass

#     return sites


# def _get_edge_sites():
#     """
#     Reads recently visited URLs from Microsoft Edge's SQLite history database.
#     Returns list of root domain names visited in the last 24 hours.
#     """
#     sites = set()
#     try:
#         username = os.environ.get("USERNAME", "")
#         edge_history = os.path.join(
#             "C:\\Users", username,
#             "AppData", "Local", "Microsoft", "Edge",
#             "User Data", "Default", "History"
#         )

#         if not os.path.exists(edge_history):
#             return sites

#         tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".db")
#         tmp.close()
#         shutil.copy2(edge_history, tmp.name)

#         conn = sqlite3.connect(tmp.name)
#         cursor = conn.cursor()

#         one_day_ago = (int(time.time()) - 86400) * 1000000 + 11644473600000000
#         cursor.execute(
#             "SELECT url FROM urls WHERE last_visit_time > ? ORDER BY last_visit_time DESC LIMIT 200",
#             (one_day_ago,)
#         )

#         for row in cursor.fetchall():
#             url = row[0]
#             try:
#                 parsed = urlparse(url)
#                 if parsed.hostname:
#                     sites.add(_root_domain(parsed.hostname))
#             except Exception:
#                 pass

#         conn.close()
#         os.unlink(tmp.name)

#     except Exception:
#         pass

#     return sites


# def _get_firefox_sites():
#     """
#     Reads recently visited URLs from Firefox's SQLite places database.
#     Returns list of root domain names visited in the last 24 hours.
#     """
#     sites = set()
#     try:
#         username   = os.environ.get("USERNAME", "")
#         ff_base    = os.path.join("C:\\Users", username, "AppData", "Roaming", "Mozilla", "Firefox", "Profiles")

#         if not os.path.exists(ff_base):
#             return sites

#         # Find all Firefox profiles
#         for profile in os.listdir(ff_base):
#             places_db = os.path.join(ff_base, profile, "places.sqlite")
#             if not os.path.exists(places_db):
#                 continue

#             tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".db")
#             tmp.close()
#             shutil.copy2(places_db, tmp.name)

#             conn   = sqlite3.connect(tmp.name)
#             cursor = conn.cursor()

#             # Firefox stores time in microseconds since Unix epoch
#             one_day_ago_us = (int(time.time()) - 86400) * 1000000
#             cursor.execute(
#                 "SELECT url FROM moz_places WHERE last_visit_date > ? ORDER BY last_visit_date DESC LIMIT 200",
#                 (one_day_ago_us,)
#             )

#             for row in cursor.fetchall():
#                 url = row[0]
#                 try:
#                     parsed = urlparse(url)
#                     if parsed.hostname:
#                         sites.add(_root_domain(parsed.hostname))
#                 except Exception:
#                     pass

#             conn.close()
#             os.unlink(tmp.name)

#     except Exception:
#         pass

#     return sites


# def _get_sites_from_network_connections():
#     """
#     Falls back to active network connections + DNS cache lookup.
#     Returns set of website names currently connected to.
#     """
#     sites = set()
#     try:
#         connections = psutil.net_connections(kind='inet')
#         for conn in connections:
#             if not conn.raddr:
#                 continue
#             ip = conn.raddr.ip
#             if (ip.startswith("127.") or ip.startswith("::1") or
#                     ip.startswith("169.254") or ip == BACKEND_SERVER_IP):
#                 continue
#             website = _ip_to_website(ip)
#             if website and website != ip:   # Only add if resolved to a real name
#                 sites.add(website)
#             # Raw IPs (unresolvable) are intentionally skipped — they create noise
#     except Exception:
#         pass
#     return sites


# def _get_browser_recent_sites(minutes=30):
#     """
#     Reads Chrome + Edge History SQLite DB for pages visited in the last N minutes.
#     This returns ACTUAL page navigations (whatsapp.com, youtube.com, etc.)
#     not CDN/resource URLs like session binary scan.
#     """
#     sites = set()
#     username = os.environ.get("USERNAME", "")
#     cutoff = (int(time.time()) - minutes * 60) * 1000000 + 11644473600000000  # Chrome epoch

#     browser_paths = [
#         os.path.join("C:\\Users", username, "AppData", "Local", "Google", "Chrome",
#                      "User Data", "Default", "History"),
#         os.path.join("C:\\Users", username, "AppData", "Local", "Microsoft", "Edge",
#                      "User Data", "Default", "History"),
#     ]

#     for history_path in browser_paths:
#         if not os.path.exists(history_path):
#             continue
#         try:
#             tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".db")
#             tmp.close()
#             shutil.copy2(history_path, tmp.name)
#             conn = sqlite3.connect(tmp.name)
#             cursor = conn.cursor()
#             cursor.execute(
#                 "SELECT url FROM urls WHERE last_visit_time > ? ORDER BY last_visit_time DESC LIMIT 200",
#                 (cutoff,)
#             )
#             for row in cursor.fetchall():
#                 url = row[0]
#                 try:
#                     parsed = urlparse(url)
#                     if parsed.hostname:
#                         sites.add(_root_domain(parsed.hostname))
#                 except Exception:
#                     pass
#             conn.close()
#             os.unlink(tmp.name)
#         except Exception:
#             pass

#     return sites


# def _collect_open_tabs():
#     """
#     Returns a sorted list of currently-open / recently-visited browser tab domains.
#     Combines:
#       1. Chrome + Edge History DB (last 30 min) — actual page navigations only
#       2. Session binary scan (truly brand-new tabs not yet in history)
#     Filters out CDN infrastructure and noise domains.
#     """
#     tabs = set()
#     # History DB (most reliable — only records actual page visits)
#     tabs.update(_get_browser_recent_sites(minutes=30))
#     # Session binary scan (catches tabs opened in the last few seconds)
#     tabs.update(_get_chrome_open_tabs())
#     tabs.update(_get_edge_open_tabs())
#     # Remove all noise / CDN infrastructure domains
#     tabs -= _NOISE_DOMAINS
#     # Remove bare IPs
#     tabs = {t for t in tabs if t and not _RAW_IP_RE.match(t)}
#     return sorted(list(tabs))


# # ============================================================
# # COMBINE ALL SOURCES → unique list of active websites
# # ============================================================

# def get_active_destinations(cached_open_tabs=None):
#     """
#     Collects real websites from currently active sources only:
#       1. Chrome currently open tabs  (session binary scan — real-time)
#       2. Edge currently open tabs    (session binary scan — real-time)
#       3. Active network connections + DNS cache

#     cached_open_tabs: pass in already-collected open tab set to avoid re-reading session files.
#     Returns deduplicated list with website name + ip + port.
#     """
#     # Only currently open tabs — no history
#     all_sites = set()
#     if cached_open_tabs is not None:
#         all_sites.update(cached_open_tabs)
#     else:
#         all_sites.update(_get_chrome_open_tabs())
#         all_sites.update(_get_edge_open_tabs())

#     # Filter out noise / CDN domains
#     all_sites -= _NOISE_DOMAINS

#     # Build destination objects
#     # For browser-history sites we may not have a live IP — that's fine
#     destinations = []
#     seen         = set()

#     # First: network connections (have live IP + port) — only include if domain was resolved
#     try:
#         connections = psutil.net_connections(kind='inet')
#         for conn in connections:
#             if not conn.raddr:
#                 continue
#             ip      = conn.raddr.ip
#             port    = conn.raddr.port
#             if (ip.startswith("127.") or ip.startswith("::1") or
#                     ip.startswith("169.254") or ip == BACKEND_SERVER_IP):
#                 continue
#             website = _ip_to_website(ip)
#             if website == ip:  # Could not resolve to domain name — skip raw IPs
#                 continue
#             if website in seen:
#                 continue
#             seen.add(website)
#             destinations.append({
#                 "website": website,
#                 "domain":  website,
#                 "ip":      ip,
#                 "port":    port,
#                 "source":  "network"
#             })
#     except Exception:
#         pass

#     # Second: browser history + open tabs not already in list (skip bare IPs)
#     for site in sorted(all_sites):
#         if site in seen:
#             continue
#         if _RAW_IP_RE.match(site):  # Skip raw IPv4/IPv6 addresses
#             continue
#         seen.add(site)
#         destinations.append({
#             "website": site,
#             "domain":  site,
#             "ip":      "",
#             "port":    0,
#             "source":  "browser"
#         })

#     return destinations[:100]  # Increased from 50


# # ============================================================
# # COLLECT ALL SYSTEM DATA  (all original fields preserved)
# # ============================================================

# def collect_system_data():
#     """
#     Collects and returns full system snapshot:
#       - hostname, timestamp
#       - bytes_sent, bytes_recv
#       - upload_rate_kbps, download_rate_kbps
#       - cpu_percent, memory_percent, disk_percent
#       - active_connections (count)
#       - processes (list of running app names, up to 25 unique)
#       - destinations (real websites from browsers + network)
#     """
#     global _last_bytes_sent, _last_bytes_recv, _last_rate_check_time
    
#     try:
#         refresh_dns_cache()

#         net            = psutil.net_io_counters()
#         cpu_percent    = psutil.cpu_percent(interval=0.5)
#         memory_percent = psutil.virtual_memory().percent
#         disk_percent   = psutil.disk_usage('C:\\').percent if platform.system() == 'Windows' else psutil.disk_usage('/').percent
        
#         # Calculate upload/download rates in KB/s
#         current_time = time.time()
#         time_delta = max(current_time - _last_rate_check_time, 1)  # Avoid division by zero
        
#         bytes_sent_delta = max(net.bytes_sent - _last_bytes_sent, 0)
#         bytes_recv_delta = max(net.bytes_recv - _last_bytes_recv, 0)
        
#         upload_rate_kbps = (bytes_sent_delta / 1024) / time_delta if time_delta > 0 else 0.0
#         download_rate_kbps = (bytes_recv_delta / 1024) / time_delta if time_delta > 0 else 0.0
        
#         # Update tracking variables for next iteration
#         _last_bytes_sent = net.bytes_sent
#         _last_bytes_recv = net.bytes_recv
#         _last_rate_check_time = current_time

#         try:
#             active_connections = len([
#                 c for c in psutil.net_connections(kind='inet') if c.raddr
#             ])
#         except Exception:
#             active_connections = 0

#         # Collect unique process names efficiently
#         processes = set()
#         for proc in psutil.process_iter(['name']):
#             try:
#                 if proc.info["name"]:
#                     processes.add(proc.info["name"].lower())
#             except Exception:
#                 pass
        
#         # Limit to 25 unique processes for performance
#         processes = sorted(list(processes))[:25]

#         # Collect open tabs once — reuse in get_active_destinations to avoid double session read
#         open_tabs    = _collect_open_tabs()
#         destinations = get_active_destinations(cached_open_tabs=set(open_tabs))

#         return {
#             "hostname":           STUDENT_ID,
#             "timestamp":          datetime.now().isoformat(),
#             "bytes_sent":         net.bytes_sent,
#             "bytes_recv":         net.bytes_recv,
#             "cpu_percent":        round(cpu_percent, 2),
#             "memory_percent":     round(memory_percent, 2),
#             "disk_percent":       round(disk_percent, 2),
#             "active_connections": active_connections,
#             "upload_rate_kbps":   round(upload_rate_kbps, 2),
#             "download_rate_kbps": round(download_rate_kbps, 2),
#             "processes":          processes,
#             "destinations":       destinations,
#             "open_tabs":          open_tabs
#         }

#     except Exception as e:
#         print(f"❌ Error collecting system data: {e}")
#         return None


# # ============================================================
# # SEND TO ADMIN
# # ============================================================

# def send_to_admin(data):
#     try:
#         response = requests.post(API_URL, json=data, timeout=5)
#         if response.status_code == 201:
#             sites   = [d.get("website", "?") for d in data.get("destinations", [])]
#             preview = ", ".join(sites[:6])
#             more    = f"  (+{len(sites)-6} more)" if len(sites) > 6 else ""
#             print(f"✅ [SENT] {datetime.now().strftime('%H:%M:%S')} — "
#                   f"CPU:{data['cpu_percent']}%  "
#                   f"RAM:{data['memory_percent']}%  "
#                   f"Disk:{data['disk_percent']}%  |  "
#                   f"{len(sites)} sites: {preview}{more}")
#         else:
#             print(f"⚠️  [WARN] Server responded: {response.status_code}")
#     except requests.exceptions.RequestException as e:
#         print(f"❌ [ERROR] Could not reach admin server: {e}")


# # ============================================================
# # POLL FOR COMMANDS
# # ============================================================

# def check_for_commands():
#     try:
#         response = requests.get(
#             COMMANDS_URL,
#             params={"student_id": STUDENT_ID},
#             timeout=3
#         )
#         if response.status_code == 200:
#             return response.json().get("commands", [])
#         return []
#     except requests.exceptions.RequestException:
#         return []


# # ============================================================
# # BLOCKING
# # ============================================================

# def clean_domain(raw):
#     raw = raw.strip()
#     if "://" in raw:
#         parsed = urlparse(raw)
#         return parsed.hostname or raw
#     return raw.split("/")[0].strip()


# def block_via_firewall(domain, ip_addresses):
#     blocked = 0
#     for ip in ip_addresses:
#         rule_name = f"Block_{domain}_{ip}"
#         cmd = [
#             "netsh", "advfirewall", "firewall", "add", "rule",
#             f"name={rule_name}", "dir=out", "action=block", f"remoteip={ip}"
#         ]
#         try:
#             result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
#             out    = (result.stderr + result.stdout).strip().lower()
#             if result.returncode == 0:
#                 blocked += 1
#                 print(f"    ✅ Firewall rule added: block {ip}")
#             elif "access is denied" in out or "elevation" in out:
#                 print("    ❌ Administrator privileges required! Run as Admin.")
#                 return -1
#             elif "already exists" in out or "duplicate" in out:
#                 print(f"    ℹ️  Rule already exists for {ip}")
#                 blocked += 1
#             else:
#                 print(f"    ⚠️  Could not block {ip}: {out}")
#         except subprocess.TimeoutExpired:
#             print(f"    ⏱️  Timeout adding rule for {ip}")
#     return blocked


# def block_via_hosts(domain):
#     hosts_path = r"C:\Windows\System32\drivers\etc\hosts"
#     variants   = [domain] if domain.startswith("www.") else [domain, f"www.{domain}"]
#     try:
#         with open(hosts_path, "r") as f:
#             existing = f.read()
#         # Check for the exact hosts entry, not just substring (avoids www.domain.com false match)
#         new_lines = [f"127.0.0.1 {v}" for v in variants if f"127.0.0.1 {v}" not in existing]
#         if new_lines:
#             with open(hosts_path, "a") as f:
#                 f.write(f"\n# Blocked by Student Agent [{datetime.now().strftime('%Y-%m-%d %H:%M')}] - {domain}\n")
#                 for line in new_lines:
#                     f.write(line + "\n")
#             print(f"    ✅ Hosts file updated: {new_lines}")
#         else:
#             print(f"    ℹ️  Hosts file: {domain} already present")
#     except PermissionError:
#         print("    ⚠️  Hosts file: Permission denied — run as Administrator.")
#     except Exception as e:
#         print(f"    ⚠️  Hosts file error: {e}")


# def block_domain_local(domain_raw, reason="Admin policy"):
#     if platform.system() != "Windows":
#         print("❌ Blocking only supported on Windows")
#         return False

#     domain = clean_domain(domain_raw)
#     print(f"\n🚫 BLOCK: {domain}  (received: '{domain_raw}')  |  Reason: {reason}")
#     print("-" * 55)

#     variants = [domain] if domain.startswith("www.") else [domain, f"www.{domain}"]
#     all_ips  = []

#     for v in variants:
#         print(f"  🔍 Resolving {v} ...")
#         try:
#             addr_info = socket.getaddrinfo(v, None)
#             ips       = list({info[4][0] for info in addr_info})
#             print(f"  📡 {v} → {ips}")
#             for ip in ips:
#                 if ip not in all_ips:
#                     all_ips.append(ip)
#         except socket.gaierror as e:
#             print(f"  ❌ DNS failed for {v}: {e}")

#     if not all_ips:
#         print("  ⚠️  No IPs resolved. Hosts file block still applied.")

#     print("  🔥 Adding firewall rules ...")
#     result = block_via_firewall(domain, all_ips)
#     if result == -1:
#         return False

#     print("  📝 Updating hosts file ...")
#     block_via_hosts(domain)

#     print(f"✅ Block complete: {domain}\n")
#     return True


# # ============================================================
# # UNBLOCKING
# # ============================================================

# def unblock_via_firewall(domain):
#     removed = 0
#     try:
#         result = subprocess.run(
#             "netsh advfirewall firewall show rule name=all",
#             capture_output=True, text=True, shell=True
#         )
#         rules = []
#         for line in result.stdout.split("\n"):
#             if "Rule Name:" in line and domain in line:
#                 rule_name = line.split("Rule Name:")[-1].strip()
#                 rules.append(rule_name)

#         if not rules:
#             print(f"    ℹ️  No firewall rules found for '{domain}'")
#             return 0

#         for rule_name in rules:
#             cmd = f'netsh advfirewall firewall delete rule name="{rule_name}"'
#             res = subprocess.run(cmd, shell=True, capture_output=True, text=True)
#             if res.returncode == 0:
#                 removed += 1
#                 print(f"    🗑️  Removed: {rule_name}")
#             else:
#                 print(f"    ⚠️  Failed to remove: {rule_name}")
#     except Exception as e:
#         print(f"    ❌ Firewall unblock error: {e}")
#     return removed


# def unblock_via_hosts(domain):
#     hosts_path = r"C:\Windows\System32\drivers\etc\hosts"
#     try:
#         with open(hosts_path, "r") as f:
#             lines = f.readlines()
#         # Match domain as a full word in a hosts entry (prevents partial matches)
#         filtered      = [ln for ln in lines if f" {domain}" not in ln and f"\t{domain}" not in ln]
#         removed_count = len(lines) - len(filtered)
#         if removed_count > 0:
#             with open(hosts_path, "w") as f:
#                 f.writelines(filtered)
#             print(f"    ✅ Hosts file: removed {removed_count} line(s) for {domain}")
#         else:
#             print(f"    ℹ️  Hosts file: no entries found for {domain}")
#     except PermissionError:
#         print("    ⚠️  Hosts file: Permission denied — run as Administrator.")
#     except Exception as e:
#         print(f"    ⚠️  Hosts file error: {e}")


# def unblock_domain_local(domain_raw):
#     if platform.system() != "Windows":
#         print("❌ Unblocking only supported on Windows")
#         return False

#     domain = clean_domain(domain_raw)
#     print(f"\n✅ UNBLOCK: {domain}  (received: '{domain_raw}')")
#     print("-" * 55)

#     total_removed = 0

#     print(f"  🔥 Removing firewall rules for '{domain}' ...")
#     total_removed += unblock_via_firewall(domain)

#     if not domain.startswith("www."):
#         www_domain = f"www.{domain}"
#         print(f"  🔥 Removing firewall rules for '{www_domain}' ...")
#         total_removed += unblock_via_firewall(www_domain)

#     print(f"  📝 Cleaning hosts file ...")
#     unblock_via_hosts(domain)

#     if total_removed > 0:
#         print(f"✅ Unblock complete: {domain}  ({total_removed} firewall rule(s) removed)\n")
#     else:
#         print(f"✅ Unblock done: {domain}  (hosts file cleaned — no matching firewall rules found)\n")

#     return True


# # ============================================================
# # COMMAND DISPATCHER
# # ============================================================

# def execute_command(command):
#     action = command.get("action")

#     if action == "BLOCK_DOMAIN":
#         domain = command.get("domain")
#         reason = command.get("reason", "Admin policy")
#         if domain:
#             block_domain_local(domain, reason)
#         else:
#             print("⚠️  BLOCK_DOMAIN: missing 'domain' field")

#     elif action == "UNBLOCK_DOMAIN":
#         domain = command.get("domain")
#         if domain:
#             unblock_domain_local(domain)
#         else:
#             print("⚠️  UNBLOCK_DOMAIN: missing 'domain' field")

#     elif action == "PING":
#         print("🏓 PING received from admin — agent is alive")

#     else:
#         print(f"⚠️  Unknown command action: '{action}'")


# # ============================================================
# # MAIN LOOP
# # ============================================================

# def main():
#     print("=" * 60)
#     print("🚀 STUDENT AGENT STARTED")
#     print("=" * 60)
#     print(f"📌 Student ID : {STUDENT_ID}")
#     print(f"📡 Backend    : {BACKEND_SERVER_IP}:{BACKEND_SERVER_PORT}")
#     print(f"⏱️  Send every : {SEND_INTERVAL}s  |  Poll every: {POLL_INTERVAL}s")
#     print()
#     print("🔍 Monitoring:")
#     print("   ✅ Currently open tabs  (Chrome + Edge session scan — real-time)")
#     print("   ✅ DNS cache + active network connections")
#     print("   ✅ Running processes")
#     print("   ✅ CPU / Memory / Disk usage")
#     print("   ✅ Network bytes sent / received")
#     print("   ✅ Active connection count")
#     print("   ✅ Remote BLOCK / UNBLOCK commands from admin")
#     print()
#     if platform.system() == "Windows":
#         print("⚠️  Run as Administrator for firewall + hosts file management")
#     else:
#         print("⚠️  WARNING: Firewall blocking only works on Windows")
#     print("=" * 60)
#     print()

#     last_send_time = 0
#     last_poll_time = 0

#     while True:
#         try:
#             current_time = time.time()

#             # Send activity data
#             if current_time - last_send_time >= SEND_INTERVAL:
#                 payload = collect_system_data()
#                 if payload:
#                     send_to_admin(payload)
#                 last_send_time = current_time

#             # Poll for commands at a faster interval than sending
#             if current_time - last_poll_time >= POLL_INTERVAL:
#                 commands = check_for_commands()
#                 if commands:
#                     print(f"\n📥 Received {len(commands)} command(s) from admin:")
#                     for cmd in commands:
#                         execute_command(cmd)
#                     print()
#                 last_poll_time = current_time

#             time.sleep(0.5)
        
#         except Exception as e:
#             print(f"❌ Error in main loop: {e}")
#             time.sleep(1)  # Back off on error


# if __name__ == "__main__":
#     try:
#         main()
#     except KeyboardInterrupt:
#         print("\n\n⏹️  Student Agent stopped by user")
#     except Exception as e:
#         print(f"\n\n❌ Fatal error: {e}")

import psutil
import socket
import requests
import time
import subprocess
import platform
import os
import sqlite3
import shutil
import tempfile
import re
from datetime import datetime
from urllib.parse import urlparse

# ============================================================
# 🔧 CONFIGURATION
# ============================================================
BACKEND_SERVER_IP   = "10.85.231.252"
BACKEND_SERVER_PORT = 8000  # Updated to match backend default port

SEND_INTERVAL = 3   # Send data every 3 seconds (FASTER for real-time alerts)
POLL_INTERVAL = 2   # Check for commands every 2 seconds (FASTER for instant blocking)

# ============================================================
# AUTO-CONFIGURATION
# ============================================================
API_URL      = f"http://{BACKEND_SERVER_IP}:{BACKEND_SERVER_PORT}/activity"
COMMANDS_URL = f"http://{BACKEND_SERVER_IP}:{BACKEND_SERVER_PORT}/commands"
STUDENT_ID   = socket.gethostname()

# ============================================================
# STATE TRACKING FOR RATE CALCULATIONS
# ============================================================
_last_bytes_sent = 0
_last_bytes_recv = 0
_last_rate_check_time = time.time()

# ============================================================
# DNS CACHE  —  IP → website name (from Windows DNS resolver)
# ============================================================
_dns_cache = {}

# Pre-compiled regex for detecting raw IPv4/IPv6 addresses
_RAW_IP_RE = re.compile(r'^(\d{1,3}\.){3}\d{1,3}$|^[0-9a-fA-F:]+:[0-9a-fA-F:]+$')


def refresh_dns_cache():
    """
    Reads Windows DNS resolver cache (ipconfig /displaydns).
    Builds IP → clean domain name map.
    This works because every DNS lookup the browser makes is cached here.
    """
    global _dns_cache
    new_cache = {}

    if platform.system() != "Windows":
        return

    try:
        result = subprocess.run(
            ["ipconfig", "/displaydns"],
            capture_output=True, text=True, timeout=15,
            encoding="utf-8", errors="ignore"
        )
        output = result.stdout
        current_domain = None

        for line in output.splitlines():
            line = line.strip()

            # Detect section header (bare domain name)
            if (line and "." in line and " " not in line and
                    not line.startswith("-") and
                    not any(line.startswith(k) for k in
                            ["Record", "Time", "Section", "Data", "TTL", "Answer"])):
                current_domain = line.lower().rstrip(".")

            # IPv4 A record
            if current_domain and "A (Host) Record" in line:
                ip = line.split(":")[-1].strip()
                if ip and _is_valid_ipv4(ip):
                    new_cache[ip] = _root_domain(current_domain)

            # IPv6 AAAA record
            if current_domain and "AAAA" in line:
                ipv6 = line.split()[-1].strip()
                if ipv6 and ":" in ipv6:
                    new_cache[ipv6] = _root_domain(current_domain)

        _dns_cache = new_cache

    except Exception:
        pass


def _is_valid_ipv4(s):
    parts = s.split(".")
    if len(parts) != 4:
        return False
    try:
        return all(0 <= int(p) <= 255 for p in parts)
    except ValueError:
        return False


def _root_domain(domain):
    """
    Strips subdomains → returns root domain.
    "mail.google.com" → "google.com"
    "edge-chat.facebook.com" → "facebook.com"
    """
    domain = domain.lower().rstrip(".")
    parts  = domain.split(".")
    if len(parts) > 2:
        return ".".join(parts[-2:])
    return domain


def _ip_to_website(ip):
    """
    Converts IP → website name using:
    1. DNS cache (most accurate — real domain names)
    2. Reverse DNS fallback
    3. Raw IP as last resort
    """
    if ip in _dns_cache:
        return _dns_cache[ip]
    try:
        hostname = socket.gethostbyaddr(ip)[0]
        return _root_domain(hostname)
    except Exception:
        pass
    return ip


# ============================================================
# REAL WEBSITE DETECTION — from Chrome/Edge/Firefox history
# ============================================================

def _extract_urls_from_session_binary(filepath):
    """
    Reads Chrome/Edge binary session file (SNSS format) and extracts all URLs
    by scanning for http/https strings embedded in the binary data.
    This captures currently open tabs — even if never written to history yet.
    """
    sites = set()
    try:
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".snss")
        tmp.close()
        shutil.copy2(filepath, tmp.name)
        with open(tmp.name, "rb") as f:
            data = f.read()
        os.unlink(tmp.name)
        # Extract all readable URLs from binary blob
        for m in re.finditer(rb'https?://[A-Za-z0-9\-._~:/?#\[\]@!$&\'()*+,;=%]{4,300}', data):
            try:
                url = m.group(0).decode("utf-8", errors="ignore")
                parsed = urlparse(url)
                if parsed.hostname:
                    sites.add(_root_domain(parsed.hostname))
            except Exception:
                pass
    except Exception:
        pass
    return sites


def _get_chrome_open_tabs():
    """
    Reads currently open tabs from Chrome's session files (Current Tabs, Current Session).
    Works even if the tab was just opened and not yet recorded in history.
    """
    sites = set()
    username = os.environ.get("USERNAME", "")
    base = os.path.join("C:\\Users", username, "AppData", "Local", "Google", "Chrome", "User Data")
    if not os.path.exists(base):
        return sites
    # Check Default profile + numbered profiles (Profile 1, Profile 2, ...)
    profiles = ["Default"] + [f"Profile {i}" for i in range(1, 6)]
    session_files = ["Current Tabs", "Current Session", "Last Tabs", "Last Session"]
    for profile in profiles:
        for sf in session_files:
            path = os.path.join(base, profile, sf)
            if os.path.exists(path):
                sites.update(_extract_urls_from_session_binary(path))
    return sites


def _get_edge_open_tabs():
    """
    Reads currently open tabs from Microsoft Edge's session files.
    """
    sites = set()
    username = os.environ.get("USERNAME", "")
    base = os.path.join("C:\\Users", username, "AppData", "Local", "Microsoft", "Edge", "User Data")
    if not os.path.exists(base):
        return sites
    profiles = ["Default"] + [f"Profile {i}" for i in range(1, 6)]
    session_files = ["Current Tabs", "Current Session", "Last Tabs", "Last Session"]
    for profile in profiles:
        for sf in session_files:
            path = os.path.join(base, profile, sf)
            if os.path.exists(path):
                sites.update(_extract_urls_from_session_binary(path))
    return sites


def _get_chrome_sites():
    """
    Reads recently visited URLs from Chrome's SQLite history database.
    Returns list of root domain names visited in the last 24 hours.
    """
    sites = set()
    try:
        username = os.environ.get("USERNAME", "")
        chrome_history = os.path.join(
            "C:\\Users", username,
            "AppData", "Local", "Google", "Chrome",
            "User Data", "Default", "History"
        )

        if not os.path.exists(chrome_history):
            return sites

        # Copy DB to temp file (Chrome locks the original)
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".db")
        tmp.close()
        shutil.copy2(chrome_history, tmp.name)

        conn = sqlite3.connect(tmp.name)
        cursor = conn.cursor()

        # Get URLs visited in the last 24 hours
        # Chrome stores time as microseconds since 1601-01-01
        one_day_ago = (int(time.time()) - 86400) * 1000000 + 11644473600000000
        cursor.execute(
            "SELECT url FROM urls WHERE last_visit_time > ? ORDER BY last_visit_time DESC LIMIT 200",
            (one_day_ago,)
        )

        for row in cursor.fetchall():
            url = row[0]
            try:
                parsed = urlparse(url)
                if parsed.hostname:
                    sites.add(_root_domain(parsed.hostname))
            except Exception:
                pass

        conn.close()
        os.unlink(tmp.name)

    except Exception:
        pass

    return sites


def _get_edge_sites():
    """
    Reads recently visited URLs from Microsoft Edge's SQLite history database.
    Returns list of root domain names visited in the last 24 hours.
    """
    sites = set()
    try:
        username = os.environ.get("USERNAME", "")
        edge_history = os.path.join(
            "C:\\Users", username,
            "AppData", "Local", "Microsoft", "Edge",
            "User Data", "Default", "History"
        )

        if not os.path.exists(edge_history):
            return sites

        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".db")
        tmp.close()
        shutil.copy2(edge_history, tmp.name)

        conn = sqlite3.connect(tmp.name)
        cursor = conn.cursor()

        one_day_ago = (int(time.time()) - 86400) * 1000000 + 11644473600000000
        cursor.execute(
            "SELECT url FROM urls WHERE last_visit_time > ? ORDER BY last_visit_time DESC LIMIT 200",
            (one_day_ago,)
        )

        for row in cursor.fetchall():
            url = row[0]
            try:
                parsed = urlparse(url)
                if parsed.hostname:
                    sites.add(_root_domain(parsed.hostname))
            except Exception:
                pass

        conn.close()
        os.unlink(tmp.name)

    except Exception:
        pass

    return sites


def _get_firefox_sites():
    """
    Reads recently visited URLs from Firefox's SQLite places database.
    Returns list of root domain names visited in the last 24 hours.
    """
    sites = set()
    try:
        username   = os.environ.get("USERNAME", "")
        ff_base    = os.path.join("C:\\Users", username, "AppData", "Roaming", "Mozilla", "Firefox", "Profiles")

        if not os.path.exists(ff_base):
            return sites

        # Find all Firefox profiles
        for profile in os.listdir(ff_base):
            places_db = os.path.join(ff_base, profile, "places.sqlite")
            if not os.path.exists(places_db):
                continue

            tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".db")
            tmp.close()
            shutil.copy2(places_db, tmp.name)

            conn   = sqlite3.connect(tmp.name)
            cursor = conn.cursor()

            # Firefox stores time in microseconds since Unix epoch
            one_day_ago_us = (int(time.time()) - 86400) * 1000000
            cursor.execute(
                "SELECT url FROM moz_places WHERE last_visit_date > ? ORDER BY last_visit_date DESC LIMIT 200",
                (one_day_ago_us,)
            )

            for row in cursor.fetchall():
                url = row[0]
                try:
                    parsed = urlparse(url)
                    if parsed.hostname:
                        sites.add(_root_domain(parsed.hostname))
                except Exception:
                    pass

            conn.close()
            os.unlink(tmp.name)

    except Exception:
        pass

    return sites


def _get_sites_from_network_connections():
    """
    Falls back to active network connections + DNS cache lookup.
    Returns set of website names currently connected to.
    """
    sites = set()
    try:
        connections = psutil.net_connections(kind='inet')
        for conn in connections:
            if not conn.raddr:
                continue
            ip = conn.raddr.ip
            if (ip.startswith("127.") or ip.startswith("::1") or
                    ip.startswith("169.254") or ip == BACKEND_SERVER_IP):
                continue
            website = _ip_to_website(ip)
            if website and website != ip:   # Only add if resolved to a real name
                sites.add(website)
            # Raw IPs (unresolvable) are intentionally skipped — they create noise
    except Exception:
        pass
    return sites


def _collect_open_tabs():
    """
    Returns a sorted list of ONLY currently-open browser tab domains
    (Chrome + Edge session scan). No history. No network connections.
    No limit — show everything open right now.
    """
    tabs = set()
    tabs.update(_get_chrome_open_tabs())
    tabs.update(_get_edge_open_tabs())
    # Filter noise
    noise = {
        "", "localhost", "local", "internal",
        "update.googleapis.com", "safebrowsing.googleapis.com",
        "clients2.google.com", "ocsp.pki.goog"
    }
    tabs -= noise
    return sorted(list(tabs))


# ============================================================
# COMBINE ALL SOURCES → unique list of active websites
# ============================================================

def get_active_destinations(cached_open_tabs=None):
    """
    Collects real websites from ALL available sources:
      1. Chrome currently open tabs  (session binary scan — catches tabs opened seconds ago)
      2. Edge currently open tabs    (session binary scan)
      3. Chrome browser history      (last 24 hours)
      4. Edge browser history        (last 24 hours)
      5. Firefox browser history     (last 24 hours)
      6. Active network connections + DNS cache

    cached_open_tabs: pass in already-collected open tab set to avoid re-reading session files.
    Returns deduplicated list with website name + ip + port.
    """
    # Gather site names from all browser sources
    all_sites = set()
    # Currently open tabs — reuse cached result if provided (avoids double session-file read)
    if cached_open_tabs is not None:
        all_sites.update(cached_open_tabs)
    else:
        all_sites.update(_get_chrome_open_tabs())
        all_sites.update(_get_edge_open_tabs())
    # History fallback (last 24 hours)
    all_sites.update(_get_chrome_sites())
    all_sites.update(_get_edge_sites())
    all_sites.update(_get_firefox_sites())

    # Filter out noise
    noise = {
        "", "localhost", "local", "internal",
        "update.googleapis.com", "safebrowsing.googleapis.com",
        "clients2.google.com", "ocsp.pki.goog"
    }
    all_sites -= noise

    # Build destination objects
    # For browser-history sites we may not have a live IP — that's fine
    destinations = []
    seen         = set()

    # First: network connections (have live IP + port) — only include if domain was resolved
    try:
        connections = psutil.net_connections(kind='inet')
        for conn in connections:
            if not conn.raddr:
                continue
            ip      = conn.raddr.ip
            port    = conn.raddr.port
            if (ip.startswith("127.") or ip.startswith("::1") or
                    ip.startswith("169.254") or ip == BACKEND_SERVER_IP):
                continue
            website = _ip_to_website(ip)
            if website == ip:  # Could not resolve to domain name — skip raw IPs
                continue
            if website in seen:
                continue
            seen.add(website)
            destinations.append({
                "website": website,
                "domain":  website,
                "ip":      ip,
                "port":    port,
                "source":  "network"
            })
    except Exception:
        pass

    # Second: browser history + open tabs not already in list (skip bare IPs)
    for site in sorted(all_sites):
        if site in seen:
            continue
        if _RAW_IP_RE.match(site):  # Skip raw IPv4/IPv6 addresses
            continue
        seen.add(site)
        destinations.append({
            "website": site,
            "domain":  site,
            "ip":      "",
            "port":    0,
            "source":  "browser"
        })

    return destinations[:100]  # Increased from 50


# ============================================================
# COLLECT ALL SYSTEM DATA  (all original fields preserved)
# ============================================================

def collect_system_data():
    """
    Collects and returns full system snapshot:
      - hostname, timestamp
      - bytes_sent, bytes_recv
      - upload_rate_kbps, download_rate_kbps
      - cpu_percent, memory_percent, disk_percent
      - active_connections (count)
      - processes (list of running app names, up to 25 unique)
      - destinations (real websites from browsers + network)
    """
    global _last_bytes_sent, _last_bytes_recv, _last_rate_check_time
    
    try:
        refresh_dns_cache()

        net            = psutil.net_io_counters()
        cpu_percent    = psutil.cpu_percent(interval=0.5)
        memory_percent = psutil.virtual_memory().percent
        disk_percent   = psutil.disk_usage('C:\\').percent if platform.system() == 'Windows' else psutil.disk_usage('/').percent
        
        # Calculate upload/download rates in KB/s
        current_time = time.time()
        time_delta = max(current_time - _last_rate_check_time, 1)  # Avoid division by zero
        
        bytes_sent_delta = max(net.bytes_sent - _last_bytes_sent, 0)
        bytes_recv_delta = max(net.bytes_recv - _last_bytes_recv, 0)
        
        upload_rate_kbps = (bytes_sent_delta / 1024) / time_delta if time_delta > 0 else 0.0
        download_rate_kbps = (bytes_recv_delta / 1024) / time_delta if time_delta > 0 else 0.0
        
        # Update tracking variables for next iteration
        _last_bytes_sent = net.bytes_sent
        _last_bytes_recv = net.bytes_recv
        _last_rate_check_time = current_time

        try:
            active_connections = len([
                c for c in psutil.net_connections(kind='inet') if c.raddr
            ])
        except Exception:
            active_connections = 0

        # Collect unique process names efficiently
        processes = set()
        for proc in psutil.process_iter(['name']):
            try:
                if proc.info["name"]:
                    processes.add(proc.info["name"].lower())
            except Exception:
                pass
        
        # Limit to 25 unique processes for performance
        processes = sorted(list(processes))[:25]

        # Collect open tabs once — reuse in get_active_destinations to avoid double session read
        open_tabs    = _collect_open_tabs()
        destinations = get_active_destinations(cached_open_tabs=set(open_tabs))

        return {
            "hostname":           STUDENT_ID,
            "timestamp":          datetime.now().isoformat(),
            "bytes_sent":         net.bytes_sent,
            "bytes_recv":         net.bytes_recv,
            "cpu_percent":        round(cpu_percent, 2),
            "memory_percent":     round(memory_percent, 2),
            "disk_percent":       round(disk_percent, 2),
            "active_connections": active_connections,
            "upload_rate_kbps":   round(upload_rate_kbps, 2),
            "download_rate_kbps": round(download_rate_kbps, 2),
            "processes":          processes,
            "destinations":       destinations,
            "open_tabs":          open_tabs
        }

    except Exception as e:
        print(f"❌ Error collecting system data: {e}")
        return None


# ============================================================
# SEND TO ADMIN
# ============================================================

def send_to_admin(data):
    try:
        response = requests.post(API_URL, json=data, timeout=5)
        if response.status_code == 201:
            sites   = [d.get("website", "?") for d in data.get("destinations", [])]
            preview = ", ".join(sites[:6])
            more    = f"  (+{len(sites)-6} more)" if len(sites) > 6 else ""
            print(f"✅ [SENT] {datetime.now().strftime('%H:%M:%S')} — "
                  f"CPU:{data['cpu_percent']}%  "
                  f"RAM:{data['memory_percent']}%  "
                  f"Disk:{data['disk_percent']}%  |  "
                  f"{len(sites)} sites: {preview}{more}")
        else:
            print(f"⚠️  [WARN] Server responded: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"❌ [ERROR] Could not reach admin server: {e}")


# ============================================================
# POLL FOR COMMANDS
# ============================================================

def check_for_commands():
    try:
        response = requests.get(
            COMMANDS_URL,
            params={"student_id": STUDENT_ID},
            timeout=3
        )
        if response.status_code == 200:
            return response.json().get("commands", [])
        return []
    except requests.exceptions.RequestException:
        return []


# ============================================================
# BLOCKING
# ============================================================

def clean_domain(raw):
    raw = raw.strip()
    if "://" in raw:
        parsed = urlparse(raw)
        return parsed.hostname or raw
    return raw.split("/")[0].strip()


def block_via_firewall(domain, ip_addresses):
    blocked = 0
    for ip in ip_addresses:
        rule_name = f"Block_{domain}_{ip}"
        cmd = [
            "netsh", "advfirewall", "firewall", "add", "rule",
            f"name={rule_name}", "dir=out", "action=block", f"remoteip={ip}"
        ]
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
            out    = (result.stderr + result.stdout).strip().lower()
            if result.returncode == 0:
                blocked += 1
                print(f"    ✅ Firewall rule added: block {ip}")
            elif "access is denied" in out or "elevation" in out:
                print("    ❌ Administrator privileges required! Run as Admin.")
                return -1
            elif "already exists" in out or "duplicate" in out:
                print(f"    ℹ️  Rule already exists for {ip}")
                blocked += 1
            else:
                print(f"    ⚠️  Could not block {ip}: {out}")
        except subprocess.TimeoutExpired:
            print(f"    ⏱️  Timeout adding rule for {ip}")
    return blocked


def block_via_hosts(domain):
    hosts_path = r"C:\Windows\System32\drivers\etc\hosts"
    variants   = [domain] if domain.startswith("www.") else [domain, f"www.{domain}"]
    try:
        with open(hosts_path, "r") as f:
            existing = f.read()
        # Check for the exact hosts entry, not just substring (avoids www.domain.com false match)
        new_lines = [f"127.0.0.1 {v}" for v in variants if f"127.0.0.1 {v}" not in existing]
        if new_lines:
            with open(hosts_path, "a") as f:
                f.write(f"\n# Blocked by Student Agent [{datetime.now().strftime('%Y-%m-%d %H:%M')}] - {domain}\n")
                for line in new_lines:
                    f.write(line + "\n")
            print(f"    ✅ Hosts file updated: {new_lines}")
        else:
            print(f"    ℹ️  Hosts file: {domain} already present")
    except PermissionError:
        print("    ⚠️  Hosts file: Permission denied — run as Administrator.")
    except Exception as e:
        print(f"    ⚠️  Hosts file error: {e}")


def block_domain_local(domain_raw, reason="Admin policy"):
    if platform.system() != "Windows":
        print("❌ Blocking only supported on Windows")
        return False

    domain = clean_domain(domain_raw)
    print(f"\n🚫 BLOCK: {domain}  (received: '{domain_raw}')  |  Reason: {reason}")
    print("-" * 55)

    variants = [domain] if domain.startswith("www.") else [domain, f"www.{domain}"]
    all_ips  = []

    for v in variants:
        print(f"  🔍 Resolving {v} ...")
        try:
            addr_info = socket.getaddrinfo(v, None)
            ips       = list({info[4][0] for info in addr_info})
            print(f"  📡 {v} → {ips}")
            for ip in ips:
                if ip not in all_ips:
                    all_ips.append(ip)
        except socket.gaierror as e:
            print(f"  ❌ DNS failed for {v}: {e}")

    if not all_ips:
        print("  ⚠️  No IPs resolved. Hosts file block still applied.")

    print("  🔥 Adding firewall rules ...")
    result = block_via_firewall(domain, all_ips)
    if result == -1:
        return False

    print("  📝 Updating hosts file ...")
    block_via_hosts(domain)

    print(f"✅ Block complete: {domain}\n")
    return True


# ============================================================
# UNBLOCKING
# ============================================================

def unblock_via_firewall(domain):
    removed = 0
    try:
        result = subprocess.run(
            "netsh advfirewall firewall show rule name=all",
            capture_output=True, text=True, shell=True
        )
        rules = []
        for line in result.stdout.split("\n"):
            if "Rule Name:" in line and domain in line:
                rule_name = line.split("Rule Name:")[-1].strip()
                rules.append(rule_name)

        if not rules:
            print(f"    ℹ️  No firewall rules found for '{domain}'")
            return 0

        for rule_name in rules:
            cmd = f'netsh advfirewall firewall delete rule name="{rule_name}"'
            res = subprocess.run(cmd, shell=True, capture_output=True, text=True)
            if res.returncode == 0:
                removed += 1
                print(f"    🗑️  Removed: {rule_name}")
            else:
                print(f"    ⚠️  Failed to remove: {rule_name}")
    except Exception as e:
        print(f"    ❌ Firewall unblock error: {e}")
    return removed


def unblock_via_hosts(domain):
    hosts_path = r"C:\Windows\System32\drivers\etc\hosts"
    try:
        with open(hosts_path, "r") as f:
            lines = f.readlines()
        # Match domain as a full word in a hosts entry (prevents partial matches)
        filtered      = [ln for ln in lines if f" {domain}" not in ln and f"\t{domain}" not in ln]
        removed_count = len(lines) - len(filtered)
        if removed_count > 0:
            with open(hosts_path, "w") as f:
                f.writelines(filtered)
            print(f"    ✅ Hosts file: removed {removed_count} line(s) for {domain}")
        else:
            print(f"    ℹ️  Hosts file: no entries found for {domain}")
    except PermissionError:
        print("    ⚠️  Hosts file: Permission denied — run as Administrator.")
    except Exception as e:
        print(f"    ⚠️  Hosts file error: {e}")


def unblock_domain_local(domain_raw):
    if platform.system() != "Windows":
        print("❌ Unblocking only supported on Windows")
        return False

    domain = clean_domain(domain_raw)
    print(f"\n✅ UNBLOCK: {domain}  (received: '{domain_raw}')")
    print("-" * 55)

    total_removed = 0

    print(f"  🔥 Removing firewall rules for '{domain}' ...")
    total_removed += unblock_via_firewall(domain)

    if not domain.startswith("www."):
        www_domain = f"www.{domain}"
        print(f"  🔥 Removing firewall rules for '{www_domain}' ...")
        total_removed += unblock_via_firewall(www_domain)

    print(f"  📝 Cleaning hosts file ...")
    unblock_via_hosts(domain)

    if total_removed > 0:
        print(f"✅ Unblock complete: {domain}  ({total_removed} firewall rule(s) removed)\n")
    else:
        print(f"✅ Unblock done: {domain}  (hosts file cleaned — no matching firewall rules found)\n")

    return True


# ============================================================
# COMMAND DISPATCHER
# ============================================================

def execute_command(command):
    action = command.get("action")

    if action == "BLOCK_DOMAIN":
        domain = command.get("domain")
        reason = command.get("reason", "Admin policy")
        if domain:
            block_domain_local(domain, reason)
        else:
            print("⚠️  BLOCK_DOMAIN: missing 'domain' field")

    elif action == "UNBLOCK_DOMAIN":
        domain = command.get("domain")
        if domain:
            unblock_domain_local(domain)
        else:
            print("⚠️  UNBLOCK_DOMAIN: missing 'domain' field")

    elif action == "PING":
        print("🏓 PING received from admin — agent is alive")

    else:
        print(f"⚠️  Unknown command action: '{action}'")


# ============================================================
# MAIN LOOP
# ============================================================

def main():
    print("=" * 60)
    print("🚀 STUDENT AGENT STARTED")
    print("=" * 60)
    print(f"📌 Student ID : {STUDENT_ID}")
    print(f"📡 Backend    : {BACKEND_SERVER_IP}:{BACKEND_SERVER_PORT}")
    print(f"⏱️  Send every : {SEND_INTERVAL}s  |  Poll every: {POLL_INTERVAL}s")
    print()
    print("🔍 Monitoring:")
    print("   ✅ Currently open tabs  (Chrome + Edge session scan — real-time)")
    print("   ✅ Browser history       (Chrome + Edge + Firefox, last 24 hours)")
    print("   ✅ DNS cache + active network connections")
    print("   ✅ Running processes")
    print("   ✅ CPU / Memory / Disk usage")
    print("   ✅ Network bytes sent / received")
    print("   ✅ Active connection count")
    print("   ✅ Remote BLOCK / UNBLOCK commands from admin")
    print()
    if platform.system() == "Windows":
        print("⚠️  Run as Administrator for firewall + hosts file management")
    else:
        print("⚠️  WARNING: Firewall blocking only works on Windows")
    print("=" * 60)
    print()

    last_send_time = 0
    last_poll_time = 0

    while True:
        try:
            current_time = time.time()

            # Send activity data
            if current_time - last_send_time >= SEND_INTERVAL:
                payload = collect_system_data()
                if payload:
                    send_to_admin(payload)
                last_send_time = current_time

            # Poll for commands at a faster interval than sending
            if current_time - last_poll_time >= POLL_INTERVAL:
                commands = check_for_commands()
                if commands:
                    print(f"\n📥 Received {len(commands)} command(s) from admin:")
                    for cmd in commands:
                        execute_command(cmd)
                    print()
                last_poll_time = current_time

            time.sleep(0.5)
        
        except Exception as e:
            print(f"❌ Error in main loop: {e}")
            time.sleep(1)  # Back off on error


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⏹️  Student Agent stopped by user")
    except Exception as e:
        print(f"\n\n❌ Fatal error: {e}")