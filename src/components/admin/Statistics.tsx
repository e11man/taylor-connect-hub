import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Loader2, RefreshCw, TrendingUp, Users, Clock, Building2, Edit2, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StatisticsData {
  recorded: {
    active_volunteers: number;
    hours_contributed: number;
    partner_organizations: number;
  };
  live: {
    active_volunteers: number;
    hours_contributed: number;
    partner_organizations: number;
  };
}

interface EditingState {
  statType: string | null;
  fieldType: 'confirmed' | 'estimate' | null;
  value: string;
}

export const Statistics = () => {
  const { toast } = useToast();
  const [statistics, setStatistics] = useState<StatisticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editingState, setEditingState] = useState<EditingState>({
    statType: null,
    fieldType: null,
    value: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchStatistics = async (showRefreshToast = false) => {
    try {
      if (showRefreshToast) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const response = await fetch('/api/statistics');
      const data = await response.json();

      if (data.success) {
        setStatistics(data.data);
        if (showRefreshToast) {
          toast({
            title: "Statistics refreshed",
            description: "Values have been updated from the database",
          });
        }
      } else {
        throw new Error(data.error || 'Failed to fetch statistics');
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
      toast({
        title: "Error",
        description: "Failed to fetch statistics. Using fallback values.",
        variant: "destructive",
      });
      
      // Set fallback values
      setStatistics({
        recorded: {
          active_volunteers: 2500,
          hours_contributed: 5000,
          partner_organizations: 50,
        },
        live: {
          active_volunteers: 0,
          hours_contributed: 0,
          partner_organizations: 0,
        },
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, []);

  useEffect(() => {
    // Focus input when editing starts
    if (editingState.statType && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingState.statType]);

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const calculateDifference = (recorded: number, live: number): number => {
    return live - recorded;
  };

  const startEditing = (statType: string, fieldType: 'confirmed' | 'estimate', currentValue: number) => {
    setEditingState({
      statType,
      fieldType,
      value: currentValue.toString()
    });
  };

  const cancelEditing = () => {
    setEditingState({
      statType: null,
      fieldType: null,
      value: ''
    });
  };

  const saveValue = async () => {
    if (!editingState.statType || !editingState.fieldType) return;

    // Validate input
    const value = parseInt(editingState.value);
    if (isNaN(value) || value < 0) {
      toast({
        title: "Invalid value",
        description: "Please enter a non-negative number",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch('/api/statistics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stat_type: editingState.statType,
          field_type: editingState.fieldType,
          value: value
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStatistics(data.data);
        toast({
          title: "Success",
          description: "Statistics updated successfully",
        });
        cancelEditing();
      } else {
        throw new Error(data.error || 'Failed to update statistics');
      }
    } catch (error) {
      console.error('Error updating statistics:', error);
      toast({
        title: "Error",
        description: "Failed to update statistics. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveValue();
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#00AFCE]" />
      </div>
    );
  }

  if (!statistics) {
    return (
      <Alert>
        <AlertDescription>
          Unable to load statistics. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  const StatCard = ({ 
    title, 
    icon: Icon, 
    recorded, 
    live, 
    color = "text-[#00AFCE]",
    statType
  }: { 
    title: string; 
    icon: React.ElementType; 
    recorded: number; 
    live: number; 
    color?: string;
    statType: string;
  }) => {
    const difference = calculateDifference(recorded, live);
    const showIncrease = difference > 0;
    const isEditingConfirmed = editingState.statType === statType && editingState.fieldType === 'confirmed';
    const isEditingEstimate = editingState.statType === statType && editingState.fieldType === 'estimate';

    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="text-lg font-medium">{title}</span>
            <Icon className={`w-6 h-6 ${color}`} />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm text-muted-foreground">Confirmed Total</p>
              {!isEditingConfirmed && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2"
                  onClick={() => startEditing(statType, 'confirmed', recorded)}
                >
                  <Edit2 className="w-3 h-3" />
                </Button>
              )}
            </div>
            {isEditingConfirmed ? (
              <div className="flex items-center gap-2">
                <Input
                  ref={inputRef}
                  type="number"
                  value={editingState.value}
                  onChange={(e) => setEditingState({ ...editingState, value: e.target.value })}
                  onKeyDown={handleKeyDown}
                  className="h-9 w-32"
                  min="0"
                  disabled={isSaving}
                />
                <Button
                  size="sm"
                  className="h-8 px-2"
                  onClick={saveValue}
                  disabled={isSaving}
                >
                  {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2"
                  onClick={cancelEditing}
                  disabled={isSaving}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <p className="text-3xl font-bold">{formatNumber(recorded)}</p>
            )}
          </div>
          
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm text-muted-foreground">Current Estimate</p>
              {!isEditingEstimate && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2"
                  onClick={() => startEditing(statType, 'estimate', live)}
                >
                  <Edit2 className="w-3 h-3" />
                </Button>
              )}
            </div>
            {isEditingEstimate ? (
              <div className="flex items-center gap-2">
                <Input
                  ref={inputRef}
                  type="number"
                  value={editingState.value}
                  onChange={(e) => setEditingState({ ...editingState, value: e.target.value })}
                  onKeyDown={handleKeyDown}
                  className="h-9 w-32"
                  min="0"
                  disabled={isSaving}
                />
                <Button
                  size="sm"
                  className="h-8 px-2"
                  onClick={saveValue}
                  disabled={isSaving}
                >
                  {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2"
                  onClick={cancelEditing}
                  disabled={isSaving}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-2xl font-semibold text-muted-foreground">
                  {formatNumber(live)}
                </p>
                {showIncrease && (
                  <Badge variant="secondary" className="text-xs">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {formatNumber(difference)}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Statistics Overview</h2>
          <p className="text-muted-foreground mt-1">
            Monitor volunteer engagement and partner growth
          </p>
        </div>
        <Button
          onClick={() => fetchStatistics(true)}
          disabled={isRefreshing}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Active Volunteers"
          icon={Users}
          recorded={statistics.recorded.active_volunteers}
          live={statistics.live.active_volunteers}
          statType="active_volunteers"
        />
        
        <StatCard
          title="Hours Contributed"
          icon={Clock}
          recorded={statistics.recorded.hours_contributed}
          live={statistics.live.hours_contributed}
          color="text-orange-500"
          statType="hours_contributed"
        />
        
        <StatCard
          title="Partner Organizations"
          icon={Building2}
          recorded={statistics.recorded.partner_organizations}
          live={statistics.live.partner_organizations}
          color="text-purple-500"
          statType="partner_organizations"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>About These Statistics</CardTitle>
          <CardDescription>
            Understanding the difference between confirmed and estimated values
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Confirmed Total</h4>
            <p className="text-sm text-muted-foreground">
              These are the official numbers that have been verified and confirmed by administrators. Click the edit button to update these values.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Current Estimate</h4>
            <p className="text-sm text-muted-foreground">
              These numbers can be manually adjusted to reflect real-time estimates or projections. They help track progress between official counts.
            </p>
          </div>
          
          <Alert className="mt-4">
            <AlertDescription>
              <strong>Note:</strong> All changes are saved immediately and will be reflected across the entire site, including the home page statistics display.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};