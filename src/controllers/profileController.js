const db = require("../db");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user data
    const userResult = await db.query(
      `SELECT u.name, u.phone_number, u.subdomain, u.profile_image_url,
              up.brand_name, up.goal_type, up.category_id, up.bio,
              bc.name as business_category_name,
              ut.template_id,
              t.name as template_name
       FROM users u
       LEFT JOIN user_profiles up ON u.id = up.user_id
       LEFT JOIN business_categories bc ON up.category_id = bc.id
       LEFT JOIN user_templates ut ON u.id = ut.user_id
       LEFT JOIN templates t ON ut.template_id = t.id
       WHERE u.id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    // Get user's social links
    const linksResult = await db.query(
      `SELECT ul.url, p.name as platform_name, ul.display_order
       FROM user_links ul
       JOIN platforms p ON ul.platform_id = p.id
       WHERE ul.user_id = $1
       ORDER BY ul.display_order`,
      [userId]
    );

    const profile = {
      ...userResult.rows[0],
      links: linksResult.rows,
    };

    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
    });
  }
};

const updateUserProfile = async (req, res) => {
  const userId = req.user.userId;
  const { name, bio, imageData, brandName, goalType, categoryId, subdomain } =
    req.body;
  let profileImageUrl = null;

  try {
    // Start a transaction
    await db.query("BEGIN");

    // Handle image upload if present
    if (imageData) {
      const { base64String, fileType } = imageData;
      const buffer = Buffer.from(base64String, "base64");
      const fileName = `${userId}-${Date.now()}.${fileType}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from("profile-images")
        .upload(fileName, buffer, {
          contentType: `image/${fileType}`,
          upsert: true,
        });

      if (error) throw error;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("profile-images").getPublicUrl(fileName);

      profileImageUrl = publicUrl;
    }

    // Check if subdomain is already taken
    if (subdomain) {
      const existingSubdomain = await db.query(
        "SELECT id FROM users WHERE subdomain = $1 AND id != $2",
        [subdomain.toLowerCase(), userId]
      );

      if (existingSubdomain.rows.length > 0) {
        await db.query("ROLLBACK");
        return res.status(400).json({
          success: false,
          message: "This subdomain is already taken",
        });
      }
    }

    // Update user table
    await db.query(
      `UPDATE users 
       SET name = $1, 
           profile_image_url = COALESCE($2, profile_image_url),
           subdomain = COALESCE($3, subdomain),
           updated_at = NOW() 
       WHERE id = $4`,
      [name, profileImageUrl, subdomain?.toLowerCase(), userId]
    );

    // Check if user profile exists
    const profileExists = await db.query(
      "SELECT id FROM user_profiles WHERE user_id = $1",
      [userId]
    );

    if (profileExists.rows.length === 0) {
      // Create new profile
      await db.query(
        `INSERT INTO user_profiles (
          user_id, bio, brand_name, goal_type, category_id
        ) VALUES ($1, $2, $3, $4, $5)`,
        [userId, bio, brandName, goalType, categoryId]
      );
    } else {
      // Update existing profile
      await db.query(
        `UPDATE user_profiles 
         SET bio = COALESCE($1, bio),
             brand_name = COALESCE($2, brand_name),
             goal_type = COALESCE($3, goal_type),
             category_id = COALESCE($4, category_id),
             updated_at = NOW()
         WHERE user_id = $5`,
        [bio, brandName, goalType, categoryId, userId]
      );
    }

    await db.query("COMMIT");

    res.json({
      success: true,
      message: "Profile updated successfully",
      profileImageUrl: profileImageUrl,
    });
  } catch (error) {
    await db.query("ROLLBACK");
    console.error("Error updating profile:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
};

const updateBrandName = async (req, res) => {
  const { brandName } = req.body;
  const userId = req.user.userId;

  try {
    // Start a transaction
    await db.query("BEGIN");

    // First check if user profile exists
    const profileExists = await db.query(
      "SELECT id FROM user_profiles WHERE user_id = $1",
      [userId]
    );

    if (profileExists.rows.length === 0) {
      // Create new profile
      await db.query(
        "INSERT INTO user_profiles (user_id, brand_name) VALUES ($1, $2)",
        [userId, brandName]
      );
    } else {
      // Update existing profile
      await db.query(
        "UPDATE user_profiles SET brand_name = $1, updated_at = NOW() WHERE user_id = $2",
        [brandName, userId]
      );
    }

    await db.query("COMMIT");

    res.json({
      success: true,
      message: "Brand name updated successfully",
    });
  } catch (error) {
    await db.query("ROLLBACK");
    console.error("Error updating brand name:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update brand name",
    });
  }
};

const updateSubdomain = async (req, res) => {
  const { subdomain } = req.body;
  const userId = req.user.userId;

  try {
    // Check if subdomain is already taken
    const existingSubdomain = await db.query(
      "SELECT id FROM users WHERE subdomain = $1 AND id != $2",
      [subdomain.toLowerCase(), userId]
    );

    if (existingSubdomain.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "This subdomain is already taken",
      });
    }

    // Update user's subdomain
    await db.query(
      "UPDATE users SET subdomain = $1, updated_at = NOW() WHERE id = $2",
      [subdomain.toLowerCase(), userId]
    );

    res.json({
      success: true,
      message: "Subdomain updated successfully",
    });
  } catch (error) {
    console.error("Error updating subdomain:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update subdomain",
    });
  }
};

const updateGoal = async (req, res) => {
  const { goalType } = req.body;
  const userId = req.user.userId;

  try {
    // Start a transaction
    await db.query("BEGIN");

    // First check if user profile exists
    const profileExists = await db.query(
      "SELECT id FROM user_profiles WHERE user_id = $1",
      [userId]
    );

    if (profileExists.rows.length === 0) {
      // Create new profile
      await db.query(
        "INSERT INTO user_profiles (user_id, goal_type) VALUES ($1, $2)",
        [userId, goalType]
      );
    } else {
      // Update existing profile
      await db.query(
        "UPDATE user_profiles SET goal_type = $1, updated_at = NOW() WHERE user_id = $2",
        [goalType, userId]
      );
    }

    await db.query("COMMIT");

    res.json({
      success: true,
      message: "Goal type updated successfully",
    });
  } catch (error) {
    await db.query("ROLLBACK");
    console.error("Error updating goal type:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update goal type",
    });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  updateBrandName,
  updateSubdomain,
  updateGoal,
};
