import { Router } from "express";
import Booking from "../models/Booking.js";
import User from "../models/User.js";
import Withdrawal from "../models/Withdrawal.js";
import Transaction from "../models/Transaction.js";
import Settings from "../models/Settings.js";
import { verifyToken, requireRole } from "../middleware/auth.js";
import { formatCurrency } from "../utils/formatCurrency.js";

const router = Router();

// Read commission rate from DB — falls back to 10% if not set
async function getCommissionRate() {
  try {
    const doc = await Settings.findOne({ key: "commissionRate" });
    return doc ? Number(doc.value) / 100 : 0.10;
  } catch {
    return 0.10;
  }
}

// Merchant: Get earnings dashboard data
router.get("/dashboard", verifyToken, async (req, res) => {
  try {
    const merchantId = req.user._id;

    // Get all paid bookings for this merchant (completed services + confirmed/paid events + any paid status)
    const completedBookings = await Booking.find({
      assignedTo: merchantId,
      $or: [
        { status: "completed", paymentStatus: { $in: ["paid", "partially_paid"] } },
        { status: "confirmed", paymentStatus: "paid", event: { $ne: null } },
        { status: "paid", paymentStatus: { $in: ["paid", "partially_paid"] } },
        { status: "accepted", paymentStatus: "paid" },
        { status: "processing", paymentStatus: "paid" }
      ]
    });

    const earningTransactions = await Transaction.find({ merchant: merchantId, type: "earning", status: "completed" });
    const commissionTransactions = await Transaction.find({ merchant: merchantId, type: "commission_deduction", status: "completed" });

    let totalEarnings = earningTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    let totalCommission = commissionTransactions.reduce((sum, tx) => sum + tx.amount, 0);

    // Only fall back to live rate calculation if no Transaction records exist yet
    const COMMISSION_RATE = await getCommissionRate();

    if (earningTransactions.length === 0) {
      totalEarnings = completedBookings.reduce((sum, b) => {
        const paidAmount = (b.paymentStatus === "partially_paid" && b.isAdvancePaid)
          ? (b.advanceAmount || 0)
          : (b.price || 0);
        return sum + (paidAmount * (1 - COMMISSION_RATE));
      }, 0);
    }

    if (commissionTransactions.length === 0) {
      totalCommission = completedBookings.reduce((sum, b) => {
        const paidAmount = (b.paymentStatus === "partially_paid" && b.isAdvancePaid)
          ? (b.advanceAmount || 0)
          : (b.price || 0);
        return sum + (paidAmount * COMMISSION_RATE);
      }, 0);
    }

    // Get pending withdrawals
    const pendingWithdrawals = await Withdrawal.find({
      merchant: merchantId,
      status: "pending"
    });

    const pendingWithdrawalAmount = pendingWithdrawals.reduce((sum, w) => sum + w.amount, 0);

    // Get completed and approved withdrawals (both count as withdrawn)
    const completedWithdrawals = await Withdrawal.find({
      merchant: merchantId,
      status: { $in: ["completed", "approved"] }
    });

    const totalWithdrawn = completedWithdrawals.reduce((sum, w) => sum + w.amount, 0);

    // Calculate available balance (total earnings - withdrawn - pending)
    const availableBalance = totalEarnings - totalWithdrawn - pendingWithdrawalAmount;

    // Get recent transactions
    const recentTransactions = await Transaction.find({
      merchant: merchantId
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("booking", "serviceName event price");

    res.json({
      totalEarnings: Math.round(totalEarnings * 100) / 100,
      totalCommission: Math.round(totalCommission * 100) / 100,
      totalWithdrawn: Math.round(totalWithdrawn * 100) / 100,
      pendingWithdrawalAmount: Math.round(pendingWithdrawalAmount * 100) / 100,
      availableBalance: Math.round(availableBalance * 100) / 100,
      completedBookings: completedBookings.length,
      pendingWithdrawals: pendingWithdrawals.length,
      recentTransactions
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch earnings data" });
  }
});

// Merchant: Request withdrawal
router.post("/withdrawal-request", verifyToken, async (req, res) => {
  try {
    const merchantId = req.user._id;
    const { amount, bankDetails } = req.body;


    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid withdrawal amount" });
    }

    // Get merchant's available balance
    const earningTransactions = await Transaction.find({ merchant: merchantId, type: "earning", status: "completed" });
    const totalEarnings = earningTransactions.reduce((sum, t) => sum + t.amount, 0);

    const completedWithdrawals = await Withdrawal.find({
      merchant: merchantId,
      status: { $in: ["completed", "approved"] }
    });

    const totalWithdrawn = completedWithdrawals.reduce((sum, w) => sum + w.amount, 0);

    const pendingWithdrawals = await Withdrawal.find({
      merchant: merchantId,
      status: "pending"
    });

    const pendingWithdrawalAmount = pendingWithdrawals.reduce((sum, w) => sum + w.amount, 0);
    const availableBalance = totalEarnings - totalWithdrawn - pendingWithdrawalAmount;

    if (amount > availableBalance) {
      return res.status(400).json({ error: "Insufficient balance for withdrawal" });
    }

    // Create withdrawal request
    const withdrawal = await Withdrawal.create({
      merchant: merchantId,
      amount,
      bankDetails,
      status: "pending"
    });

    // Create transaction record
    await Transaction.create({
      merchant: merchantId,
      type: "withdrawal",
      amount,
      description: `Withdrawal request for ${formatCurrency(amount)}`,
      status: "pending",
      relatedId: withdrawal._id.toString()
    });


    res.json({
      success: true,
      withdrawal,
      message: "Withdrawal request submitted successfully"
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to create withdrawal request" });
  }
});

// Merchant: Get withdrawal history
router.get("/withdrawals", verifyToken, async (req, res) => {
  try {
    const merchantId = req.user._id;
    const withdrawals = await Withdrawal.find({ merchant: merchantId })
      .sort({ createdAt: -1 });

    res.json({ withdrawals });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch withdrawals" });
  }
});

// Merchant: Get transaction history
router.get("/transactions", verifyToken, async (req, res) => {
  try {
    const merchantId = req.user._id;
    const transactions = await Transaction.find({ merchant: merchantId })
      .sort({ createdAt: -1 })
      .populate("booking", "serviceName event price");

    res.json({ transactions });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

// Admin: Approve withdrawal
router.patch("/withdrawal/:id/approve", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const withdrawal = await Withdrawal.findByIdAndUpdate(
      id,
      { status: "approved", approvedAt: new Date() },
      { new: true }
    ).populate("merchant", "name email");

    if (!withdrawal) {
      return res.status(404).json({ error: "Withdrawal not found" });
    }

    // Create notification for merchant
    const Notification = (await import("../models/Notification.js")).default;
    await Notification.create({
      userId: withdrawal.merchant._id,
      title: "Withdrawal Approved",
      message: `Your withdrawal request of ${formatCurrency(withdrawal.amount)} has been approved by admin.`,
      type: "booking",
      status: "unread",
      relatedId: withdrawal._id,
      actionUrl: "/merchant-earnings"
    });

    res.json({ success: true, withdrawal });
  } catch (error) {
    res.status(500).json({ error: "Failed to approve withdrawal" });
  }
});

// Admin: Complete withdrawal
router.patch("/withdrawal/:id/complete", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const { transactionId } = req.body;

    const withdrawal = await Withdrawal.findByIdAndUpdate(
      id,
      { status: "completed", completedAt: new Date(), transactionId },
      { new: true }
    ).populate("merchant", "name email");

    if (!withdrawal) {
      return res.status(404).json({ error: "Withdrawal not found" });
    }

    // Update transaction status
    await Transaction.findOneAndUpdate(
      { relatedId: id },
      { status: "completed" }
    );

    // Create notification for merchant
    const Notification = (await import("../models/Notification.js")).default;
    await Notification.create({
      userId: withdrawal.merchant._id,
      title: "Withdrawal Completed",
      message: `Your withdrawal of ${formatCurrency(withdrawal.amount)} has been successfully completed. Transaction ID: ${transactionId}`,
      type: "booking",
      status: "unread",
      relatedId: withdrawal._id,
      actionUrl: "/merchant-earnings"
    });

    res.json({ success: true, withdrawal });
  } catch (error) {
    res.status(500).json({ error: "Failed to complete withdrawal" });
  }
});

// Admin: Reject withdrawal
router.patch("/withdrawal/:id/reject", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const withdrawal = await Withdrawal.findByIdAndUpdate(
      id,
      { status: "rejected", rejectionReason: reason },
      { new: true }
    ).populate("merchant", "name email");

    if (!withdrawal) {
      return res.status(404).json({ error: "Withdrawal not found" });
    }

    // Update transaction status
    await Transaction.findOneAndUpdate(
      { relatedId: id },
      { status: "failed" }
    );

    // Create notification for merchant
    const Notification = (await import("../models/Notification.js")).default;
    await Notification.create({
      userId: withdrawal.merchant._id,
      title: "Withdrawal Rejected",
      message: `Your withdrawal request of ${formatCurrency(withdrawal.amount)} has been rejected. Reason: ${reason}`,
      type: "booking",
      status: "unread",
      relatedId: withdrawal._id,
      actionUrl: "/merchant-earnings"
    });

    res.json({ success: true, withdrawal });
  } catch (error) {
    res.status(500).json({ error: "Failed to reject withdrawal" });
  }
});

// Admin: Get all pending withdrawals
router.get("/admin/pending-withdrawals", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    
    const pendingWithdrawals = await Withdrawal.find({ status: "pending" })
      .populate("merchant", "name email")
      .sort({ requestedAt: -1 });

    res.json({ withdrawals: pendingWithdrawals });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch pending withdrawals" });
  }
});

// Admin: Get all withdrawals (with filters)
router.get("/admin/withdrawals", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};
    
    if (status) {
      query.status = status;
    }

    
    const withdrawals = await Withdrawal.find(query)
      .populate("merchant", "name email")
      .sort({ requestedAt: -1 });

    res.json({ withdrawals });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch withdrawals" });
  }
});

export default router;
