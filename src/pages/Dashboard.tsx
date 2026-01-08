import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Eye,
  ChevronDown,
  ChevronUp,
  Car,
  DollarSign,
  Truck,
  Banknote,
  RadioTower,
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
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
const COMPANY = {
  name: 'Patina Khadan',
  address: 'NH-16, Kolaghat, West Bengal',
  phone: '+91 9XXXXXXXXX',
  logo: '/logo.png', // public folder
};



const getDateKey = (date: Date) =>
  date.toLocaleDateString('en-CA'); // YYYY-MM-DD

const getLabel = (date: Date) =>
  date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

/* =====================
   Component
===================== */

export const Dashboard = () => {
  const { entries } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [tripFilter, setTripFilter] = useState<'all' | '1st' | '2nd'>('all');
  const [sortOrder, setSortOrder] = useState<'latest' | 'oldest'>('latest');

  const [dateFilterMode, setDateFilterMode] = useState<string>('today');

  const [showFilters, setShowFilters] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<FormEntry | null>(null);

  /* =====================
     Dynamic Date Options
  ===================== */

  const dateOptions = useMemo(() => {
    const today = new Date();

    const dates = [0, 1, 2].map((offset) => {
      const d = new Date(today);
      d.setDate(today.getDate() - offset);
      return d;
    });

    const options = ['today', ...dates.slice(1).map(d => getDateKey(d))];

    const labels: Record<string, string> = {
      today: 'Today',
    };

    dates.slice(1).forEach((d) => {
      labels[getDateKey(d)] = getLabel(d);
    });

    return { options, labels };
  }, []);

  /* =====================
     Filter + Sort
  ===================== */

  const filteredEntries = useMemo(() => {
    let result = [...entries];

    /* Search */
    if (searchQuery) {
      result = result.filter((e) =>
        e.carNumber.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    /* =====================
       DATE FILTER (FIXED)
    ===================== */

    // 1️⃣ From–To Date Range (highest priority)
    if (dateFrom || dateTo) {
      result = result.filter((e) => {
        const time = new Date(e.dateTime).getTime();

        const fromOk = dateFrom
          ? time >= new Date(dateFrom).setHours(0, 0, 0, 0)
          : true;

        const toOk = dateTo
          ? time <= new Date(dateTo).setHours(23, 59, 59, 999)
          : true;

        return fromOk && toOk;
      });
    }
    // 2️⃣ Quick Date Buttons
    else if (dateFilterMode === 'today') {
      const todayKey = getDateKey(new Date());
      result = result.filter(
        (e) => getDateKey(new Date(e.dateTime)) === todayKey
      );
    }
    else {
      result = result.filter(
        (e) => getDateKey(new Date(e.dateTime)) === dateFilterMode
      );
    }

    /* Trip filter */
    if (tripFilter !== 'all') {
      result = result.filter((e) => e.trip === tripFilter);
    }

    /* Sort */
    result.sort((a, b) => {
      const aTime = new Date(a.dateTime).getTime();
      const bTime = new Date(b.dateTime).getTime();
      return sortOrder === 'latest' ? bTime - aTime : aTime - bTime;
    });

    return result;
  }, [
    entries,
    searchQuery,
    tripFilter,
    sortOrder,
    dateFilterMode,
    dateFrom,
    dateTo,
  ]);

  /* =====================
     Stats
  ===================== */

  const stats = useMemo(() => {
    const totalCost = filteredEntries.reduce((s, e) => s + e.cost, 0);
    const totalCash = filteredEntries.reduce((s, e) => s + e.cash, 0);
    const totalUpi = filteredEntries.reduce((s, e) => s + e.upi, 0);

    return {
      totalEntries: filteredEntries.length,
      totalCost,
      totalCash,
      totalUpi,
    };
  }, [filteredEntries]);

  const formatDate = (date: string) =>
    new Date(date).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

  const clearFilters = () => {
    setSearchQuery('');
    setTripFilter('all');
    setDateFrom('');
    setDateTo('');
    setDateFilterMode('today');
  };
  const getPdfDateTitle = () => {
    if (dateFrom && dateTo) {
      return `${format(new Date(dateFrom), 'dd MMM yyyy')} – ${format(
        new Date(dateTo),
        'dd MMM yyyy'
      )}`;
    }

    if (dateFrom && !dateTo) {
      return format(new Date(dateFrom), 'dd MMM yyyy');
    }

    if (dateFilterMode === 'today') {
      return format(new Date(), 'dd MMM yyyy');
    }

    return format(new Date(dateFilterMode), 'dd MMM yyyy');
  };

  const drawHeader = (doc: jsPDF) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;

    doc.setFillColor(33, 37, 41); // dark header
    doc.rect(0, 0, pageWidth, 30, 'F');

    doc.setTextColor(255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(COMPANY.name, margin, 18);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('DAILY TRANSPORT SHEET', pageWidth - margin, 14, {
      align: 'right',
    });
    doc.text(`Date : ${getPdfDateTitle()}`, pageWidth - margin, 22, {
      align: 'right',
    });

    doc.setTextColor(0);
  };

  const exportPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;

    // FIRST PAGE HEADER
    drawHeader(doc);

    const tableData = filteredEntries.map((e) => [
      e.slNo,
      e.carNumber,
      e.wheels,
      e.cft,
      `${e.cost}`,
      e.cash ? `${e.cash}` : '-',
      e.upi ? `${e.upi}` : '-',
      e.trip === '2nd' ? '2nd Trip' : '1st Trip',
      e.remark || '-',
    ]);

    const totalCash = filteredEntries.reduce((s, e) => s + e.cash, 0);
    const totalUpi = filteredEntries.reduce((s, e) => s + e.upi, 0);
    const totalCost = filteredEntries.reduce((s, e) => s + e.cost, 0);

    tableData.push([
      '',
      'TOTAL',
      '',
      '',
      `${totalCost}`,
      `${totalCash}`,
      `${totalUpi}`,
      '',
      '',
    ]);

    autoTable(doc, {
      startY: 36, // ⬅ below header
      tableWidth: pageWidth - margin * 2,
      margin: { left: margin, right: margin, top: 36 },
      theme: 'grid',

      head: [[
        'Sl',
        'Vehicle No',
        'Wheel',
        'CFT',
        'Rate',
        'Cash',
        'Upi',
        'Trip',
        'Remarks',
      ]],

      body: tableData,

      styles: {
        fontSize: 9,
        cellPadding: 3,
        valign: 'middle',
      },

      headStyles: {
        fillColor: [220, 220, 220],
        textColor: 0,
        fontStyle: 'bold',
      },

      didParseCell(data) {
        const row = data.row.raw;

        if (row && row[7] === '2nd Trip' && data.section === 'body') {
          data.cell.styles.fillColor = [255, 243, 205];
        }

        if (row && row[1] === 'TOTAL') {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [230, 230, 230];
        }
      },

      didDrawPage: () => {
        // 🔥 THIS MAKES HEADER REPEAT ON EVERY PAGE
        drawHeader(doc);
      },

      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { cellWidth: 28 },
        2: { cellWidth: 20 },
        3: { halign: 'center', cellWidth: 18 },
        4: { halign: 'center', cellWidth: 18 },
        5: { halign: 'right', cellWidth: 20 },
        6: { halign: 'right', cellWidth: 18 },
        7: { halign: 'center', cellWidth: 18 },
        8: { cellWidth: 25 },
      },
    });

    /* FOOTER */
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    doc.save(`daily-sheet-${getPdfDateTitle().replace(/ /g, '-')}.pdf`);
  };






  return (
    <Layout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Truck} label="Total Entries" value={stats.totalEntries} color="bg-primary/10 text-primary" />
          <StatCard icon={DollarSign} label="Total Cost" value={`₹${stats.totalCost}`} color="bg-success/10 text-success" />
          <StatCard icon={Banknote} label="Total Cash" value={`₹${stats.totalCash}`} color="bg-blue-500/10 text-blue-500" />
          <StatCard icon={RadioTower} label="Total UPI" value={`₹${stats.totalUpi}`} color="bg-purple-500/10 text-purple-500" />
        </div>

        {/* Filters */}
        <div className="glass-card p-4">
          <div className="flex flex-wrap items-center gap-3">

            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search car number..."
                className="w-full rounded-xl border bg-secondary/50 py-2.5 pl-10 pr-4 text-sm"
              />
            </div>

            <FilterGroup
              value={tripFilter}
              onChange={setTripFilter}
              options={['all', '1st', '2nd']}
              labels={{ all: 'All', '1st': '1st Trip', '2nd': '2nd Trip' }}
            />

            {/* ✅ Dynamic Date Filter */}
            <FilterGroup
              value={dateFilterMode}
              onChange={(val) => {
                setDateFrom('');
                setDateTo('');
                setDateFilterMode(val);
              }}
              options={dateOptions.options}
              labels={dateOptions.labels}
            />

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setSortOrder(sortOrder === 'latest' ? 'oldest' : 'latest')
              }
            >
              {sortOrder === 'latest' ? 'Latest First' : 'Oldest First'}
            </Button>

            <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="h-4 w-4" />
              Filters
              {showFilters ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>

            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear All
            </Button>
            <Button variant="outline" size="sm" onClick={exportPDF}>
              Export PDF
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
                {/* From Date */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground">From Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-[160px] justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateFrom ? format(new Date(dateFrom), 'dd MMM yyyy') : 'Select date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateFrom ? new Date(dateFrom) : undefined}
                        onSelect={(date) => {
                          setDateFilterMode('today'); // disable quick buttons
                          setDateFrom(date ? getDateKey(date) : '');
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* To Date */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground">To Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-[160px] justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateTo ? format(new Date(dateTo), 'dd MMM yyyy') : 'Select date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateTo ? new Date(dateTo) : undefined}
                        onSelect={(date) => {
                          setDateFilterMode('today');
                          setDateTo(date ? getDateKey(date) : '');
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
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

/* =====================
   Small Components
===================== */

const FilterGroup = ({ value, onChange, options, labels }: any) => (
  <div className="flex rounded-xl border bg-secondary/30 p-1">
    {options.map((o: string) => (
      <button
        key={o}
        onClick={() => onChange(o)}
        className={cn(
          'rounded-lg px-3 py-1.5 text-xs',
          value === o
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground'
        )}
      >
        {labels[o]}
      </button>
    ))}
  </div>
);

const StatCard = ({ icon: Icon, label, value, color }: any) => (
  <div className="glass-card p-4 flex items-center gap-3">
    <div className={cn('rounded-xl p-2.5', color)}>
      <Icon className="h-5 w-5" />
    </div>
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  </div>
);

export default Dashboard;
