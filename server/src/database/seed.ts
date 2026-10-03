// server/src/database/seed.ts
import mongoose from "mongoose";
import appConfig from "../config/config.js";
import User from "../modules/user/userModel.js";
import Category from "../modules/category/category.model.js";
import Ticket from "../modules/ticket/ticket.model.js";
import TicketMessage from "../modules/ticketMessage/ticketMessage.model.js";
import TicketActivity from "../modules/ticketActivity/ticketActivity.model.js";
import {
  TICKET_STATUS,
  TICKET_PRIORITY,
  MESSAGE_TYPE,
  MESSAGE_SOURCE,
} from "../constants/ticket.js";

const seedDatabase = async () => {
  try {
    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(appConfig.MONGO_URI);
    console.log("Connected! Seeding initial data...");

    // 1. Seed Categories
    const categoriesData = [
      {
        name: "Technical Support",
        description: "Hardware, software, and application issues",
      },
      {
        name: "Billing & Invoicing",
        description: "Payments, invoices, and subscription queries",
      },
      {
        name: "Account & Access",
        description: "Login credentials, 2FA, and permission problems",
      },
      {
        name: "General Inquiries",
        description: "General company and product questions",
      },
    ];

    for (const cat of categoriesData) {
      await Category.findOneAndUpdate(
        { name: cat.name },
        { ...cat, isActive: true },
        { upsert: true, new: true },
      );
    }
    console.log("✅ Categories seeded successfully.");

    // 2. Seed Default Demo Users
    const usersData = [
      {
        name: "Admin User",
        email: "admin@bitdesk.local",
        phone: "+1000000001",
        password: "AdminPassword123!",
        role: "admin",
        isVerified: true,
      },
      {
        name: "Sarah Support",
        email: "agent@bitdesk.local",
        phone: "+1000000002",
        password: "AgentPassword123!",
        role: "agent",
        isVerified: true,
      },
      {
        name: "Alex Customer",
        email: "customer@bitdesk.local",
        phone: "+1000000003",
        password: "CustomerPassword123!",
        role: "customer",
        isVerified: true,
      },
    ];

    const usersMap: Record<string, any> = {};
    for (const u of usersData) {
      let existing = await User.findOne({ email: u.email });
      if (!existing) {
        existing = await User.create(u as any);
      }
      usersMap[u.role] = existing;
    }
    console.log("✅ Demo accounts seeded:");
    console.log("   • Admin:    admin@bitdesk.local / AdminPassword123!");
    console.log("   • Agent:    agent@bitdesk.local / AgentPassword123!");
    console.log("   • Customer: customer@bitdesk.local / CustomerPassword123!");

    // 3. Seed Sample Ticket
    const techCategory = await Category.findOne({ name: "Technical Support" });
    const existingTicket = await Ticket.findOne({
      subject: "Cannot connect to VPN network",
    });

    if (!existingTicket && techCategory) {
      const ticket = await Ticket.create({
        subject: "Cannot connect to VPN network",
        description:
          "Whenever I try to connect to the internal VPN server, it gives a timeout error 504.",
        requesterId: usersMap.customer._id,
        requesterEmail: usersMap.customer.email,
        assignedTo: usersMap.agent._id,
        category: techCategory._id,
        priority: TICKET_PRIORITY.HIGH,
        status: TICKET_STATUS.IN_PROGRESS,
        lastMessageAt: new Date(),
      });

      await TicketMessage.create({
        ticketId: ticket._id,
        senderId: usersMap.customer._id,
        senderEmail: usersMap.customer.email,
        senderRole: "customer",
        type: MESSAGE_TYPE.PUBLIC,
        body: ticket.description,
        source: MESSAGE_SOURCE.WEB,
      });

      await TicketMessage.create({
        ticketId: ticket._id,
        senderId: usersMap.agent._id,
        senderEmail: usersMap.agent.email,
        senderRole: "agent",
        type: MESSAGE_TYPE.INTERNAL,
        body: "Checked network routing table. The gateway at 10.0.0.1 is undergoing maintenance.",
        source: MESSAGE_SOURCE.WEB,
      });

      await TicketActivity.create({
        ticketId: ticket._id,
        actorId: usersMap.customer._id,
        actorEmail: usersMap.customer.email,
        action: "TICKET_CREATED",
        newValue: ticket.ticketNumber,
      });

      console.log(`✅ Sample Ticket created: ${ticket.ticketNumber}`);
    }

    console.log("\n🎉 Database Seeding Complete!");
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
};

seedDatabase();
