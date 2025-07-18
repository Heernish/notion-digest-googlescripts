# Notion Daily & Evening Digest Scripts

This repository provides Google Apps Script functions that automatically send styled email digests based on your Notion databases. You get both a **Morning Digest** and an **Evening Digest** delivered every day. You can use the script as a sample and update to your requirements.

---

## Sample Features

- **Morning Digest** (6:00 AM):
  - Overdue and due-today tasks (grouped by category)
  - Today’s workouts (by focus group)
  - Today’s meal plan (breakfast, lunch, dinner)
  - Today’s birthdays

- **Evening Digest** (9:00 PM):
  - Tasks due today or earlier
  - Tomorrow’s meal plan
  - Tomorrow’s birthdays

- Styled HTML emails with clear headings and links to your Notion dashboard.

---

## Prerequisites

1. **Google Account** with access to [Google Apps Script](https://script.google.com).  
2. A **Notion integration token** with read access to your databases.  
3. Notion **Database IDs** for:
   - Tasks  
   - Workout  
   - Meal Plan  
   - Birthdays  

---

## Setup

1. **Clone or fork** this repository:
   ```bash
   git clone https://github.com/<your-username>/notion-digest-scripts.git

2. Go to [script.google.com](https://script.google.com) and create a **new Apps Script project**.  
3. In the script editor, **replace** the default `Code.gs` content with the code from this repo.  
4. At the top of `Code.gs`, **update** the configuration section with your values:
   ```js
   const NOTION_TOKEN       = 'YOUR_NOTION_TOKEN';
   const TASKS_DB_ID        = 'YOUR_TASKS_DATABASE_ID';
   const WORKOUT_DB_ID      = 'YOUR_WORKOUT_DATABASE_ID';
   const MEAL_DB_ID         = 'YOUR_MEAL_DATABASE_ID';
   const BIRTHDAY_DB_ID     = 'YOUR_BIRTHDAY_DATABASE_ID';
   const EMAIL_RECIPIENT    = 'your.email@example.com';
   const NOTION_API_VERSION = '2022-06-28';

5. Save the script

## Triggers & Deployment

1. In the Apps Script editor, select the function **`createTriggers`** from the function dropdown.  
2. Click  **Run** and accept any permission prompts.  
3. This schedules two daily triggers:  
   - **`sendNotionMorningDigest`** at 6 AM  
   - **`sendNotionEveningDigest`** at 9 PM  

You can also manually test any function by selecting it and clicking **Run**.

---

## 🔧 Customization

- **Trigger times**: Edit `createTriggers()` in `Code.gs` and adjust `.atHour(HOUR)`.  
- **Email content**: Modify the HTML/CSS blocks in the `sendNotion*Digest` functions.  
- **Date filters**: Tweak the Notion API `filter` payloads to include/exclude pages.  
- **Additional sections**: Copy the existing pattern to add new database queries or sections.

---

## 🐛 Debugging & Logs

- Use `Logger.log(...)` in your functions to emit debug info.  
- View logs via **View → Logs** in the Apps Script editor.  
- If the Notion API errors, check:  
  - Your token and database IDs  
  - Property names and types in your Notion schema

---

## 🤝 Contributing

1. **Fork** the repo and create a branch:  
   ```bash
   git checkout -b feature/your-feature