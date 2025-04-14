# Budget App

**Budget App** is a full-stack personal finance application designed to help users manage their budgets, track transactions, set savings goals, earn achievements, and receive insightful notifications. Built with a Flask backend and a React frontend, it leverages a MySQL database for data persistence and Grok AI (via Groq API) for transaction categorization and financial insights. This project was developed for a hackathon, emphasizing user-friendly design and real-time financial tracking.

---
![image](https://github.com/user-attachments/assets/da93af3d-11da-44c7-a0e9-0e383fba6bf2)

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

---

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

---

## Installation

### Prerequisites

- Python 3.8+
- Node.js 16+
- MySQL 8.0+
- Groq API key (sign up at [Groq](https://groq.com))

### Backend Setup

```bash
git clone <repo-url>
cd budget-app
pip install -r requirements.txt
```



