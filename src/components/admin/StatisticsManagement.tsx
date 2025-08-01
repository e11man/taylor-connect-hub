import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useStatistics } from '@/hooks/useStatistics';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, TrendingUp, Users, Clock, Building } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Statistic {
  key: string;
  base_value: number;
  live_value: number;
  total_value: number;
  description: string;
}

const getStatIcon = (key: string) => {
  switch (key) {
    case 'active_volunteers':
      return Users;
    case 'hours_contributed':
      return Clock;
    case 'partner_organizations':
      return Building;
    default:
      return TrendingUp;
  }
};

const getStatLabel = (key: string) => {
  switch (key) {
    case 'active_volunteers':
      return 'Active Volunteers';
    case 'hours_contributed':
      return 'Hours Contributed';
    case 'partner_organizations':
      return 'Partner Organizations';
    default:
      return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
};

export const StatisticsManagement = () => {
  const { statistics, loading, error, updateBaseValue, updateLiveValue, recalculateStatistics } = useStatistics();
  const { toast } = useToast();
  const [editingStat, setEditingStat] = useState<Statistic | null>(null);
  const [editType, setEditType] = useState<'base' | 'live'>('base');
  const [editValue, setEditValue] = useState('');

  const handleEdit = (stat: Statistic, type: 'base' | 'live') => {
    setEditingStat(stat);
    setEditType(type);
    setEditValue(type === 'base' ? stat.base_value.toString() : stat.live_value.toString());
  };

  const handleSave = async () => {
    if (!editingStat) return;

    const numValue = parseInt(editValue);
    if (isNaN(numValue) || numValue < 0) {
      toast({
        title: 'Error',
        description: 'Please enter a valid positive number',
        variant: 'destructive',
      });
      return;
    }

    const updateFunction = editType === 'base' ? updateBaseValue : updateLiveValue;
    const result = await updateFunction(editingStat.key, numValue);

    if (result.success) {
      toast({
        title: 'Success',
        description: `${editType === 'base' ? 'Base' : 'Live'} value updated successfully`,
      });
      setEditingStat(null);
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to update value',
        variant: 'destructive',
      });
    }
  };

  const handleRecalculate = async () => {
    const result = await recalculateStatistics();
    if (result.success) {
      toast({
        title: 'Success',
        description: 'Statistics recalculated successfully',
      });
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to recalculate statistics',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Statistics Management</CardTitle>
          <CardDescription>
            Manage dynamic impact statistics with base values and live calculations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Statistics Management</CardTitle>
          <CardDescription>
            Manage dynamic impact statistics with base values and live calculations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">Error loading statistics: {error}</p>
            <Button onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Statistics Management</CardTitle>
              <CardDescription>
                Manage dynamic impact statistics. Base values are starting numbers, live values are calculated from user activity.
              </CardDescription>
            </div>
            <Button onClick={handleRecalculate} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Recalculate
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Statistic</TableHead>
                <TableHead>Base Value</TableHead>
                <TableHead>Live Value</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {statistics.map((stat) => {
                const IconComponent = getStatIcon(stat.key);
                return (
                  <TableRow key={stat.key}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <IconComponent className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">{getStatLabel(stat.key)}</div>
                          <div className="text-sm text-muted-foreground">{stat.description}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-lg">{stat.base_value.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Starting value</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-lg text-green-600">{stat.live_value.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">From activity</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-xl font-bold text-blue-600">
                        {stat.total_value.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">Displayed</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(stat, 'base')}
                            >
                              Edit Base
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Base Value</DialogTitle>
                              <DialogDescription>
                                Update the starting value for {getStatLabel(stat.key)}. This will be added to the live calculated value.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                              <Label htmlFor="base-value">Base Value</Label>
                              <Input
                                id="base-value"
                                type="number"
                                min="0"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="mt-2"
                              />
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setEditingStat(null)}>
                                Cancel
                              </Button>
                              <Button onClick={handleSave}>
                                Save
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(stat, 'live')}
                            >
                              Edit Live
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Live Value</DialogTitle>
                              <DialogDescription>
                                Manually override the calculated live value for {getStatLabel(stat.key)}. This will be added to the base value.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                              <Label htmlFor="live-value">Live Value</Label>
                              <Input
                                id="live-value"
                                type="number"
                                min="0"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="mt-2"
                              />
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setEditingStat(null)}>
                                Cancel
                              </Button>
                              <Button onClick={handleSave}>
                                Save
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}; 