import subprocess

def block_ip(ip):
    """
    Blocks the given IP using Windows Firewall.
    MUST run as Administrator.
    """
    command = (
        'netsh advfirewall firewall add rule '
        f'name="Block {ip}" '
        'dir=out action=block '
        f'remoteip={ip}'
    )

    subprocess.run(command, shell=True)
