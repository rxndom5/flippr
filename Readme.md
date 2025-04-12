markdown

Collapse

Wrap

Copy
# Budget App

**Budget App** is a full-stack personal finance application designed to help users manage their budgets, track transactions, set savings goals, earn achievements, and receive insightful notifications. Built with a Flask backend and a React frontend, it leverages a MySQL database for data persistence and Grok AI (via Groq API) for transaction categorization and financial insights. This project was developed for a hackathon, emphasizing user-friendly design and real-time financial tracking.

## Features

### 1. User Authentication
- **Register**: Create an account with username, email, password, full name, and currency (default: USD).
  - Endpoint: `POST /register`
  - Validation: Ensures unique username/email, hashes passwords using bcrypt.
- **Login**: Authenticate users and track login streaks for achievements.
  - Endpoint: `POST /login`
  - Features: Awards "Consistent Planner" achievement for 7 consecutive daily logins.

### 2. Transactions
- **Create Transactions**: Add income or expenses with amount, description, date, and optional budget/goal associations.
  - Endpoint: `POST /transactions`
  - AI Categorization: Uses Grok AI to categorize transactions (e.g., "Food", "Rent", "Savings") with fallback keyword matching.
  - Notifications:
    - Budget alerts (80% and 100% of limit).
    - Savings goal progress (25%, 50%, 75%, 100% milestones).
    - First transaction awards "First Step" achievement.
- **View Transactions**: List all transactions with details (amount, category, date, etc.).
  - Endpoint: `GET /transactions`
- **Delete Transactions**: Remove transactions, updating associated budgets/goals.
  - Endpoint: `DELETE /transactions/<id>`
  - Logic: Adjusts savings goal `current_amount` if applicable.

### 3. Budgets
- **Create Budgets**: Set spending limits for categories (e.g., "Food", "Entertainment") with monthly or weekly periods.
  - Endpoint: `POST /budgets`
  - Notification: Alerts user on budget creation.
- **View Budgets**: Display budgets with spent amounts vs. limits.
  - Endpoint: `GET /budgets`
  - Logic: Calculates spent amount from negative transactions.
- **Notifications**:
  - Warns at 80% of budget limit.
  - Alerts when budget is exceeded.

### 4. Savings Goals
- **Create Goals**: Define goals with name, target amount, and optional deadline.
  - Endpoint: `POST /savings-goals`
  - Notification: Confirms goal creation.
- **View Goals**: List goals with current vs. target amounts.
  - Endpoint: `GET /savings-goals`
- **Progress Tracking**:
  - Updates `current_amount` with positive transactions.
  - Notifies at milestones (25%, 50%, 75%, 100%).
  - Awards "Savings Star" achievement when goal is met.

### 5. Notifications
- **Types**: Budget alerts, savings progress, financial insights, goal/budget creation.
  - Storage: Persisted in `notifications` table with `user_id`, `message`, `type`, `created_at`, `is_read`.
  - Triggers:
    - Budget: 80% warning, 100% exceeded.
    - Savings: Milestone reached (25%, 50%, 75%, 100%).
    - Insight: High spending in a category (>50% of total expenses).
    - Creation: New budget or goal.
- **View Notifications**:
  - Endpoint: `GET /notifications`
  - Frontend: Displays in a right-sidebar `Drawer` (via `BellIcon`) and `/notifications` page.
  - UI: Teal cards for unread, gray for read, grouped by date, with badges (e.g., red for `budget`, green for `savings`).

### 6. Achievements
- **Earn Achievements**: Gamifies financial habits with awards.
  - Endpoint: `GET /achievements`
  - Types:
    - **First Step**: First transaction added (Icon: `CheckCircleIcon`).
    - **Savings Star**: Complete a savings goal (Icon: `StarIcon`).
    - **Budget Master**: Stay within budgets for 3 months (Icon: `CheckIcon`).
    - **Consistent Planner**: Log in daily for 7 days (Icon: `CalendarIcon`).
  - Logic: Prevents duplicate awards, stored with `name`, `description`, `icon`, `earned_at`.

### 7. Transaction Reports
- **Generate Reports**: Summarize financial activity over a date range (default: last 30 days).
  - Endpoint: `GET /transaction-report?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD`
  - Output:
    - Summary: Total income, expenses, net balance.
    - Categories: Breakdown by AI-assigned categories (e.g., Food: -$200).
    - Goals: Progress (current vs. target, contributions).
    - Budgets: Spending vs. limits.
    - AI Insights: Grok-generated advice (e.g., "Reduce Food spending").
  - Notifications: Alerts if one category dominates expenses (>50%).
  - Achievements: Awards "Budget Master" for consistent budget adherence.

### 8. AI Integration
- **Transaction Categorization**:
  - Uses Groq API (`llama3-70b-8192`) to assign categories based on descriptions.
  - Fallback: Keyword matching for reliability (e.g., "coffee" → "Food").
- **Financial Insights**:
  - Grok generates detailed reports with actionable advice.
  - Example: Identifies high spending and suggests adjustments.

## Tech Stack
- **Backend**: Flask (Python)
  - Database: MySQL (`budget_app` schema)
  - Authentication: bcrypt for password hashing
  - AI: Groq API for categorization and insights
  - Logging: Debug-level logs for errors, transactions, notifications
- **Frontend**: React
  - UI Library: Material-UI (assumed for `BellIcon`, `Drawer`, badges)
  - Pages: Dashboard, Notifications, Goals, Budgets, Reports
  - Features: Real-time notifications, interactive charts (assumed)
