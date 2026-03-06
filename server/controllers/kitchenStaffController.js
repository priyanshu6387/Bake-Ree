import User from "../models/User.js";
import Order from "../models/Order.js";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// Get all kitchen staff
export const getKitchenStaff = async (req, res) => {
  try {
    const staff = await User.find({
      $or: [
        { role: "kitchen_staff" },
        { role: "admin" },
        { isAdmin: true },
      ],
    })
      .select("-password")
      .sort({ name: 1 });

    res.status(200).json(staff);
  } catch (err) {
    console.error("Get kitchen staff error:", err);
    res.status(500).json({ error: "Failed to fetch kitchen staff" });
  }
};

// Create new kitchen staff
export const createKitchenStaff = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User with this email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create kitchen staff user
    const staff = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      role: "kitchen_staff",
      accessRoleKey: "kitchen_prep",
      permissions: [],
      isAdmin: false,
      isActive: true,
    });

    const staffData = staff.toObject();
    delete staffData.password;

    res.status(201).json(staffData);
  } catch (err) {
    console.error("Create kitchen staff error:", err);
    res.status(500).json({ error: "Failed to create kitchen staff" });
  }
};

// Update kitchen staff
export const updateKitchenStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, isActive, password, accessRoleKey, permissions } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid staff ID" });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (accessRoleKey !== undefined) updateData.accessRoleKey = accessRoleKey;
    if (Array.isArray(permissions)) updateData.permissions = permissions;

    // Update password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const staff = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!staff) {
      return res.status(404).json({ error: "Kitchen staff not found" });
    }

    res.status(200).json(staff);
  } catch (err) {
    console.error("Update kitchen staff error:", err);
    res.status(500).json({ error: "Failed to update kitchen staff" });
  }
};

// Delete kitchen staff
export const deleteKitchenStaff = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid staff ID" });
    }

    // Check if staff has assigned orders
    const assignedOrders = await Order.countDocuments({
      assignedKitchenStaff: id,
      status: { $in: ["Pending", "Preparing", "Ready"] },
    });

    if (assignedOrders > 0) {
      return res.status(400).json({
        error: `Cannot delete staff member with ${assignedOrders} active assigned orders`,
      });
    }

    const staff = await User.findByIdAndDelete(id);

    if (!staff) {
      return res.status(404).json({ error: "Kitchen staff not found" });
    }

    res.status(200).json({ message: "Kitchen staff deleted successfully" });
  } catch (err) {
    console.error("Delete kitchen staff error:", err);
    res.status(500).json({ error: "Failed to delete kitchen staff" });
  }
};

// Get kitchen staff statistics
export const getKitchenStaffStats = async (req, res) => {
  try {
    const staff = await User.find({
      $or: [
        { role: "kitchen_staff" },
        { role: "admin" },
        { isAdmin: true },
      ],
    }).select("_id name");

    const stats = await Promise.all(
      staff.map(async (member) => {
        const pending = await Order.countDocuments({
          assignedKitchenStaff: member._id,
          status: "Pending",
        });
        const preparing = await Order.countDocuments({
          assignedKitchenStaff: member._id,
          status: "Preparing",
        });
        const ready = await Order.countDocuments({
          assignedKitchenStaff: member._id,
          status: "Ready",
        });

        return {
          staffId: member._id,
          staffName: member.name,
          pending,
          preparing,
          ready,
          total: pending + preparing + ready,
        };
      })
    );

    res.status(200).json(stats);
  } catch (err) {
    console.error("Get kitchen staff stats error:", err);
    res.status(500).json({ error: "Failed to fetch kitchen staff statistics" });
  }
};
