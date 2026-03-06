import nodemailer from "nodemailer";
import { readFile } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create transporter for sending emails
const createTransporter = () => {
  // For Gmail, you can use App Password or OAuth2
  // For production, consider using SendGrid, Mailgun, or AWS SES
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: parseInt(process.env.EMAIL_PORT || "587"),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS?.replace(/\s+/g, ""),
    },
  });
};

// Load HTML template and replace placeholders
const loadTemplate = async (templateName, replacements = {}) => {
  try {
    const templatePath = join(__dirname, "../templates/emails", templateName);
    let html = await readFile(templatePath, "utf-8");

    // Replace placeholders with actual values
    Object.keys(replacements).forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, "g");
      html = html.replace(regex, replacements[key]);
    });

    return html;
  } catch (error) {
    console.error(`Error loading email template ${templateName}:`, error);
    // Return a simple fallback template
    return `
      <!DOCTYPE html>
      <html>
        <head><title>${replacements.subject || "Bake-Ree"}</title></head>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto;">
            ${replacements.content || ""}
          </div>
        </body>
      </html>
    `;
  }
};

// Send email helper function
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    // Skip email sending if email is not configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn("⚠️  Email not configured. Skipping email send to:", to);
      return { success: false, error: "Email not configured" };
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || `"Bake-Ree" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      text: text || subject, // Plain text fallback
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully to:", to);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Error sending email:", error);
    return { success: false, error: error.message };
  }
};

// Send order confirmation email
export const sendOrderConfirmation = async (order, user) => {
  try {
    const orderItems = order.items
      .map(
        (item) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">
          ${item.product?.name || "Product"}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">
          ${item.quantity}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
          ₹${(item.price * item.quantity).toFixed(2)}
        </td>
      </tr>
    `
      )
      .join("");

    // Build delivery charge row HTML conditionally
    const deliveryChargeRow = order.orderType === "Delivery" && order.deliveryCharge > 0
      ? `<tr>
          <td style="padding: 8px 0; color: #666; border-bottom: 1px solid #eee;">
            <strong style="color: #2a2927;">Delivery Charge:</strong>
          </td>
          <td style="padding: 8px 0; text-align: right; color: #2a2927; border-bottom: 1px solid #eee;">
            ₹${(order.deliveryCharge || 0).toFixed(2)}
          </td>
        </tr>`
      : "";

    // Build special instructions HTML conditionally
    const specialInstructionsHtml = order.specialInstructions
      ? `<div style="background-color: #fdf7d8; padding: 15px; margin: 20px 0; border-radius: 4px; border-left: 4px solid #f4c430;">
          <p style="margin: 0; color: #2a2927; font-size: 14px;">
            <strong>Special Instructions:</strong><br>
            ${order.specialInstructions}
          </p>
        </div>`
      : "";

    // Calculate subtotal (total - delivery charge)
    const subtotal = order.totalAmount - (order.deliveryCharge || 0);

    const html = await loadTemplate("orderConfirmation.html", {
      customerName: user?.name || "Customer",
      orderNumber: order._id.toString().slice(-8).toUpperCase(),
      orderDate: new Date(order.createdAt).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      orderItems,
      subtotal: `₹${subtotal.toFixed(2)}`,
      deliveryChargeRow,
      total: `₹${order.totalAmount.toFixed(2)}`,
      orderType: order.orderType,
      status: order.status,
      specialInstructionsHtml,
    });

    return await sendEmail({
      to: user?.email,
      subject: `Order Confirmation - Order #${order._id.toString().slice(-8).toUpperCase()}`,
      html,
    });
  } catch (error) {
    console.error("Error sending order confirmation email:", error);
    return { success: false, error: error.message };
  }
};

// Send order status update email
export const sendOrderStatusUpdate = async (order, user, newStatus) => {
  try {
    const normalizedStatus = String(newStatus || "").trim().toUpperCase();
    const statusConfig = {
      DELIVERED: {
        displayStatus: "Delivered",
        statusMessage: "Your order has been delivered. Enjoy!",
        statusSpecificMessage: `<div style="background-color: #f0fdf4; padding: 15px; margin: 20px 0; border-radius: 4px; border-left: 4px solid #22c55e;">
          <p style="margin: 0; color: #2a2927; font-size: 14px;">✅ Your order has been delivered! We hope you enjoy it!</p>
        </div>`,
      },
      CANCELLED: {
        displayStatus: "Cancelled",
        statusMessage: "Your order has been cancelled.",
        statusSpecificMessage: `<div style="background-color: #fff1f2; padding: 15px; margin: 20px 0; border-radius: 4px; border-left: 4px solid #e11d48;">
          <p style="margin: 0; color: #2a2927; font-size: 14px;">Your order was cancelled. If this looks incorrect, please contact support.</p>
        </div>`,
      },
    };

    const selectedStatus = statusConfig[normalizedStatus];

    // Only send status emails for delivered/cancelled events.
    if (!selectedStatus) {
      console.log("ℹ️ Skipping intermediate status email:", newStatus);
      return { success: true, skipped: true };
    }

    const html = await loadTemplate("orderStatusUpdate.html", {
      customerName: user?.name || "Customer",
      orderNumber: order._id.toString().slice(-8).toUpperCase(),
      newStatus: selectedStatus.displayStatus,
      statusMessage: selectedStatus.statusMessage,
      orderDate: new Date(order.createdAt).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      total: `₹${order.totalAmount.toFixed(2)}`,
      orderType: order.orderType,
      statusSpecificMessage: selectedStatus.statusSpecificMessage,
    });

    return await sendEmail({
      to: user?.email,
      subject: `Order Update - Order #${order._id.toString().slice(-8).toUpperCase()} is now ${selectedStatus.displayStatus}`,
      html,
    });
  } catch (error) {
    console.error("Error sending order status update email:", error);
    return { success: false, error: error.message };
  }
};

// Send welcome email
export const sendWelcomeEmail = async (user) => {
  try {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const html = await loadTemplate("welcome.html", {
      customerName: user?.name || "Customer",
      email: user?.email || "",
      frontendUrl,
    });

    return await sendEmail({
      to: user?.email,
      subject: "Welcome to Bake-Ree! 🍞",
      html,
    });
  } catch (error) {
    console.error("Error sending welcome email:", error);
    return { success: false, error: error.message };
  }
};

// Send password reset email (for future use)
export const sendPasswordResetEmail = async (user, resetToken) => {
  try {
    const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`;

    const html = await loadTemplate("passwordReset.html", {
      customerName: user?.name || "Customer",
      resetUrl,
      expiryTime: "1 hour",
    });

    return await sendEmail({
      to: user?.email,
      subject: "Reset Your Bake-Ree Password",
      html,
    });
  } catch (error) {
    console.error("Error sending password reset email:", error);
    return { success: false, error: error.message };
  }
};

export default {
  sendOrderConfirmation,
  sendOrderStatusUpdate,
  sendWelcomeEmail,
  sendPasswordResetEmail,
};
