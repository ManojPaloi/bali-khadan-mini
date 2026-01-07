import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Loader2, CheckCircle2, X } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Layout } from '@/components/Layout';
import { FloatingInput } from '@/components/FloatingInput';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const policeStations = [
  "Beliabera PS",
  "Sankrail PS",
  "kalaikunda PS",
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
  const [vendor, setVendor] = useState('');
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

  // Auto-calculate cost when CFT changes (for 1st trip)
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
      // If neither cash nor upi is filled, auto-fill cash with cost
      if (!cash && !upi) {
        // Don't auto-fill immediately, let user decide
        return;
      }

      // If cash is filled but upi is not, auto-fill upi with remaining
      if (cash && !upi && cashNum < costNum) {
        const remaining = costNum - cashNum;
        setUpi(remaining.toString());
      }

      // If upi is filled but cash is not, auto-fill cash with remaining
      if (upi && !cash && upiNum < costNum) {
        const remaining = costNum - upiNum;
        setCash(remaining.toString());
      }
    }
  }, [cash, upi, cost]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = 'Name is required';
    if (!phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required';
    // if (!vendor.trim()) newErrors.vendor = 'Vendor is required';
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
    await new Promise((resolve) => setTimeout(resolve, 800));

    const now = new Date();
    const dateTime = now.toISOString();

    // Determine final cash and upi values
    const costNum = parseFloat(cost) || 0;
    let finalCash = parseFloat(cash) || 0;
    let finalUpi = parseFloat(upi) || 0;

    // If neither cash nor upi filled, cash = cost
    if (!cash && !upi) {
      finalCash = costNum;
      finalUpi = 0;
    }

    addEntry({
      dateTime,
      name: name.trim(),
      phoneNumber: phoneNumber.trim(),
      vendor: vendor.trim(),
      location: location.trim(),
      carNumber: carNumber.trim(),
      wheels: parseFloat(wheels),
      cft: parseFloat(cft),
      cost: costNum,
      cash: finalCash,
      upi: finalUpi,
      remark: remark.trim(),
      trip,
      policeStations: trip === '2nd' ? selectedStations : undefined,
    });

    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);

    // Reset form
    setName('');
    setPhoneNumber('');
    setVendor('');
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
    setErrors({});
    setIsSubmitting(false);

    toast({
      title: 'Success!',
      description: 'Data saved successfully',
    });
  };

  const toggleStation = (station: string) => {
    setSelectedStations((prev) =>
      prev.includes(station)
        ? prev.filter((s) => s !== station)
        : [...prev, station]
    );
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const nextSlNo = getNextSlNo(new Date().toISOString().split('T')[0]);
  const dateTime = new Date().toISOString();
  const slNo = getNextSlNo(dateTime);
  return (
    <Layout>
      <div className="mx-auto max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold">Data Entry</h1>
          <p className="text-sm text-muted-foreground">{currentDate}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6"
        >
          {/* Auto-generated info */}
          <div className="mb-6 flex items-center justify-between rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 p-5 shadow">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Serial No
              </p>
              <p className="text-2xl font-bold text-primary">
                {slNo}
              </p>
            </div>
            <div className="text-3xl font-extrabold text-primary/30">
              #
            </div>
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
                      trip === t
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border/50 bg-secondary/30 text-muted-foreground hover:bg-secondary/50'
                    )}
                  >
                    {t} Trip
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Police stations (2nd trip only) */}
            <AnimatePresence>
              {trip === '2nd' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <label className="mb-2 block text-sm text-muted-foreground">
                    Police Stations <span className="text-xs">(Optional)</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {policeStations.map((station) => (
                      <motion.button
                        key={station}
                        type="button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleStation(station)}
                        className={cn(
                          'rounded-lg border px-3 py-1.5 text-xs font-medium transition-all',
                          selectedStations.includes(station)
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border/50 bg-secondary/30 text-muted-foreground hover:bg-secondary/50'
                        )}
                      >
                        {station}
                        {selectedStations.includes(station) && (
                          <X className="ml-1 inline h-3 w-3" />
                        )}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Name & Phone Number */}
            <div className="grid gap-4 sm:grid-cols-2">

              <FloatingInput
                label="Car Number"
                value={carNumber}
                onChange={(e) => setCarNumber(e.target.value)}
                error={errors.carNumber}
              />
              <FloatingInput
                label="Phone Number"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                error={errors.phoneNumber}
              />
            </div>

            {/* Vendor & Location */}
            <div className="grid gap-4 sm:grid-cols-2">
              {/* <FloatingInput
                label="Vendor"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                error={errors.vendor}
              /> */}
              <FloatingInput
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={errors.name}
              />
              <FloatingInput
                label="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                error={errors.location}
              />


            </div>


            {/* Wheels & CFT */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Select value={wheels} onValueChange={setWheels}>
                  <SelectTrigger className={cn(
                    "h-12 rounded-xl border-border/50 bg-secondary/30",
                    errors.wheels && "border-destructive"
                  )}>
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
                {errors.wheels && (
                  <p className="mt-1 text-xs text-destructive">{errors.wheels}</p>
                )}
              </div>
              <FloatingInput
                label="CFT"
                type="number"
                value={cft}
                onChange={(e) => setCft(e.target.value)}
                error={errors.cft}
              />
            </div>

            {/* Cost (auto-calculated) */}
            <div className="relative">
              <FloatingInput
                label="Cost "
                type="number"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="bg-primary/5"
              />
            </div>

            {/* Cash & UPI */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="relative">
                <FloatingInput
                  label="Cash"
                  type="number"
                  value={cash}
                  onChange={(e) => {
                    setCash(e.target.value);
                    // Clear upi when cash changes to recalculate
                    if (e.target.value) {
                      const costNum = parseFloat(cost) || 0;
                      const cashNum = parseFloat(e.target.value) || 0;
                      if (cashNum < costNum) {
                        setUpi((costNum - cashNum).toString());
                      } else {
                        setUpi('0');
                      }
                    }
                  }}
                />

              </div>
              <div className="relative">
                <FloatingInput
                  label="UPI"
                  type="number"
                  value={upi}
                  onChange={(e) => {
                    setUpi(e.target.value);
                    // Clear cash when upi changes to recalculate
                    if (e.target.value) {
                      const costNum = parseFloat(cost) || 0;
                      const upiNum = parseFloat(e.target.value) || 0;
                      if (upiNum < costNum) {
                        setCash((costNum - upiNum).toString());
                      } else {
                        setCash('0');
                      }
                    }
                  }}
                />

              </div>
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
            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full gap-2 rounded-xl py-6 text-base font-medium"
              >
                <AnimatePresence mode="wait">
                  {isSubmitting ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2"
                    >
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Saving...
                    </motion.div>
                  ) : showSuccess ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2 text-success"
                    >
                      <CheckCircle2 className="h-5 w-5" />
                      Saved!
                    </motion.div>
                  ) : (
                    <motion.div
                      key="default"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2"
                    >
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
