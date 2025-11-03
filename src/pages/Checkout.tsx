import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, MapPin, Home, Briefcase, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase";
import { toast } from "sonner";

// Extend Window interface for Razorpay
declare global {
  interface Window {
    Razorpay: any;
  }
}

// Define the type for an address from the database
interface DbAddress {
  id: string;
  user_id: string;
  address_type: 'home' | 'work' | 'other';
  street_address: string;
  city: string;
  state: string;
  pin_code: string;
  is_default: boolean;
  created_at: string;
}

const Checkout = () => {
  const navigate = useNavigate();
  const { items, total: subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [isProcessing, setIsProcessing] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  
  // Address states
  const [loadingAddress, setLoadingAddress] = useState(true);
  const [addresses, setAddresses] = useState<DbAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [newAddressType, setNewAddressType] = useState<'home' | 'work' | 'other'>('home');
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);

  const deliveryCharge = subtotal > 500 ? 0 : 50;
  const total = subtotal + deliveryCharge;

  const [formData, setFormData] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    delivery_address: "",
    delivery_city: "",
    delivery_state: "",
    delivery_pincode: "",
  });

  // Fetch user's addresses
  useEffect(() => {
    const fetchAddresses = async () => {
      if (!user) {
        setLoadingAddress(false);
        return;
      }

      try {
        // Fetch all addresses
        const { data: dbAddresses, error: addressError } = await supabase
          .from('addresses')
          .select('*')
          .eq('user_id', user.id)
          .order('is_default', { ascending: false }); // Default address first

        if (addressError) throw addressError;
        setAddresses(dbAddresses || []);

        // Select default address if available
        if (dbAddresses && dbAddresses.length > 0) {
          const defaultAddress = dbAddresses.find(a => a.is_default) || dbAddresses[0];
          setSelectedAddressId(defaultAddress.id);
          // Pre-fill form with default address
          setFormData(prev => ({
            ...prev,
            delivery_address: defaultAddress.street_address,
            delivery_city: defaultAddress.city,
            delivery_state: defaultAddress.state,
            delivery_pincode: defaultAddress.pin_code,
          }));
        }
      } catch (error) {
        console.error('Error fetching addresses:', error);
      } finally {
        setLoadingAddress(false);
      }
    };

    fetchAddresses();
  }, [user]);

  // Load user profile data
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('first_name, last_name, phone')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') throw error;

        if (data) {
          setFormData(prev => ({
            ...prev,
            customer_name: `${data.first_name || ''} ${data.last_name || ''}`.trim(),
            customer_email: user.email || '',
            customer_phone: data.phone || '',
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            customer_email: user.email || '',
          }));
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    loadUserData();
  }, [user]);

  // Handle address selection change
  const handleAddressSelect = (addressId: string) => {
    setSelectedAddressId(addressId);
    const address = addresses.find(a => a.id === addressId);
    if (address) {
      setFormData(prev => ({
        ...prev,
        delivery_address: address.street_address,
        delivery_city: address.city,
        delivery_state: address.state,
        delivery_pincode: address.pin_code,
      }));
    }
    setIsAddingNewAddress(false);
  };

  // Handle adding a new address
  const handleAddNewAddress = () => {
    setIsAddingNewAddress(true);
    setSelectedAddressId('');
    setFormData(prev => ({
      ...prev,
      delivery_address: "",
      delivery_city: "",
      delivery_state: "",
      delivery_pincode: "",
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Function to save the new address to the database
  const saveNewAddress = async () => {
    if (!user) throw new Error("User not authenticated");

    // Step 1: Unset all previous default addresses for this user
    const { error: unsetError } = await supabase
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', user.id);

    if (unsetError) {
      console.error('Error unsetting old default address:', unsetError);
      throw new Error('Could not update old addresses. Please try again.');
    }

    // Step 2: Insert the new address as the new default
    const { data, error: insertError } = await supabase
      .from('addresses')
      .insert({
        user_id: user.id,
        address_type: newAddressType,
        street_address: formData.delivery_address,
        city: formData.delivery_city,
        state: formData.delivery_state,
        pin_code: formData.delivery_pincode,
        is_default: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error saving new address:', insertError);
      throw new Error('Could not save new address. Please try again.');
    }

    // Update the addresses state with the new address
    setAddresses(prev => [data, ...prev.map(a => ({ ...a, is_default: false }))]);
    setSelectedAddressId(data.id);
    setIsAddingNewAddress(false);
    
    toast.success('New address saved successfully!');
  };

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    script.onerror = () => {
      console.error('Failed to load Razorpay SDK');
      toast.error('Failed to load payment gateway');
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const generateOrderNumber = () => {
    return `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  };

  const createDatabaseOrder = async (razorpayOrderId?: string, paymentStatus: string = 'pending') => {
    try {
      const orderNumber = generateOrderNumber();
      
      // Insert order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          user_id: user?.id || null,
          customer_name: formData.customer_name,
          customer_email: formData.customer_email,
          customer_phone: formData.customer_phone,
          delivery_address: formData.delivery_address,
          delivery_city: formData.delivery_city,
          delivery_state: formData.delivery_state,
          delivery_pincode: formData.delivery_pincode,
          subtotal: subtotal,
          delivery_charge: deliveryCharge,
          total_amount: total,
          payment_method: paymentMethod,
          payment_status: paymentStatus,
          status: 'pending',
          razorpay_order_id: razorpayOrderId || null,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Get product IDs from slugs
      const productSlugs = items.map(item => item.id);
      const { data: products } = await supabase
        .from('products')
        .select('id, slug')
        .in('slug', productSlugs);

      const slugToIdMap = new Map(products?.map(p => [p.slug, p.id]) || []);

      // Insert order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: slugToIdMap.get(item.id) || null,
        product_name: item.name,
        product_price: item.price,
        quantity: item.quantity,
        subtotal: item.price * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      return order;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  };

  const createRazorpayOrder = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
        body: {
          amount: total,
          currency: 'INR',
          receipt: `rcpt_${Date.now()}`,
          notes: {
            customer_name: formData.customer_name,
            customer_email: formData.customer_email,
          },
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      return data;
    } catch (error) {
      console.error('Error creating Razorpay order:', error);
      throw error;
    }
  };

  const handleRazorpayPayment = async () => {
    try {
      const razorpayData = await createRazorpayOrder();

      const options = {
        key: razorpayData.key_id,
        amount: razorpayData.amount,
        currency: razorpayData.currency,
        name: 'Zaika Toast',
        description: 'Order Payment',
        order_id: razorpayData.order_id,
        handler: async function (response: any) {
          try {
            const dbOrder = await createDatabaseOrder(razorpayData.order_id, 'paid');

            const { error } = await supabase
              .from('orders')
              .update({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                status: 'confirmed',
              })
              .eq('id', dbOrder.id);

            if (error) throw error;

            clearCart();
            toast.success("Payment successful! Order placed 🎉");
            navigate('/account');
          } catch (error) {
            console.error('Error creating order after payment:', error);
            toast.error('Payment successful but failed to create order. Please contact support with your payment ID: ' + response.razorpay_payment_id);
          } finally {
            setIsProcessing(false);
          }
        },
        prefill: {
          name: formData.customer_name,
          email: formData.customer_email,
          contact: formData.customer_phone,
        },
        theme: {
          color: '#FF6B35',
        },
        modal: {
          ondismiss: function() {
            setIsProcessing(false);
            toast.info('Payment cancelled');
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Razorpay payment error:', error);
      setIsProcessing(false);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isProcessing) return;
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setIsProcessing(true);

    try {
      // If user is adding a new address, save it before creating the order
      if (isAddingNewAddress) {
        await saveNewAddress();
      }

      if (paymentMethod === 'razorpay') {
        if (!razorpayLoaded) {
          throw new Error('Payment gateway not loaded. Please refresh and try again.');
        }
        await handleRazorpayPayment();
      } else {
        await createDatabaseOrder(undefined, 'pending');
        clearCart();
        toast.success("Order placed successfully! 🎉");
        navigate('/account');
        setIsProcessing(false);
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error.message || 'Failed to place order. Please try again.');
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12 min-h-[60vh] flex items-center justify-center">
        <Card className="text-center py-12 max-w-md">
          <CardContent>
            <h2 className="text-2xl font-display font-semibold mb-4">Your cart is empty</h2>
            <Link to="/products">
              <Button>Browse Products</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getAddressIcon = (type: string) => {
    switch (type) {
      case 'home':
        return <Home className="h-4 w-4" />;
      case 'work':
        return <Briefcase className="h-4 w-4" />;
      default:
        return <Building className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <Link to="/cart">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Cart
        </Button>
      </Link>

      <h1 className="text-4xl font-display font-bold mb-8">
        Checkout
      </h1>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customer_name">Full Name *</Label>
                  <Input
                    id="customer_name"
                    name="customer_name"
                    value={formData.customer_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customer_email">Email *</Label>
                    <Input
                      id="customer_email"
                      name="customer_email"
                      type="email"
                      value={formData.customer_email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customer_phone">Phone *</Label>
                    <Input
                      id="customer_phone"
                      name="customer_phone"
                      type="tel"
                      value={formData.customer_phone}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Address */}
            <Card>
              <CardHeader>
                <CardTitle>Delivery Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingAddress ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <RadioGroup 
                    value={isAddingNewAddress ? "new" : selectedAddressId} 
                    onValueChange={(value) => {
                      if (value === "new") {
                        handleAddNewAddress();
                      } else {
                        handleAddressSelect(value);
                      }
                    }}
                    className="space-y-3"
                  >
                    {/* Show all addresses */}
                    {addresses.map((address) => (
                      <div 
                        key={address.id} 
                        className={`flex items-start space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-accent/5 ${
                          selectedAddressId === address.id ? 'border-primary bg-accent/10' : ''
                        }`}
                      >
                        <RadioGroupItem 
                          value={address.id} 
                          id={`address-${address.id}`} 
                        />
                        <div className="flex-1">
                          <label htmlFor={`address-${address.id}`} className="cursor-pointer">
                            <div className="flex items-center gap-2 font-semibold mb-2">
                              {getAddressIcon(address.address_type)}
                              <span className="capitalize">{address.address_type} Address</span>
                              {address.is_default && (
                                <Badge variant="secondary" className="ml-2 text-xs">
                                  Default
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {address.street_address}, {address.city}, {address.state} - {address.pin_code}
                            </p>
                          </label>
                        </div>
                      </div>
                    ))}

                    {/* Add New Address Option */}
                    <div 
                      className={`flex items-start space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-accent/5 ${
                        isAddingNewAddress ? 'border-primary bg-accent/10' : ''
                      }`}
                    >
                      <RadioGroupItem 
                        value="new" 
                        id="new-address" 
                      />
                      <div className="flex-1">
                        <label htmlFor="new-address" className="cursor-pointer font-semibold">
                          Add New Address
                        </label>
                        {isAddingNewAddress && (
                          <div className="mt-4 space-y-4">
                            <div>
                              <Label>Address Type</Label>
                              <RadioGroup value={newAddressType} onValueChange={(value: any) => setNewAddressType(value)} className="flex gap-4 mt-2">
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="home" id="type-home" />
                                  <Label htmlFor="type-home" className="flex items-center gap-2 cursor-pointer">
                                    <Home className="h-4 w-4" /> Home
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="work" id="type-work" />
                                  <Label htmlFor="type-work" className="flex items-center gap-2 cursor-pointer">
                                    <Briefcase className="h-4 w-4" /> Work
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="other" id="type-other" />
                                  <Label htmlFor="type-other" className="flex items-center gap-2 cursor-pointer">
                                    <Building className="h-4 w-4" /> Other
                                  </Label>
                                </div>
                              </RadioGroup>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="delivery_address">Street Address *</Label>
                              <Input
                                id="delivery_address"
                                name="delivery_address"
                                value={formData.delivery_address}
                                onChange={handleInputChange}
                                placeholder="House number, street name"
                                required
                              />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="delivery_city">City *</Label>
                                <Input
                                  id="delivery_city"
                                  name="delivery_city"
                                  value={formData.delivery_city}
                                  onChange={handleInputChange}
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="delivery_state">State *</Label>
                                <Input
                                  id="delivery_state"
                                  name="delivery_state"
                                  value={formData.delivery_state}
                                  onChange={handleInputChange}
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="delivery_pincode">PIN Code *</Label>
                                <Input
                                  id="delivery_pincode"
                                  name="delivery_pincode"
                                  value={formData.delivery_pincode}
                                  onChange={handleInputChange}
                                  required
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </RadioGroup>
                )}
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="flex items-center space-x-2 p-3 border rounded-md cursor-pointer hover:bg-accent/5">
                    <RadioGroupItem value="razorpay" id="razorpay" />
                    <Label htmlFor="razorpay" className="flex-1 cursor-pointer">
                      <div className="font-semibold">Pay Online</div>
                      <p className="text-sm text-muted-foreground">Credit/Debit Card, UPI, Net Banking</p>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-md cursor-pointer hover:bg-accent/5">
                    <RadioGroupItem value="cod" id="cod" />
                    <Label htmlFor="cod" className="flex-1 cursor-pointer">
                      <div className="font-semibold">Cash on Delivery</div>
                      <p className="text-sm text-muted-foreground">Pay when you receive</p>
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>
                        {item.name} × {item.quantity}
                      </span>
                      <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Delivery</span>
                    <span>{deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}</span>
                  </div>
                  {subtotal < 500 && (
                    <p className="text-xs text-muted-foreground">
                      Add ₹{(500 - subtotal).toFixed(2)} more for free delivery
                    </p>
                  )}
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total</span>
                    <span className="text-primary">₹{total.toFixed(2)}</span>
                  </div>
                </div>
                <Button type="submit" className="w-full" size="lg" disabled={isProcessing}>
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Place Order - ₹${total.toFixed(2)}`
                  )}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  By placing your order, you agree to our terms and conditions
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Checkout;