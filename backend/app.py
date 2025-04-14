from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
import bcrypt
from datetime import datetime
from groq import Groq
import os
from dotenv import load_dotenv
import logging
from collections import defaultdict
from datetime import datetime, timedelta
import json
from decimal import Decimal

# Configure logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

db_config = {
    'user': 'root',
    'password': 'qwerty',  # Replace with your MySQL password
    'host': 'localhost',
    'database': 'budget_app'
}

# Initialize Groq client
try:
    groq_client = Groq(api_key=os.getenv('GROQ_API_KEY'))
    logger.info("Groq client initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize Groq client: {str(e)}")
    raise

# Load categorization prompt
try:
    with open('categorization_prompt.txt', 'r') as file:
        CATEGORIZATION_PROMPT = file.read().strip()
    logger.info("Categorization prompt loaded successfully")
except FileNotFoundError:
    logger.error("categorization_prompt.txt not found")
    raise
except Exception as e:
    logger.error(f"Error loading categorization prompt: {str(e)}")
    raise

def get_db_connection():
    try:
        conn = mysql.connector.connect(**db_config)
        logger.debug("Database connection established")
        return conn
    except mysql.connector.Error as err:
        logger.error(f"Database connection error: {str(err)}")
        raise

def categorize_transaction(description):
    """Use Groq to categorize a transaction description with improved accuracy."""
    logger.debug(f"Categorizing transaction: {description}")
    valid_categories = [
        "Food", "Rent", "Entertainment", "Utilities", "Income", "Clothes",
        "Transport", "Health", "Education", "Savings", "Other"
    ]
    try:
        response = groq_client.chat.completions.create(
            model="llama3-70b-8192",
            messages=[
                {
                    "role": "system",
                    "content": CATEGORIZATION_PROMPT
                },
                {
                    "role": "user",
                    "content": f"Description: {description}"
                }
            ],
            max_tokens=10,
            temperature=0.3
        )
        category = response.choices[0].message.content.strip()
        logger.debug(f"Groq returned category: {category}")
        return category if category in valid_categories else "Other"
    except Exception as e:
        logger.error(f"Groq categorization error: {str(e)}")
        # Fallback keyword matching
        description = description.lower()
        if any(word in description for word in ['jacket', 'shirt', 'pants', 'dress', 'shoes', 'jeans']):
            return "Clothes"
        elif any(word in description for word in ['car', 'gas', 'fuel', 'bus', 'train', 'taxi']):
            return "Transport"
        elif any(word in description for word in ['food', 'grocery', 'pizza', 'coffee', 'restaurant']):
            return "Food"
        elif any(word in description for word in ['rent', 'mortgage']):
            return "Rent"
        elif any(word in description for word in ['movie', 'concert', 'game', 'streaming']):
            return "Entertainment"
        elif any(word in description for word in ['electric', 'water', 'internet', 'phone']):
            return "Utilities"
        elif any(word in description for word in ['salary', 'paycheck', 'bonus', 'freelance']):
            return "Income"
        elif any(word in description for word in ['doctor', 'hospital', 'medicine', 'pharmacy']):
            return "Health"
        elif any(word in description for word in ['book', 'tuition', 'course', 'school']):
            return "Education"
        elif any(word in description for word in ['savings', 'deposit', 'retirement', 'emergency']):
            return "Savings"
        return "Other"

