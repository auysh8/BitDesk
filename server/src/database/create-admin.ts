// server/src/database/create-admin.ts
import mongoose from "mongoose";
import appConfig from "../config/config.js";
import User from "../modules/user/userModel.js";

const email = process.argv[2] || "admin@bitdesk.local";
const password = process.argv[3] || "AdminPassword123!";
const name = process.argv[4] || "Administrator";
const phone = process.argv[5] || "+1000000000";

async function createAdmin() {
  try {
    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(appConfig.MONGO_URI);

    let user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      console.log(`User ${email} already exists. Updating to verified & approved Admin...`);
      user.role = "admin";
      user.isVerified = true;
      user.isApproved = true;
      user.password = password; // mongoose pre-save hook will hash this
      await user.save();
      console.log(`✅ Admin updated successfully: ${email}`);
    } else {
      user = await User.create({
        name,
        email: email.toLowerCase(),
        phone,
        password,
        role: "admin",
        isVerified: true,
        isApproved: true,
      });
      console.log(`✅ Admin created successfully: ${email}`);
    }

    console.log("\nCredentials:");
    console.log(`Email:    ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Role:     admin (Approved & Verified)`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to create/update admin:", error);
    process.exit(1);
  }
}

createAdmin();
