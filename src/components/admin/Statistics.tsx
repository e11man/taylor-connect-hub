import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, RefreshCw, TrendingUp, Users, Clock, Building2 } from "lucide-react";
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

export const Statistics = () => {
  const { toast } = useToast();
  const [statistics, setStatistics] = useState<StatisticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
            description: "Live estimates have been recalculated",
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

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const calculateDifference = (recorded: number, live: number): number => {
    return live - recorded;
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
    color = "text-[#00AFCE]" 
  }: { 
    title: string; 
    icon: React.ElementType; 
    recorded: number; 
    live: number; 
    color?: string;
  }) => {
    const difference = calculateDifference(recorded, live);
    const showIncrease = difference > 0;

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
            <p className="text-sm text-muted-foreground mb-1">Confirmed Total</p>
            <p className="text-3xl font-bold">{formatNumber(recorded)}</p>
          </div>
          
          <div className="border-t pt-4">
            <p className="text-sm text-muted-foreground mb-1">Current Estimate</p>
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
          Refresh Live Data
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Active Volunteers"
          icon={Users}
          recorded={statistics.recorded.active_volunteers}
          live={statistics.live.active_volunteers}
        />
        
        <StatCard
          title="Hours Contributed"
          icon={Clock}
          recorded={statistics.recorded.hours_contributed}
          live={statistics.live.hours_contributed}
          color="text-orange-500"
        />
        
        <StatCard
          title="Partner Organizations"
          icon={Building2}
          recorded={statistics.recorded.partner_organizations}
          live={statistics.live.partner_organizations}
          color="text-purple-500"
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
              These are the official numbers stored in our database. They represent verified counts that have been reviewed and confirmed by administrators.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Current Estimate</h4>
            <p className="text-sm text-muted-foreground">
              These numbers are calculated in real-time based on actual user activity. They include all sign-ups, partnerships, and volunteer hours since the last official update.
            </p>
          </div>
          
          <Alert className="mt-4">
            <AlertDescription>
              <strong>Note:</strong> Hours are estimated at 2 hours per event sign-up unless otherwise specified. Current estimates are refreshed each time you load this page or click the refresh button.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};