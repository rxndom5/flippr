from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
import bcrypt
from datetime import datetime

app = Flask(__name__)
CORS(app)

db_config = {
    'user': 'root',
    'password': 'shashank',  # Replace with your MySQL password
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

@app.route('/savings-goals', methods=['GET', 'POST'])
def savings_goals():
    username = request.headers.get('X-Username')
    if not username:
        return jsonify({'error': 'Username required'}), 400

    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Get user_id
        cursor.execute('SELECT id FROM users WHERE username = %s', (username,))
        user = cursor.fetchone()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        user_id = user['id']

        if request.method == 'GET':
            cursor.execute('''
                SELECT id, name, target_amount, current_amount, deadline
                FROM savings_goals
                WHERE user_id = %s
            ''', (user_id,))
            goals = cursor.fetchall()
            return jsonify({'goals': goals}), 200

        elif request.method == 'POST':
            data = request.get_json()
            name = data.get('name')
            target_amount = data.get('target_amount')
            deadline = data.get('deadline')

            if not name or not target_amount:
                return jsonify({'error': 'Missing name or target amount'}), 400

            try:
                target_amount = float(target_amount)
                if target_amount <= 0:
                    raise ValueError
            except (ValueError, TypeError):
                return jsonify({'error': 'Invalid target amount'}), 400

            deadline_date = None
            if deadline:
                try:
                    deadline_date = datetime.strptime(deadline, '%Y-%m-%d').date()
                except ValueError:
                    return jsonify({'error': 'Invalid deadline format (use YYYY-MM-DD)'}), 400

            cursor.execute('''
                INSERT INTO savings_goals (user_id, name, target_amount, current_amount, deadline)
                VALUES (%s, %s, %s, %s, %s)
            ''', (user_id, name, target_amount, 0.00, deadline_date))
            conn.commit()
            return jsonify({'message': 'Savings goal created'}), 201

    except mysql.connector.Error as err:
        return jsonify({'error': str(err)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@app.route('/transactions', methods=['GET', 'POST'])
def transactions():
    username = request.headers.get('X-Username')
    if not username:
        return jsonify({'error': 'Username required'}), 400

    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Get user_id
        cursor.execute('SELECT id FROM users WHERE username = %s', (username,))
        user = cursor.fetchone()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        user_id = user['id']

        if request.method == 'GET':
            cursor.execute('''
                SELECT t.id, t.amount, t.description, t.transaction_date, t.goal_id, g.name AS goal_name, t.budget_id, b.category AS budget_category
                FROM transactions t
                LEFT JOIN savings_goals g ON t.goal_id = g.id
                LEFT JOIN budgets b ON t.budget_id = b.id
                WHERE t.user_id = %s
                ORDER BY t.transaction_date DESC
            ''', (user_id,))
            transactions = cursor.fetchall()
            return jsonify({'transactions': transactions}), 200

        elif request.method == 'POST':
            data = request.get_json()
            amount = data.get('amount')
            description = data.get('description')
            transaction_date = data.get('transaction_date')
            goal_id = data.get('goal_id')
            budget_id = data.get('budget_id')

            if not amount or not description or not transaction_date:
                return jsonify({'error': 'Missing required fields'}), 400

            try:
                amount = float(amount)
            except (ValueError, TypeError):
                return jsonify({'error': 'Invalid amount'}), 400

            try:
                transaction_date = datetime.strptime(transaction_date, '%Y-%m-%d').date()
            except ValueError:
                return jsonify({'error': 'Invalid date format (use YYYY-MM-DD)'}), 400

            # Validate goal_id if provided
            if goal_id:
                cursor.execute('SELECT id FROM savings_goals WHERE id = %s AND user_id = %s', (goal_id, user_id))
                if not cursor.fetchone():
                    return jsonify({'error': 'Invalid goal ID'}), 400

            # Validate budget_id if provided
            if budget_id:
                cursor.execute('SELECT id FROM budgets WHERE id = %s AND user_id = %s', (budget_id, user_id))
                if not cursor.fetchone():
                    return jsonify({'error': 'Invalid budget ID'}), 400

            # Insert transaction
            cursor.execute('''
                INSERT INTO transactions (user_id, amount, description, transaction_date, goal_id, budget_id)
                VALUES (%s, %s, %s, %s, %s, %s)
            ''', (user_id, amount, description, transaction_date, goal_id or None, budget_id or None))

            # Update savings goal current_amount if goal_id exists and amount is positive
            if goal_id and amount > 0:
                cursor.execute('''
                    UPDATE savings_goals
                    SET current_amount = current_amount + %s
                    WHERE id = %s AND user_id = %s
                ''', (amount, goal_id, user_id))

            conn.commit()
            return jsonify({'message': 'Transaction created'}), 201

    except mysql.connector.Error as err:
        return jsonify({'error': str(err)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@app.route('/budgets', methods=['GET', 'POST'])
def budgets():
    username = request.headers.get('X-Username')
    if not username:
        return jsonify({'error': 'Username required'}), 400

    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Get user_id
        cursor.execute('SELECT id FROM users WHERE username = %s', (username,))
        user = cursor.fetchone()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        user_id = user['id']

        if request.method == 'GET':
            cursor.execute('''
                SELECT b.id, b.category, b.amount AS budget_amount,
                       COALESCE(SUM(t.amount), 0) AS spent_amount
                FROM budgets b
                LEFT JOIN transactions t ON t.budget_id = b.id AND t.amount < 0
                WHERE b.user_id = %s
                GROUP BY b.id, b.category, b.amount
            ''', (user_id,))
            budgets = cursor.fetchall()
            return jsonify({'budgets': budgets}), 200

        elif request.method == 'POST':
            data = request.get_json()
            category = data.get('category')
            amount = data.get('amount')
            period = data.get('period', 'monthly')

            if not category or not amount:
                return jsonify({'error': 'Missing category or amount'}), 400

            try:
                amount = float(amount)
                if amount <= 0:
                    raise ValueError
            except (ValueError, TypeError):
                return jsonify({'error': 'Invalid amount'}), 400

            if period not in ['monthly', 'weekly']:
                return jsonify({'error': 'Invalid period (use monthly or weekly)'}), 400

            cursor.execute('''
                INSERT INTO budgets (user_id, category, amount, period)
                VALUES (%s, %s, %s, %s)
            ''', (user_id, category, amount, period))
            conn.commit()
            return jsonify({'message': 'Budget created'}), 201

    except mysql.connector.Error as err:
        return jsonify({'error': str(err)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

if __name__ == '__main__':
    app.run(debug=True, port=5001)