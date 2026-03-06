import mongoose from "mongoose";

const navPolicyEntrySchema = new mongoose.Schema(
  {
    visible: { type: Boolean, default: true },
    locked: { type: Boolean, default: false },
  },
  { _id: false }
);

const accessRoleSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" },
    isSystem: { type: Boolean, default: false },
    permissions: [{ type: String }],
    navPolicy: {
      modules: {
        type: Map,
        of: navPolicyEntrySchema,
        default: () => ({}),
      },
      pages: {
        type: Map,
        of: navPolicyEntrySchema,
        default: () => ({}),
      },
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

const AccessRole =
  mongoose.models.AccessRole || mongoose.model("AccessRole", accessRoleSchema);

export default AccessRole;
