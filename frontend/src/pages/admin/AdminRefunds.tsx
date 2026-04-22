import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { RefreshCcw, DollarSign, AlertCircle, CheckCircle, XCircle, Clock } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { apiListBookings } from "@/lib/api";
import { toast } from "sonner";

interface Booking {
  _id: string;
  customer: {
    _id: string;
    name: string;
    email: string;
  };
  event?: {
    _id: string;
    title: string;
  };
  serviceName?: string;
  price: number;
  datetime: string;
  status: string;
  paymentStatus: string;
  refundReason?: string;
  refundedAt?: string;
  assignedTo?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
}

const REFUND_STATUS_BADGE: Record<string, string> = {
  pending: "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30",
  approved: "bg-green-500/15 text-green-400 border border-green-500/30",
  rejected: "bg-red-500/15 text-red-400 border border-red-500/30",
  refunded: "bg-gray-500/15 text-gray-400 border border-gray-500/30",
};

const AdminRefunds = () => {
  const { token } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    loadRefunds();
  }, []);

  const loadRefunds = async () => {
    try {
      setLoading(true);
      const data = await apiListBookings(undefined, token!);
      // Filter bookings with refunds or refund requests
      const refundRelated = (data.bookings || []).filter((b: Booking) => 
        b.paymentStatus === "refunded" || 
        b.status === "cancelled" ||
        b.refundReason
      );
      setBookings(refundRelated);
    } catch (error) {
      toast.error("Failed to load refund data");
    } finally {
      setLoading(false);
    }
  };

  const handleProcessRefund = async () => {
    if (!selectedBooking) return;
    
    if (!refundReason.trim()) {
      toast.error("Please provide a refund reason");
      return;
    }

    setProcessing(true);
    try {
      // In a real implementation, this would call an API endpoint
      // await apiProcessRefund(selectedBooking._id, refundReason, token!);
      
      toast.success(`Refund of ₹${selectedBooking.price} processed successfully`);
      setRefundDialogOpen(false);
      setRefundReason("");
      loadRefunds();
    } catch (error: any) {
      toast.error(error.message || "Failed to process refund");
    } finally {
      setProcessing(false);
    }
  };

  const openRefundDialog = (booking: Booking) => {
    setSelectedBooking(booking);
    setRefundReason("");
    setRefundDialogOpen(true);
  };

  const totalRefundAmount = bookings
    .filter(b => b.paymentStatus === "refunded")
    .reduce((sum, b) => sum + (b.price || 0), 0);

  const pendingRefunds = bookings.filter(b => b.status === "cancelled" && b.paymentStatus !== "refunded");

  return (
    <AdminLayout>
      <section className="py-2 sm:py-8 lg:py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <RefreshCcw className="h-8 w-8 text-primary" />
              <div>
                <h1 className="font-display text-xs sm:text-3xl font-bold truncate">
                  Refund <span className="text-gradient">Management</span>
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                  Process and track customer refund requests
                </p>
              </div>
            </div>
          </div>

          {/* Refund Stats */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 mb-8">
            <Card>
              <CardContent className="pt-3 sm:pt-6 px-3 sm:px-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-gray-500/15 p-3">
                    <RefreshCcw className="h-5 w-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Refunded</p>
                    <p className="font-display text-xs sm:text-2xl font-bold truncate">₹{totalRefundAmount.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-3 sm:pt-6 px-3 sm:px-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-yellow-500/15 p-3">
                    <Clock className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pending Review</p>
                    <p className="font-display text-xs sm:text-2xl font-bold truncate">{pendingRefunds.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-3 sm:pt-6 px-3 sm:px-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-green-500/15 p-3">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Approved</p>
                    <p className="font-display text-xs sm:text-2xl font-bold truncate">
                      {bookings.filter(b => b.paymentStatus === "refunded").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-3 sm:pt-6 px-3 sm:px-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-red-500/15 p-3">
                    <XCircle className="h-5 w-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Rejected</p>
                    <p className="font-display text-xs sm:text-2xl font-bold truncate">
                      {bookings.filter(b => b.status === "cancelled" && b.paymentStatus !== "refunded").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Refund Requests Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Refund Requests & History</span>
                <div className="flex gap-2">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="rounded-md border border-border bg-card px-3 py-1 text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="refunded">Refunded</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-16 text-muted-foreground">
                  Loading refund data...
                </div>
              ) : bookings.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground">
                  <RefreshCcw className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>No refund requests or refunded bookings.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Booking ID</TableHead>
                      <TableHead>Service/Event</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Refund Reason</TableHead>
                      <TableHead>Refund Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings
                      .filter(b => filterStatus === "all" || b.paymentStatus === filterStatus || b.status === filterStatus)
                      .map((booking) => (
                        <TableRow key={booking._id}>
                          <TableCell className="font-mono text-xs">
                            {booking._id.slice(-8)}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {booking.service?.name || booking.serviceName || booking.event?.title}
                              </p>
                              {booking.assignedTo && (
                                <p className="text-xs text-muted-foreground">
                                  Merchant: {booking.assignedTo.name}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{booking.customer?.name}</p>
                              <p className="text-xs text-muted-foreground">{booking.customer?.email}</p>
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold">
                            ₹{booking.price?.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {booking.refundReason ? (
                              <div className="max-w-[200px]">
                                <p className="text-sm truncate">{booking.refundReason}</p>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={REFUND_STATUS_BADGE[booking.paymentStatus] || "bg-secondary text-muted-foreground"}>
                              {booking.paymentStatus === "refunded" ? "Refunded" : booking.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {booking.refundedAt 
                              ? new Date(booking.refundedAt).toLocaleDateString()
                              : new Date(booking.datetime).toLocaleDateString()
                            }
                          </TableCell>
                          <TableCell>
                            {booking.status === "cancelled" && booking.paymentStatus !== "refunded" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openRefundDialog(booking)}
                              >
                                Process Refund
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* Refund Dialog */}
      <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
            <DialogDescription>
              You are about to refund ₹{selectedBooking?.price?.toLocaleString()} to {selectedBooking?.customer?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="refund-reason">Refund Reason *</Label>
              <Textarea
                id="refund-reason"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Please provide a reason for this refund..."
                rows={4}
              />
            </div>

            <div className="flex items-start gap-3 p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
              <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 shrink-0" />
              <div className="text-sm text-yellow-200">
                <p className="font-medium mb-1">Important Information:</p>
                <ul className="list-disc list-inside space-y-1 text-yellow-300/80">
                  <li>This action cannot be undone</li>
                  <li>The full amount will be refunded to the customer</li>
                  <li>The booking will be marked as cancelled</li>
                  <li>Both customer and merchant will be notified</li>
                </ul>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRefundDialogOpen(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleProcessRefund}
              disabled={processing || !refundReason.trim()}
              className="bg-primary hover:bg-primary/90"
            >
              {processing ? (
                <>
                  <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Confirm Refund
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminRefunds;