def create_notification(user_id, message, notification_type):
    """Helper function to insert a notification into the database."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            'INSERT INTO notifications (user_id, message, type, created_at, is_read) '
            'VALUES (%s, %s, %s, %s, %s)',
            (user_id, message, notification_type, datetime.now(), False)
        )
        conn.commit()
        logger.info(f"Notification created for user_id {user_id}: {message}")
    except mysql.connector.Error as err:
        logger.error(f"Notification creation error: {str(err)}")
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    full_name = data.get('full_name')
    currency = data.get('currency', 'USD')

    if not username or not email or not password:
        logger.warning("Registration failed: Missing required fields")
        return jsonify({'error': 'Missing required fields'}), 400

    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT id FROM users WHERE username = %s OR email = %s', (username, email))
        if cursor.fetchone():
            logger.warning(f"Registration failed: Username {username} or email {email} exists")
            return jsonify({'error': 'Username or email already exists'}), 400

        cursor.execute('''
            INSERT INTO users (username, email, password_hash, full_name, currency)
            VALUES (%s, %s, %s, %s, %s)
        ''', (username, email, hashed_password, full_name, currency))
        conn.commit()
        logger.info(f"User registered: {username}")
        return jsonify({'message': 'Registration successful'}), 201
    except mysql.connector.Error as err:
        logger.error(f"Registration database error: {str(err)}")
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
        logger.warning("Login failed: Missing username or password")
        return jsonify({'error': 'Missing username or password'}), 400

    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute('SELECT id, username, password_hash FROM users WHERE username = %s', (username,))
        user = cursor.fetchone()

        if not user:
            logger.warning(f"Login failed: Invalid username {username}")
            return jsonify({'error': 'Invalid username or password'}), 401

        if bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
            # Update login streak for "Consistent Planner"
            today = datetime.now().date()
            cursor.execute('SELECT streak, last_login FROM login_streaks WHERE user_id = %s', (user['id'],))
            streak_data = cursor.fetchone()
            if not streak_data:
                streak = 1
                cursor.execute(
                    'INSERT INTO login_streaks (user_id, streak, last_login) VALUES (%s, %s, %s)',
                    (user['id'], streak, today)
                )
            else:
                if streak_data['last_login'] and streak_data['last_login'] < today - timedelta(days=1):
                    streak = 1
                else:
                    streak = streak_data['streak'] + 1 if streak_data['last_login'] == today - timedelta(days=1) else 1
                cursor.execute(
                    'UPDATE login_streaks SET streak = %s, last_login = %s WHERE user_id = %s',
                    (streak, today, user['id'])
                )
            if streak >= 7:
                award_achievement(user['id'], 'Consistent Planner', 'Logged in daily for a week', 'CalendarIcon')

            conn.commit()
            logger.info(f"User logged in: {username}")
            return jsonify({
                'message': 'Login successful',
                'username': user['username'],
                'user_id': user['id']
            }), 200
        else:
            logger.warning(f"Login failed: Invalid password for {username}")
            return jsonify({'error': 'Invalid username or password'}), 401
    except mysql.connector.Error as err:
        logger.error(f"Login database error: {str(err)}")
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
        logger.warning("Savings goals request failed: Username required")
        return jsonify({'error': 'Username required'}), 400

    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute('SELECT id FROM users WHERE username = %s', (username,))
        user = cursor.fetchone()
        if not user:
            logger.warning(f"Savings goals failed: User {username} not found")
            return jsonify({'error': 'User not found'}), 404
        user_id = user['id']

        if request.method == 'GET':
            cursor.execute('''
                SELECT id, name, target_amount, current_amount, deadline
                FROM savings_goals
                WHERE user_id = %s
            ''', (user_id,))
            goals = cursor.fetchall()
            logger.debug(f"Fetched {len(goals)} savings goals for user {username}")
            return jsonify({'goals': goals}), 200

        elif request.method == 'POST':
            data = request.get_json()
            name = data.get('name')
            target_amount = data.get('target_amount')
            deadline = data.get('deadline')

            if not name or not target_amount:
                logger.warning("Savings goal creation failed: Missing name or target amount")
                return jsonify({'error': 'Missing name or target amount'}), 400

            try:
                target_amount = float(target_amount)
                if target_amount <= 0:
                    raise ValueError
            except (ValueError, TypeError):
                logger.warning("Savings goal creation failed: Invalid target amount")
                return jsonify({'error': 'Invalid target amount'}), 400

            deadline_date = None
            if deadline:
                try:
                    deadline_date = datetime.strptime(deadline, '%Y-%m-%d').date()
                except ValueError:
                    logger.warning("Savings goal creation failed: Invalid deadline format")
                    return jsonify({'error': 'Invalid deadline format (use YYYY-MM-DD)'}), 400

            cursor.execute('''
                INSERT INTO savings_goals (user_id, name, target_amount, current_amount, deadline)
                VALUES (%s, %s, %s, %s, %s)
            ''', (user_id, name, target_amount, 0.00, deadline_date))
            create_notification(user_id, f"Created new savings goal: {name}", "savings")
            conn.commit()
            logger.info(f"Savings goal created for user {username}: {name}")
            return jsonify({'message': 'Savings goal created'}), 201

    except mysql.connector.Error as err:
        logger.error(f"Savings goals database error: {str(err)}")
        return jsonify({'error': str(err)}), 500
    except Exception as e:
        logger.error(f"Savings goals unexpected error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@app.route('/transactions', methods=['GET', 'POST', 'DELETE'])
def transactions():
    username = request.headers.get('X-Username')
    if not username:
        logger.warning("Transactions request failed: Username required")
        return jsonify({'error': 'Username required'}), 400

    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute('SELECT id FROM users WHERE username = %s', (username,))
        user = cursor.fetchone()
        if not user:
            logger.warning(f"Transactions failed: User {username} not found")
            return jsonify({'error': 'User not found'}), 404
        user_id = user['id']

        if request.method == 'GET':
            cursor.execute('''
                SELECT t.id, t.amount, t.description, t.transaction_date, t.goal_id, g.name AS goal_name,
                       t.budget_id, b.category AS budget_category, t.ai_category
                FROM transactions t
                LEFT JOIN savings_goals g ON t.goal_id = g.id
                LEFT JOIN budgets b ON t.budget_id = b.id
                WHERE t.user_id = %s
                ORDER BY t.transaction_date DESC
            ''', (user_id,))
            transactions = cursor.fetchall()
            logger.debug(f"Fetched {len(transactions)} transactions for user {username}")
            return jsonify({'transactions': transactions}), 200

        elif request.method == 'POST':
            data = request.get_json()
            logger.debug(f"Transaction POST data: {data}")
            amount = data.get('amount')
            description = data.get('description')
            transaction_date = data.get('transaction_date')
            goal_id = data.get('goal_id')
            budget_id = data.get('budget_id')

            if not amount or not description or not transaction_date:
                logger.warning("Transaction creation failed: Missing required fields")
                return jsonify({'error': 'Missing required fields'}), 400

            try:
                amount = float(amount)
            except (ValueError, TypeError):
                logger.warning("Transaction creation failed: Invalid amount")
                return jsonify({'error': 'Invalid amount'}), 400

            try:
                transaction_date = datetime.strptime(transaction_date, '%Y-%m-%d').date()
            except ValueError:
                logger.warning("Transaction creation failed: Invalid date format")
                return jsonify({'error': 'Invalid date format (use YYYY-MM-DD)'}), 400

            if goal_id:
                try:
                    goal_id = int(goal_id)
                    cursor.execute('SELECT id FROM savings_goals WHERE id = %s AND user_id = %s', (goal_id, user_id))
                    if not cursor.fetchone():
                        logger.warning(f"Transaction creation failed: Invalid goal ID {goal_id}")
                        return jsonify({'error': 'Invalid goal ID'}), 400
                except (ValueError, TypeError):
                    logger.warning("Transaction creation failed: Invalid goal ID format")
                    return jsonify({'error': 'Invalid goal ID'}), 400

            if budget_id:
                try:
                    budget_id = int(budget_id)
                    cursor.execute('SELECT id FROM budgets WHERE id = %s AND user_id = %s', (budget_id, user_id))
                    if not cursor.fetchone():
                        logger.warning(f"Transaction creation failed: Invalid budget ID {budget_id}")
                        return jsonify({'error': 'Invalid budget ID'}), 400
                except (ValueError, TypeError):
                    logger.warning("Transaction creation failed: Invalid budget ID format")
                    return jsonify({'error': 'Invalid budget ID'}), 400

            # Categorize using Groq
            ai_category = categorize_transaction(description)

            # Insert transaction
            cursor.execute('''
                INSERT INTO transactions (user_id, amount, description, transaction_date, goal_id, budget_id, ai_category)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            ''', (user_id, amount, description, transaction_date, goal_id or None, budget_id or None, ai_category))

            # Budget notification
            if budget_id and amount < 0:
                cursor.execute('''
                    SELECT b.category, b.amount AS budget_amount, COALESCE(SUM(t.amount), 0) AS spent_amount
                    FROM budgets b
                    LEFT JOIN transactions t ON t.budget_id = b.id AND t.amount < 0
                    WHERE b.id = %s AND b.user_id = %s
                    GROUP BY b.id, b.category, b.amount
                ''', (budget_id, user_id))
                budget = cursor.fetchone()
                if budget:
                    spent = float(abs(budget['spent_amount'])) + abs(amount)
                    limit = float(budget['budget_amount'])
                    if spent >= limit:
                        create_notification(user_id, f"Budget exceeded for {budget['category']}: ${spent:.2f}/ ${limit:.2f}", "budget")
                    elif spent >= limit * 0.8:
                        create_notification(user_id, f"Warning: {budget['category']} budget nearing limit: ${spent:.2f}/ ${limit:.2f}", "budget")

            # Savings goal progress notification
            if goal_id and amount > 0:
                cursor.execute('''
                    SELECT name, current_amount, target_amount
                    FROM savings_goals
                    WHERE id = %s AND user_id = %s
                ''', (goal_id, user_id))
                goal = cursor.fetchone()
                if goal:
                    cursor.execute('''
                        UPDATE savings_goals
                        SET current_amount = current_amount + %s
                        WHERE id = %s AND user_id = %s
                    ''', (amount, goal_id, user_id))
                    new_current = float(goal['current_amount']) + amount
                    target = float(goal['target_amount'])
                    progress = (new_current / target) * 100
                    milestones = [25, 50, 75, 100]
                    for milestone in milestones:
                        if (float(goal['current_amount']) / target * 100) < milestone <= progress:
                            create_notification(user_id, f"Reached {milestone}% of savings goal '{goal['name']}': ${new_current:.2f}/ ${target:.2f}", "savings")
                    # Check for "Savings Star"
                    if new_current >= target:
                        award_achievement(user_id, 'Savings Star', 'Completed a savings goal', 'StarIcon')

            # Award "First Step" for first transaction
            cursor.execute('SELECT COUNT(*) as count FROM transactions WHERE user_id = %s', (user_id,))
            transaction_count = cursor.fetchone()['count']
            if transaction_count == 1:
                award_achievement(user_id, 'First Step', 'Added your first transaction', 'CheckCircleIcon')

            conn.commit()
            logger.info(f"Transaction created for user {username}: {description}, AI Category: {ai_category}")
            return jsonify({'message': 'Transaction created', 'ai_category': ai_category}), 201

    except mysql.connector.Error as err:
        logger.error(f"Transactions database error: {str(err)}")
        return jsonify({'error': str(err)}), 500
    except Exception as e:
        logger.error(f"Transactions unexpected error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@app.route('/transactions/<int:transaction_id>', methods=['DELETE'])
def delete_transaction(transaction_id):
    username = request.headers.get('X-Username')
    if not username:
        logger.warning("Delete transaction failed: Username required")
        return jsonify({'error': 'Username required'}), 400

    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute('SELECT id FROM users WHERE username = %s', (username,))
        user = cursor.fetchone()
        if not user:
            logger.warning(f"Delete transaction failed: User {username} not found")
            return jsonify({'error': 'User not found'}), 404
        user_id = user['id']

        # Fetch transaction details
        cursor.execute('''
            SELECT amount, goal_id, budget_id
            FROM transactions
            WHERE id = %s AND user_id = %s
        ''', (transaction_id, user_id))
        transaction = cursor.fetchone()
        if not transaction:
            logger.warning(f"Delete transaction failed: Transaction {transaction_id} not found for user {username}")
            return jsonify({'error': 'Transaction not found'}), 404

        # Update savings goal if necessary
        if transaction['goal_id'] and transaction['amount'] > 0:
            cursor.execute('''
                UPDATE savings_goals
                SET current_amount = current_amount - %s
                WHERE id = %s AND user_id = %s
            ''', (transaction['amount'], transaction['goal_id'], user_id))
            logger.debug(f"Updated savings goal {transaction['goal_id']} for user {username}: subtracted {transaction['amount']}")

        # Delete transaction
        cursor.execute('DELETE FROM transactions WHERE id = %s AND user_id = %s', (transaction_id, user_id))
        if cursor.rowcount == 0:
            logger.warning(f"Delete transaction failed: No rows affected for transaction {transaction_id}")
            return jsonify({'error': 'Transaction not found'}), 404

        conn.commit()
        logger.info(f"Transaction {transaction_id} deleted for user {username}")
        return jsonify({'message': 'Transaction deleted'}), 200

    except mysql.connector.Error as err:
        logger.error(f"Delete transaction database error: {str(err)}")
        return jsonify({'error': str(err)}), 500
    except Exception as e:
        logger.error(f"Delete transaction unexpected error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@app.route('/budgets', methods=['GET', 'POST'])
def budgets():
    username = request.headers.get('X-Username')
    if not username:
        logger.warning("Budgets request failed: Username required")
        return jsonify({'error': 'Username required'}), 400

    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute('SELECT id FROM users WHERE username = %s', (username,))
        user = cursor.fetchone()
        if not user:
            logger.warning(f"Budgets failed: User {username} not found")
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
            logger.debug(f"Fetched {len(budgets)} budgets for user {username}")
            return jsonify({'budgets': budgets}), 200

        elif request.method == 'POST':
            data = request.get_json()
            category = data.get('category')
            amount = data.get('amount')
            period = data.get('period', 'monthly')

            if not category or not amount:
                logger.warning("Budget creation failed: Missing category or amount")
                return jsonify({'error': 'Missing category or amount'}), 400

            try:
                amount = float(amount)
                if amount <= 0:
                    raise ValueError
            except (ValueError, TypeError):
                logger.warning("Budget creation failed: Invalid amount")
                return jsonify({'error': 'Invalid amount'}), 400

            if period not in ['monthly', 'weekly']:
                logger.warning("Budget creation failed: Invalid period")
                return jsonify({'error': 'Invalid period (use monthly or weekly)'}), 400

            cursor.execute('''
                INSERT INTO budgets (user_id, category, amount, period)
                VALUES (%s, %s, %s, %s)
            ''', (user_id, category, amount, period))
            create_notification(user_id, f"Created new budget: {category}", "budget")
            conn.commit()
            logger.info(f"Budget created for user {username}: {category}")
            return jsonify({'message': 'Budget created'}), 201

    except mysql.connector.Error as err:
        logger.error(f"Budgets database error: {str(err)}")
        return jsonify({'error': str(err)}), 500
    except Exception as e:
        logger.error(f"Budgets unexpected error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@app.route('/transaction-report', methods=['GET'])
def transaction_report():
    username = request.headers.get('X-Username')
    if not username:
        logger.warning("Transaction report failed: Username required")
        return jsonify({'error': 'Username required'}), 400

    # Optional date range parameters (default: last 30 days)
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date', datetime.now().strftime('%Y-%m-%d'))
    
    try:
        # Validate and set date range
        end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        if start_date:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        else:
            start_date = end_date - timedelta(days=30)

        if start_date > end_date:
            logger.warning("Transaction report failed: Invalid date range")
            return jsonify({'error': 'Start date cannot be after end date'}), 400

        conn = None
        cursor = None
        try:
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)

            # Get user ID
            cursor.execute('SELECT id FROM users WHERE username = %s', (username,))
            user = cursor.fetchone()
            if not user:
                logger.warning(f"Transaction report failed: User {username} not found")
                return jsonify({'error': 'User not found'}), 404
            user_id = user['id']

            # Fetch transactions
            cursor.execute('''
                SELECT amount, description, transaction_date, goal_id, budget_id, ai_category
                FROM transactions
                WHERE user_id = %s AND transaction_date BETWEEN %s AND %s
                ORDER BY transaction_date DESC
            ''', (user_id, start_date, end_date))
            transactions = cursor.fetchall()

            # Initialize aggregates
            total_income = 0.0
            total_expenses = 0.0
            category_sums = defaultdict(float)
            goal_contributions = defaultdict(float)
            budget_spending = defaultdict(float)

            # Process transactions
            for t in transactions:
                amount = float(t['amount'])
                category = t['ai_category'] or 'Uncategorized'
                if amount > 0:
                    total_income += amount
                else:
                    total_expenses += abs(amount)
                category_sums[category] += amount

                if t['goal_id']:
                    goal_contributions[t['goal_id']] += amount if amount > 0 else 0

                if t['budget_id']:
                    budget_spending[t['budget_id']] += abs(amount) if amount < 0 else 0

            # Fetch savings goals
            cursor.execute('''
                SELECT id, name, target_amount, current_amount
                FROM savings_goals
                WHERE user_id = %s
            ''', (user_id,))
            goals = cursor.fetchall()
            goal_summary = {
                g['id']: {
                    'name': g['name'],
                    'target': float(g['target_amount']),
                    'current': float(g['current_amount']),
                    'contributed': goal_contributions.get(g['id'], 0.0)
                } for g in goals
            }

            # Fetch budgets
            cursor.execute('''
                SELECT id, category, amount
                FROM budgets
                WHERE user_id = %s
            ''', (user_id,))
            budgets = cursor.fetchall()
            budget_summary = {
                b['id']: {
                    'category': b['category'],
                    'limit': float(b['amount']),
                    'spent': budget_spending.get(b['id'], 0.0)
                } for b in budgets
            }

            # Check for "Budget Master" achievement
            all_within_budget = all(b['spent'] <= b['limit'] for b in budget_summary.values())
            current_date = datetime.now().date()
            cursor.execute('SELECT budget_streak, last_budget_check FROM streaks WHERE user_id = %s', (user_id,))
            streak_data = cursor.fetchone()
            if not streak_data:
                streak = 0
                cursor.execute(
                    'INSERT INTO streaks (user_id, budget_streak, last_budget_check) VALUES (%s, %s, %s)',
                    (user_id, streak, current_date)
                )
            else:
                if streak_data['last_budget_check'] and streak_data['last_budget_check'].month != current_date.month:
                    if all_within_budget:
                        streak = streak_data['budget_streak'] + 1
                        cursor.execute(
                            'UPDATE streaks SET budget_streak = %s, last_budget_check = %s WHERE user_id = %s',
                            (streak, current_date, user_id)
                        )
                        if streak >= 3:
                            award_achievement(user_id, 'Budget Master', 'Stayed within budget for 3 months', 'CheckIcon')
                    else:
                        cursor.execute(
                            'UPDATE streaks SET budget_streak = 0, last_budget_check = %s WHERE user_id = %s',
                            (current_date, user_id)
                        )
                streak = streak_data['budget_streak']

            # Financial insight notification
            sorted_categories = sorted(category_sums.items(), key=lambda x: abs(x[1]), reverse=True)
            if sorted_categories and abs(sorted_categories[0][1]) > total_expenses * 0.5:
                top_category, top_amount = sorted_categories[0]
                if top_amount < 0:  # Only for expenses
                    create_notification(
                        user_id,
                        f"You're spending a lot on {top_category}: ${abs(top_amount):.2f}. Consider reviewing this category.",
                        "insight"
                    )

            # Prepare data for AI analysis
            report_data = {
                'total_income': total_income,
                'total_expenses': total_expenses,
                'net_balance': total_income - total_expenses,
                'categories': [
                    {'name': k, 'amount': v, 'type': 'Income' if v > 0 else 'Expense'}
                    for k, v in sorted(category_sums.items(), key=lambda x: abs(x[1]), reverse=True)
                ],
                'goals': [
                    {'name': g['name'], 'target': g['target'], 'current': g['current'], 'contributed': g['contributed']}
                    for g in goal_summary.values()
                ],
                'budgets': [
                    {'category': b['category'], 'limit': b['limit'], 'spent': b['spent']}
                    for b in budget_summary.values()
                ]
            }

            # AI prompt for detailed report
            ai_prompt = f"""
