import express, {Request, Response, Application} from "express";
import {Pool, QueryResult} from "pg";

const app: Application = express();
const port = 3000;

// Define the structures for type safety
interface DateIdea {
  idea_id: number;
  title: string;
  activity_type: "STAY_IN" | "GO_OUT";
  // Price is returned as a string from the PostgreSQL DECIMAL type
  est_price_per_person: string;
  creator_username: string | null;
}

interface User {
  user_id: number;
  username: string;
  first_name: string | null;
  last_name: string | null;
  created_at: string; // TIMESTAMP is often returned as a string
}

// PostgreSQL Connection Pool: Connects to the Docker container
// NOTE: Ensure these credentials match your Docker setup.
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "date_ideas_db",
  password: "mysecretpassword",
  port: 5432,
});

app.use(express.json());

// --- ENDPOINT 1: Get all public date ideas ---
app.get(
  "/api/ideas",
  async (req: Request, res: Response<DateIdea[] | {error: string}>) => {
    try {
      // NOTE: The previous SQL had a WHERE di.is_public = FALSE which is usually incorrect for a public list.
      // I've removed that WHERE clause to fetch all ideas, as intended for an "Explore" screen.
      const queryText = `
            SELECT
                di.idea_id,
                di.title,
                di.activity_type,
                di.est_price_per_person::text as est_price_per_person, 
                di.latitude,
                di.longitude,
                u.username as creator_username
            FROM Date_Ideas di
            LEFT JOIN Users u ON di.user_id = u.user_id
            -- WHERE di.is_public = TRUE -- Use this if you have a public flag
            ORDER BY di.idea_id DESC
        `;

      const result: QueryResult<DateIdea> = await pool.query(queryText);

      res.json(result.rows);
    } catch (err) {
      console.error("Database query error in /api/ideas:", err);
      res.status(500).json({error: "Failed to retrieve ideas."});
    }
  }
);

// --- NEW ENDPOINT 2: Create a new date idea (POST) ---
app.post(
  "/api/ideas",
  async (req: Request, res: Response<DateIdea | {error: string}>) => {
    // Ensure all required fields are present
    const {title, activity_type, est_price_per_person, creator_username} =
      req.body;

    if (!title || !activity_type || est_price_per_person === undefined) {
      return res
        .status(400)
        .json({
          error:
            "Missing required fields: title, activity_type, or est_price_per_person.",
        });
    }

    try {
      // Find user_id if a creator_username is provided
      let userId: number | null = null;
      if (creator_username) {
        const userQuery = await pool.query(
          "SELECT user_id FROM Users WHERE username = $1",
          [creator_username]
        );
        userId = userQuery.rows.length > 0 ? userQuery.rows[0].user_id : null;
      }

      // Insert the new idea. user_id will be NULL if no matching username was found.
      const queryText = `
            INSERT INTO Date_Ideas (title, activity_type, est_price_per_person, user_id, is_public)
            VALUES ($1, $2, $3::DECIMAL, $4, TRUE) 
            RETURNING idea_id, title, activity_type, est_price_per_person::text, ${
              userId
                ? " (SELECT username FROM Users WHERE user_id = $4) AS creator_username"
                : "NULL AS creator_username"
            };
        `;

      const values = [title, activity_type, est_price_per_person, userId];
      const result: QueryResult<DateIdea> = await pool.query(queryText, values);

      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error("Database query error in POST /api/ideas:", err);
      res.status(500).json({error: "Failed to create new idea."});
    }
  }
);

// --- NEW ENDPOINT 3: Update an existing date idea (PUT) ---
app.put(
  "/api/ideas/:id",
  async (
    req: Request<{id: string}>,
    res: Response<DateIdea | {error: string}>
  ) => {
    const ideaId = parseInt(req.params.id);
    // Destructure the new location fields from the request body
    const {title, activity_type, est_price_per_person, latitude, longitude} =
      req.body;

    if (isNaN(ideaId)) {
      return res.status(400).json({error: "Invalid idea ID format."});
    }

    if (!title || !activity_type || est_price_per_person === undefined) {
      return res
        .status(400)
        .json({error: "Missing required fields for update."});
    }

    try {
      const queryText = `
            UPDATE Date_Ideas
            SET 
                title = $1, 
                activity_type = $2, 
                est_price_per_person = $3::DECIMAL,
                latitude = $5,     -- ADDED LATITUDE
                longitude = $6     -- ADDED LONGITUDE
            WHERE idea_id = $4
            RETURNING idea_id, title, activity_type, est_price_per_person::text
        `;

      // Ensure values are in order with the SQL placeholders ($1, $2, etc.)
      const values = [
        title,
        activity_type,
        est_price_per_person,
        ideaId, // $4
        latitude || null, // $5: Send null if blank
        longitude || null, // $6: Send null if blank
      ];

      const result: QueryResult<DateIdea> = await pool.query(queryText, values);

      if (result.rowCount === 0) {
        return res.status(404).json({error: "Idea not found."});
      }

      res.json(result.rows[0]);
    } catch (err) {
      console.error(`Database query error in PUT /api/ideas/${ideaId}:`, err);
      res.status(500).json({error: "Failed to update idea."});
    }
  }
);

// --- NEW ENDPOINT 4: Delete a date idea (DELETE) ---
app.delete(
  "/api/ideas/:id",
  async (
    req: Request<{id: string}>,
    res: Response<{message: string} | {error: string}>
  ) => {
    const ideaId = parseInt(req.params.id);

    if (isNaN(ideaId)) {
      return res.status(400).json({error: "Invalid idea ID format."});
    }

    try {
      const queryText = "DELETE FROM Date_Ideas WHERE idea_id = $1";
      const result = await pool.query(queryText, [ideaId]);

      if (result.rowCount === 0) {
        return res.status(404).json({error: "Idea not found."});
      }

      res.status(200).json({message: "Idea successfully deleted."});
    } catch (err) {
      console.error(
        `Database query error in DELETE /api/ideas/${ideaId}:`,
        err
      );
      res.status(500).json({error: "Failed to delete idea."});
    }
  }
);

// --- ENDPOINT 5: Get all users (non-sensitive data only) ---
// (Kept for completeness, remains unchanged)
app.get(
  "/api/users",
  async (req: Request, res: Response<User[] | {error: string}>) => {
    try {
      const queryText = `
            SELECT
                user_id,
                username,
                first_name,
                last_name,
                created_at
            FROM Users
            ORDER BY user_id ASC
        `;

      const result: QueryResult<User> = await pool.query(queryText);

      res.json(result.rows);
    } catch (err) {
      console.error("Database query error in /api/users:", err);
      res.status(500).json({error: "Failed to retrieve users."});
    }
  }
);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  // Reminder for React Native: use the correct IP address for your local network
  console.log(`Ideas endpoint: http://192.168.86.56:${port}/api/ideas`);
});
