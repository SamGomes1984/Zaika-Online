import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Edit, Trash2 } from 'lucide-react';

const Coupons = () => {
  const mockCoupons = [
    {
      id: '1',
      code: 'WELCOME10',
      discount: '10%',
      minOrder: 500,
      validUntil: '2025-03-31',
      usageCount: 45,
    },
    {
      id: '2',
      code: 'FLAT50',
      discount: '₹50',
      minOrder: 300,
      validUntil: '2025-02-28',
      usageCount: 23,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Coupons</h1>
          <p className="text-muted-foreground mt-2">Manage discount codes</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Coupon
        </Button>
      </div>

      <div className="grid gap-4">
        {mockCoupons.map((coupon) => (
          <Card key={coupon.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg font-mono">{coupon.code}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Discount: {coupon.discount} | Min Order: ₹{coupon.minOrder}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Valid until: {new Date(coupon.validUntil).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right space-y-4">
                  <div>
                    <p className="text-lg font-semibold">{coupon.usageCount}</p>
                    <p className="text-sm text-muted-foreground">Times Used</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Coupons;
