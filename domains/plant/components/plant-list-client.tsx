'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Leaf, 
  MoreHorizontal, 
  Droplets,
  Gauge,
  Plus,
  BarChart3,
  X
} from 'lucide-react';

import { Plant, getPlants } from '../actions/plant';
import { getPlantHealth } from '../../health/actions/health';
import { PlantDrawer } from './plant-drawer';
import { DeletePlantButton } from './delete-plant-button';
import { HealthHistoryChart } from '../../health/components/health-history-chart';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogDescription,
  DialogFooter,
} from "../../../components/ui/dialog";

// Helper function to generate dates for default view
function getDateRange(daysBack = 14) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - daysBack);
  
  // Format dates as YYYY-MM-DD
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0]
  };
}

interface PlantListClientProps {
  initialPlants: Plant[];
}

type StatusVariant = 'success' | 'warning' | 'danger';

interface PlantStatus {
  label: string;
  variant: StatusVariant;
}

// Type for plant health data
type HealthData = {
  plantId: number;
  plantName: string;
  overallStatus: string;
  averageScore: number;
  startDate: string;
  endDate: string;
  dailyData: Array<{
    date: string;
    precipitation: number;
    humidity: number;
    status: string;
    score: number;
    waterDeviation: number;
    humidityDeviation: number;
  }>;
};

