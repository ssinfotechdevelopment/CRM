import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  DollarSign, TrendingUp, TrendingDown, User, Mail, Briefcase, Building,
  Download, Printer, Eye, ChevronLeft, FileText, Award, AlertCircle,
  XCircle, TrendingUp as TrendingUpIcon, TrendingDown as TrendingDownIcon
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const API = "https://crm-backned-v1.onrender.com/api";

const formatCurrency = (amount) => `₹${amount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const StatusBadge = ({ status }) => {
  const map = {
    Paid: "bg-green-100 text-green-700",
    Processed: "bg-blue-100 text-blue-700",
    Pending: "bg-yellow-100 text-yellow-700",
    "Not Processed": "bg-gray-100 text-gray-600",
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${map[status] || map["Not Processed"]}`}>
      {status || "Not Processed"}
    </span>
  );
};

const EmployeeSalaryDetails = () => {
  const navigate = useNavigate();
  
  const [employee, setEmployee] = useState(null);
  const [salaryHistory, setSalaryHistory] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [currentSalary, setCurrentSalary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [showSalarySlip, setShowSalarySlip] = useState(false);
  const [stats, setStats] = useState({
    totalEarned: 0,
    totalDeductions: 0,
    totalOvertime: 0,
    averageSalary: 0,
    bestMonth: null,
    totalMonths: 0
  });

  const token = localStorage.getItem("employeeToken");
  const currentEmployee = JSON.parse(localStorage.getItem("employeeData") || "{}");
  const employeeId = currentEmployee._id;

  // Fetch employee details from backend
  const fetchEmployee = async () => {
    try {
      const res = await fetch(`${API}/employee/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.data) {
        setEmployee(data.data);
      } else if (data.success && data.employee) {
        setEmployee(data.employee);
      } else {
        setEmployee(currentEmployee);
      }
    } catch (error) {
      console.error("Error fetching employee:", error);
      setEmployee(currentEmployee);
    }
  };

  // Fetch salary history from backend
  const fetchSalaryHistory = async () => {
    if (!employeeId) return;
    
    try {
      console.log("Fetching salary history for employee:", employeeId);
      const res = await fetch(`${API}/salaries/history/${employeeId}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await res.json();
      console.log("Salary history response:", data);
      
      if (data.success && data.history) {
        setSalaryHistory(data.history);
        calculateStats(data.history);
      } else if (data.success && data.data) {
        const history = Array.isArray(data.data) ? data.data : [];
        setSalaryHistory(history);
        calculateStats(history);
      } else {
        console.log("No salary history found");
        setSalaryHistory([]);
        calculateStats([]);
      }
    } catch (error) {
      console.error("Error fetching salary history:", error);
      setSalaryHistory([]);
      calculateStats([]);
    }
  };

  // Fetch current month salary breakdown from backend
  const fetchCurrentSalary = async () => {
    if (!employeeId) return;
    
    try {
      console.log("Fetching salary breakdown for:", employeeId, selectedMonth, selectedYear);
      const res = await fetch(`${API}/salaries/calculate/${employeeId}?month=${selectedMonth}&year=${selectedYear}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await res.json();
      console.log("Salary breakdown response:", data);
      
      if (data.success && data.data) {
        setCurrentSalary(data.data);
      } else {
        // Fallback calculated data
        const baseSalary = currentEmployee.salary || 0;
        const dailyRate = baseSalary / 22;
        const hourlyRate = dailyRate / 9;
        
        setCurrentSalary({
          baseSalary: baseSalary,
          finalSalary: baseSalary,
          leaves: { total: 0, paid: 0, unpaid: 0, deduction: 0 },
          overtime: { totalHours: 0, pay: 0 },
          rates: { dailyRate: dailyRate, hourlyRate: hourlyRate, overtimeRate: hourlyRate * 1.5 }
        });
      }
    } catch (error) {
      console.error("Error fetching current salary:", error);
      // Fallback calculated data
      const baseSalary = currentEmployee.salary || 0;
      const dailyRate = baseSalary / 22;
      const hourlyRate = dailyRate / 9;
      
      setCurrentSalary({
        baseSalary: baseSalary,
        finalSalary: baseSalary,
        leaves: { total: 0, paid: 0, unpaid: 0, deduction: 0 },
        overtime: { totalHours: 0, pay: 0 },
        rates: { dailyRate: dailyRate, hourlyRate: hourlyRate, overtimeRate: hourlyRate * 1.5 }
      });
    }
  };

  // Calculate statistics from history
  const calculateStats = (history) => {
    if (!history || history.length === 0) {
      setStats({
        totalEarned: 0,
        totalDeductions: 0,
        totalOvertime: 0,
        averageSalary: 0,
        bestMonth: null,
        totalMonths: 0
      });
      return;
    }
    
    const totalEarned = history.reduce((sum, record) => sum + (record.finalSalary || record.amount || 0), 0);
    const totalDeductions = history.reduce((sum, record) => sum + (record.leaveDeduction || 0), 0);
    const totalOvertime = history.reduce((sum, record) => sum + (record.overtimePay || 0), 0);
    
    let bestMonth = null;
    let highestSalary = 0;
    history.forEach(record => {
      const salary = record.finalSalary || record.amount || 0;
      if (salary > highestSalary) {
        highestSalary = salary;
        bestMonth = record;
      }
    });

    setStats({
      totalEarned,
      totalDeductions,
      totalOvertime,
      averageSalary: history.length > 0 ? totalEarned / history.length : 0,
      bestMonth,
      totalMonths: history.length
    });
  };

  // Generate Salary Slip PDF
  const generateSalarySlip = async () => {
    if (!currentSalary) return;
    
    setGeneratingPDF(true);
    try {
      const element = document.getElementById('salary-slip-content');
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`Salary_Slip_${employee?.name}_${selectedMonth}_${selectedYear}.pdf`);
      
      toast.success("Salary slip downloaded successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate salary slip");
    } finally {
      setGeneratingPDF(false);
    }
  };

  // Print Salary Slip
  const printSalarySlip = () => {
    const printContent = document.getElementById('salary-slip-content').innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Salary Slip - ${employee?.name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            @media print {
              body { margin: 0; padding: 20px; }
            }
            .salary-slip-container {
              max-width: 800px;
              margin: 0 auto;
              background: white;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th, td {
              padding: 8px;
              text-align: left;
              border-bottom: 1px solid #ddd;
            }
          </style>
        </head>
        <body>
          <div class="salary-slip-container">
            ${printContent}
          </div>
          <script>window.print();<\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  useEffect(() => {
    if (!token) {
      toast.error("Please login again");
      navigate("/employee/login");
      return;
    }
    
    fetchEmployee();
    fetchSalaryHistory();
    setLoading(false);
  }, []);

  useEffect(() => {
    if (employeeId && token && !loading) {
      fetchCurrentSalary();
    }
  }, [selectedMonth, selectedYear]);

  const getDepartmentName = (dept) => {
    const deptMap = { 1: "Sales", 2: "Marketing", 3: "Development", 4: "HR", 5: "Finance", 6: "Operations" };
    return deptMap[dept] || "Unknown";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your salary details...</p>
        </div>
      </div>
    );
  }

  const displayEmployee = employee || currentEmployee;

  if (!displayEmployee || !displayEmployee.name) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800">Unable to Load Data</h2>
          <p className="text-gray-600 mt-2">Please login again to continue.</p>
          <button
            onClick={() => navigate("/employee/login")}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          
          {/* Header with Back Button */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate('/employee/dashboard')}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
            <div className="text-right">
              <p className="text-sm text-gray-500">Employee Salary Portal</p>
              <p className="text-xs text-gray-400">Last updated: {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          {/* Employee Profile Card */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-8">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
                  <User className="w-10 h-10 text-indigo-600" />
                </div>
                <div className="text-white">
                  <h1 className="text-2xl font-bold">{displayEmployee.name}</h1>
                  <p className="text-indigo-200">{displayEmployee.position || "Employee"}</p>
                  <div className="flex flex-wrap gap-4 mt-2 text-sm">
                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {displayEmployee.email}</span>
                    <span className="flex items-center gap-1"><Building className="w-3 h-3" /> Dept: {getDepartmentName(displayEmployee.department)}</span>
                    <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" /> Base Salary: {formatCurrency(displayEmployee.salary)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Total Earned</p>
                  <p className="text-2xl font-bold text-gray-800">{formatCurrency(stats.totalEarned)}</p>
                  <p className="text-xs text-gray-400">Over {stats.totalMonths} months</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500 opacity-50" />
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-red-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Total Deductions</p>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.totalDeductions)}</p>
                  <p className="text-xs text-gray-400">Leave deductions</p>
                </div>
                <TrendingDownIcon className="w-8 h-8 text-red-500 opacity-50" />
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Total Overtime</p>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats.totalOvertime)}</p>
                  <p className="text-xs text-gray-400">Extra earnings</p>
                </div>
                <TrendingUpIcon className="w-8 h-8 text-blue-500 opacity-50" />
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Average Salary</p>
                  <p className="text-2xl font-bold text-purple-600">{formatCurrency(stats.averageSalary)}</p>
                  <p className="text-xs text-gray-400">Per month average</p>
                </div>
                <Award className="w-8 h-8 text-purple-500 opacity-50" />
              </div>
            </div>
          </div>

          {/* Month Selector for Current Salary */}
          <div className="bg-white rounded-xl shadow-md p-4 mb-6">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex gap-3 items-center">
                <label className="text-sm font-medium text-gray-700">View Salary For:</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(2000, i, 1).toLocaleString('default', { month: 'long' })}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = new Date().getFullYear() - 2 + i;
                    return <option key={year} value={year}>{year}</option>;
                  })}
                </select>
                <button
                  onClick={fetchCurrentSalary}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition"
                >
                  Load
                </button>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setShowSalarySlip(true)}
                  disabled={!currentSalary}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition disabled:opacity-50"
                >
                  <FileText className="w-4 h-4" />
                  View Salary Slip
                </button>
              </div>
            </div>
          </div>

          {/* Current Month Salary Breakdown */}
          {currentSalary ? (
            <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
              <div className="bg-gray-50 px-6 py-4 border-b">
                <h2 className="text-lg font-semibold text-gray-800">
                  Salary Breakdown - {new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long' })} {selectedYear}
                </h2>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <p className="text-sm text-green-600">Base Salary</p>
                    <p className="text-2xl font-bold text-green-700">{formatCurrency(currentSalary.baseSalary)}</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4 text-center">
                    <p className="text-sm text-red-600">Leave Deduction</p>
                    <p className="text-2xl font-bold text-red-700">-{formatCurrency(currentSalary.leaves?.deduction || 0)}</p>
                    <p className="text-xs text-gray-500">{currentSalary.leaves?.unpaid || 0} unpaid leaves</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <p className="text-sm text-blue-600">Overtime Pay</p>
                    <p className="text-2xl font-bold text-blue-700">+{formatCurrency(currentSalary.overtime?.pay || 0)}</p>
                    <p className="text-xs text-gray-500">{currentSalary.overtime?.totalHours || 0} hours overtime</p>
                  </div>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 font-semibold border-b">Detailed Calculation</div>
                  <div className="divide-y">
                    <div className="flex justify-between px-4 py-3">
                      <span className="text-gray-600">Daily Rate (Salary / 22 days)</span>
                      <span className="font-medium">{formatCurrency(currentSalary.rates?.dailyRate)}</span>
                    </div>
                    <div className="flex justify-between px-4 py-3">
                      <span className="text-gray-600">Hourly Rate (Daily / 9 hours)</span>
                      <span className="font-medium">{formatCurrency(currentSalary.rates?.hourlyRate)}</span>
                    </div>
                    <div className="flex justify-between px-4 py-3">
                      <span className="text-gray-600">Total Leave Days</span>
                      <span>{currentSalary.leaves?.total || 0} days</span>
                    </div>
                    <div className="flex justify-between px-4 py-3">
                      <span className="text-gray-600">Paid Leaves (Allowed: 2)</span>
                      <span>{currentSalary.leaves?.paid || 0} days</span>
                    </div>
                    <div className="flex justify-between px-4 py-3">
                      <span className="text-gray-600">Unpaid Leaves</span>
                      <span className="text-red-600">{currentSalary.leaves?.unpaid || 0} days</span>
                    </div>
                    <div className="flex justify-between px-4 py-3">
                      <span className="text-gray-600">Total Overtime Hours</span>
                      <span className="text-blue-600">{currentSalary.overtime?.totalHours || 0} hours</span>
                    </div>
                    <div className="flex justify-between px-4 py-3 bg-indigo-50">
                      <span className="font-bold text-gray-800">Final Salary</span>
                      <span className="font-bold text-xl text-indigo-700">{formatCurrency(currentSalary.finalSalary)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md p-8 text-center mb-6">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No salary data found for {new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long' })} {selectedYear}</p>
            </div>
          )}

          {/* Salary History Table */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-800">Salary History</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left">Month/Year</th>
                    <th className="px-4 py-3 text-right">Base Salary</th>
                    <th className="px-4 py-3 text-center">Leaves</th>
                    <th className="px-4 py-3 text-right">Leave Deduction</th>
                    <th className="px-4 py-3 text-right">OT Hours</th>
                    <th className="px-4 py-3 text-right">OT Pay</th>
                    <th className="px-4 py-3 text-right">Final Salary</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {salaryHistory.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="px-4 py-8 text-center text-gray-400">
                        No salary history found
                      </td>
                    </tr>
                  ) : (
                    salaryHistory.map((record, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">
                          {record.monthName || new Date(record.year, record.month - 1).toLocaleString('default', { month: 'long' })} {record.year}
                        </td>
                        <td className="px-4 py-3 text-right">{formatCurrency(record.baseSalary)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-green-600">{record.paidLeaves || 0}</span>/
                          <span className="text-red-600">{record.unpaidLeaves || 0}</span>
                        </td>
                        <td className="px-4 py-3 text-right text-red-600">{formatCurrency(record.leaveDeduction)}</td>
                        <td className="px-4 py-3 text-right">{(record.totalOvertimeHours || 0).toFixed(1)} hrs</td>
                        <td className="px-4 py-3 text-right text-green-600">+{formatCurrency(record.overtimePay)}</td>
                        <td className="px-4 py-3 text-right font-bold text-indigo-600">{formatCurrency(record.finalSalary || record.amount)}</td>
                        <td className="px-4 py-3 text-center"><StatusBadge status={record.status} /></td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => {
                              setSelectedMonth(record.month);
                              setSelectedYear(record.year);
                              setTimeout(() => {
                                fetchCurrentSalary();
                                setShowSalarySlip(true);
                              }, 100);
                            }}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            title="View Salary Slip"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Best Month Highlight */}
          {stats.bestMonth && (
            <div className="mt-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-200">
              <div className="flex items-center gap-3">
                <Award className="w-8 h-8 text-yellow-600" />
                <div>
                  <p className="text-sm text-yellow-700 font-medium">🏆 Your Best Month Performance</p>
                  <p className="text-gray-800">
                    {stats.bestMonth.monthName || new Date(stats.bestMonth.year, stats.bestMonth.month - 1).toLocaleString('default', { month: 'long' })} {stats.bestMonth.year} - Earned {formatCurrency(stats.bestMonth.finalSalary || stats.bestMonth.amount)}
                    {stats.bestMonth.totalOvertimeHours > 0 && ` with ${stats.bestMonth.totalOvertimeHours} overtime hours`}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Salary Slip Modal */}
      {showSalarySlip && currentSalary && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex justify-between items-center">
              <h3 className="text-white font-semibold text-lg">Salary Slip</h3>
              <button onClick={() => setShowSalarySlip(false)} className="text-white/80 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]" id="salary-slip-content">
              <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 text-center">
                  <h2 className="text-2xl font-bold">SALARY SLIP</h2>
                  <p className="text-indigo-200">Salary Management System</p>
                </div>
                
                <div className="border-b p-4 text-center bg-gray-50">
                  <p className="text-sm text-gray-600">Corporate Office: Salary Management System</p>
                  <p className="text-xs text-gray-500">Email: accounts@salarysystem.com | Phone: +91 1234567890</p>
                </div>
                
                <div className="p-6 border-b">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Employee Name</p>
                      <p className="font-semibold text-gray-800">{displayEmployee?.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Employee ID</p>
                      <p className="font-semibold text-gray-800">{displayEmployee?._id?.slice(-8)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Designation</p>
                      <p className="font-semibold text-gray-800">{displayEmployee?.position}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Department</p>
                      <p className="font-semibold text-gray-800">{getDepartmentName(displayEmployee?.department)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Salary Month</p>
                      <p className="font-semibold text-gray-800">{new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long' })} {selectedYear}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Pay Date</p>
                      <p className="font-semibold text-gray-800">{new Date().toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 font-semibold text-gray-600">Description</th>
                        <th className="text-right py-2 font-semibold text-gray-600">Earnings (₹)</th>
                        <th className="text-right py-2 font-semibold text-gray-600">Deductions (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2">Base Salary</td>
                        <td className="text-right py-2 text-green-600">{formatCurrency(currentSalary.baseSalary)}</td>
                        <td className="text-right py-2">-</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">
                          Leave Deduction 
                          <span className="text-xs text-gray-400 block">({currentSalary.leaves?.unpaid || 0} unpaid leaves)</span>
                        </td>
                        <td className="text-right py-2">-</td>
                        <td className="text-right py-2 text-red-600">{formatCurrency(currentSalary.leaves?.deduction || 0)}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">
                          Overtime Pay
                          <span className="text-xs text-gray-400 block">({currentSalary.overtime?.totalHours || 0} hours @ 1.5x)</span>
                        </td>
                        <td className="text-right py-2 text-blue-600">+{formatCurrency(currentSalary.overtime?.pay || 0)}</td>
                        <td className="text-right py-2">-</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="py-3 font-bold">NET SALARY</td>
                        <td className="text-right py-3 font-bold text-indigo-600" colSpan="2">
                          {formatCurrency(currentSalary.finalSalary)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                <div className="p-4 bg-gray-50 border-t">
                  <p className="text-xs text-gray-500">Calculation Notes:</p>
                  <ul className="text-xs text-gray-500 mt-1 space-y-1">
                    <li>• Daily Rate = Base Salary / 22 working days</li>
                    <li>• Hourly Rate = Daily Rate / 9 hours</li>
                    <li>• 2 paid leaves allowed per month</li>
                    <li>• Overtime paid at 1.5x hourly rate</li>
                  </ul>
                </div>
                
                <div className="p-4 text-center border-t">
                  <p className="text-xs text-gray-400">This is a computer generated salary slip - No signature required</p>
                  <p className="text-xs text-gray-400 mt-1">Generated on: {new Date().toLocaleString()}</p>
                </div>
              </div>
            </div>
            
            <div className="border-t px-6 py-4 flex justify-end gap-3">
              <button
                onClick={printSalarySlip}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
              <button
                onClick={generateSalarySlip}
                disabled={generatingPDF}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {generatingPDF ? "Generating..." : "Download PDF"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EmployeeSalaryDetails;