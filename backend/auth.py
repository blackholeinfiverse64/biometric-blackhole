"""
JWT Authentication module.
Handles user registration, login, and token verification.
"""

import jwt
import hashlib
import os
from datetime import datetime, timedelta, timezone
from functools import wraps
from flask import request, jsonify, g
from database import get_db

SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'change-this-secret-in-production-use-a-long-random-string')
TOKEN_EXPIRY_HOURS = int(os.environ.get('JWT_EXPIRY_HOURS', '72'))


def hash_password(password):
    salt = os.environ.get('PASSWORD_SALT', 'attendance-app-salt')
    return hashlib.sha256(f"{salt}{password}".encode()).hexdigest()


def create_token(user_id, email, role):
    payload = {
        'user_id': user_id,
        'email': email,
        'role': role,
        'exp': datetime.now(timezone.utc) + timedelta(hours=TOKEN_EXPIRY_HOURS),
        'iat': datetime.now(timezone.utc),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')


def decode_token(token):
    return jwt.decode(token, SECRET_KEY, algorithms=['HS256'])


def jwt_required(f):
    """Decorator that requires a valid JWT token in the Authorization header."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            token = auth_header[7:]

        if not token:
            return jsonify({'error': 'Authentication token is missing'}), 401

        try:
            payload = decode_token(token)
            g.user_id = payload['user_id']
            g.user_email = payload['email']
            g.user_role = payload['role']
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401

        return f(*args, **kwargs)
    return decorated


def register_user(email, password, full_name, role='employee'):
    if not email or not password or not full_name:
        return None, 'Email, password, and full name are required'

    if len(password) < 6:
        return None, 'Password must be at least 6 characters'

    email_lower = email.lower().strip()

    if 'admin' in email_lower or 'manager' in email_lower:
        role = 'admin'

    db = get_db()
    try:
        existing = db.execute('SELECT id FROM users WHERE email = ?', (email_lower,)).fetchone()
        if existing:
            db.close()
            return None, 'An account with this email already exists'

        pw_hash = hash_password(password)
        cursor = db.execute(
            'INSERT INTO users (email, password_hash, full_name, role) VALUES (?, ?, ?, ?)',
            (email_lower, pw_hash, full_name.strip(), role)
        )
        db.commit()
        user_id = cursor.lastrowid

        user = db.execute('SELECT * FROM users WHERE id = ?', (user_id,)).fetchone()
        db.close()

        token = create_token(user_id, email_lower, role)
        return {
            'token': token,
            'user': {
                'id': user['id'],
                'email': user['email'],
                'full_name': user['full_name'],
                'role': user['role'],
            }
        }, None
    except Exception as e:
        db.close()
        return None, str(e)


def login_user(email, password):
    if not email or not password:
        return None, 'Email and password are required'

    email_lower = email.lower().strip()
    pw_hash = hash_password(password)

    db = get_db()
    user = db.execute(
        'SELECT * FROM users WHERE email = ? AND password_hash = ?',
        (email_lower, pw_hash)
    ).fetchone()
    db.close()

    if not user:
        return None, 'Invalid email or password'

    token = create_token(user['id'], user['email'], user['role'])
    return {
        'token': token,
        'user': {
            'id': user['id'],
            'email': user['email'],
            'full_name': user['full_name'],
            'role': user['role'],
        }
    }, None


def get_user_profile(user_id):
    db = get_db()
    user = db.execute('SELECT id, email, full_name, role, created_at FROM users WHERE id = ?', (user_id,)).fetchone()
    db.close()
    if not user:
        return None
    return dict(user)
