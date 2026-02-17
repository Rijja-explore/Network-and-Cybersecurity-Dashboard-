# 🎯 Friend Setup Instructions

## For Your Friend's Laptop:

### Step 1: Install Python Dependencies
```bash
pip install psutil requests
```

### Step 2: Download student_agent.py
Copy the file `student_agent.py` from this project to your friend's laptop.
**The agent is already configured with your IP address: `10.154.216.252:8001`**

### Step 3: Run the Agent
```bash
python student_agent.py
```

The agent will:
- ✅ Send system data every 5 seconds
- ✅ Monitor network connections
- ✅ Track running processes
- ✅ Check for admin commands every 3 seconds

---

## For You (Admin Dashboard):

### 1. Backend Running ✅
Backend is running on: `http://10.154.216.252:8001` (accessible to external connections)

### 2. Frontend Dashboard ✅  
Dashboard is running on: `http://localhost:3004`

### 3. Admin Controls Available:
- **View Students**: Go to `/students` page to see connected laptops
- **Block Websites**: Click "Block Website" button next to any student
- **Monitor Activity**: Real-time updates every 5 seconds

---

## 🔒 Admin Blocking Demo:

1. Once your friend's agent is sending data, you'll see "FRIEND-LAPTOP-01" in the students list
2. Click the "Block Website" button next to their entry  
3. Enter a domain like `youtube.com` or `facebook.com`
4. The block command will be sent to their laptop within 3 seconds
5. Their agent will block the domain using Windows Firewall

---

## 🛡️ Security Notes:

- This is for **educational/monitoring purposes only**
- Friend should run the agent **as Administrator** for firewall blocking
- The agent automatically uses their computer's hostname as the student ID
- All network activity is logged and viewable in your dashboard

---

## 📊 What You'll See in Dashboard:

- **Real-time student data**: CPU, Memory, Network usage
- **Active processes**: What programs they're running  
- **Website visits**: Domains they're accessing
- **Network connections**: Live connection monitoring
- **Admin controls**: Block/unblock websites remotely

Your friend just needs to run: `python student_agent.py` and their data will appear in your dashboard!