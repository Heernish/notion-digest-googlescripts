// ─── CONFIG ───────────────────────────────────────────────────────────────
const NOTION_TOKEN      = 'NOTION TOKEN HERE';
const TASKS_DB_ID       = 'TASK DB HERE'; //Add any DB you want to display info
const WORKOUT_DB_ID     = 'WORKOUT DB HERE';
const MEAL_DB_ID        = 'MEAL DB HERE';
const BIRTHDAY_DB_ID    = 'BIRTHDAY DB HERE';
const EMAIL_RECIPIENT   = 'YOUR_EMAIL@gmail.com';
const NOTION_API_VERSION= '2022-06-28';  // or the latest version
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Main: Fetch Tasks (due or overdue), group by Category, fetch today's Workouts, and email digest.
 */
function sendNotionMorningDigest() {
  const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');

  // 1. Fetch overdue or due-today Tasks
  const tasksPayload = {
    filter: {
      and: [
        { property: 'Due Date', date: { on_or_before: today } },
        { property: 'Status', status: { does_not_equal: 'Done' } },
        { property: 'Status', status: { does_not_equal: 'Rejected' } }
      ]
    },
    sorts: [{ property: 'Due Date', direction: 'ascending' }]
  };
  const tasks = queryDatabase(TASKS_DB_ID, tasksPayload);

  // 2. Group tasks by Tags/Category
  const groupedTasks = {};
  tasks.forEach(page => {
    //Logger.log(JSON.stringify(page.properties, null, 2));
    const catProps = page.properties['Tags']?.multi_select || [];
    if (catProps.length > 0) {
      catProps.forEach(cat => {
        const category = cat.name;
        if (!groupedTasks[category]) groupedTasks[category] = [];
        groupedTasks[category].push(page);
      });
    } else {
      if (!groupedTasks['Uncategorized']) groupedTasks['Uncategorized'] = [];
      groupedTasks['Uncategorized'].push(page);
    }
  });

  // 3. Fetch today's Workouts
  const workoutPayload = {
    filter: {
      property: 'Date',
      date: { equals: today }
    }
  };
  const workouts = queryDatabase(WORKOUT_DB_ID, workoutPayload);

   // 4. Meal Plan: today's meals
  const mealPayload = { filter: { property: 'Date', date: { equals: today } } };
  const mealPages = queryDatabase(MEAL_DB_ID, mealPayload);
  const mealPage = mealPages.length ? mealPages[0] : null;

  // 5. Birthdays: people with birthday today
  const birthdayPayload = { filter: { property: 'Date', date: { equals: today } } };
  const birthdayPages = queryDatabase(BIRTHDAY_DB_ID, birthdayPayload);

   // 3. Build HTML email
  let html = [];
  html.push('<div style="font-family:Arial, sans-serif; color:#333; line-height:1.5;">');
  html.push(`<h1 style="border-bottom:2px solid #eee; padding-bottom:5px;">📅 Notion Daily Digest — ${today}</h1>`);

  // Birthdays section
  html.push('<h2 style="color:#8E44AD;">🎂 Birthdays Today</h2>');
  if (birthdayPages.length) {
    html.push('<ul style="padding-left:20px; list-style-type:disc;">');
    birthdayPages.forEach(page => {
      const name = extractTitle(page);
      html.push(`<li>${name}</li>`);
    });
    html.push('</ul>');
  } else {
    html.push('<p>No birthdays today. 🎉</p>');
  }

  // Meal Plan section
  html.push('<h2 style="color:#D35400;">🍽️ Meal Plan</h2>');
  if (mealPage) {
    const textOrEmpty = (arr) => arr?.map(item => item.plain_text).join('') || '-';
    const breakfast = textOrEmpty(mealPage.properties['Breakfast']?.rich_text);
    const lunch     = textOrEmpty(mealPage.properties['Lunch']?.rich_text);
    const dinner    = textOrEmpty(mealPage.properties['Dinner']?.rich_text);
    html.push('<div style="padding-left:20px;">');
    html.push(`<p style="margin:5px 0;"><strong>Breakfast:</strong> ${breakfast}</p>`);
    html.push(`<p style="margin:5px 0;"><strong>Lunch:</strong> ${lunch}</p>`);
    html.push(`<p style="margin:5px 0;"><strong>Dinner:</strong> ${dinner}</p>`);
    html.push('</div>');
  } else {
    html.push('<p>No meal plan found for today.</p>');
  }

  // Workouts section
  html.push('<h2 style="color:#27AE60;">🏋️ Today&rsquo;s Workouts</h2>');
  if (workouts.length) {
    html.push('<ul style="padding-left:20px; list-style-type:circle;">');
    workouts.forEach(page => {
      const relations = page.properties['Workout Focus Groups']?.relation || [];
      relations.forEach(rel => {
        const name = fetchPageTitle(rel.id);
        html.push(`<li>${name}</li>`);
      });
    });
    html.push('</ul>');
  } else {
    html.push('<p>No workouts scheduled for today. 🏖️</p>');
  }

  // Tasks section
  html.push('<h2 style="color:#2E86C1;">🔔 Overdue / Due Today</h2>');
  if (Object.keys(groupedTasks).length) {
    Object.keys(groupedTasks).forEach(category => {
      html.push(`<h3 style="margin-bottom:2px;">${category}</h3><ul style="padding-left:20px;">`);
      groupedTasks[category].forEach(page => {
        const title = extractTitle(page);
        const due   = page.properties['Due Date'].date.start;
        html.push(`<li><strong>${title}</strong> — <em>${due}</em></li>`);
      });
      html.push('</ul>');
    });
  } else {
    html.push('<p>No overdue or due-today tasks! ✅</p>');
  }

  // Dashboard link
  html.push('<p style="margin-top:20px;"><a href="YOUR NOTION DASHBOARD LINK" style="color:#3498DB; text-decoration:none; font-weight:bold;">🚀 Open Notion Dashboard</a></p>');

  html.push('</div>');
  const htmlBody = html.join('');

  // 4. Send the email with HTML body
  MailApp.sendEmail({
    to:        EMAIL_RECIPIENT,
    subject:   `Morning Notion Digest — ${today}`,
    htmlBody:  htmlBody,
    body:      htmlBody.replace(/<[^>]+>/g, '') // fallback plain text
  });
}