You are a financial advisor analyzing a user's transactions from {start_date} to {end_date}. Provide a detailed report summarizing their financial activity and offer personalized advice. Use the following data:

- Total Income: ${total_income:.2f}
- Total Expenses: ${total_expenses:.2f}
- Net Balance: ${(total_income - total_expenses):.2f}
- Category Breakdown:
{chr(10).join([f"  - {c['name']}: ${abs(c['amount']):.2f} ({c['type']})" for c in report_data['categories']])}
- Savings Goals:
{chr(10).join([f"  - {g['name']}: ${g['current']:.2f}/ ${g['target']:.2f} (Contributed: ${g['contributed']:.2f})" for g in report_data['goals']])}
- Budgets:
{chr(10).join([f"  - {b['category']}: Spent ${b['spent']:.2f}/ Limit ${b['limit']:.2f}" for b in report_data['budgets']])}

Generate a report with:
1. A summary of income, expenses, and net balance.
2. Key observations about spending patterns (e.g., high spending categories).
3. Progress on savings goals and any concerns.
4. Budget adherence (e.g., overspending or underspending).
5. 2-3 actionable pieces of advice to improve financial health.
Keep the tone professional yet friendly, and limit the response to 300 words.
"""

            # Query Groq for report
            try:
                response = groq_client.chat.completions.create(
                    model="llama3-70b-8192",
                    messages=[
                        {"role": "system", "content": "You are a financial advisor providing clear, concise, and actionable insights."},
                        {"role": "user", "content": ai_prompt}
                    ],
                    max_tokens=350,
                    temperature=0.5
                )
                ai_report = response.choices[0].message.content.strip()
                logger.debug("Groq generated transaction report successfully")
            except Exception as e:
                logger.error(f"Groq report generation error: {str(e)}")
                ai_report = "Unable to generate AI insights at this time."

            # Combine raw data and AI report
            report = {
                'summary': {
                    'total_income': total_income,
                    'total_expenses': total_expenses,
                    'net_balance': total_income - total_expenses,
                    'period': f"{start_date} to {end_date}"
                },
                'categories': report_data['categories'],
                'goals': report_data['goals'],
                'budgets': report_data['budgets'],
                'ai_insights': ai_report
            }

            conn.commit()
            logger.info(f"Transaction report generated for user {username}")
            return jsonify(report), 200

        except mysql.connector.Error as err:
            logger.error(f"Transaction report database error: {str(err)}")
            return jsonify({'error': str(err)}), 500
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()

    except ValueError as ve:
        logger.warning(f"Transaction report failed: Invalid date format - {str(ve)}")
        return jsonify({'error': 'Invalid date format (use YYYY-MM-DD)'}), 400
    except Exception as e:
        logger.error(f"Transaction report unexpected error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

def award_achievement(user_id, name, description, icon='StarIcon'):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            'SELECT COUNT(*) FROM achievements WHERE user_id = %s AND name = %s',
            (user_id, name)
        )
        if cursor.fetchone()[0] > 0:
            cursor.close()
            conn.close()
            return  # Already awarded
        cursor.execute(
            'INSERT INTO achievements (user_id, name, description, icon) VALUES (%s, %s, %s, %s)',
            (user_id, name, description, icon)
        )
        conn.commit()
        cursor.close()
        conn.close()
        logger.info(f"Awarded achievement {name} to user_id {user_id}")
    except mysql.connector.Error as err:
        logger.error(f"Achievement award error: {str(err)}")

@app.route('/achievements', methods=['GET'])
def get_achievements():
    username = request.headers.get('X-Username')
    if not username:
        logger.warning("Achievements fetch failed: Username required")
        return jsonify({'error': 'Username required'}), 400
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute('SELECT id FROM users WHERE username = %s', (username,))
        user = cursor.fetchone()
        if not user:
            logger.warning(f"Achievements fetch failed: User {username} not found")
            return jsonify({'error': 'User not found'}), 404
        cursor.execute(
            'SELECT name, description, icon, earned_at FROM achievements WHERE user_id = %s',
            (user['id'],)
        )
        achievements = cursor.fetchall()
        cursor.close()
        conn.close()
        logger.info(f"Fetched achievements for user {username}")
        return jsonify({'achievements': achievements}), 200
    except mysql.connector.Error as err:
        logger.error(f"Achievements fetch database error: {str(err)}")
        return jsonify({'error': str(err)}), 500

@app.route('/notifications', methods=['GET'])
def get_notifications():
    username = request.headers.get('X-Username')
    if not username:
        logger.warning("Notifications fetch failed: Username required")
        return jsonify({'error': 'Username required'}), 400
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute('SELECT id FROM users WHERE username = %s', (username,))
        user = cursor.fetchone()
        if not user:
            logger.warning(f"Notifications fetch failed: User {username} not found")
            return jsonify({'error': 'User not found'}), 404
        cursor.execute('''
            SELECT id, message, type, created_at, is_read
            FROM notifications
            WHERE user_id = %s
            ORDER BY created_at DESC
        ''', (user['id'],))
        notifications = cursor.fetchall()
        cursor.close()
        conn.close()
        logger.info(f"Fetched {len(notifications)} notifications for user {username}")
        return jsonify({'notifications': notifications}), 200
    except mysql.connector.Error as err:
        logger.error(f"Notifications fetch database error: {str(err)}")
        return jsonify({'error': str(err)}), 500

@app.route('/chat', methods=['POST'])
def chat():
    username = request.headers.get('X-Username')
    if not username:
        logger.warning("Chat request failed: Username required")
        return jsonify({'error': 'Username required'}), 400

    data = request.get_json()
    query = data.get('query')
    financial_data = data.get('financialData')

    if not query or not financial_data:
        logger.warning("Chat request failed: Missing query or financial data")
        return jsonify({'error': 'Missing query or financial data'}), 400

    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Verify user
        cursor.execute('SELECT id FROM users WHERE username = %s', (username,))
        user = cursor.fetchone()
        if not user:
            logger.warning(f"Chat failed: User {username} not found")
            return jsonify({'error': 'User not found'}), 404
        user_id = user['id']

        # Construct AI prompt
        ai_prompt = f"""
