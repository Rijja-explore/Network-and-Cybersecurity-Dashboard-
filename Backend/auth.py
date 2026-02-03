ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"

def authenticate(username, password):
    return username == ADMIN_USERNAME and password == ADMIN_PASSWORD
