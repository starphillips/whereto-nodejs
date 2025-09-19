import { Router, Request, Response } from "express";
import { pool } from "../db";

const router = Router();

// post a comment
router.post("/:thread", async (req: Request, res: Response) => {
  const { thread } = req.params;
  const { name, comment, social, parent_id } = req.body;

  if (!name || !comment) {
    return res.status(400).send("Name and comment are required.");
  }

  let socialUrl = social?.trim() || null;
  if (socialUrl && !/^https?:\/\//i.test(socialUrl)) {
    socialUrl = "https://" + socialUrl;
  }

  try {
    await pool.query(
      `INSERT INTO comments (thread, parent_id, name, social_url, text)
       VALUES ($1, $2, $3, $4, $5)`,
      [thread, parent_id || null, name.slice(0, 80), socialUrl?.slice(0, 255), comment]
    );
    res.redirect(req.get("Referrer") || "/index.html#blog-comments");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error saving comment");
  }
});

// fetch comments for a thread
router.get("/:thread", async (req: Request, res: Response) => {
  const { thread } = req.params;

  try {
    const result = await pool.query(
      `SELECT * FROM comments WHERE thread=$1 AND is_approved=true ORDER BY created_at ASC`,
      [thread]
    );

    const items = result.rows;
    const roots = items.filter((c) => !c.parent_id);
    const repliesByParent: Record<number, any[]> = {};
    items.forEach((c) => {
      if (c.parent_id) {
        repliesByParent[c.parent_id] = repliesByParent[c.parent_id] || [];
        repliesByParent[c.parent_id].push(c);
      }
    });

    res.json({ roots, replies: repliesByParent });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching comments");
  }
});

export default router;
