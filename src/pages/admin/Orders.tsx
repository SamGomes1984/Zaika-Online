import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Package, Eye, ArrowRight, CheckCircle, XCircle, Wallet, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase';
import { toast } from 'sonner';

interface OrderItem {
  id: string;
  product_name: string;
  product_price: number;
  quantity: number;
  subtotal: number;
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_address: string;
  delivery_city: string;
  delivery_state: string;
  delivery_pincode: string;
  subtotal: number;
  delivery_charge: number;
  total_amount: number;
  status: string;
  delivery_date: string | null;
  delivery_slot: string | null;
  payment_method: string;
  payment_status: string;
  cancellation_reason: string | null;
  cancelled_by: string | null;
  created_at: string;
  delivered_at: string | null;
  order_items: OrderItem[];
}

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Cancel dialog state
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  
  // Delivery confirmation dialog state
  const [isDeliveryDialogOpen, setIsDeliveryDialogOpen] = useState(false);
  const [paymentConfirmation, setPaymentConfirmation] = useState<'cash' | 'online'>('cash');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          customer_name,
          customer_email,
          customer_phone,
          delivery_address,
          delivery_city,
          delivery_state,
          delivery_pincode,
          subtotal,
          delivery_charge,
          total_amount,
          status,
          delivery_date,
          delivery_slot,
          payment_method,
          payment_status,
          cancellation_reason,
          cancelled_by,
          created_at,
          delivered_at,
          order_items (
            id,
            product_name,
            product_price,
            quantity,
            subtotal
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string, additionalData?: any) => {
    setIsUpdating(true);
    try {
      const updateData: any = { 
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      // Add specific fields based on status
      if (newStatus === 'delivered') {
        updateData.delivered_at = new Date().toISOString();
        if (additionalData?.paymentStatus) {
          updateData.payment_status = additionalData.paymentStatus;
        }
      }

      if (newStatus === 'cancelled') {
        updateData.cancellation_reason = additionalData?.reason || null;
        updateData.cancelled_by = 'admin';
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;

      toast.success(`Order ${newStatus === 'cancelled' ? 'cancelled' : `moved to ${newStatus}`}`);
      
      // Update local state
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus, ...updateData } : order
      ));
      
      // Update selected order if it's open
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus, ...updateData });
      }

      // Close dialogs
      setIsDeliveryDialogOpen(false);
      setIsCancelDialogOpen(false);
      setCancellationReason('');
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeliveryComplete = () => {
    if (!selectedOrder) return;

    const isCOD = selectedOrder.payment_method?.toLowerCase() === 'cod';
    
    if (isCOD) {
      // Show payment confirmation dialog for COD
      setIsDeliveryDialogOpen(true);
    } else {
      // For online payment, directly mark as delivered
      updateOrderStatus(selectedOrder.id, 'delivered', { 
        paymentStatus: 'paid' 
      });
    }
  };

  const confirmDelivery = () => {
    if (!selectedOrder) return;
    
    updateOrderStatus(selectedOrder.id, 'delivered', { 
      paymentStatus: paymentConfirmation === 'cash' ? 'paid' : 'paid'
    });
  };

  const handleCancelOrder = () => {
    if (!selectedOrder) return;
    setIsCancelDialogOpen(true);
  };

  const confirmCancellation = () => {
    if (!selectedOrder) return;
    if (!cancellationReason.trim()) {
      toast.error('Please provide a cancellation reason');
      return;
    }
    
    updateOrderStatus(selectedOrder.id, 'cancelled', { 
      reason: cancellationReason 
    });
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return 'bg-green-500 hover:bg-green-600';
      case 'out_for_delivery':
        return 'bg-purple-500 hover:bg-purple-600';
      case 'preparing':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'confirmed':
        return 'bg-cyan-500 hover:bg-cyan-600';
      case 'pending':
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 'cancelled':
        return 'bg-red-500 hover:bg-red-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const filterOrders = (status: string) => {
    if (status === 'all') return orders;
    return orders.filter(order => order.status?.toLowerCase() === status.toLowerCase());
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsDialogOpen(true);
  };

  const getNextStatus = (currentStatus: string) => {
    const status = currentStatus?.toLowerCase() || 'pending';
    if (status === 'pending') return 'confirmed';
    if (status === 'confirmed') return 'preparing';
    if (status === 'preparing') return 'out_for_delivery';
    if (status === 'out_for_delivery') return 'delivered';
    return null;
  };

  const getStatusLabel = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'out_for_delivery':
        return 'Out for Delivery';
      case 'confirmed':
        return 'Confirmed';
      case 'preparing':
        return 'Preparing';
      case 'pending':
        return 'Pending';
      case 'delivered':
        return 'Delivered';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const canCancelOrder = (order: Order) => {
    const status = order.status?.toLowerCase();
    return status !== 'delivered' && status !== 'cancelled';
  };

  const OrderCard = ({ order }: { order: Order }) => (
    <Card key={order.id}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-lg">Order #{order.order_number}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Customer: {order.customer_name}
            </p>
            <p className="text-sm text-muted-foreground">
              Date: {new Date(order.created_at).toLocaleDateString()}
            </p>
            <p className="text-sm text-muted-foreground">
              Payment: {order.payment_method?.toUpperCase()} 
              {order.payment_method?.toLowerCase() === 'cod' && ' (Cash on Delivery)'}
            </p>
          </div>
          
          <div className="text-right space-y-2 flex-shrink-0 ml-4">
            <p className="text-xl font-bold">₹{order.total_amount}</p>
            <Badge className={getStatusColor(order.status || 'pending')}>
              {getStatusLabel(order.status || 'pending')}
            </Badge>
            {order.payment_status && (
              <Badge variant="outline" className="block">
                {order.payment_status}
              </Badge>
            )}
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="ml-4"
            onClick={() => handleViewDetails(order)}
          >
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const TabContent = ({ status }: { status: string }) => {
    const filteredOrders = filterOrders(status);

    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Loading orders...</p>
        </div>
      );
    }

    if (filteredOrders.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {status === 'all' ? 'No orders found' : `No ${status} orders`}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {filteredOrders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Orders</h1>
          <p className="text-muted-foreground mt-2">Manage customer orders and deliveries</p>
        </div>
        <Button onClick={fetchOrders} variant="outline">
          <Package className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">
            All ({orders.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({filterOrders('pending').length})
          </TabsTrigger>
          <TabsTrigger value="confirmed">
            Confirmed ({filterOrders('confirmed').length})
          </TabsTrigger>
          <TabsTrigger value="preparing">
            Preparing ({filterOrders('preparing').length})
          </TabsTrigger>
          <TabsTrigger value="out_for_delivery">
            Out for Delivery ({filterOrders('out_for_delivery').length})
          </TabsTrigger>
          <TabsTrigger value="delivered">
            Delivered ({filterOrders('delivered').length})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Cancelled ({filterOrders('cancelled').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6"><TabContent status="all" /></TabsContent>
        <TabsContent value="pending" className="mt-6"><TabContent status="pending" /></TabsContent>
        <TabsContent value="confirmed" className="mt-6"><TabContent status="confirmed" /></TabsContent>
        <TabsContent value="preparing" className="mt-6"><TabContent status="preparing" /></TabsContent>
        <TabsContent value="out_for_delivery" className="mt-6"><TabContent status="out_for_delivery" /></TabsContent>
        <TabsContent value="delivered" className="mt-6"><TabContent status="delivered" /></TabsContent>
        <TabsContent value="cancelled" className="mt-6"><TabContent status="cancelled" /></TabsContent>
      </Tabs>

      {/* Order Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details - #{selectedOrder?.order_number}</DialogTitle>
            <DialogDescription>
              Complete order information and delivery management
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Status and Actions */}
              <div className="p-4 bg-muted rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Current Status</p>
                    <Badge className={getStatusColor(selectedOrder.status || 'pending')}>
                      {getStatusLabel(selectedOrder.status || 'pending')}
                    </Badge>
                  </div>
                  
                  {selectedOrder.status?.toLowerCase() === 'out_for_delivery' ? (
                    <Button
                      onClick={handleDeliveryComplete}
                      disabled={isUpdating}
                      size="lg"
                    >
                      {isUpdating ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      Mark as Delivered
                    </Button>
                  ) : getNextStatus(selectedOrder.status) && (
                    <Button
                      onClick={() => updateOrderStatus(selectedOrder.id, getNextStatus(selectedOrder.status)!)}
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <ArrowRight className="h-4 w-4 mr-2" />
                      )}
                      Move to {getStatusLabel(getNextStatus(selectedOrder.status)!)}
                    </Button>
                  )}
                </div>

                {canCancelOrder(selectedOrder) && (
                  <Button
                    variant="destructive"
                    onClick={handleCancelOrder}
                    disabled={isUpdating}
                    className="w-full"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel Order
                  </Button>
                )}

                {selectedOrder.status?.toLowerCase() === 'cancelled' && selectedOrder.cancellation_reason && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                    <p className="text-sm font-semibold text-destructive mb-1">Cancellation Reason:</p>
                    <p className="text-sm text-muted-foreground">{selectedOrder.cancellation_reason}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Cancelled by: {selectedOrder.cancelled_by || 'Admin'}
                    </p>
                  </div>
                )}
              </div>

              {/* Customer Information */}
              <div>
                <h3 className="font-semibold mb-3">Customer Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium">{selectedOrder.customer_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-medium">{selectedOrder.customer_email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="font-medium">{selectedOrder.customer_phone}</span>
                  </div>
                </div>
              </div>

              {/* Delivery Information */}
              <div>
                <h3 className="font-semibold mb-3">Delivery Information</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Address:</span>
                    <p className="font-medium mt-1">
                      {selectedOrder.delivery_address}, {selectedOrder.delivery_city}, {selectedOrder.delivery_state} - {selectedOrder.delivery_pincode}
                    </p>
                  </div>
                  {selectedOrder.delivery_date && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Delivery Date:</span>
                      <span className="font-medium">{new Date(selectedOrder.delivery_date).toLocaleDateString()}</span>
                    </div>
                  )}
                  {selectedOrder.delivery_slot && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Delivery Slot:</span>
                      <span className="font-medium">{selectedOrder.delivery_slot}</span>
                    </div>
                  )}
                  {selectedOrder.delivered_at && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Delivered At:</span>
                      <span className="font-medium">{new Date(selectedOrder.delivered_at).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-semibold mb-3">Order Items</h3>
                <div className="border rounded-lg divide-y">
                  {selectedOrder.order_items?.map((item) => (
                    <div key={item.id} className="p-3 flex justify-between items-center">
                      <div>
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-sm text-muted-foreground">
                          ₹{item.product_price} × {item.quantity}
                        </p>
                      </div>
                      <p className="font-semibold">₹{item.subtotal}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Summary */}
              <div>
                <h3 className="font-semibold mb-3">Payment Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span>₹{selectedOrder.subtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Delivery Charge:</span>
                    <span>₹{selectedOrder.delivery_charge || 0}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Total Amount:</span>
                    <span>₹{selectedOrder.total_amount}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-muted-foreground">Payment Method:</span>
                    <div className="flex items-center gap-2">
                      {selectedOrder.payment_method?.toLowerCase() === 'cod' ? (
                        <Wallet className="h-4 w-4" />
                      ) : (
                        <CreditCard className="h-4 w-4" />
                      )}
                      <span className="font-medium">{selectedOrder.payment_method?.toUpperCase()}</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment Status:</span>
                    <Badge variant={selectedOrder.payment_status === 'paid' ? 'default' : 'outline'}>
                      {selectedOrder.payment_status}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Order Date */}
              <div className="text-sm text-muted-foreground pt-4 border-t">
                Order placed on {new Date(selectedOrder.created_at).toLocaleString()}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delivery Confirmation Dialog (COD Only) */}
      <Dialog open={isDeliveryDialogOpen} onOpenChange={setIsDeliveryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delivery & Payment</DialogTitle>
            <DialogDescription>
              Confirm that the order has been delivered and payment has been collected
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm mb-2">Order: #{selectedOrder?.order_number}</p>
              <p className="text-lg font-bold">Total Amount: ₹{selectedOrder?.total_amount}</p>
              <p className="text-sm text-muted-foreground mt-1">Payment Method: COD</p>
            </div>

            <div className="space-y-2">
              <Label>Payment Collection Confirmation</Label>
              <RadioGroup value={paymentConfirmation} onValueChange={(value) => setPaymentConfirmation(value as 'cash' | 'online')}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cash" id="cash" />
                  <Label htmlFor="cash" className="cursor-pointer">Cash collected from customer</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="online" id="online" />
                  <Label htmlFor="online" className="cursor-pointer">Customer paid online at delivery</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeliveryDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmDelivery} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Confirm Delivery
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Order Dialog */}
      <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Order</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel order #{selectedOrder?.order_number}. The customer will be notified of the cancellation.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-4">
            <Label htmlFor="cancellation_reason">Cancellation Reason *</Label>
            <Textarea
              id="cancellation_reason"
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              placeholder="e.g., Address not found, Customer unavailable, Out of stock, etc."
              rows={4}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-2">
              This reason will be visible to the customer
            </p>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCancellationReason('')}>
              Go Back
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancellation}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancel Order
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Orders;