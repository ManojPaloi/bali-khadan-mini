import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Loader2, CheckCircle2 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Layout } from '@/components/Layout';
import { FloatingInput } from '@/components/FloatingInput';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { axiosProtected } from '@/auth/api/axios';

const policeStations = [
  "Beliabera PS",
  "Sankrail PS",
  "Kalaikunda PS",
  "Kharagpur Local PS",
  "Gopiballavpur PS",
  "Dantan PS",
  "Kharagpur PS",
  "Midnapore PS",
  "Salboni PS",
  "Nayagram PS",
  "Keshiary PS",
  "Jhargram Court PS",
  "Binpur PS",
];

const wheelsOptions = ['6', '10', '12', '14', '16', '18', '20', '22'];

export const Form = () => {
  const { addEntry, getNextSlNo } = useStore();
  const { toast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [location, setLocation] = useState('');
  const [carNumber, setCarNumber] = useState('');
  const [wheels, setWheels] = useState('');
  const [cft, setCft] = useState('');
  const [cost, setCost] = useState('');
  const [cash, setCash] = useState('');
  const [upi, setUpi] = useState('');
  const [remark, setRemark] = useState('');
  const [trip, setTrip] = useState<'1st' | '2nd'>('1st');
  const [selectedStations, setSelectedStations] = useState<string[]>([]);

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-calculate cost when CFT changes (only for 1st trip)
  useEffect(() => {
    if (trip === '1st' && cft) {
      const calculatedCost = parseFloat(cft) * 50;
      setCost(calculatedCost.toString());
    }
  }, [cft, trip]);

  // Auto-fill cash/upi based on cost
  useEffect(() => {
    const costNum = parseFloat(cost) || 0;
    const cashNum = parseFloat(cash) || 0;
    const upiNum = parseFloat(upi) || 0;

    if (costNum > 0) {
      if (cash && !upi) {
        setUpi((costNum - cashNum).toString());
      } else if (!cash && upi) {
        setCash((costNum - upiNum).toString());
      }
    }
  }, [cash, upi, cost]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required';
    if (!location.trim()) newErrors.location = 'Location is required';
    if (!carNumber.trim()) newErrors.carNumber = 'Car number is required';
    if (!wheels) newErrors.wheels = 'Select wheels count';
    if (!cft || parseFloat(cft) <= 0) newErrors.cft = 'Valid CFT required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    const now = new Date();
    const dateTime = now.toISOString();

    const costNum = parseFloat(cost) || 0;
    let finalCash = parseFloat(cash) || 0;
    let finalUpi = parseFloat(upi) || 0;

    if (!cash && !upi) finalCash = costNum;

    const payment_in = finalCash > 0 ? 'cash' : 'upi';
    const paid_amount = finalCash > 0 ? finalCash : finalUpi;

    const payload = {
      trip: trip === '1st' ? 'first trip' : 'second trip',
      car_number: carNumber.trim(),
      phone_number: phoneNumber.trim(),
      name: name.trim(),
      location: location.trim(),
      wheels: parseInt(wheels) || 0,
      cft: parseFloat(cft) || 0,
      total_cost: costNum,
      payment_in,
      paid_amount,
      payment_status: 'paid',
      remarks: remark.trim(),
    };

    try {
      const response = await axiosProtected.post('/users/invoice/generate/', payload);
      if (response.status >= 200 && response.status < 300) {
        toast({
          title: 'Success',
          description: 'Invoice generated!',
        });

        setShowSuccess(true);

        // Reset form after 2s
        setTimeout(() => {
          setName('');
          setPhoneNumber('');
          setLocation('');
          setCarNumber('');
          setWheels('');
          setCft('');
          setCost('');
          setCash('');
          setUpi('');
          setRemark('');
          setTrip('1st');
          setSelectedStations([]);
          setShowSuccess(false);
        }, 2000);
      } else {
        throw new Error('API returned non-success status');
      }
    } catch (error: any) {
      console.error(error);
      toast({
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to generate invoice',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }

  };


  const toggleStation = (station: string) => {
    setSelectedStations((prev) =>
      prev.includes(station) ? prev.filter((s) => s !== station) : [...prev, station]
    );
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const slNo = getNextSlNo(new Date().toISOString().split('T')[0]);

  return (
    <Layout>
      <div className="mx-auto max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-2xl font-bold">Data Entry</h1>
          <p className="text-sm text-muted-foreground">{currentDate}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="glass-card p-6">
          {/* Auto-generated info */}
          <div className="mb-6 flex items-center justify-between rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 p-5 shadow">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Serial No</p>
              <p className="text-2xl font-bold text-primary">{slNo}</p>
            </div>
            <div className="text-3xl font-extrabold text-primary/30">#</div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Trip selector */}
            <div>
              <label className="mb-2 block text-sm text-muted-foreground">Trip</label>
              <div className="flex gap-2">
                {(['1st', '2nd'] as const).map((t) => (
                  <motion.button
                    key={t}
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setTrip(t)}
                    className={cn(
                      'flex-1 rounded-xl border py-3 text-sm font-medium transition-all',
                      trip === t ? 'border-primary bg-primary/10 text-primary' : 'border-border/50 bg-secondary/30 text-muted-foreground hover:bg-secondary/50'
                    )}
                  >
                    {t} Trip
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Car Number & Phone */}
            <div className="grid gap-4 sm:grid-cols-2">
              <FloatingInput label="Car Number" value={carNumber} onChange={(e) => setCarNumber(e.target.value)} error={errors.carNumber} />
              <FloatingInput label="Phone Number" type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} error={errors.phoneNumber} />
            </div>

            {/* Name & Location */}
            <div className="grid gap-4 sm:grid-cols-2">
              <FloatingInput label="Name" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
              <FloatingInput label="Location" value={location} onChange={(e) => setLocation(e.target.value)} error={errors.location} />
            </div>

            {/* Wheels & CFT */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Select value={wheels} onValueChange={setWheels}>
                  <SelectTrigger className={cn('h-12 rounded-xl border-border/50 bg-secondary/30', errors.wheels && 'border-destructive')}>
                    <SelectValue placeholder="Select wheels" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border">
                    {wheelsOptions.map((w) => (
                      <SelectItem key={w} value={w}>
                        {w} Wheels
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.wheels && <p className="mt-1 text-xs text-destructive">{errors.wheels}</p>}
              </div>
              <FloatingInput label="CFT" type="number" value={cft} onChange={(e) => setCft(e.target.value)} error={errors.cft} />
            </div>

            {/* Cost */}
            <div className="relative">
              <FloatingInput label="Cost" type="number" value={cost} onChange={(e) => setCost(e.target.value)} className="bg-primary/5" />
            </div>

            {/* Cash & UPI */}
            <div className="grid gap-4 sm:grid-cols-2">
              <FloatingInput
                label="Cash"
                type="number"
                value={cash}
                onChange={(e) => {
                  setCash(e.target.value);
                  const costNum = parseFloat(cost) || 0;
                  const cashNum = parseFloat(e.target.value) || 0;
                  setUpi(cashNum < costNum ? (costNum - cashNum).toString() : '0');
                }}
              />
              <FloatingInput
                label="UPI"
                type="number"
                value={upi}
                onChange={(e) => {
                  setUpi(e.target.value);
                  const costNum = parseFloat(cost) || 0;
                  const upiNum = parseFloat(e.target.value) || 0;
                  setCash(upiNum < costNum ? (costNum - upiNum).toString() : '0');
                }}
              />
            </div>

            {/* Remark */}
            <div>
              <label className="mb-2 block text-sm text-muted-foreground">Remark</label>
              <Textarea
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="Enter remark..."
                className="min-h-[100px] resize-none rounded-xl border-border/50 bg-secondary/30"
              />
            </div>

            {/* Submit button */}
            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              <Button type="submit" disabled={isSubmitting} className="w-full gap-2 rounded-xl py-6 text-base font-medium">
                <AnimatePresence mode="wait">
                  {isSubmitting ? (
                    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Saving...
                    </motion.div>
                  ) : showSuccess ? (
                    <motion.div key="success" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-success">
                      <CheckCircle2 className="h-5 w-5" />
                      Saved!
                    </motion.div>
                  ) : (
                    <motion.div key="default" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                      <Save className="h-5 w-5" />
                      Save Entry
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            </motion.div>
          </form>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Form;
