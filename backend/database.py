"""
MongoDB Database setup for the Attendance Processing System.
Uses PyMongo to connect to MongoDB Atlas.
"""

import os
import certifi
from pymongo import MongoClient, ASCENDING, DESCENDING
from datetime import datetime

MONGO_URI = os.environ.get(
    'MONGODB_URI',
    'mongodb+srv://blackholeauth_db_user:blackhole_biometric@cluster0.1kdzvsi.mongodb.net/'
)
DB_NAME = os.environ.get('MONGODB_DB_NAME', 'biometric_attendance')

_client = None


def get_client():
    global _client
    if _client is None:
        _client = MongoClient(MONGO_URI, tlsCAFile=certifi.where())
    return _client


def get_db():
    return get_client()[DB_NAME]


def init_db():
    db = get_db()

    db.users.create_index([('email', ASCENDING)], unique=True)

    db.attendance_reports.create_index(
        [('user_id', ASCENDING), ('year', ASCENDING), ('month', ASCENDING)],
        unique=True,
    )

    db.hour_rates.create_index(
        [('user_id', ASCENDING), ('employee_id', ASCENDING)],
        unique=True,
    )

    db.manual_users.create_index([('user_id', ASCENDING)])
    db.finalized_salaries.create_index([('user_id', ASCENDING)])
    db.confirmed_salaries.create_index([('user_id', ASCENDING)])
