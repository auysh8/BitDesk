// server/src/database/reset-app.ts
import mongoose from "mongoose";
import appConfig from "../config/config.js";
import User from "../modules/user/userModel.js";
import Category from "../modules/category/category.model.js";
import Ticket from "../modules/ticket/ticket.model.js";
import TicketMessage from "../modules/ticketMessage/ticketMessage.model.js";
import TicketActivity from "../modules/ticketActivity/ticketActivity.model.js";
import EmailEvent from "../modules/email/emailEvent.model.js";
import EmailVerification from "../modules/auth/emailVerification.model.js";

const DEFAULT_PASSWORD = "Password123!";

const resetApp = async () => {
  try {
    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(appConfig.MONGO_URI);
    console.log("Connected successfully!\n");

    // 1. Clear all old operational data
    console.log("🧹 Clearing old tickets, messages, activities, email events, and pending OTP verifications...");
    await Ticket.deleteMany({});
    await TicketMessage.deleteMany({});
    await TicketActivity.deleteMany({});
    await EmailEvent.deleteMany({});
    await EmailVerification.deleteMany({});
    await User.deleteMany({});
    console.log("✅ Database cleared.\n");

    // 2. Seed 4 Categories
    console.log("📁 Seeding 4 default support categories...");
    const categoriesData = [
      {
        name: "Technical Support",
        description: "Hardware, software, bugs, and application issues",
        isActive: true,
      },
      {
        name: "Billing & Invoicing",
        description: "Payments, invoices, subscriptions, and refund queries",
        isActive: true,
      },
      {
        name: "Account & Access",
        description: "Login credentials, 2FA, permissions, and security",
        isActive: true,
      },
      {
        name: "General Inquiries",
        description: "General company, product information, and questions",
        isActive: true,
      },
    ];

    for (const cat of categoriesData) {
      await Category.findOneAndUpdate(
        { name: cat.name },
        cat,
        { upsert: true, returnDocument: "after" }
      );
    }
    console.log("✅ 4 categories ready.\n");

    // 3. Create ONLY the single Demo Admin account
    console.log("👤 Creating only the Demo Admin user...");
    await User.create({
      name: "Demo Admin",
      email: "admin@bitdesk.dev",
      phone: "+1000000001",
      password: DEFAULT_PASSWORD,
      role: "admin",
      isVerified: true,
      isApproved: true,
    } as any);
    console.log("✅ Demo Admin created successfully.\n");

    console.log("=================================================");
    console.log("🎉 BITDESK APP RESET COMPLETE");
    console.log("=================================================");
    console.log("SINGLE ACTIVE ACCOUNT:");
    console.log("   • Name:     Demo Admin");
    console.log("   • Email:    admin@bitdesk.dev");
    console.log(`   • Password: ${DEFAULT_PASSWORD}`);
    console.log("   • Role:     admin (Approved & Verified)");
    console.log("=================================================");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Reset failed:", error);
    process.exit(1);
  }
};

resetApp();
