from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
import bcrypt

app = Flask(__name__)
CORS(app)

# Database configuration
db_config = {
    'user': 'root',
    'password': 'qwerty',  # Replace with your MySQL password
    'host': 'localhost',
    'database': 'budget_app'
}

def get_db_connection():
    return mysql.connector.connect(**db_config)

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    full_name = data.get('full_name')
    currency = data.get('currency', 'USD')

    if not username or not email or not password:
        return jsonify({'error': 'Missing required fields'}), 400

    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT id FROM users WHERE username = %s OR email = %s', (username, email))
        if cursor.fetchone():
            return jsonify({'error': 'Username or email already exists'}), 400

        cursor.execute('''
            INSERT INTO users (username, email, password_hash, full_name, currency)
            VALUES (%s, %s, %s, %s, %s)
        ''', (username, email, hashed_password, full_name, currency))
        conn.commit()
        return jsonify({'message': 'Registration successful'}), 201
    except mysql.connector.Error as err:
        return jsonify({'error': str(err)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'error': 'Missing username or password'}), 400

    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute('SELECT id, username, password_hash FROM users WHERE username = %s', (username,))
        user = cursor.fetchone()

        if not user:
            return jsonify({'error': 'Invalid username or password'}), 401

        if bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
            return jsonify({
                'message': 'Login successful',
                'username': user['username'],
                'user_id': user['id']
            }), 200
        else:
            return jsonify({'error': 'Invalid username or password'}), 401
    except mysql.connector.Error as err:
        return jsonify({'error': str(err)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@app.route('/expenses', methods=['POST'])
def add_expense():
    data = request.get_json()
    user_id = data.get('user_id')
    amount = data.get('amount')
    category = data.get('category')
    description = data.get('description')
    expense_date = data.get('expense_date')

    if not all([user_id, amount, category, expense_date]):
        return jsonify({'error': 'Missing required fields'}), 400

    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO expenses (user_id, amount, category, description, expense_date)
            VALUES (%s, %s, %s, %s, %s)
        ''', (user_id, amount, category, description, expense_date))
        conn.commit()
        return jsonify({'message': 'Expense added successfully'}), 201
    except mysql.connector.Error as err:
        return jsonify({'error': str(err)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@app.route('/expenses/<int:user_id>', methods=['GET'])
def get_expenses(user_id):
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute('''
            SELECT id, amount, category, description, expense_date
            FROM expenses
            WHERE user_id = %s
            ORDER BY expense_date DESC
        ''', (user_id,))
        expenses = cursor.fetchall()
        return jsonify({'expenses': expenses}), 200
    except mysql.connector.Error as err:
        return jsonify({'error': str(err)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

if __name__ == '__main__':
    app.run(debug=True, port=5001)