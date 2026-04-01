"""
SQLite Database setup and models for the Attendance Processing System.
Replaces Supabase with local JWT-based auth and SQLite storage.
"""

import sqlite3
import os
import json
from datetime import datetime

def _default_db_path():
    render_disk = '/data'
    if os.path.isdir(render_disk):
        return os.path.join(render_disk, 'attendance.db')
    return os.path.join(os.path.dirname(__file__), 'attendance.db')

DB_PATH = os.environ.get('DATABASE_PATH', _default_db_path())


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    conn = get_db()
    cursor = conn.cursor()

    cursor.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            full_name TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'employee',
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS attendance_reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            year INTEGER NOT NULL,
            month INTEGER NOT NULL,
            daily_report TEXT DEFAULT '[]',
            monthly_summary TEXT DEFAULT '[]',
            statistics TEXT DEFAULT '{}',
            output_file TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE(user_id, year, month)
        );

        CREATE TABLE IF NOT EXISTS manual_users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            employee_id INTEGER NOT NULL,
            employee_name TEXT NOT NULL,
            total_hours REAL DEFAULT 0,
            hour_rate REAL,
            present_days INTEGER DEFAULT 0,
            absent_days INTEGER DEFAULT 0,
            auto_assigned_days INTEGER DEFAULT 0,
            daily_records TEXT DEFAULT '[]',
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS finalized_salaries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            month_key TEXT NOT NULL,
            month INTEGER,
            year INTEGER,
            employees TEXT DEFAULT '[]',
            total_salary REAL DEFAULT 0,
            finalized_at TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS confirmed_salaries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            employee_id INTEGER,
            employee_name TEXT,
            total_hours REAL,
            hour_rate REAL,
            salary REAL,
            confirmed_at TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS hour_rates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            employee_id INTEGER NOT NULL,
            hour_rate REAL NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE(user_id, employee_id)
        );
    """)

    conn.commit()
    conn.close()
