import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  phone: String,
  isAdmin: { type: Boolean, default: false },
  role: {
    type: String,
    enum: ["customer", "kitchen_staff", "delivery_staff", "admin"],
    default: "customer",
  },
  accessRoleKey: {
    type: String,
    default: null,
    trim: true,
  },
  permissions: [{ type: String }],
  accessOverrides: {
    modules: {
      type: Map,
      of: new mongoose.Schema(
        {
          visible: { type: Boolean, default: true },
          locked: { type: Boolean, default: false },
        },
        { _id: false }
      ),
      default: () => ({}),
    },
    pages: {
      type: Map,
      of: new mongoose.Schema(
        {
          visible: { type: Boolean, default: true },
          locked: { type: Boolean, default: false },
        },
        { _id: false }
      ),
      default: () => ({}),
    },
  },
  allergyPreferences: {
    allergies: {
      type: [String],
      default: [],
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  settingsVersion: { type: Number, default: 1 },
  isActive: { type: Boolean, default: true }, // For kitchen staff management
}, { timestamps: true });

const User = mongoose.model("User", userSchema);
export default User;
