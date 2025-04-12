from flask import Flask, request, jsonify
from flask_cors import CORS
import bcrypt
import mysql.connector
from mysql.connector import Error

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# MySQL configuration
db_config = {
    'host': 'localhost',
    'user': 'root',           # Replace with your MySQL username
    'password': 'shashank',  # Replace with your MySQL password
    'database': 'budget_app'
}

def create_db_connection():
    try:
        connection = mysql.connector.connect(**db_config)
        return connection
    except Error as e:
        print(f"Error connecting to MySQL: {e}")
        return None

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    full_name = data.get('full_name', '')
    currency = data.get('currency', 'USD')

    if not username or not email or not password:
        return jsonify({'error': 'Missing required fields'}), 400

    # Hash password
    password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

    connection = create_db_connection()
    if not connection:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor = connection.cursor()
        # Check if username or email already exists
        cursor.execute("SELECT * FROM users WHERE username = %s OR email = %s", (username, email))
        if cursor.fetchone():
            return jsonify({'error': 'Username or email already exists'}), 400

        # Insert new user
        query = """
        INSERT INTO users (username, email, password_hash, full_name, currency)
        VALUES (%s, %s, %s, %s, %s)
        """
        cursor.execute(query, (username, email, password_hash, full_name, currency))
        connection.commit()
        return jsonify({'message': 'Registration successful'}), 201
    except Error as e:
        return jsonify({'error': f'Database error: {str(e)}'}), 500
    finally:
        cursor.close()
        connection.close()

if __name__ == '__main__':
    app.run(debug=True, port=5001)