/**
 * Evening Digest: Tasks due today, tomorrow’s workouts, meals, birthdays.
 */
function sendNotionEveningDigest() {
  const now = new Date();
  const tz = Session.getScriptTimeZone();
  const today    = Utilities.formatDate(now, tz, 'yyyy-MM-dd');
  const tomorrow = Utilities.formatDate(new Date(now.getTime()+24*60*60*1000), tz, 'yyyy-MM-dd');

  // Tasks: due today, excluding Completed/Rejected
  const tasks = queryDatabase(TASKS_DB_ID, {
    filter: { and: [
      { property: 'Due Date', date: { on_or_before: today } },
      { property: 'Status', status: { does_not_equal: 'Done' } },
      { property: 'Status', status: { does_not_equal: 'Rejected' } }
    ] }
  });
  // Group tasks by Category
  const groupedTasks = {};
  tasks.forEach(p => {
    const cats = p.properties['Tags']?.multi_select || [];
    if (!cats.length) cats.push({ name: 'Uncategorized' });
    cats.forEach(c => (groupedTasks[c.name] = groupedTasks[c.name] || []).push(p));
  });
 
  // Meal: tomorrow
  const mealPage = queryDatabase(MEAL_DB_ID, { filter: { property: 'Date', date: { equals: tomorrow } } })[0] || null;
  
  // Birthdays: tomorrow
  const birthdays = queryDatabase(BIRTHDAY_DB_ID, { filter: { property: 'Date', date: { equals: tomorrow } } });
  
  // Build HTML
  let html = ['<div style="font-family:Arial,sans-serif;color:#333;line-height:1.5;">'];
  html.push(`<h1 style="border-bottom:2px solid #eee;">🌇 Good Evening — ${today}</h1>`);
  
 // Tasks
  html.push('<h2 style="color:#2E86C1;">🔔 Tasks Overdue/Due Today</h2>');
  if (Object.keys(groupedTasks).length) {
    Object.entries(groupedTasks).forEach(([cat, arr]) => {
      html.push(`<h3>${cat}</h3><ul style="padding-left:20px;">`);
      arr.forEach(p => {
        const title = extractTitle(p);
        const due   = p.properties['Due Date'].date.start;
        html.push(`<li><strong>${title}</strong> — <em>${due}</em></li>`);
      });
      html.push('</ul>');
    });
  } else html.push('<p>No tasks to show. ✅</p>');
  
  html.push('<h2 style="color:#D35400;">🍽️ Tomorrow&rsquo;s Meal Plan</h2>');
  if (mealPage) {
    const txt = arr => arr?.map(i=>i.plain_text).join('')||'-';
    html.push(`<p><strong>Breakfast:</strong> ${txt(mealPage.properties['Breakfast'].rich_text)}</p>`);
    html.push(`<p><strong>Lunch:</strong> ${txt(mealPage.properties['Lunch'].rich_text)}</p>`);
    html.push(`<p><strong>Dinner:</strong> ${txt(mealPage.properties['Dinner'].rich_text)}</p>`);
  } else html.push('<p>No meal plan for tomorrow.</p>');
  html.push('<h2 style="color:#8E44AD;">🎂 Tomorrow&rsquo;s Birthdays</h2>');
  
  if (birthdays.length) {
    html.push('<ul>');
    birthdays.forEach(p => html.push(`<li>${extractTitle(p)}</li>`));
    html.push('</ul>');
  } else html.push('<p>No birthdays tomorrow.</p>');
  html.push(`<p style="margin-top:20px;"><a href="YOUR NOTION DASHBOARD LINK" style="color:#3498DB;">🔗 Open Dashboard</a></p>`);
  html.push('</div>');
  
  // Send
  MailApp.sendEmail({ to: EMAIL_RECIPIENT, subject: `Evening Notion Digest — ${today}`, htmlBody: html.join(''), body: html.join('').replace(/<[^>]+>/g,'') });
}


