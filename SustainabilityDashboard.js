import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, PieChart, Pie, Cell, Area, AreaChart, ResponsiveContainer } from 'recharts';
import { Bell, Download, RefreshCw, Filter, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Calendar, Building, Users, Settings } from 'lucide-react';

const SustainabilityDashboard = () => {
  const [selectedView, setSelectedView] = useState('overview');
  const [filters, setFilters] = useState({
    timeRange: 'today',
    unit: 'all',
    department: 'all',
    machine: 'all',
    shift: 'all'
  });
  const [alerts, setAlerts] = useState([
    { id: 1, type: 'critical', message: 'Water usage exceeded 120% of target in Production Unit A', time: '2 hours ago' },
    { id: 2, type: 'warning', message: 'Energy consumption trending 15% above average', time: '4 hours ago' },
    { id: 3, type: 'info', message: 'Weekly waste reduction goal achieved', time: '1 day ago' }
  ]);
  const [showAlerts, setShowAlerts] = useState(false);
  const [notes, setNotes] = useState({});
  const [newNote, setNewNote] = useState('');

  // Mock data for KPIs
  const kpiData = {
    energy: {
      current: 2850,
      target: 3000,
      unit: 'kWh',
      status: 'On Track',
      trend: 'down',
      change: -5.2
    },
    water: {
      current: 12500,
      target: 10000,
      unit: 'Liters',
      status: 'Over Target',
      trend: 'up',
      change: +25.0
    },
    waste: {
      current: 45,
      target: 50,
      unit: 'kg',
      status: 'On Track',
      trend: 'down',
      change: -10.0
    },
    emissions: {
      current: 185,
      target: 200,
      unit: 'kg CO2',
      status: 'On Track',
      trend: 'down',
      change: -7.5
    }
  };

  // Overall performance radar data
  const overallData = [
    { metric: 'Energy', current: 95, target: 100 },
    { metric: 'Water', current: 80, target: 100 },
    { metric: 'Waste', current: 90, target: 100 },
    { metric: 'Emissions', current: 92, target: 100 }
  ];

  // Trend data for insights
  const trendData = [
    { date: '01/11', energy: 3200, water: 11000, waste: 55, emissions: 210 },
    { date: '02/11', energy: 3100, water: 11500, waste: 52, emissions: 200 },
    { date: '03/11', energy: 2950, water: 12000, waste: 48, emissions: 195 },
    { date: '04/11', energy: 2900, water: 12200, waste: 47, emissions: 190 },
    { date: '05/11', energy: 2850, water: 12500, waste: 45, emissions: 185 }
  ];

  // Department comparison data
  const deptData = [
    { dept: 'Spinning', energy: 850, water: 3500, waste: 15, emissions: 65 },
    { dept: 'Weaving', energy: 950, water: 4200, waste: 18, emissions: 75 },
    { dept: 'Dyeing', energy: 750, water: 3800, waste: 8, emissions: 30 },
    { dept: 'Finishing', energy: 300, water: 1000, waste: 4, emissions: 15 }
  ];

  const getStatusColor = (status) => {
    switch(status) {
      case 'On Track': return 'text-green-600';
      case 'Over Target': return 'text-red-600';
      case 'Behind Schedule': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getTrendIcon = (trend) => {
    return trend === 'up' ? <TrendingUp className="w-4 h-4 text-red-500" /> : <TrendingDown className="w-4 h-4 text-green-500" />;
  };

  const KPITile = ({ title, data, onClick }) => {
    const progressPercentage = (data.current / data.target) * 100;
    
    return (
      <div 
        className="bg-white p-6 rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
        onClick={onClick}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          {getTrendIcon(data.trend)}
        </div>
        <div className="mb-4">
          <div className="text-3xl font-bold text-gray-900">
            {data.current.toLocaleString()} <span className="text-sm text-gray-600">{data.unit}</span>
          </div>
          <div className={`text-sm ${getStatusColor(data.status)}`}>
            {data.status} ({data.change > 0 ? '+' : ''}{data.change}%)
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${progressPercentage > 100 ? 'bg-red-500' : 'bg-green-500'}`}
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          ></div>
        </div>
        <div className="text-xs text-gray-600 mt-2">
          Target: {data.target.toLocaleString()} {data.unit}
        </div>
      </div>
    );
  };

  const OverallTile = ({ onClick }) => {
    return (
      <div 
        className="bg-white p-6 rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow col-span-2"
        onClick={onClick}
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Overall Performance</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={overallData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" />
              <PolarRadiusAxis domain={[0, 100]} />
              <Radar name="Current" dataKey="current" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
              <Radar name="Target" dataKey="target" stroke="#6b7280" fill="transparent" strokeDasharray="5 5" />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="text-sm text-gray-600 mt-2">
          Average Performance: 89% of targets
        </div>
      </div>
    );
  };

  const AlertPanel = () => {
    const criticalCount = alerts.filter(a => a.type === 'critical').length;
    const warningCount = alerts.filter(a => a.type === 'warning').length;

    return (
      <div className="relative">
        <button
          onClick={() => setShowAlerts(!showAlerts)}
          className="relative p-2 text-gray-600 hover:text-gray-900"
        >
          <Bell className="w-6 h-6" />
          {(criticalCount + warningCount > 0) && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
              {criticalCount + warningCount}
            </span>
          )}
        </button>
        
        {showAlerts && (
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border z-50">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-gray-800">Alerts & Notifications</h3>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {alerts.map(alert => (
                <div key={alert.id} className="p-3 border-b hover:bg-gray-50">
                  <div className="flex items-start space-x-3">
                    {alert.type === 'critical' && <AlertTriangle className="w-4 h-4 text-red-500 mt-1" />}
                    {alert.type === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-500 mt-1" />}
                    {alert.type === 'info' && <CheckCircle className="w-4 h-4 text-green-500 mt-1" />}
                    <div className="flex-1">
                      <p className="text-sm text-gray-800">{alert.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{alert.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const FilterBar = () => {
    return (
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex items-center space-x-4 flex-wrap">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          <select 
            value={filters.timeRange}
            onChange={(e) => setFilters({...filters, timeRange: e.target.value})}
            className="px-3 py-1 border rounded text-sm"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          
          <select 
            value={filters.unit}
            onChange={(e) => setFilters({...filters, unit: e.target.value})}
            className="px-3 py-1 border rounded text-sm"
          >
            <option value="all">All Units</option>
            <option value="unit-a">Unit A</option>
            <option value="unit-b">Unit B</option>
            <option value="unit-c">Unit C</option>
          </select>
          
          <select 
            value={filters.department}
            onChange={(e) => setFilters({...filters, department: e.target.value})}
            className="px-3 py-1 border rounded text-sm"
          >
            <option value="all">All Departments</option>
            <option value="spinning">Spinning</option>
            <option value="weaving">Weaving</option>
            <option value="dyeing">Dyeing</option>
            <option value="finishing">Finishing</option>
          </select>
        </div>
      </div>
    );
  };

  const OverviewPage = () => {
    return (
      <div>
        <FilterBar />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <KPITile 
            title="Energy Consumption" 
            data={kpiData.energy}
            onClick={() => setSelectedView('energy')}
          />
          <KPITile 
            title="Water Usage" 
            data={kpiData.water}
            onClick={() => setSelectedView('water')}
          />
          <KPITile 
            title="Waste Generated" 
            data={kpiData.waste}
            onClick={() => setSelectedView('waste')}
          />
          <KPITile 
            title="CO2 Emissions" 
            data={kpiData.emissions}
            onClick={() => setSelectedView('emissions')}
          />
          <OverallTile onClick={() => setSelectedView('overall')} />
        </div>
      </div>
    );
  };

  const InsightsPage = ({ metric, data }) => {
    const metricKey = metric.toLowerCase();
    const currentData = kpiData[metricKey] || kpiData.energy;

    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setSelectedView('overview')}
              className="text-blue-600 hover:text-blue-800"
            >
              ← Back to Overview
            </button>
            <h2 className="text-2xl font-bold text-gray-800">{metric} Insights</h2>
          </div>
        </div>

        <FilterBar />

        {/* Current Status Card */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <h4 className="text-lg font-semibold text-gray-800">Current Value</h4>
              <p className="text-3xl font-bold text-gray-900">
                {currentData.current.toLocaleString()} <span className="text-sm">{currentData.unit}</span>
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-800">Target</h4>
              <p className="text-2xl font-bold text-gray-700">
                {currentData.target.toLocaleString()} <span className="text-sm">{currentData.unit}</span>
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-800">Progress</h4>
              <p className={`text-2xl font-bold ${getStatusColor(currentData.status)}`}>
                {Math.round((currentData.current/currentData.target)*100)}%
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-800">Trend</h4>
              <div className="flex items-center space-x-2">
                {getTrendIcon(currentData.trend)}
                <span className={`text-xl font-bold ${currentData.trend === 'up' ? 'text-red-600' : 'text-green-600'}`}>
                  {currentData.change > 0 ? '+' : ''}{currentData.change}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Trend Chart */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Trend Over Time</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey={metricKey} 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Breakdown */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Department Breakdown</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="dept" />
                <YAxis />
                <Tooltip />
                <Bar dataKey={metricKey} fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Notes Section (Good-to-have feature 1) */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Notes & Comments</h3>
          <div className="space-y-4">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note about this metric..."
                className="flex-1 px-3 py-2 border rounded-md"
              />
              <button
                onClick={() => {
                  if (newNote.trim()) {
                    const noteId = `${metric}_${Date.now()}`;
                    setNotes({
                      ...notes,
                      [noteId]: {
                        text: newNote,
                        timestamp: new Date().toLocaleString(),
                        metric: metric
                      }
                    });
                    setNewNote('');
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add Note
              </button>
            </div>
            <div className="space-y-2">
              {Object.entries(notes)
                .filter(([_, note]) => note.metric === metric)
                .map(([id, note]) => (
                <div key={id} className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm text-gray-800">{note.text}</p>
                  <p className="text-xs text-gray-500 mt-1">{note.timestamp}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ExportOptions = () => {
    return (
      <div className="relative group">
        <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
          <Download className="w-4 h-4" />
          <span>Export</span>
        </button>
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
          <div className="py-1">
            <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Export as PDF</a>
            <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Export as CSV</a>
            <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Export as Excel</a>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Sustainability Dashboard
              </h1>
              <span className="ml-4 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                Textile Manufacturing
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <ExportOptions />
              
              <button 
                onClick={() => window.location.reload()}
                className="p-2 text-gray-600 hover:text-gray-900"
                title="Refresh Data"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              
              <AlertPanel />
              
              <div className="text-sm text-gray-600">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedView === 'overview' && <OverviewPage />}
        {selectedView === 'energy' && <InsightsPage metric="Energy Consumption" />}
        {selectedView === 'water' && <InsightsPage metric="Water Usage" />}
        {selectedView === 'waste' && <InsightsPage metric="Waste Generated" />}
        {selectedView === 'emissions' && <InsightsPage metric="CO2 Emissions" />}
        {selectedView === 'overall' && <InsightsPage metric="Overall Performance" />}
      </main>
    </div>
  );
};

export default SustainabilityDashboard;