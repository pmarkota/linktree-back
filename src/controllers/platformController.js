const db = require("../db");

const getPlatforms = async (req, res) => {
  try {
    const platforms = await db.query(
      "SELECT * FROM platforms WHERE is_active = true ORDER BY name ASC"
    );

    res.json({
      success: true,
      platforms: platforms.rows,
    });
  } catch (error) {
    console.error("Error fetching platforms:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch platforms",
    });
  }
};

const getUserLinks = async (req, res) => {
  const userId = req.user.userId;

  try {
    const links = await db.query(
      `SELECT ul.*, p.name as platform_name, p.icon_url 
       FROM user_links ul 
       JOIN platforms p ON ul.platform_id = p.id 
       WHERE ul.user_id = $1 AND ul.is_active = true 
       ORDER BY ul.display_order ASC`,
      [userId]
    );

    res.json({
      success: true,
      links: links.rows,
    });
  } catch (error) {
    console.error("Error fetching user links:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user links",
    });
  }
};

const saveSocialLinks = async (req, res) => {
  const { links } = req.body;
  const userId = req.user.userId;

  try {
    // Start a transaction
    await db.query("BEGIN");

    // Deactivate all existing links
    await db.query(
      "UPDATE user_links SET is_active = false WHERE user_id = $1",
      [userId]
    );

    // Insert new links
    for (let i = 0; i < links.length; i++) {
      const { platformId, url } = links[i];

      await db.query(
        `INSERT INTO user_links (
          user_id, platform_id, url, display_order, is_active
        ) VALUES ($1, $2, $3, $4, true)`,
        [userId, platformId, url, i]
      );
    }

    // Commit transaction
    await db.query("COMMIT");

    res.json({
      success: true,
      message: "Social links saved successfully",
    });
  } catch (error) {
    // Rollback in case of error
    await db.query("ROLLBACK");
    console.error("Error saving social links:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save social links",
    });
  }
};

module.exports = {
  getPlatforms,
  getUserLinks,
  saveSocialLinks,
};
