import express from "express";
import cookieParser from "cookie-parser";
import bcrypt from "bcryptjs";
// db.ts loads .env before creating the pool (must be imported first)
import { query } from "./db.js";

const app = express();
const PORT = 3001;
const COOKIE_NAME = "homie_uid";
const COOKIE_SECRET = process.env.COOKIE_SECRET || "dev-secret";

app.use(express.json());
app.use(cookieParser(COOKIE_SECRET));

// ── Helpers ──────────────────────────────────────────────────────────

async function dbQuery(text: string, params?: unknown[]) {
  return query(text, params);
}

function getSessionUserId(req: express.Request): number | null {
  const val = req.signedCookies?.[COOKIE_NAME];
  return val ? Number(val) : null;
}

function setSessionUserId(res: express.Response, userId: number) {
  res.cookie(COOKIE_NAME, String(userId), {
    signed: true,
    httpOnly: true,
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000,
  });
}

function clearSession(res: express.Response) {
  res.clearCookie(COOKIE_NAME);
}

function requireAuth(req: express.Request, res: express.Response): number | null {
  const uid = getSessionUserId(req);
  if (!uid) {
    res.status(401).json({ error: "Not authenticated" });
    return null;
  }
  return uid;
}

// ── Health ───────────────────────────────────────────────────────────

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/db-ping", async (_req, res) => {
  try {
    await dbQuery("SELECT 1");
    res.json({ success: true, message: "Database connection successful" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(503).json({ success: false, message });
  }
});