You are a financial advisor chatbot for a budget app. Answer the user's question based on their financial data and insights. Be concise, friendly, and actionable. Limit responses to 100 words.

**Financial Data**:
- Summary:
  - Total Income: ${financial_data.get('summary', {}).get('total_income', 0):.2f}
  - Total Expenses: ${financial_data.get('summary', {}).get('total_expenses', 0):.2f}
  - Net Balance: ${financial_data.get('summary', {}).get('net_balance', 0):.2f}
  - Period: {financial_data.get('summary', {}).get('period', 'Unknown')}
- Categories:
{chr(10).join([f"  - {c.get('name', 'Unknown')}: ${abs(c.get('amount', 0)):.2f} ({c.get('type', 'Unknown')})" for c in financial_data.get('categories', [])])}
- Budgets:
{chr(10).join([f"  - {b.get('category', 'Unknown')}: Spent ${b.get('spent', 0):.2f}/Limit ${b.get('limit', 0):.2f}" for b in financial_data.get('budgets', [])])}
- Goals:
{chr(10).join([f"  - {g.get('name', 'Unknown')}: ${g.get('current', 0):.2f}/${g.get('target', 0):.2f}" for g in financial_data.get('goals', [])])}
- AI Insights: {financial_data.get('ai_insights', 'No insights available.')}

**User Question**: {query}

Provide a direct answer with relevant details from the data.
"""

        # Query Groq
        try:
            response = groq_client.chat.completions.create(
                model="llama3-70b-8192",
                messages=[
                    {"role": "system", "content": "You are a financial advisor chatbot providing concise, data-driven answers."},
                    {"role": "user", "content": ai_prompt}
                ],
                max_tokens=150,
                temperature=0.5
            )
            ai_response = response.choices[0].message.content.strip()
            logger.debug(f"Groq chat response: {ai_response}")
        except Exception as e:
            logger.error(f"Groq chat error: {str(e)}")
            ai_response = "Sorry, I couldn't process your request. Try again later."

        return jsonify({'response': ai_response}), 200

    except mysql.connector.Error as err:
        logger.error(f"Chat database error: {str(err)}")
        return jsonify({'error': str(err)}), 500
    except Exception as e:
        logger.error(f"Chat unexpected error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


if __name__ == '__main__':
    app.run(debug=True, port=5001)