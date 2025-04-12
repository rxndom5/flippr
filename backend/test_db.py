import mysql.connector
from mysql.connector import Error

db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': 'qwerty',  # Replace with your MySQL password
    'database': 'budget_app'
}

try:
    connection = mysql.connector.connect(**db_config)
    if connection.is_connected():
        print("Successfully connected to MySQL!")
    connection.close()
except Error as e:
    print(f"Error: {e}")