app.get("/api/health/db", async (_req, res) => {
  try {
    await dbQuery("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(503).json({ status: "error", database: "unreachable", message });
  }
});

// ── Auth ─────────────────────────────────────────────────────────────

app.get("/api/auth/user", async (req, res) => {
  const uid = getSessionUserId(req);
  if (!uid) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  try {
    const { rows } = await dbQuery(
      `SELECT user_id, username, email, first_name, last_name FROM users WHERE user_id = $1`,
      [uid],
    );
    if (rows.length === 0) {
      clearSession(res);
      res.status(401).json({ error: "User not found" });
      return;
    }
    const u = rows[0];
    res.json({
      id: String(u.user_id),
      email: u.email,
      firstName: u.first_name,
      lastName: u.last_name,
      profileImageUrl: null,
      createdAt: null,
      updatedAt: null,
    });
  } catch {
    res.status(401).json({ error: "Not authenticated" });
  }
});

app.post("/api/auth/register", async (req, res) => {
  const { username, email, password, firstName, lastName } = req.body ?? {};
  if (!username || !email || !password || !firstName || !lastName) {
    res.status(400).json({ error: "username, email, password, firstName, lastName required" });
    return;
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await dbQuery(
      `INSERT INTO users (username, password_hash, email, first_name, last_name)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING user_id, username, email, first_name, last_name`,
      [username, hash, email, firstName, lastName],
    );
    const u = rows[0];
    setSessionUserId(res, Number(u.user_id));
    res.status(201).json({
      id: String(u.user_id),
      email: u.email,
      firstName: u.first_name,
      lastName: u.last_name,
      profileImageUrl: null,
    });
  } catch (err: any) {
    if (err?.code === "23505") {
      res.status(409).json({ error: "Username or email already taken" });
      return;
    }
    res.status(500).json({ error: "Registration failed", details: err?.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body ?? {};
  if (!username || !password) {
    res.status(400).json({ error: "username and password required" });
    return;
  }
  try {
    const { rows } = await dbQuery(
      `SELECT user_id, username, email, first_name, last_name, password_hash
       FROM users WHERE username = $1 OR email = $1`,
      [username],
    );
    if (rows.length === 0) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const u = rows[0];
    const valid = await bcrypt.compare(password, u.password_hash);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    setSessionUserId(res, Number(u.user_id));
    res.json({
      id: String(u.user_id),
      email: u.email,
      firstName: u.first_name,
      lastName: u.last_name,
      profileImageUrl: null,
    });
  } catch (err: any) {
    res.status(500).json({ error: "Login failed", details: err?.message });
  }
});

/**
 * GET /api/login – Dev convenience: auto-login as first seeded user, redirect to app.
 * The frontend navigates here via window.location.href = "/api/login".
 */
app.get("/api/login", async (_req, res) => {
  try {
    const { rows } = await dbQuery(
      `SELECT user_id FROM users ORDER BY user_id ASC LIMIT 1`,
    );
    if (rows.length > 0) {
      setSessionUserId(res, Number(rows[0].user_id));
    }
  } catch {
    // DB not available – skip
  }
  res.redirect("/");
});

app.get("/api/logout", (_req, res) => {
  clearSession(res);
  res.redirect("/");
});

// ── Users (dev/admin) ────────────────────────────────────────────────

app.get("/api/users", async (_req, res) => {
  try {
    const { rows } = await dbQuery(
      `SELECT user_id, username, email, first_name, last_name, created_date, updated_date
       FROM users ORDER BY user_id`,
    );
    res.json(
      rows.map((u: any) => ({
        id: String(u.user_id),
        username: u.username,
        email: u.email,
        firstName: u.first_name,
        lastName: u.last_name,
        createdDate: u.created_date,
        updatedDate: u.updated_date,
      })),
    );
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch users", details: err?.message });
  }
});

// ── Goals ────────────────────────────────────────────────────────────

function mapGoalRow(row: any) {
  return {
    id: Number(row.goal_id),
    userId: String(row.user_id),
    category: row.category_name ?? "Other",
    title: row.goal_name,
    description: null,
    isCompleted: row.is_completed,
    targetDate: row.due_date,
    completedAt: row.completed_date,
    targetValue: null,
    currentValue: null,
  };
}

const GOALS_SELECT = `
  SELECT g.goal_id, g.user_id, g.goal_name, g.due_date,
         g.is_completed, g.completed_date, g.created_date,
         gc.category_name
  FROM goals g
  JOIN goal_categories gc ON gc.category_id = g.category_id`;

app.get("/api/goals", async (req, res) => {
  const uid = requireAuth(req, res);
  if (!uid) return;
  try {
    const { rows } = await dbQuery(
      `${GOALS_SELECT} WHERE g.user_id = $1 ORDER BY g.created_date DESC`,
      [uid],
    );
    res.json(rows.map(mapGoalRow));
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch goals", details: err?.message });
  }
});

app.post("/api/goals/generate-defaults", async (req, res) => {
  const uid = requireAuth(req, res);
  if (!uid) return;

  const defaults = [
    { category: "Credit", name: "Check your credit score" },
    { category: "Credit", name: "Review credit report for errors" },
    { category: "Savings", name: "Set up automatic savings transfer" },
    { category: "Savings", name: "Build 3-month emergency fund" },
    { category: "Govt Assistance", name: "Research first-time buyer programs" },
    { category: "Location Research", name: "Identify 3 target neighborhoods" },
    { category: "Tour Homes", name: "Attend an open house" },
  ];

  try {
    let count = 0;
    for (const d of defaults) {
      const catResult = await dbQuery(
        `SELECT category_id FROM goal_categories WHERE category_name = $1`,
        [d.category],
      );
      if (catResult.rows.length === 0) continue;
      await dbQuery(
        `INSERT INTO goals (user_id, category_id, goal_name)
         VALUES ($1, $2, $3)`,
        [uid, catResult.rows[0].category_id, d.name],
      );
      count++;
    }
    res.status(201).json({ message: "Default goals created", count });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to generate goals", details: err?.message });
  }
});

app.post("/api/goals", async (req, res) => {
  const uid = requireAuth(req, res);
  if (!uid) return;
  const { title, category, targetDate } = req.body ?? {};
  if (!title) {
    res.status(400).json({ error: "title is required" });
    return;
  }
  try {
    const catName = category || "Other";
    const catResult = await dbQuery(
      `SELECT category_id FROM goal_categories WHERE category_name = $1`,
      [catName],
    );
    if (catResult.rows.length === 0) {
      res.status(400).json({ error: `Unknown category: ${catName}` });
      return;
    }
    const categoryId = catResult.rows[0].category_id;
    const { rows } = await dbQuery(
      `INSERT INTO goals (user_id, category_id, goal_name, due_date)
       VALUES ($1, $2, $3, $4)
       RETURNING goal_id`,
      [uid, categoryId, title, targetDate || null],
    );
    const full = await dbQuery(`${GOALS_SELECT} WHERE g.goal_id = $1`, [rows[0].goal_id]);
    res.status(201).json(mapGoalRow(full.rows[0]));
  } catch (err: any) {
    res.status(500).json({ error: "Failed to create goal", details: err?.message });
  }
});

app.patch("/api/goals/:id", async (req, res) => {
  const uid = requireAuth(req, res);
  if (!uid) return;
  const goalId = Number(req.params.id);
  const { isCompleted, title, category, targetDate } = req.body ?? {};

  try {
    const sets: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (typeof isCompleted === "boolean") {
      sets.push(`is_completed = $${idx++}`);
      params.push(isCompleted);
      sets.push(`completed_date = $${idx++}`);
      params.push(isCompleted ? new Date().toISOString() : null);
    }
    if (title !== undefined) {
      sets.push(`goal_name = $${idx++}`);
      params.push(title);
    }
    if (category !== undefined) {
      const catResult = await dbQuery(
        `SELECT category_id FROM goal_categories WHERE category_name = $1`,
        [category],
      );
      if (catResult.rows.length === 0) {
        res.status(400).json({ error: `Unknown category: ${category}` });
        return;
      }
      sets.push(`category_id = $${idx++}`);
      params.push(catResult.rows[0].category_id);
    }
    if (targetDate !== undefined) {
      sets.push(`due_date = $${idx++}`);
      params.push(targetDate || null);
    }

    if (sets.length === 0) {
      res.status(400).json({ error: "No fields to update" });
      return;
    }

    sets.push(`updated_date = NOW()`);
    params.push(goalId, uid);

    const { rowCount } = await dbQuery(
      `UPDATE goals SET ${sets.join(", ")}
       WHERE goal_id = $${idx++} AND user_id = $${idx++}`,
      params,
    );
    if (rowCount === 0) {
      res.status(404).json({ message: "Goal not found" });
      return;
    }

    const full = await dbQuery(`${GOALS_SELECT} WHERE g.goal_id = $1`, [goalId]);
    res.json(mapGoalRow(full.rows[0]));
  } catch (err: any) {
    res.status(500).json({ error: "Failed to update goal", details: err?.message });
  }
});

app.delete("/api/goals/:id", async (req, res) => {
  const uid = requireAuth(req, res);
  if (!uid) return;
  const goalId = Number(req.params.id);
  try {
    const { rowCount } = await dbQuery(
      `DELETE FROM goals WHERE goal_id = $1 AND user_id = $2`,
      [goalId, uid],
    );
    if (rowCount === 0) {
      res.status(404).json({ message: "Goal not found" });
      return;
    }
    res.status(204).end();
  } catch (err: any) {
    res.status(500).json({ error: "Failed to delete goal", details: err?.message });
  }
});

// ── User Settings (mapped to plan table) ─────────────────────────────

function mapPlanRow(row: any) {
  return {
    id: Number(row.user_id),
    userId: String(row.user_id),
    currentSavings: row.current_savings ?? "0",
    monthlySavingsTarget: row.per_month_savings ?? "0",
    targetPurchaseDate: row.target_purchase_date,
    targetPriceMin: row.target_range_low ?? "0",
    targetPriceMax: row.target_range_high ?? "0",
    onboardingCompleted: true,
  };
}

app.get("/api/user-settings", async (req, res) => {
  const uid = requireAuth(req, res);
  if (!uid) return;
  try {
    const { rows } = await dbQuery(`SELECT * FROM plan WHERE user_id = $1`, [uid]);
    if (rows.length === 0) {
      res.json({
        id: uid,
        userId: String(uid),
        currentSavings: "0",
        monthlySavingsTarget: "0",
        targetPurchaseDate: null,
        targetPriceMin: "0",
        targetPriceMax: "0",
        onboardingCompleted: false,
      });
      return;
    }
    res.json(mapPlanRow(rows[0]));
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch settings", details: err?.message });
  }
});

app.patch("/api/user-settings", async (req, res) => {
  const uid = requireAuth(req, res);
  if (!uid) return;
  const { currentSavings, monthlySavingsTarget, targetPurchaseDate, targetPriceMin, targetPriceMax } =
    req.body ?? {};

  try {
    const { rows } = await dbQuery(
      `INSERT INTO plan (user_id, current_savings, per_month_savings, target_purchase_date,
                         target_range_low, target_range_high)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id) DO UPDATE SET
         current_savings      = COALESCE($2, plan.current_savings),
         per_month_savings    = COALESCE($3, plan.per_month_savings),
         target_purchase_date = COALESCE($4, plan.target_purchase_date),
         target_range_low     = COALESCE($5, plan.target_range_low),
         target_range_high    = COALESCE($6, plan.target_range_high),
         updated_date         = NOW()
       RETURNING *`,
      [uid, currentSavings ?? 0, monthlySavingsTarget ?? 0, targetPurchaseDate || null, targetPriceMin ?? null, targetPriceMax ?? null],
    );
    res.json(mapPlanRow(rows[0]));
  } catch (err: any) {
    res.status(500).json({ error: "Failed to update settings", details: err?.message });
  }
});

// ── Plan (direct REST endpoints) ─────────────────────────────────────

app.get("/api/plan", async (req, res) => {
  const userId = req.query.user_id ? Number(req.query.user_id) : requireAuth(req, res);
  if (!userId) return;
  try {
    const { rows } = await dbQuery(`SELECT * FROM plan WHERE user_id = $1`, [userId]);
    if (rows.length === 0) {
      res.status(404).json({ error: "No plan found for this user" });
      return;
    }
    res.json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch plan", details: err?.message });
  }
});

app.post("/api/plan", async (req, res) => {
  const uid = requireAuth(req, res);
  if (!uid) return;
  const { current_savings, target_range_low, target_range_high, target_purchase_date, per_month_savings, down_payment_percent } =
    req.body ?? {};
  try {
    const { rows } = await dbQuery(
      `INSERT INTO plan (user_id, current_savings, target_range_low, target_range_high,
                         target_purchase_date, per_month_savings, down_payment_percent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (user_id) DO UPDATE SET
         current_savings      = COALESCE($2, plan.current_savings),
         target_range_low     = COALESCE($3, plan.target_range_low),
         target_range_high    = COALESCE($4, plan.target_range_high),
         target_purchase_date = COALESCE($5, plan.target_purchase_date),
         per_month_savings    = COALESCE($6, plan.per_month_savings),
         down_payment_percent = COALESCE($7, plan.down_payment_percent),
         updated_date         = NOW()
       RETURNING *`,
      [uid, current_savings ?? 0, target_range_low ?? null, target_range_high ?? null, target_purchase_date ?? null, per_month_savings ?? 0, down_payment_percent ?? null],
    );
    res.json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to upsert plan", details: err?.message });
  }
});

// ── Reviews ──────────────────────────────────────────────────────────

app.get("/api/reviews", async (_req, res) => {
  try {
    const { rows } = await dbQuery(
      `SELECT r.review_id, r.user_id, r.review_title, r.num_stars, r.review_text, r.created_date,
              u.username, u.first_name, u.last_name
       FROM reviews r
       JOIN users u ON u.user_id = r.user_id
       ORDER BY r.created_date DESC`,
    );
    res.json(
      rows.map((r: any) => ({
        reviewId: r.review_id,
        userId: String(r.user_id),
        reviewTitle: r.review_title,
        numStars: r.num_stars,
        reviewText: r.review_text,
        createdDate: r.created_date,
        username: r.username,
        authorName: `${r.first_name} ${r.last_name}`,
      })),
    );
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch reviews", details: err?.message });
  }
});

app.post("/api/reviews", async (req, res) => {
  const uid = requireAuth(req, res);
  if (!uid) return;
  const { reviewTitle, numStars, reviewText } = req.body ?? {};
  if (!reviewTitle || !numStars) {
    res.status(400).json({ error: "reviewTitle and numStars required" });
    return;
  }
  if (numStars < 1 || numStars > 5) {
    res.status(400).json({ error: "numStars must be between 1 and 5" });
    return;
  }
  try {
    const { rows } = await dbQuery(
      `INSERT INTO reviews (user_id, review_title, num_stars, review_text)
       VALUES ($1, $2, $3, $4)
       RETURNING review_id, user_id, review_title, num_stars, review_text, created_date`,
      [uid, reviewTitle, numStars, reviewText || null],
    );
    const r = rows[0];
    res.status(201).json({
      reviewId: r.review_id,
      userId: String(r.user_id),
      reviewTitle: r.review_title,
      numStars: r.num_stars,
      reviewText: r.review_text,
      createdDate: r.created_date,
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to create review", details: err?.message });
  }
});

// ── Resources (static – no DDL table) ────────────────────────────────

const STATIC_RESOURCES = [
  {
    id: 1,
    title: "Understanding Your Credit Score",
    description: "Learn what makes up your credit score and how to improve it before applying for a mortgage.",
    content: "Your credit score is one of the most important factors in getting approved for a mortgage and securing a good interest rate.\n\nWhat Makes Up Your Score:\n- Payment History (35%): Pay all bills on time\n- Credit Utilization (30%): Keep balances below 30% of limits\n- Length of Credit History (15%): Keep old accounts open\n- Credit Mix (10%): Have different types of credit\n- New Credit (10%): Avoid opening many new accounts at once\n\nTips to Improve:\n1. Set up automatic payments for all bills\n2. Pay down credit card balances\n3. Don't close old credit cards\n4. Dispute any errors on your credit report\n5. Avoid applying for new credit before your mortgage application",
    category: "Credit",
    imageUrl: null,
    readTimeMinutes: 5,
  },
  {
    id: 2,
    title: "First-Time Home Buyer Programs",
    description: "A guide to federal and state programs that can help first-time buyers with down payments and closing costs.",
    content: "There are many programs designed to help first-time home buyers get into their first home with less money upfront.\n\nFederal Programs:\n- FHA Loans: As low as 3.5% down payment with credit score of 580+\n- VA Loans: Zero down payment for eligible veterans and service members\n- USDA Loans: Zero down payment for rural and suburban properties\n\nState Programs:\nMost states offer additional assistance including:\n- Down payment assistance grants\n- Below-market interest rates\n- Tax credits for mortgage interest\n\nHow to Qualify:\n1. Check income limits for your area\n2. Complete a homebuyer education course\n3. Work with a lender familiar with these programs\n4. Apply early—some programs have limited funding",
    category: "Govt Assistance",
    imageUrl: null,
    readTimeMinutes: 7,
  },
  {
    id: 3,
    title: "How to Save for a Down Payment",
    description: "Practical strategies to build your savings and reach your down payment goal faster.",
    content: "Saving for a down payment is often the biggest hurdle for new home buyers. Here are proven strategies to get there faster.\n\nSet Your Target:\n- Conventional loans: 5-20% of home price\n- FHA loans: 3.5% minimum\n- Calculate your specific number based on your price range\n\nSavings Strategies:\n1. Open a dedicated high-yield savings account\n2. Set up automatic transfers on payday\n3. Cut discretionary spending (subscriptions, dining out)\n4. Put bonuses and tax refunds directly into savings\n5. Consider a side hustle for extra income\n\nTimeline Planning:\nIf your goal is $30,000 and you save $1,500/month, you'll reach it in 20 months. Use our savings calculator to plan your timeline.",
    category: "Savings",
    imageUrl: null,
    readTimeMinutes: 6,
  },
  {
    id: 4,
    title: "What to Look for When Touring Homes",
    description: "A checklist of things to inspect and questions to ask when visiting potential homes.",
    content: "Touring homes can be exciting but overwhelming. Use this guide to evaluate each property systematically.\n\nStructural Checklist:\n- Foundation: Look for cracks or water damage\n- Roof: Ask about age and recent repairs\n- Windows: Check for drafts and proper sealing\n- Plumbing: Run faucets, check water pressure\n- Electrical: Test outlets, check panel age\n\nNeighborhood Factors:\n- Drive by at different times of day\n- Check school ratings even if you don't have kids (affects resale)\n- Note proximity to grocery stores, hospitals, transit\n- Research flood zones and natural disaster risk\n\nQuestions to Ask:\n1. How long has the home been on the market?\n2. Why is the seller moving?\n3. What's included in the sale?\n4. Are there any known issues or recent repairs?\n5. What are the average utility costs?",
    category: "Tour Homes",
    imageUrl: null,
    readTimeMinutes: 8,
  },
  {
    id: 5,
    title: "Choosing the Right Neighborhood",
    description: "How to research and evaluate neighborhoods to find the best fit for your lifestyle and budget.",
    content: "The neighborhood you choose is just as important as the home itself. Here's how to make a smart decision.\n\nResearch Online:\n- Use crime mapping tools to check safety statistics\n- Review school ratings on GreatSchools.org\n- Check home value trends on Zillow or Redfin\n- Look at planned developments that could affect property values\n\nVisit In Person:\n- Walk the neighborhood at different times\n- Talk to potential neighbors\n- Check noise levels from highways, airports, or trains\n- Note the condition of nearby homes\n\nPractical Considerations:\n- Commute time to work\n- Access to public transportation\n- Proximity to healthcare, shopping, and recreation\n- Property tax rates (can vary significantly between neighborhoods)\n- HOA fees and rules if applicable",
    category: "Location Research",
    imageUrl: null,
    readTimeMinutes: 6,
  },
];

app.get("/api/resources", (_req, res) => {
  res.json(STATIC_RESOURCES.map(({ content: _c, ...rest }) => rest));
});

app.get("/api/resources/:id", (req, res) => {
  const id = Number(req.params.id);
  const resource = STATIC_RESOURCES.find((r) => r.id === id);
  if (!resource) {
    res.status(404).json({ message: "Resource not found" });
    return;
  }
  res.json(resource);
});

// ── Global error handler ─────────────────────────────────────────────

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled error:", err?.message || err);
  res.status(500).json({
    error: "Internal server error",
    details: process.env.NODE_ENV === "production" ? undefined : err?.message,
  });
});

// ── Start ────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
