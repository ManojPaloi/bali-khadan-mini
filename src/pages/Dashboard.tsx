import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Calendar, Filter, Eye, X,
  TrendingUp, Car, DollarSign, Truck,
  ChevronDown, ChevronUp, Banknote,
  RadioTower
} from 'lucide-react';

import { useStore, FormEntry } from '@/store/useStore';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export const Dashboard = () => {
  const { entries } = useStore();
  console.log("entries", entries);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [tripFilter, setTripFilter] = useState<'all' | '1st' | '2nd'>('all');
  const [sortOrder, setSortOrder] = useState<'latest' | 'oldest'>('latest');
  const [selectedEntry, setSelectedEntry] = useState<FormEntry | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filter and sort entries
  const filteredEntries = useMemo(() => {
    let result = [...entries];

    // Search filter
    if (searchQuery) {
      result = result.filter((e) =>
        e.carNumber.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Date filter
    if (dateFrom) {
      result = result.filter((e) => e.dateTime >= dateFrom);
    }
    if (dateTo) {
      result = result.filter((e) => e.dateTime <= dateTo + 'T23:59:59');
    }

    // Trip filter
    if (tripFilter !== 'all') {
      result = result.filter((e) => e.trip === tripFilter);
    }

    // Sort
    result.sort((a, b) => {
      const dateA = new Date(a.dateTime).getTime();
      const dateB = new Date(b.dateTime).getTime();
      return sortOrder === 'latest' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [entries, searchQuery, dateFrom, dateTo, tripFilter, sortOrder]);

  // Stats
  const stats = useMemo(() => {
    const totalCost = filteredEntries.reduce((sum, e) => sum + e.cost, 0);
    const totalCash = filteredEntries.reduce((sum, e) => sum + e.cash, 0);
    const totalUpi = filteredEntries.reduce((sum, e) => sum + e.upi, 0);
    return {
      totalEntries: filteredEntries.length,
      totalCost,
      totalCash,
      totalUpi,
    };
  }, [filteredEntries]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setDateFrom('');
    setDateTo('');
    setTripFilter('all');
  };

  const StatCard = ({
    icon: Icon,
    label,
    value,
    color
  }: {
    icon: typeof TrendingUp;
    label: string;
    value: string | number;
    color: string;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4"
    >
      <div className="flex items-center gap-3">
        <div className={cn('rounded-xl p-2.5', color)}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </div>
    </motion.div>
  );

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            View and manage your transport data
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={Truck}
            label="Total Entries"
            value={stats.totalEntries}
            color="bg-primary/10 text-primary"
          />
          <StatCard
            icon={DollarSign}
            label="Total Cost"
            value={`₹${stats.totalCost.toLocaleString()}`}
            color="bg-success/10 text-success"
          />
          <StatCard
            icon={Banknote}
            label="Total Cash"
            value={`₹${stats.totalCash.toLocaleString()}`}
            color="bg-blue-500/10 text-blue-500"
          />
          <StatCard
            icon={RadioTower}
            label="Total UPI"
            value={`₹${stats.totalUpi.toLocaleString()}`}
            color="bg-purple-500/10 text-purple-500"
          />
        </div>

        {/* Filters */}
        <div className="glass-card p-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search car number..."
                className="w-full rounded-xl border border-border/50 bg-secondary/50 py-2.5 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Trip filter */}
            <div className="flex rounded-xl border border-border/50 bg-secondary/30 p-1">
              {(['all', '1st', '2nd'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTripFilter(t)}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                    tripFilter === t
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {t === 'all' ? 'All' : `${t} Trip`}
                </button>
              ))}
            </div>

            {/* Toggle filters */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
              {showFilters ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </Button>

            {/* Sort */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'latest' ? 'oldest' : 'latest')}
              className="gap-2"
            >
              {sortOrder === 'latest' ? 'Latest First' : 'Oldest First'}
            </Button>
          </div>

          {/* Expanded filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 flex flex-wrap items-end gap-4 border-t border-border/30 pt-4"
              >
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">From Date</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="rounded-lg border border-border/50 bg-secondary/50 px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">To Date</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="rounded-lg border border-border/50 bg-secondary/50 px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear All
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Table / Cards */}
        <div className="glass-card overflow-hidden">
          {filteredEntries.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div className="mb-4 rounded-full bg-secondary/50 p-4">
                <Truck className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium">No entries found</p>
              <p className="text-sm text-muted-foreground">
                {entries.length === 0
                  ? 'Start adding data from the Entry Form'
                  : 'Try adjusting your filters'}
              </p>
            </motion.div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/30 bg-secondary/30">
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Sl No</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Date/Time</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Car Number</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Trip</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Wheels</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">CFT</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Cost</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Cash</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">UPI</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {filteredEntries.map((entry, index) => (
                        <motion.tr
                          key={entry.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ delay: index * 0.03 }}
                          className={cn(
                            'border-b border-border/20 transition-colors hover:bg-secondary/30',
                            entry.trip === '2nd' && 'highlight-row'
                          )}
                        >
                          <td className="px-4 py-3 text-sm font-medium">{entry.slNo}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {formatDate(entry.dateTime)}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium">{entry.carNumber}</td>
                          <td className="px-4 py-3">
                            <span
                              className={cn(
                                'rounded-full px-2 py-0.5 text-xs font-medium',
                                entry.trip === '1st'
                                  ? 'bg-blue-500/10 text-blue-500'
                                  : 'bg-primary/10 text-primary'
                              )}
                            >
                              {entry.trip}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">{entry.wheels}</td>
                          <td className="px-4 py-3 text-sm">{entry.cft}</td>
                          <td className="px-4 py-3 text-sm font-medium text-success">
                            ₹{entry.cost}
                          </td>
                          <td className="px-4 py-3 text-sm">₹{entry.cash}</td>
                          <td className="px-4 py-3 text-sm">₹{entry.upi}</td>
                          <td className="px-4 py-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedEntry(entry)}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="space-y-3 p-4 md:hidden">
                <AnimatePresence>
                  {filteredEntries.map((entry, index) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => setSelectedEntry(entry)}
                      className={cn(
                        'cursor-pointer rounded-xl border border-border/30 bg-secondary/30 p-4 transition-all hover:bg-secondary/50',
                        entry.trip === '2nd' && 'border-l-2 border-l-primary bg-primary/5'
                      )}
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold">#{entry.slNo}</span>
                          <span
                            className={cn(
                              'rounded-full px-2 py-0.5 text-xs font-medium',
                              entry.trip === '1st'
                                ? 'bg-blue-500/10 text-blue-500'
                                : 'bg-primary/10 text-primary'
                            )}
                          >
                            {entry.trip} Trip
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(entry.dateTime)}
                        </span>
                      </div>
                      <div className="mb-2 flex items-center gap-2">
                        <Car className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{entry.carNumber}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {entry.wheels} wheels • {entry.cft} CFT
                        </span>
                        <span className="font-medium text-success">₹{entry.cost}</span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </>
          )}
        </div>

        {/* View Dialog */}
        <Dialog open={!!selectedEntry} onOpenChange={() => setSelectedEntry(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span>Entry Details</span>
                {selectedEntry?.trip === '2nd' && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    2nd Trip
                  </span>
                )}
              </DialogTitle>
            </DialogHeader>
            {selectedEntry && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-secondary/50 p-3">
                    <p className="text-xs text-muted-foreground">Sl No</p>
                    <p className="text-lg font-bold">{selectedEntry.slNo}</p>
                  </div>
                  <div className="rounded-lg bg-secondary/50 p-3">
                    <p className="text-xs text-muted-foreground">Date/Time</p>
                    <p className="text-sm font-medium">
                      {new Date(selectedEntry.dateTime).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg bg-secondary/50 p-3">
                  <p className="text-xs text-muted-foreground">Car Number</p>
                  <p className="text-lg font-bold">{selectedEntry.carNumber}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-secondary/50 p-3">
                    <p className="text-xs text-muted-foreground">Name</p>
                    <p className="font-bold">{selectedEntry.name}</p>
                  </div>
                  <div className="rounded-lg bg-secondary/50 p-3">
                    <p className="text-xs text-muted-foreground">phone Number</p>
                    <p className="font-bold">{selectedEntry.phoneNumber}</p>
                  </div>
                </div>

                <div className="rounded-lg bg-secondary/50 p-3">
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="font-bold">{selectedEntry.location}</p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg bg-secondary/50 p-3">
                    <p className="text-xs text-muted-foreground">Wheels</p>
                    <p className="font-bold">{selectedEntry.wheels}</p>
                  </div>
                  <div className="rounded-lg bg-secondary/50 p-3">
                    <p className="text-xs text-muted-foreground">CFT</p>
                    <p className="font-bold">{selectedEntry.cft}</p>
                  </div>
                  <div className="rounded-lg bg-success/10 p-3">
                    <p className="text-xs text-muted-foreground">Cost</p>
                    <p className="font-bold text-success">₹{selectedEntry.cost}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-secondary/50 p-3">
                    <p className="text-xs text-muted-foreground">Cash</p>
                    <p className="font-bold">₹{selectedEntry.cash}</p>
                  </div>
                  <div className="rounded-lg bg-secondary/50 p-3">
                    <p className="text-xs text-muted-foreground">UPI</p>
                    <p className="font-bold">₹{selectedEntry.upi}</p>
                  </div>
                </div>

                {selectedEntry.remark && (
                  <div className="rounded-lg bg-secondary/50 p-3">
                    <p className="text-xs text-muted-foreground">Remark</p>
                    <p className="text-sm">{selectedEntry.remark}</p>
                  </div>
                )}

                {selectedEntry.policeStations && selectedEntry.policeStations.length > 0 && (
                  <div className="rounded-lg bg-primary/10 p-3">
                    <p className="mb-2 text-xs text-muted-foreground">Police Stations</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedEntry.policeStations.map((station) => (
                        <span
                          key={station}
                          className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary"
                        >
                          {station}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </DialogContent>
        </Dialog>
      </motion.div>
    </Layout>
  );
};

export default Dashboard;
