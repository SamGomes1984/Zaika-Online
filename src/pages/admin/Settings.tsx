import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Eye, EyeOff, Key, Loader2, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase';

interface SiteSettings {
  site_name: string;
  contact_email: string;
  contact_phone: string;
  delivery_charge: string;
  free_delivery_threshold: string;
}

interface ApiKey {
  razorpay_key_id: string;
  razorpay_key_secret: string;
  google_client_id: string;
  google_client_secret: string;
}

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    site_name: '',
    contact_email: '',
    contact_phone: '',
    delivery_charge: '',
    free_delivery_threshold: '',
  });

  const [apiKeys, setApiKeys] = useState<ApiKey>({
    razorpay_key_id: '',
    razorpay_key_secret: '',
    google_client_id: '',
    google_client_secret: '',
  });

  const [showKeys, setShowKeys] = useState({
    razorpay_key: false,
    razorpay_secret: false,
    google_client_id: false,
    google_client_secret: false,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      // Fetch site settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', [
          'site_name',
          'contact_email',
          'contact_phone',
          'delivery_charge',
          'free_delivery_threshold'
        ]);

      if (settingsError) throw settingsError;

      // Convert array to object
      const settings: any = {};
      settingsData?.forEach(item => {
        settings[item.key] = item.value || '';
      });

      setSiteSettings({
        site_name: settings.site_name || 'Zaika Toast',
        contact_email: settings.contact_email || '',
        contact_phone: settings.contact_phone || '',
        delivery_charge: settings.delivery_charge || '50',
        free_delivery_threshold: settings.free_delivery_threshold || '500',
      });

      // Fetch API keys (admin only)
      const { data: keysData, error: keysError } = await supabase
        .from('api_keys')
        .select('key_name, key_value')
        .in('key_name', [
          'razorpay_key_id',
          'razorpay_key_secret',
          'google_client_id',
          'google_client_secret'
        ]);

      if (!keysError && keysData) {
        const keys: any = {};
        keysData.forEach(item => {
          keys[item.key_name] = item.key_value || '';
        });

        setApiKeys({
          razorpay_key_id: keys.razorpay_key_id || '',
          razorpay_key_secret: keys.razorpay_key_secret || '',
          google_client_id: keys.google_client_id || '',
          google_client_secret: keys.google_client_secret || '',
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const saveBusinessSettings = async () => {
    setSaving(true);
    try {
      // Upsert each setting
      const updates = [
        { key: 'site_name', value: siteSettings.site_name },
        { key: 'contact_email', value: siteSettings.contact_email },
        { key: 'contact_phone', value: siteSettings.contact_phone },
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from('site_settings')
          .upsert({
            key: update.key,
            value: update.value,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'key'
          });

        if (error) throw error;
      }

      toast.success('Business settings saved successfully');
    } catch (error) {
      console.error('Error saving business settings:', error);
      toast.error('Failed to save business settings');
    } finally {
      setSaving(false);
    }
  };

  const saveDeliverySettings = async () => {
    setSaving(true);
    try {
      const updates = [
        { key: 'delivery_charge', value: siteSettings.delivery_charge },
        { key: 'free_delivery_threshold', value: siteSettings.free_delivery_threshold },
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from('site_settings')
          .upsert({
            key: update.key,
            value: update.value,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'key'
          });

        if (error) throw error;
      }

      toast.success('Delivery settings saved successfully');
    } catch (error) {
      console.error('Error saving delivery settings:', error);
      toast.error('Failed to save delivery settings');
    } finally {
      setSaving(false);
    }
  };

  const saveRazorpayKeys = async () => {
    setSaving(true);
    try {
      const updates = [
        {
          service_name: 'razorpay',
          key_name: 'razorpay_key_id',
          key_value: apiKeys.razorpay_key_id,
        },
        {
          service_name: 'razorpay',
          key_name: 'razorpay_key_secret',
          key_value: apiKeys.razorpay_key_secret,
        },
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from('api_keys')
          .upsert({
            ...update,
            is_active: true,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'service_name,key_name'
          });

        if (error) throw error;
      }

      toast.success('Razorpay keys saved successfully');
    } catch (error) {
      console.error('Error saving Razorpay keys:', error);
      toast.error('Failed to save Razorpay keys');
    } finally {
      setSaving(false);
    }
  };

  const saveGoogleOAuthKeys = async () => {
    setSaving(true);
    try {
      const updates = [
        {
          service_name: 'google_oauth',
          key_name: 'google_client_id',
          key_value: apiKeys.google_client_id,
        },
        {
          service_name: 'google_oauth',
          key_name: 'google_client_secret',
          key_value: apiKeys.google_client_secret,
        },
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from('api_keys')
          .upsert({
            ...update,
            is_active: true,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'service_name,key_name'
          });

        if (error) throw error;
      }

      toast.success('Google OAuth keys saved successfully');
    } catch (error) {
      console.error('Error saving Google OAuth keys:', error);
      toast.error('Failed to save Google OAuth keys');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">Configure your store settings and integrations</p>
      </div>

      <Tabs defaultValue="business" className="space-y-6">
        <TabsList>
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="delivery">Delivery</TabsTrigger>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
        </TabsList>

        <TabsContent value="business">
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>
                Update your store's basic information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="site_name">Store Name</Label>
                <Input
                  id="site_name"
                  value={siteSettings.site_name}
                  onChange={(e) => setSiteSettings({ ...siteSettings, site_name: e.target.value })}
                  placeholder="Zaika Toast"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_email">Contact Email</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={siteSettings.contact_email}
                  onChange={(e) => setSiteSettings({ ...siteSettings, contact_email: e.target.value })}
                  placeholder="hello@zaikatoast.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_phone">Contact Phone</Label>
                <Input
                  id="contact_phone"
                  type="tel"
                  value={siteSettings.contact_phone}
                  onChange={(e) => setSiteSettings({ ...siteSettings, contact_phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <Button onClick={saveBusinessSettings} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="delivery">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Settings</CardTitle>
              <CardDescription>
                Configure delivery charges and thresholds
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="delivery_charge">Standard Delivery Charge (₹)</Label>
                <Input
                  id="delivery_charge"
                  type="number"
                  value={siteSettings.delivery_charge}
                  onChange={(e) => setSiteSettings({ ...siteSettings, delivery_charge: e.target.value })}
                  placeholder="50"
                />
                <p className="text-sm text-muted-foreground">
                  Charge applied for orders below free delivery threshold
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="free_delivery_threshold">Free Delivery Above (₹)</Label>
                <Input
                  id="free_delivery_threshold"
                  type="number"
                  value={siteSettings.free_delivery_threshold}
                  onChange={(e) => setSiteSettings({ ...siteSettings, free_delivery_threshold: e.target.value })}
                  placeholder="500"
                />
                <p className="text-sm text-muted-foreground">
                  Orders above this amount get free delivery
                </p>
              </div>
              <Button onClick={saveDeliverySettings} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api-keys">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-primary" />
                  <CardTitle>Razorpay Payment Gateway</CardTitle>
                </div>
                <CardDescription>
                  Configure your Razorpay credentials for payment processing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="razorpay-key">Razorpay Key ID</Label>
                  <div className="relative">
                    <Input
                      id="razorpay-key"
                      type={showKeys.razorpay_key ? 'text' : 'password'}
                      value={apiKeys.razorpay_key_id}
                      onChange={(e) => setApiKeys({ ...apiKeys, razorpay_key_id: e.target.value })}
                      placeholder="rzp_test_xxxxxxxxxx"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKeys({ ...showKeys, razorpay_key: !showKeys.razorpay_key })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showKeys.razorpay_key ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="razorpay-secret">Razorpay Secret Key</Label>
                  <div className="relative">
                    <Input
                      id="razorpay-secret"
                      type={showKeys.razorpay_secret ? 'text' : 'password'}
                      value={apiKeys.razorpay_key_secret}
                      onChange={(e) => setApiKeys({ ...apiKeys, razorpay_key_secret: e.target.value })}
                      placeholder="Enter secret key"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKeys({ ...showKeys, razorpay_secret: !showKeys.razorpay_secret })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showKeys.razorpay_secret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button onClick={saveRazorpayKeys} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Razorpay Keys
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-primary" />
                  <CardTitle>Google OAuth</CardTitle>
                </div>
                <CardDescription>
                  Configure Google OAuth for social login
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="google-client-id">Google Client ID</Label>
                  <div className="relative">
                    <Input
                      id="google-client-id"
                      type={showKeys.google_client_id ? 'text' : 'password'}
                      value={apiKeys.google_client_id}
                      onChange={(e) => setApiKeys({ ...apiKeys, google_client_id: e.target.value })}
                      placeholder="Enter Google Client ID"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKeys({ ...showKeys, google_client_id: !showKeys.google_client_id })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showKeys.google_client_id ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="google-client-secret">Google Client Secret</Label>
                  <div className="relative">
                    <Input
                      id="google-client-secret"
                      type={showKeys.google_client_secret ? 'text' : 'password'}
                      value={apiKeys.google_client_secret}
                      onChange={(e) => setApiKeys({ ...apiKeys, google_client_secret: e.target.value })}
                      placeholder="Enter Google Client Secret"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKeys({ ...showKeys, google_client_secret: !showKeys.google_client_secret })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showKeys.google_client_secret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button onClick={saveGoogleOAuthKeys} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Google OAuth Keys
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;