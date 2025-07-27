import secrets

def generate_secret_key():
    return secrets.token_hex(32)

if __name__ == "__main__":
    print("Generated secret key for JWT authentication:")
    print(generate_secret_key())
    print("\nAdd this key to your auth.py file or use as an environment variable.")
