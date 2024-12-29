const db = require("../db");

const getDashboardData = async (req, res) => {
  const userId = req.user.userId;
  console.log("Fetching dashboard data for user:", userId); // Debug log

  try {
    // Start a transaction
    await db.query("BEGIN");
    console.log("Transaction started"); // Debug log

    // Get user profile data
    console.log("Fetching user profile data..."); // Debug log
    const profileResult = await db.query(
      `SELECT 
        u.name, u.subdomain, u.profile_image_url,
        up.brand_name, up.bio, up.goal_type,
        bc.name as business_category_name
       FROM users u
       LEFT JOIN user_profiles up ON u.id = up.user_id
       LEFT JOIN business_categories bc ON up.category_id = bc.id
       WHERE u.id = $1`,
      [userId]
    );
    console.log("Profile data fetched:", profileResult.rows[0]); // Debug log

    // Get user's template
    console.log("Fetching template data..."); // Debug log
    const templateResult = await db.query(
      `SELECT t.name as template_name, t.template_data
       FROM user_templates ut
       JOIN templates t ON ut.template_id = t.id
       WHERE ut.user_id = $1`,
      [userId]
    );
    console.log("Template data fetched:", templateResult.rows[0]); // Debug log

    // Get user's social links
    console.log("Fetching social links..."); // Debug log
    const linksResult = await db.query(
      `SELECT ul.*, p.name as platform_name, p.icon_url
       FROM user_links ul
       JOIN platforms p ON ul.platform_id = p.id
       WHERE ul.user_id = $1 AND ul.is_active = true
       ORDER BY ul.display_order ASC`,
      [userId]
    );
    console.log("Social links fetched:", linksResult.rows.length, "links"); // Debug log

    // Get analytics data
    console.log("Fetching analytics data..."); // Debug log
    const analyticsResult = await db.query(
      `SELECT 
        COALESCE(SUM(page_views), 0) as total_views,
        COALESCE(SUM(total_clicks), 0) as total_clicks
       FROM analytics
       WHERE user_id = $1
       AND date >= NOW() - INTERVAL '30 days'`,
      [userId]
    );
    console.log("Analytics data fetched:", analyticsResult.rows[0]); // Debug log

    // Get daily analytics for the chart
    console.log("Fetching daily analytics..."); // Debug log
    const dailyAnalyticsResult = await db.query(
      `SELECT 
        date,
        COALESCE(page_views, 0) as page_views,
        COALESCE(total_clicks, 0) as total_clicks
       FROM (
         SELECT generate_series(
           NOW() - INTERVAL '29 days',
           NOW(),
           INTERVAL '1 day'
         )::date as date
       ) d
       LEFT JOIN (
         SELECT date, page_views, total_clicks
         FROM analytics
         WHERE user_id = $1
         AND date >= NOW() - INTERVAL '30 days'
       ) a USING (date)
       ORDER BY date ASC`,
      [userId]
    );
    console.log(
      "Daily analytics fetched:",
      dailyAnalyticsResult.rows.length,
      "days"
    ); // Debug log

    // Commit transaction
    await db.query("COMMIT");
    console.log("Transaction committed"); // Debug log

    // Format the response
    const dashboardData = {
      profile: profileResult.rows[0] || {},
      template: templateResult.rows[0] || {},
      links: linksResult.rows || [],
      analytics: {
        totalViews: parseInt(analyticsResult.rows[0]?.total_views || 0),
        totalClicks: parseInt(analyticsResult.rows[0]?.total_clicks || 0),
        dailyStats: dailyAnalyticsResult.rows.map((row) => ({
          ...row,
          page_views: parseInt(row.page_views),
          total_clicks: parseInt(row.total_clicks),
          date: row.date.toISOString().split("T")[0],
        })),
      },
    };

    console.log("Sending dashboard data response"); // Debug log
    res.json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    // Rollback in case of error
    await db.query("ROLLBACK");
    console.error("Error in getDashboardData:", error); // Debug log
    console.error("Error stack:", error.stack); // Debug log
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard data",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  getDashboardData,
};