- **Environment**: `.env` for API keys (e.g., `GROQ_API_KEY`)
- **Dependencies**:
  - Backend: `flask`, `flask-cors`, `mysql-connector-python`, `bcrypt`, `groq`, `python-dotenv`
  - Frontend: `react`, `axios`, `@mui/material` (assumed)

## Installation

### Prerequisites
- Python 3.8+
- Node.js 16+
- MySQL 8.0+
- Groq API key (sign up at [Groq](https://groq.com))

### Backend Setup
1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd budget-app
Install Python dependencies:
bash

Collapse

Wrap

Copy
pip install -r requirements.txt
Set up MySQL database:
sql

Collapse

Wrap

Copy
CREATE DATABASE budget_app;
Run schema SQL (see schema.sql for tables: users, transactions, budgets, savings_goals, notifications, achievements, streaks, login_streaks).
Configure environment:
bash

Collapse

Wrap

Copy
cp .env.example .env
Edit .env:
text

Collapse

Wrap

Copy
GROQ_API_KEY=your_groq_api_key
Update app.py db_config with your MySQL credentials:
python

Collapse

Wrap

Copy
db_config = {
    'user': 'root',
    'password': 'your_password',
    'host': 'localhost',
    'database': 'budget_app'
}
Create categorization_prompt.txt:
text

Collapse

Wrap

Copy
You are an AI that categorizes financial transactions based on descriptions. Assign one category from: Food, Rent, Entertainment, Utilities, Income, Clothes, Transport, Health, Education, Savings, Other. Return only the category name.
Run the backend:
bash

Collapse

Wrap

Copy
python app.py
Port: http://localhost:5001
Frontend Setup
Navigate to frontend directory (assumed frontend/):
bash

Collapse

Wrap

Copy
cd frontend
Install dependencies:
bash

Collapse

Wrap

Copy
npm install
Configure API base URL (assumed in src/api.js):
javascript

Collapse

Wrap

Copy
const API_URL = 'http://localhost:5001';
Run the frontend:
bash

Collapse

Wrap

Copy
npm start
Port: http://localhost:3000
Usage
Register/Login:
Visit http://localhost:3000/register or /login.
Create an account or log in as testuser.
Dashboard:
View recent transactions, budgets, goals.
Click BellIcon (top-right) to open Drawer for notifications.
Transactions:
Add via form: Enter amount, description, date, budget/goal.
See AI-assigned categories (e.g., "Groceries" → "Food").
Budgets/Goals:
Create budgets (e.g., "Food", $200/month).
Set goals (e.g., "Vacation Fund", $5000).
Track progress and receive milestone alerts.
Notifications:
Check Drawer for real-time alerts.
Visit /notifications for full history.
Reports:
Access /reports or API (GET /transaction-report) for summaries.
View AI insights (e.g., "Reduce Entertainment spending").
Achievements:
Earn badges for milestones (visible on /dashboard or /achievements).
API Endpoints
Endpoint	Method	Description	Headers
/register	POST	Register a new user	Content-Type: application/json
/login	POST	Authenticate user	Content-Type: application/json
/transactions	GET	List user transactions	X-Username: username
/transactions	POST	Create a transaction	X-Username, Content-Type
/transactions/<id>	DELETE	Delete a transaction	X-Username
/budgets	GET	List user budgets	X-Username
/budgets	POST	Create a budget	X-Username, Content-Type
/savings-goals	GET	List user savings goals	X-Username
/savings-goals	POST	Create a savings goal	X-Username, Content-Type
/notifications	GET	List user notifications	X-Username
/achievements	GET	List user achievements	X-Username
/transaction-report	GET	Generate financial report	X-Username
Example Request
Create Transaction:

bash

Collapse

Wrap

Copy
curl -X POST http://localhost:5001/transactions \
-H "X-Username: testuser" \
-H "Content-Type: application/json" \
-d '{"amount": -50, "description": "Groceries", "transaction_date": "2025-04-12", "budget_id": 1}'
Response:

json

Collapse

Wrap

Copy
{
  "message": "Transaction created",
  "ai_category": "Food"
}
Database Schema
users: id, username, email, password_hash, full_name, currency
transactions: id, user_id, amount, description, transaction_date, goal_id, budget_id, ai_category
budgets: id, user_id, category, amount, period
savings_goals: id, user_id, name, target_amount, current_amount, deadline
notifications: id, user_id, message, type, created_at, is_read
achievements: id, user_id, name, description, icon, earned_at
streaks: user_id, budget_streak, last_budget_check
login_streaks: user_id, streak, last_login
Known Issues
Notifications: No "mark as read" feature yet (planned).
Reports: AI insights may fail if Groq API is down (fallback message provided).
Edge Cases: Zero-amount transactions are allowed but may not trigger notifications.
Future Enhancements
Add "mark as read" for notifications in Drawer and /notifications.
Auto-open Drawer on new notifications.
Sound alerts for critical notifications (e.g., budget exceeded).
More AI insights (e.g., predict overspending based on trends).
Export reports as PDF/CSV.
Mobile responsiveness for frontend.
Contributing
Fork the repository.
Create a feature branch (git checkout -b feature/xyz).
Commit changes (git commit -m "Add xyz feature").
Push to branch (git push origin feature/xyz).
Open a pull request.
License
MIT License. See LICENSE for details.

Contact
Developer: [Your Name]
Email: [Your Email]
Hackathon: Built for [Hackathon Name], April 2025