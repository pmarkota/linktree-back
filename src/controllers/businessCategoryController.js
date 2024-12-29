const db = require("../db");

// Get all active business categories
const getBusinessCategories = async (req, res) => {
  try {
    const result = await db.query(
      "SELECT id, name, description FROM business_categories WHERE is_active = true ORDER BY name ASC"
    );

    res.json({
      success: true,
      categories: result.rows,
    });
  } catch (error) {
    console.error("Error fetching business categories:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch business categories",
    });
  }
};

// Select business category for user
const selectBusinessCategory = async (req, res) => {
  const { categoryId } = req.body;
  const userId = req.user.userId; // From auth middleware

  try {
    // Check if user profile exists
    let userProfile = await db.query(
      "SELECT * FROM user_profiles WHERE user_id = $1",
      [userId]
    );

    if (userProfile.rows.length === 0) {
      // Create new profile
      await db.query(
        "INSERT INTO user_profiles (user_id, category_id) VALUES ($1, $2)",
        [userId, categoryId]
      );
    } else {
      // Update existing profile
      await db.query(
        "UPDATE user_profiles SET category_id = $1 WHERE user_id = $2",
        [categoryId, userId]
      );
    }

    res.json({
      success: true,
      message: "Business category selected successfully",
    });
  } catch (error) {
    console.error("Error selecting business category:", error);
    res.status(500).json({
      success: false,
      message: "Failed to select business category",
    });
  }
};

module.exports = {
  getBusinessCategories,
  selectBusinessCategory,
};
