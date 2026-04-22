import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calculator, DollarSign, TrendingUp, Percent, Wallet, ArrowRight } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
  assignedTo?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
}

const COMMISSION_RATE = 0.05; // 5% default commission

const AdminCommissions = () => {
  const { token } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [customCommissionRate, setCustomCommissionRate] = useState<string>("5");

  useEffect(() => {
    loadCommissions();
  }, []);

  const loadCommissions = async () => {
    try {
      setLoading(true);
      const data = await apiListBookings(undefined, token!);
      // Filter only completed and paid bookings for commission calculation
      const completedPaid = (data.bookings || []).filter((b: Booking) => 
        b.status === "completed" && b.paymentStatus === "paid"
      );
      setBookings(completedPaid);
    } catch (error) {
      toast.error("Failed to load commission data");
    } finally {
      setLoading(false);
    }
  };

  const calculateCommission = (price: number) => {
    return price * (parseFloat(customCommissionRate) / 100);
  };

  const calculateMerchantPayout = (price: number) => {
    return price - calculateCommission(price);
  };

  const totalRevenue = bookings.reduce((sum, b) => sum + (b.price || 0), 0);
  const totalCommission = bookings.reduce((sum, b) => sum + calculateCommission(b.price), 0);
  const totalMerchantPayout = bookings.reduce((sum, b) => sum + calculateMerchantPayout(b.price), 0);

  return (
    <AdminLayout>
      <section className="py-2 sm:py-8 lg:py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Calculator className="h-8 w-8 text-primary" />
              <div>
                <h1 className="font-display text-xs sm:text-3xl font-bold truncate">
                  Commission <span className="text-gradient">Calculation</span>
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                  Calculate and track platform commissions from completed bookings
                </p>
              </div>
            </div>
          </div>

          {/* Commission Settings */}
          <Card className="mb-8 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="h-5 w-5 text-primary" />
                Commission Rate Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <div className="flex-1">
                  <Label htmlFor="commission-rate">Commission Rate (%)</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      id="commission-rate"
                      type="number"
                      value={customCommissionRate}
                      onChange={(e) => setCustomCommissionRate(e.target.value)}
                      className="w-24 sm:w-32"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                    <span className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                      Example: ₹1000 ticket | {customCommissionRate}% commission | Merchant gets ₹{calculateMerchantPayout(1000).toFixed(2)}
                    </span>
                  </div>
                </div>
                <Button className="sm:mt-8 w-full sm:w-auto">
                  Update Rate
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Commission Stats */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 mb-8">
            <Card>
              <CardContent className="pt-3 sm:pt-6 px-3 sm:px-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-blue-500/15 p-3">
                    <DollarSign className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="font-display text-xs sm:text-2xl font-bold truncate">₹{totalRevenue.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-3 sm:pt-6 px-3 sm:px-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-green-500/15 p-3">
                    <TrendingUp className="h-5 w-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Platform Commission</p>
                    <p className="font-display text-xs sm:text-2xl font-bold truncate">₹{totalCommission.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-3 sm:pt-6 px-3 sm:px-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-purple-500/15 p-3">
                    <Wallet className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Merchant Payouts</p>
                    <p className="font-display text-xs sm:text-2xl font-bold truncate">₹{totalMerchantPayout.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-3 sm:pt-6 px-3 sm:px-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-orange-500/15 p-3">
                    <Calculator className="h-5 w-5 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Completed Bookings</p>
                    <p className="font-display text-xs sm:text-2xl font-bold truncate">{bookings.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Commission Breakdown Table */}
          <Card>
            <CardHeader>
              <CardTitle>Commission Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-16 text-muted-foreground">
                  Loading commission data...
                </div>
              ) : bookings.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground">
                  <Calculator className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>No completed bookings to calculate commissions.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Booking ID</TableHead>
                      <TableHead>Service/Event</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Ticket Price</TableHead>
                      <TableHead>Commission ({customCommissionRate}%)</TableHead>
                      <TableHead>Merchant Payout</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking) => {
                      const commission = calculateCommission(booking.price);
                      const merchantPayout = calculateMerchantPayout(booking.price);
                      
                      return (
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
                          <TableCell className="text-green-600 font-semibold">
                            ₹{commission.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-purple-600 font-semibold">
                            ₹{merchantPayout.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(booking.datetime).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-green-500/15 text-green-400">
                              {booking.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </section>
    </AdminLayout>
  );
};

export default AdminCommissions;

