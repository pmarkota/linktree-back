const db = require("./index");

const seedBusinessCategories = async () => {
  try {
    // Delete existing categories
    await db.query("DELETE FROM business_categories");

    // Insert new categories
    const categories = [
      {
        name: "Doctor",
        description: "Healthcare professionals and medical services",
      },
      {
        name: "Mentor",
        description: "Coaches, trainers, and educational experts",
      },
      {
        name: "Artist",
        description: "Visual artists, designers, and creative professionals",
      },
      {
        name: "Musician",
        description: "Musicians, bands, and music producers",
      },
      {
        name: "Fitness Trainer",
        description: "Personal trainers and fitness experts",
      },
      {
        name: "Business Owner",
        description: "Entrepreneurs and business professionals",
      },
      {
        name: "Content Creator",
        description: "YouTubers, streamers, and digital content makers",
      },
      {
        name: "Writer",
        description: "Authors, bloggers, and journalists",
      },
      {
        name: "Developer",
        description: "Software developers and tech professionals",
      },
    ];

    for (const category of categories) {
      await db.query(
        "INSERT INTO business_categories (name, description, is_active) VALUES ($1, $2, $3)",
        [category.name, category.description, true]
      );
    }

    console.log("Successfully seeded business categories");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding business categories:", error);
    process.exit(1);
  }
};

seedBusinessCategories();
