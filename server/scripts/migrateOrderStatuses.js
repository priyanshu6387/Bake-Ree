import dotenv from "dotenv";
import connectDB from "../config/db.js";
import Order from "../models/Order.js";
import { normalizeOrderStatus } from "../services/orderLifecycleService.js";

dotenv.config();

const run = async () => {
  await connectDB();

  const cursor = Order.find().cursor();
  let updated = 0;

  for (let order = await cursor.next(); order != null; order = await cursor.next()) {
    const canonical = normalizeOrderStatus(order.status);
    let dirty = false;

    if (canonical && canonical !== order.status) {
      order.status = canonical;
      dirty = true;
    }

    if (!order.approval) {
      order.approval = {
        required: canonical === "APPROVAL_PENDING",
        status: canonical === "APPROVAL_PENDING" ? "PENDING" : "APPROVED",
      };
      dirty = true;
    }

    if (!order.lifecycleEvents || order.lifecycleEvents.length === 0) {
      order.lifecycleEvents = [
        {
          action: "MIGRATED_STATUS",
          fromStatus: order.status,
          toStatus: order.status,
          notes: "Backfilled during lifecycle migration",
          createdAt: new Date(),
        },
      ];
      dirty = true;
    }

    if (dirty) {
      await order.save();
      updated += 1;
    }
  }

  console.log(`Lifecycle migration completed. Updated orders: ${updated}`);
  process.exit(0);
};

run().catch((error) => {
  console.error("Lifecycle migration failed:", error);
  process.exit(1);
});
