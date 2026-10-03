// server/src/database/reset-app.ts
import mongoose from "mongoose";
import appConfig from "../config/config.js";
import User from "../modules/user/userModel.js";
import Category from "../modules/category/category.model.js";
import Ticket from "../modules/ticket/ticket.model.js";
import TicketMessage from "../modules/ticketMessage/ticketMessage.model.js";
import TicketActivity from "../modules/ticketActivity/ticketActivity.model.js";
import EmailEvent from "../modules/email/emailEvent.model.js";

const DEFAULT_PASSWORD = "Password123!";

const resetApp = async () => {
  try {
    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(appConfig.MONGO_URI);
    console.log("Connected successfully!\n");

    // 1. Clear all old operational data
    console.log("🧹 Clearing old tickets, messages, activities, and email events...");
    await Ticket.deleteMany({});
    await TicketMessage.deleteMany({});
    await TicketActivity.deleteMany({});
    await EmailEvent.deleteMany({});
    await User.deleteMany({});
    console.log("✅ Database cleared.\n");

    // 2. Seed 4 Categories
    console.log("📁 Seeding 4 support categories...");
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

    // 3. Create 3 Users with 3 Roles (All same password: Password123!)
    console.log("👥 Creating 3 users with 3 roles (Admin, Agent, Customer)...");
    const usersData = [
      {
        name: "Demo Admin",
        email: "admin@bitdesk.dev",
        phone: "+1000000001",
        password: DEFAULT_PASSWORD,
        role: "admin",
        isVerified: true,
        isApproved: true,
      },
      {
        name: "Demo Agent",
        email: "agent@bitdesk.dev",
        phone: "+1000000002",
        password: DEFAULT_PASSWORD,
        role: "agent",
        isVerified: true,
        isApproved: true,
      },
      {
        name: "Demo Customer",
        email: "customer@bitdesk.dev",
        phone: "+1000000003",
        password: DEFAULT_PASSWORD,
        role: "customer",
        isVerified: true,
        isApproved: true,
      },
    ];

    for (const u of usersData) {
      await User.create(u as any);
    }
    console.log("✅ Users created successfully.\n");

    console.log("=================================================");
    console.log("🎉 BITDESK APP RESET COMPLETE");
    console.log("=================================================");
    console.log(`Global Password for all users: ${DEFAULT_PASSWORD}\n`);
    console.log("1. ADMIN USER:");
    console.log("   • Name:     Demo Admin");
    console.log("   • Email:    admin@bitdesk.dev");
    console.log("   • Role:     admin (Approved & Verified)\n");
    console.log("2. SUPPORT AGENT:");
    console.log("   • Name:     Demo Agent");
    console.log("   • Email:    agent@bitdesk.dev");
    console.log("   • Role:     agent (Approved & Verified)\n");
    console.log("3. CUSTOMER:");
    console.log("   • Name:     Demo Customer");
    console.log("   • Email:    customer@bitdesk.dev");
    console.log("   • Role:     customer (Approved & Verified)");
    console.log("=================================================");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Reset failed:", error);
    process.exit(1);
  }
};

resetApp();
