# Salatk (صلاتك)

**Salatk** is a comprehensive web application designed to help Muslims manage their daily prayers, track missed prayers (Qada), and build consistent spiritual habits. It features prayer time calculations, gamification elements to encourage consistency, and a persistent tracking system using Supabase.

## ✨ Features

- **Prayer Times**: Accurate prayer times calculation based on user location (automatic or manual).
- **Prayer Tracking**: Log daily prayers (Fajr, Dhuhr, Asr, Maghrib, Isha) and Sunnah prayers.
- **Qada (Missed) Prayers**: Track and manage missed prayers with an easy-to-use counter system.
- **Habit Tracker**: Custom habit tracking (e.g., Reading Quran, Athkar) with daily logging.
- **Gamification**: Earn points for on-time prayers and habit completion. View your rank on the **Leaderboard**.
- **Multi-language Support**: Fully localized for **Arabic** and **English**.
- **Dark/Light Mode**: User-configurable themes.
- **Cloud Sync**: All data is securely stored and synced using **Supabase** (PostgreSQL).

## 🛠 Tech Stack

- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6+).
- **Backend/Database**: [Supabase](https://supabase.com/) (PostgreSQL).
- **Authentication**: Supabase Auth.
- **Hosting**: Static Web Hosting (can be deployed to Vercel, Netlify, Github Pages, etc.).

## 📂 Project Structure

```
salatk/
├── assets/             # Images, icons, and static assets
├── components/         # Reusable HTML snippets/components
├── js/                 # Core JavaScript logic
│   ├── pages/          # Page-specific logic (home, qada, habits, etc.)
│   ├── services/       # Business logic (PrayerService, HabitService)
│   ├── i18n.js         # Internationalization (Translations)
│   ├── supabaseClient.js # Supabase configuration
│   └── app.js          # Main application entry point
├── styles.css          # Global styles and variables
└── index.html          # Main HTML entry point
```

## 🗄 Database Schema

The application follows a cloud-first approach using Supabase. Below is the detailed schema:

### `profiles`
Stores public user information. Linked to `auth.users`.
- `id` (UUID, PK): References `auth.users`.
- `username` (Text): Unique display name.
- `full_name` (Text): User's full name.
- `email` (Text): User's email.
- `avatar_url` (Text): URL to user's profile picture.
- `created_at` / `updated_at`: Timestamps.

### `publications` / `locations`
Stores user location for prayer time calculation.
- `user_id` (UUID, PK): References `profiles.id`.
- `latitude` (Float): Location latitude.
- `longitude` (Float): Location longitude.
- `is_manual_mode` (Boolean): If custom location is selected.
- `name` (Text): City/Region name.

### `prayer_records`
Logs the status of daily prayers.
- `id` (UUID, PK)
- `user_id` (UUID): References `profiles.id`.
- `date` (Date): The date of the record.
- `fajr`, `dhuhr`, `asr`, `maghrib`, `isha` (Text): Status (e.g., 'completed', 'missed').
- `sunnah_...` (Boolean): Status of Sunnah prayers.

### `qada_prayers`
Tracks the count of missed prayers tracked by the user.
- `id` (UUID, PK)
- `user_id` (UUID): References `profiles.id`.
- `fajr`, `dhuhr`, `asr`, `maghrib`, `isha` (Integer): Count of missed prayers.
- `last_updated` (Timestamp).

### `habits`
Definitions of habits the user wants to track.
- `id` (UUID, PK)
- `user_id` (UUID): References `profiles.id`.
- `name` (Text): Habit name.
- `target_days` (Integer): Weekly target (0-7).
- `is_archived` (Boolean).

### `habit_history`
Daily logs of habit completions.
- `id` (UUID, PK)
- `user_id` (UUID): References `profiles.id`.
- `habit_id` (UUID): References `habits.id`.
- `completed_date` (Date): Date of completion.

### `user_settings`
User preferences.
- `user_id` (UUID, PK): References `profiles.id`.
- `theme` (Text): 'light' or 'dark'.
- `language` (Text): 'ar' or 'en'.
- `calculation_method` (Text): Prayer time calculation method (e.g., 'MWL', 'ISNA').

### `points_history`
Gamification audit log.
- `id` (Text, PK)
- `user_id` (UUID): References `profiles.id`.
- `amount` (SmallInt): Points awarded/deducted.
- `reason` (Text): Description of action.
- `recorded_at` (Timestamp).

## 🚀 Getting Started

### Prerequisites
- A **Supabase** project.
- A basic web server (e.g., VS Code Live Server, python http.server) or just file access (though some browser features require http/https).

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/salatk.git
    cd salatk
    ```

2.  **Environment Setup:**
    Create a `.env` file (or simply update `js/supabaseClient.js` directly if not using a bundler) with your Supabase credentials.
    
    *Note: The current project uses a direct assignment in `js/supabaseClient.js`.*
    
    Open `js/supabaseClient.js` and ensure the `supabaseUrl` and `supabaseKey` are correct.

3.  **Run Locally:**
    Since this is a vanilla JS application, you can serve it using any static file server.
    
    **Using Python:**
    ```bash
    python3 -m http.server 8000
    ```
    
    **Using Node (http-server):**
    ```bash
    npx http-server .
    ```

4.  **Open in Browser:**
    Navigate to `http://localhost:8000` (or the port specified).

## 🌍 Supabase Setup
This project depends on the following Supabase features:
- **Authentication**: Enable Email/Password providers.
- **Database**: Run the migration scripts (found in sql snippets or derived from schema above) to create required tables.
- **Row Level Security (RLS)**: Ensure RLS is enabled on all tables allowing users to only access their own data.

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License
[MIT](LICENSE)