/** Helper: Query a Notion database and return results array. */
function queryDatabase(databaseId, payload) {
  const url = `https://api.notion.com/v1/databases/${databaseId}/query`;
  const options = {
    method:      'post',
    contentType: 'application/json',
    headers: {
      'Authorization': `Bearer ${NOTION_TOKEN}`,
      'Notion-Version': NOTION_API_VERSION
    },
    payload:     JSON.stringify(payload)
  };
  const resp = UrlFetchApp.fetch(url, options);
  const data = JSON.parse(resp.getContentText());
  return data.results || [];
}

/** Helper: Extract title text from a page object. */
function extractTitle(page) {
  for (let key in page.properties) {
    const prop = page.properties[key];
    if (prop.type === 'title' && prop.title.length) {
      return prop.title[0].plain_text;
    }
  }
  // fallback if none found
  return 'Untitled';
}

/**
 * Helper: Fetch and extract title from a related page by ID.
 */
function fetchPageTitle(pageId) {
  const url = `https://api.notion.com/v1/pages/${pageId}`;
  const options = {
    method:      'get',
    headers: {
      'Authorization': `Bearer ${NOTION_TOKEN}`,
      'Notion-Version': NOTION_API_VERSION
    },
    muteHttpExceptions: true
  };
  const resp = UrlFetchApp.fetch(url, options);
  if (resp.getResponseCode() !== 200) {
    Logger.log(`Page fetch error: ${resp.getContentText()}`);
    return 'Unknown';
  }
  return extractTitle(JSON.parse(resp.getContentText()));
}

/**
 * Create morning and evening triggers.
 */
function createTriggers() {
  // Clear existing
  ScriptApp.getProjectTriggers().forEach(t => {
    if (['sendNotionMorningDigest','sendNotionEveningDigest'].includes(t.getHandlerFunction())) ScriptApp.deleteTrigger(t);
  });
  // Morning at 6 AM
  ScriptApp.newTrigger('sendNotionMorningDigest').timeBased().atHour(6).everyDays(1).inTimezone(Session.getScriptTimeZone()).create();
  // Evening at 9 PM
  ScriptApp.newTrigger('sendNotionEveningDigest').timeBased().atHour(21).everyDays(1).inTimezone(Session.getScriptTimeZone()).create();
}
