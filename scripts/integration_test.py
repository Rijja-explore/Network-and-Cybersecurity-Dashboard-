import requests

BASE = 'http://127.0.0.1:8000'

def login():
    try:
        r = requests.post(BASE + '/auth/login', json={'username':'admin','password':'admin123'}, timeout=5)
        print('LOGIN', r.status_code, r.text)
        return r.json().get('token')
    except Exception as e:
        print('LOGIN ERROR', e)
        return None


def block_domain(token, domain='example.com'):
    headers = {'Authorization': f'Bearer {token}'} if token else {}
    try:
        r = requests.post(BASE + '/policy/domains/block', json={'domain': domain, 'policy': 'blocked', 'reason': 'integration test'}, headers=headers, timeout=5)
        print('BLOCK', r.status_code, r.text)
        return r
    except Exception as e:
        print('BLOCK ERROR', e)
        return None


def get_domains(token):
    headers = {'Authorization': f'Bearer {token}'} if token else {}
    try:
        r = requests.get(BASE + '/policy/domains', headers=headers, timeout=5)
        print('GET DOMAINS', r.status_code, r.text)
        return r
    except Exception as e:
        print('GET DOMAINS ERROR', e)
        return None


if __name__ == '__main__':
    token = login()
    block_domain(token, 'example.com')
    get_domains(token)