export function PlantListClient({ initialPlants }: PlantListClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [plants, setPlants] = useState<Plant[]>(initialPlants);
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState<Plant | undefined>(undefined);
  const [plantToDelete, setPlantToDelete] = useState<{ id: number; name: string } | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const isFetchingRef = useRef(false);
  
  // Health chart state
  const [isHealthChartOpen, setIsHealthChartOpen] = useState(false);
  const [selectedPlantHealth, setSelectedPlantHealth] = useState<HealthData | null>(null);
  const [isLoadingHealth, setIsLoadingHealth] = useState(false);

  useEffect(() => {
    const fetchPlants = async () => {
      if (isFetchingRef.current) return;
      try {
        isFetchingRef.current = true;
        const updatedPlants = await getPlants();
        setPlants(updatedPlants);
      } catch (error) {
        console.error('Error refreshing plants:', error);
      } finally {
        isFetchingRef.current = false;
      }
    };
    
    if (refreshKey > 0) {
      fetchPlants();
    }
  }, [refreshKey]);

  useEffect(() => {
    const shouldOpenAddDrawer = searchParams.get('add') === 'true';
    const editPlantId = searchParams.get('edit');
    
    if (shouldOpenAddDrawer) {
      handleAddClick();
      router.replace(window.location.pathname, undefined);
    } else if (editPlantId) {
      const plantToEdit = plants.find(p => p.id === parseInt(editPlantId));
      if (plantToEdit) {
        handleEditClick(plantToEdit);
        router.replace(window.location.pathname, undefined);
      }
    }
  }, [searchParams, plants, router]);

  const handleEditClick = (plant: Plant) => {
    setSelectedPlant(plant);
    setIsEditDrawerOpen(true);
  };

  const handleAddClick = () => {
    setIsAddDrawerOpen(true);
  };

  const handleDeleteClick = (plantId: number, plantName: string) => {
    setPlantToDelete({ id: plantId, name: plantName });
    setIsDeleteDialogOpen(true);
  };

  const handleRefresh = useCallback(() => {
    setRefreshKey(prevKey => prevKey + 1);
  }, []);

  const handlePlantDeleted = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setPlantToDelete(null);
    handleRefresh();
  }, [handleRefresh]);
  
  // Health chart functions
  const handleViewHealthHistory = async (plant: Plant) => {
    if (!plant.weekly_water_need || !plant.expected_humidity) {
      // Show an error or notification that health data requires water need and humidity settings
      return;
    }
    
    try {
      setIsLoadingHealth(true);
      
      // Get default date range (last 14 days)
      const { startDate, endDate } = getDateRange();
      
      // Fetch health data for the plant
      const healthData = await getPlantHealth(plant.id, startDate, endDate);
      
      setSelectedPlantHealth(healthData);
      setIsHealthChartOpen(true);
    } catch (error) {
      console.error('Error fetching plant health data:', error);
    } finally {
      setIsLoadingHealth(false);
    }
  };

  // Determine plant health status
  const getPlantStatus = (plant: Plant): PlantStatus => {
    // This is just a demo implementation based on ID
    // In a real app, you would compute status based on actual metrics
    const statusIndex = plant.id % 3;
    
    switch (statusIndex) {
      case 0:
        return { label: 'Excellent', variant: 'success' };
      case 1:
        return { label: 'Good', variant: 'warning' };
      case 2:
        return { label: 'Needs Care', variant: 'danger' };
      default:
        return { label: 'Unknown', variant: 'warning' };
    }
  };

  // Format numeric values
  const formatNumber = (value: number | null | undefined, decimals: number = 1): string => {
    if (value === null || value === undefined) return '—';
    return Number(value).toFixed(decimals);
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: PlantStatus }) => {
    const variantStyles = {
      success: 'bg-emerald-100 text-emerald-800 border-emerald-200 shadow-sm',
      warning: 'bg-amber-100 text-amber-800 border-amber-200 shadow-sm',
      danger: 'bg-rose-100 text-rose-800 border-rose-200 shadow-sm',
    };
    
    return (
      <span className={cn(
        'inline-flex px-3 py-1.5 rounded-full text-sm font-medium border',
        variantStyles[status.variant]
      )}>
        {status.label}
      </span>
    );
  };

  // Empty state component
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="h-20 w-20 rounded-lg bg-green-50 flex items-center justify-center mb-6">
        <Leaf className="h-10 w-10 text-green-500" strokeWidth={1.5} />
      </div>
      <h3 className="text-xl font-semibold text-slate-900 mb-2">Ready to grow your collection?</h3>
      <p className="text-base text-slate-600 mb-8 text-center max-w-lg">
        Start monitoring your plants with our intelligent care system to ensure they thrive in any environment.
      </p>
      <Button 
        onClick={handleAddClick} 
        className="bg-white hover:bg-gray-50 text-gray-800 rounded-full px-4 py-2 h-9 border shadow-sm flex items-center"
      >
        <Plus className="h-4 w-4 mr-1" />
        <span>Add Your First Plant</span>
      </Button>
    </div>
  );

  return (
    <div className="py-14 px-4 md:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 mb-8">
        <div className="mb-4 sm:mb-0">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Plant Dashboard</h1>
          <p className="text-base text-slate-600 mt-2">Monitor health, analyze growth patterns, and optimize care for your plants</p>
        </div>
        <Button 
          onClick={handleAddClick}
          className="bg-white hover:bg-gray-50 text-gray-800 rounded-full px-4 py-2 h-9 border shadow-sm flex items-center self-end sm:self-auto"
        >
          <Plus className="h-4 w-4 mr-1" />
          <span>Add New Plant</span>
        </Button>
      </div>

      <Card className="rounded-xl border-slate-200 shadow-md overflow-hidden mb-8">
        <CardContent className="p-0">
          {plants.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent bg-slate-50 border-b border-slate-200">
                    <TableHead className="w-[250px] py-4 text-sm font-semibold text-slate-700">Plant Name</TableHead>
                    <TableHead className="py-4 text-sm font-semibold text-slate-700">Type</TableHead>
                    <TableHead className="text-right py-4 text-sm font-semibold text-slate-700">
                      <div className="flex items-center justify-end gap-1.5">
                        <Droplets className="h-4 w-4 text-slate-500" />
                        <span>Water Need</span>
                      </div>
                    </TableHead>
                    <TableHead className="text-right py-4 text-sm font-semibold text-slate-700">
                      <div className="flex items-center justify-end gap-1.5">
                        <Gauge className="h-4 w-4 text-slate-500" />
                        <span>Humidity</span>
                      </div>
                    </TableHead>
                    <TableHead className="py-4 text-sm font-semibold text-slate-700">Health Status</TableHead>
                    <TableHead className="text-right w-[120px] py-4 text-sm font-semibold text-slate-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plants.map((plant, index) => (
                    <TableRow 
                      key={plant.id} 
                      className={cn(
                        "group hover:bg-slate-50/60 transition-colors",
                        index % 2 === 0 ? "bg-white" : "bg-slate-50/30",
                      )}
                    >
                      <TableCell className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
                            <Leaf className="h-5 w-5 text-green-600" strokeWidth={1.5} />
                          </div>
                          <div>
                            <Link 
                              href={`/plant/${plant.id}`}
                              className="text-base font-medium text-slate-900 hover:text-green-600 transition-colors"
                            >
                              {plant.name}
                            </Link>
                            {plant.type && (
                              <p className="text-sm text-slate-500 mt-0.5">{plant.type}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="text-sm font-medium text-slate-700">
                          {plant.type || <span className="text-slate-400 font-normal">Not specified</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right py-4">
                        <div className="text-sm font-medium text-slate-700 tabular-nums">
                          {plant.weekly_water_need 
                            ? <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">{formatNumber(plant.weekly_water_need)} <span className="text-blue-600 text-xs">L/week</span></span>
                            : <span className="text-slate-400 font-normal">Not specified</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right py-4">
                        <div className="text-sm font-medium text-slate-700 tabular-nums">
                          {plant.expected_humidity 
                            ? <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full">{formatNumber(plant.expected_humidity, 0)}<span className="text-indigo-600 text-xs ml-0.5">%</span></span>
                            : <span className="text-slate-400 font-normal">Not specified</span>}
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <StatusBadge status={getPlantStatus(plant)} />
                      </TableCell>
                      <TableCell className="text-right py-4">
                        <div className="flex justify-end items-center gap-2">
                          {plant.weekly_water_need && plant.expected_humidity && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-9 opacity-0 group-hover:opacity-100 transition-opacity rounded-md border-slate-200 text-slate-700 hover:bg-slate-100"
                              onClick={() => handleViewHealthHistory(plant)}
                              disabled={isLoadingHealth}
                            >
                              <BarChart3 className="h-4 w-4 mr-2 text-slate-500" />
                              Analytics
                            </Button>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                className="h-9 w-9 p-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-md"
                              >
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-5 w-5 text-slate-500" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 rounded-lg">
                              <DropdownMenuLabel className="text-xs text-slate-500">
                                Manage Plant
                              </DropdownMenuLabel>
                              <DropdownMenuItem 
                                onClick={() => handleEditClick(plant)}
                                className="cursor-pointer text-sm"
                              >
                                Edit Plant Details
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteClick(plant.id, plant.name)}
                                className="cursor-pointer text-sm text-red-600 focus:text-red-600"
                              >
                                Delete Plant
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <PlantDrawer
        isOpen={isAddDrawerOpen}
        onClose={() => {
          setIsAddDrawerOpen(false);
          handleRefresh();
        }}
      />

      <PlantDrawer
        plant={selectedPlant}
        isOpen={isEditDrawerOpen}
        onClose={() => {
          setIsEditDrawerOpen(false);
          setSelectedPlant(undefined);
          handleRefresh();
        }}
      />

      {plantToDelete && (
        <DeletePlantButton 
          plantId={plantToDelete.id}
          plantName={plantToDelete.name}
          variant="ghost"
          size="icon"
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onSuccess={handlePlantDeleted}
        />
      )}
      
      {/* Health Chart Dialog */}
      <Dialog open={isHealthChartOpen} onOpenChange={setIsHealthChartOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-bold text-slate-900">
                {selectedPlantHealth?.plantName} Health Analytics
              </DialogTitle>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 rounded-full" 
                onClick={() => setIsHealthChartOpen(false)}
              >
                <X className="h-5 w-5" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
            <DialogDescription className="text-slate-600 mt-1">
              Detailed analysis from {selectedPlantHealth && new Date(selectedPlantHealth.startDate).toLocaleDateString()} to {selectedPlantHealth && new Date(selectedPlantHealth.endDate).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-6">
            {isLoadingHealth ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-3 border-slate-300 border-t-green-600 rounded-full"></div>
              </div>
            ) : selectedPlantHealth ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div className="bg-white rounded-lg border shadow-sm p-4 flex-1">
                    <h3 className="text-sm font-semibold text-slate-500 mb-1">Health Status</h3>
                    <div className="text-2xl font-bold text-slate-900">{selectedPlantHealth.overallStatus}</div>
                  </div>
                  <div className="bg-white rounded-lg border shadow-sm p-4 flex-1">
                    <h3 className="text-sm font-semibold text-slate-500 mb-1">Health Score</h3>
                    <div className="flex items-center">
                      <div className="text-2xl font-bold text-slate-900">{Math.round(selectedPlantHealth.averageScore)}</div>
                      <span className="text-lg text-slate-500 font-normal ml-1">/100</span>
                      <div className="ml-4 flex-grow">
                        <div className="w-full bg-slate-200 rounded-full h-2.5">
                          <div 
                            className="bg-green-600 h-2.5 rounded-full" 
                            style={{ width: `${selectedPlantHealth.averageScore}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg border shadow-sm p-4 mb-6">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">Health Trend</h3>
                  <div className="h-64">
                    {selectedPlantHealth.dailyData.length > 0 ? (
                      <HealthHistoryChart 
                        data={selectedPlantHealth.dailyData}
                        expectedHumidity={selectedPlant?.expected_humidity || null}
                        expectedWaterNeedDaily={selectedPlant?.weekly_water_need ? selectedPlant.weekly_water_need / 7 : null}
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <p className="text-slate-500">No data available for this period</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                  <div className="px-4 py-3 bg-slate-50 border-b">
                    <h3 className="text-sm font-semibold text-slate-700">Daily Measurements</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-slate-50">
                          <th className="text-left py-3 px-4 font-semibold text-slate-700">Date</th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-700">Status</th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-700">Score</th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-700">Precipitation</th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-700">Humidity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedPlantHealth.dailyData.map((day, index) => (
                          <tr key={index} className="border-b hover:bg-slate-50/60">
                            <td className="py-3 px-4 font-medium">{new Date(day.date).toLocaleDateString()}</td>
                            <td className="py-3 px-4">
                              <span className={cn(
                                'inline-flex px-2 py-0.5 rounded-full text-xs font-medium',
                                day.status === 'Good' ? 'bg-emerald-100 text-emerald-800' :
                                day.status === 'Needs Water' ? 'bg-amber-100 text-amber-800' :
                                day.status === 'Too Much Water' ? 'bg-blue-100 text-blue-800' :
                                day.status === 'Low Humidity' ? 'bg-orange-100 text-orange-800' :
                                day.status === 'High Humidity' ? 'bg-indigo-100 text-indigo-800' :
                                'bg-rose-100 text-rose-800'
                              )}>
                                {day.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-medium">{Math.round(day.score)}<span className="text-xs text-slate-500 ml-1">/100</span></td>
                            <td className="py-3 px-4">{Number(day.precipitation).toFixed(1)}<span className="text-xs text-slate-500 ml-1">mm</span></td>
                            <td className="py-3 px-4">{Number(day.humidity).toFixed(1)}<span className="text-xs text-slate-500 ml-1">%</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <div className="text-center">
                  <div className="mb-4 text-slate-400">
                    <BarChart3 className="h-12 w-12 mx-auto" strokeWidth={1.5} />
                  </div>
                  <p className="text-slate-600">No health data available for this plant</p>
                  <p className="text-sm text-slate-500 mt-1">Make sure water needs and humidity requirements are set</p>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter className="px-6 py-4 border-t">
            <Button className="ml-auto" onClick={() => setIsHealthChartOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 