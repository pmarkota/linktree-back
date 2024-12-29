const db = require("../db");

const getTemplates = async (req, res) => {
  try {
    const templates = await db.query(
      "SELECT * FROM templates WHERE is_active = true ORDER BY is_default DESC, created_at ASC"
    );

    res.json({
      success: true,
      templates: templates.rows,
    });
  } catch (error) {
    console.error("Error fetching templates:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch templates",
    });
  }
};

const selectTemplate = async (req, res) => {
  const { templateId } = req.body;
  const userId = req.user.userId;

  try {
    // Check if template exists
    const template = await db.query(
      "SELECT * FROM templates WHERE id = $1 AND is_active = true",
      [templateId]
    );

    if (template.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Template not found",
      });
    }

    // Check if user already has a template selection
    const existingSelection = await db.query(
      "SELECT * FROM user_templates WHERE user_id = $1",
      [userId]
    );

    if (existingSelection.rows.length === 0) {
      // Create new selection
      await db.query(
        "INSERT INTO user_templates (user_id, template_id) VALUES ($1, $2)",
        [userId, templateId]
      );
    } else {
      // Update existing selection
      await db.query(
        "UPDATE user_templates SET template_id = $1, updated_at = NOW() WHERE user_id = $2",
        [templateId, userId]
      );
    }

    res.json({
      success: true,
      message: "Template selected successfully",
    });
  } catch (error) {
    console.error("Error selecting template:", error);
    res.status(500).json({
      success: false,
      message: "Failed to select template",
    });
  }
};

module.exports = {
  getTemplates,
  selectTemplate,
};
