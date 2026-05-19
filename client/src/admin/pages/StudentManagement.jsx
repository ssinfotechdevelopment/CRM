import React, { useState, useEffect } from "react";

// Icons (same as before)
const UserIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const BookIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const CurrencyIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
  </svg>
);

const BellIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM10.24 8.56a5.97 5.97 0 01-4.66-7.11 1 1 0 00-.68-1.15 1 1 0 00-1.22.7A7.97 7.97 0 008 12a7.97 7.97 0 004.38 7.13 1 1 0 001.35-.63 1 1 0 00-.56-1.3 5.99 5.99 0 01-3.93-8.64z" />
  </svg>
);

const SearchIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const EyeIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EditIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const TrashIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const PlusIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const CloseIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);

  const [newStudent, setNewStudent] = useState({
    name: "",
    email: "",
    phone: "",
    selectedCourse: "",
    totalFees: "",
    paidFees: ""
  });

  const [editStudent, setEditStudent] = useState({
    id: "",
    name: "",
    email: "",
    phone: "",
    selectedCourse: "",
    totalFees: "",
    paidFees: "",
    status: "active"
  });

  // Static courses
  const courses = [
    { id: 1, name: "Web Development", fee: 50000, duration: "3 months" },
    { id: 2, name: "Data Science", fee: 75000, duration: "6 months" },
    { id: 3, name: "Digital Marketing", fee: 35000, duration: "2 months" },
    { id: 4, name: "Graphic Design", fee: 45000, duration: "4 months" },
  ];

  // Reminders state
  const [reminders, setReminders] = useState([
    { id: 1, studentId: "1", message: "₹20,000 pending for Web Development course", date: "2024-04-20", completed: false }
  ]);

  const API_URL = "https://crm-backend-v2.onrender.com/api/students";

  // Fetch all students
  const fetchStudents = async (query = "") => {
    try {
      setLoading(true);
      setError("");
      const url = query ? `${API_URL}/search?q=${encodeURIComponent(query)}` : API_URL;
      const res = await fetch(url);

      if (!res.ok) {
        throw new Error(`Failed to fetch students: ${res.status}`);
      }

      const json = await res.json();

      if (json.success) {
        setStudents(json.data || []);
      } else {
        throw new Error(json.message || "Failed to fetch students");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message);
      // Load demo data if backend is not available
      loadDemoData();
    } finally {
      setLoading(false);
    }
  };

  // Demo data for when backend is not available
  const loadDemoData = () => {
    const demoStudents = [
      {
        _id: "1",
        name: "Priya Sharma",
        email: "priya@edu.com",
        phone: "+919876543210",
        selectedCourse: "1",
        courseName: "Web Development",
        totalFees: 50000,
        paidFees: 20000,
        pendingFees: 30000,
        enrollmentDate: "2024-01-15",
        status: "active"
      },
      {
        _id: "2",
        name: "Rahul Kumar",
        email: "rahul@edu.com",
        phone: "+919876543211",
        selectedCourse: "2",
        courseName: "Data Science",
        totalFees: 75000,
        paidFees: 50000,
        pendingFees: 25000,
        enrollmentDate: "2024-02-01",
        status: "active"
      }
    ];
    setStudents(demoStudents);
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim() === "") {
        fetchStudents();
      } else {
        fetchStudents(searchTerm);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const getCourseName = (courseId) => {
    const course = courses.find(c => c.id === parseInt(courseId));
    return course ? course.name : "Unknown Course";
  };

  const getCourseFee = (courseId) => {
    const course = courses.find(c => c.id === parseInt(courseId));
    return course ? course.fee : 0;
  };

  const getPendingReminders = (studentId) => {
    return reminders.filter(r => r.studentId === studentId && !r.completed).length;
  };

  const totalPendingFees = students.reduce((sum, student) => sum + (student.pendingFees || 0), 0);

  const addReminder = (student) => {
    const courseName = getCourseName(student.selectedCourse);
    const newReminder = {
      id: Date.now(),
      studentId: student._id,
      message: `Fee reminder: ₹${student.pendingFees} pending for ${student.name}. Course: ${courseName}`,
      date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      completed: false,
    };

    setReminders(prev => [...prev, newReminder]);
    alert(`Reminder added for ${student.name}!`);
  };

  // Add Student
  const handleAddStudent = async (e) => {
    e.preventDefault();

    const studentData = {
      ...newStudent,
      courseName: getCourseName(newStudent.selectedCourse),
      totalFees: parseInt(newStudent.totalFees),
      paidFees: parseInt(newStudent.paidFees || 0)
    };

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(studentData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setStudents(prev => [...prev, result.data]);
        setShowAddModal(false);
        setNewStudent({
          name: "",
          email: "",
          phone: "",
          selectedCourse: "",
          totalFees: "",
          paidFees: ""
        });
        alert('Student added successfully!');
      } else {
        throw new Error(result.message || 'Failed to add student');
      }
    } catch (error) {
      console.error('Add student error:', error);
      alert(`Error: ${error.message}`);
    }
  };

  // Edit Student
  const handleEditStudent = async (e) => {
    e.preventDefault();

    const studentData = {
      ...editStudent,
      courseName: getCourseName(editStudent.selectedCourse),
      totalFees: parseInt(editStudent.totalFees),
      paidFees: parseInt(editStudent.paidFees || 0)
    };

    try {
      const response = await fetch(`${API_URL}/${editStudent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(studentData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setStudents(prev =>
          prev.map(student =>
            student._id === editStudent.id ? result.data : student
          )
        );
        setShowEditModal(false);
        setEditStudent({
          id: "",
          name: "",
          email: "",
          phone: "",
          selectedCourse: "",
          totalFees: "",
          paidFees: "",
          status: "active"
        });
        alert('Student updated successfully!');
      } else {
        throw new Error(result.message || 'Failed to update student');
      }
    } catch (error) {
      console.error('Update student error:', error);
      alert(`Error: ${error.message}`);
    }
  };

  // Delete Student
  const handleDeleteStudent = async () => {
    try {
      const response = await fetch(`${API_URL}/${studentToDelete._id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setStudents(prev => prev.filter(student => student._id !== studentToDelete._id));
        setShowDeleteModal(false);
        setStudentToDelete(null);
        alert('Student deleted successfully!');
      } else {
        throw new Error(result.message || 'Failed to delete student');
      }
    } catch (error) {
      console.error('Delete student error:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const openEditModal = (student) => {
    setEditStudent({
      id: student._id,
      name: student.name,
      email: student.email,
      phone: student.phone,
      selectedCourse: student.selectedCourse,
      totalFees: student.totalFees.toString(),
      paidFees: student.paidFees.toString(),
      status: student.status
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (student) => {
    setStudentToDelete(student);
    setShowDeleteModal(true);
  };

  const handleInputChange = (e, isEdit = false) => {
    const { name, value } = e.target;

    if (isEdit) {
      setEditStudent(prev => ({
        ...prev,
        [name]: value
      }));

      // Auto-fill course fee when course is selected
      if (name === 'selectedCourse' && value) {
        const courseFee = getCourseFee(value);
        setEditStudent(prev => ({
          ...prev,
          totalFees: courseFee.toString()
        }));
      }
    } else {
      setNewStudent(prev => ({
        ...prev,
        [name]: value
      }));

      // Auto-fill course fee when course is selected
      if (name === 'selectedCourse' && value) {
        const courseFee = getCourseFee(value);
        setNewStudent(prev => ({
          ...prev,
          totalFees: courseFee.toString()
        }));
      }
    }
  };

  if (loading && students.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-2xl font-semibold text-gray-700">Loading Students...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Student Management</h1>
          <p className="text-gray-600 mt-2">Manage Student Fees & Reminders</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <strong>Error: </strong>{error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          {[
            { label: "Total Students", value: students.length, icon: UserIcon, color: "blue" },
            { label: "Active Courses", value: courses.length, icon: BookIcon, color: "green" },
            { label: "Pending Fees", value: `₹${totalPendingFees.toLocaleString()}`, icon: CurrencyIcon, color: "purple" },
            { label: "Active Reminders", value: reminders.filter(r => !r.completed).length, icon: BellIcon, color: "orange" },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-xl shadow-lg p-4 md:p-6 border-l-4" style={{
              borderLeftColor: i === 0 ? "#3B82F6" : i === 1 ? "#10B981" : i === 2 ? "#8B5CF6" : "#F97316"
            }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-gray-600">{stat.label}</p>
                  <p className="text-xl md:text-2xl font-bold text-gray-800 mt-1">{stat.value}</p>
                </div>
                <div className={`p-2 md:p-3 rounded-full bg-${stat.color}-100`}>
                  <stat.icon className={`w-4 h-4 md:w-6 md:h-6 text-${stat.color}-600`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search + Add Student */}
        <div className="bg-white rounded-xl shadow-xl overflow-hidden mb-6">
          <div className="p-4 md:p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <h2 className="text-xl md:text-2xl font-bold text-gray-800">Students Directory</h2>
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search by name, email, phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm"
                  />
                  <SearchIcon className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                </div>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition flex items-center justify-center gap-2 text-sm"
                >
                  <PlusIcon className="w-4 h-4" />
                  Add Student
                </button>
              </div>
            </div>
          </div>

          {/* Students Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Course</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Fees Status</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Reminders</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {students.map((student) => {
                  const pendingReminders = getPendingReminders(student._id);

                  return (
                    <tr key={student._id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                            {student.name.split(" ").map(n => n[0]).join("")}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 text-sm md:text-base">{student.name}</div>
                            <div className="text-xs text-gray-500">{student.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm font-medium">{student.courseName || getCourseName(student.selectedCourse)}</div>
                        <div className="text-xs text-gray-500">₹{student.totalFees?.toLocaleString()}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm">
                          Paid: <span className="text-green-600 font-medium">₹{student.paidFees?.toLocaleString()}</span>
                        </div>
                        <div className={`text-xs ${student.pendingFees > 0 ? "text-red-600 font-medium" : "text-green-600"}`}>
                          Pending: ₹{student.pendingFees?.toLocaleString() || 0}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${student.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : student.status === 'completed'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                          }`}>
                          {student.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        {pendingReminders > 0 ? (
                          <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
                            {pendingReminders}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => setSelectedStudent(student)}
                            className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition"
                            title="View Details"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(student)}
                            className="text-green-600 hover:bg-green-50 p-2 rounded-lg transition"
                            title="Edit Student"
                          >
                            <EditIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => addReminder(student)}
                            className="text-purple-600 hover:bg-purple-50 p-2 rounded-lg transition"
                            title="Add Reminder"
                          >
                            <BellIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(student)}
                            className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition"
                            title="Delete Student"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {students.length === 0 && !loading && (
            <div className="text-center py-12 text-gray-500">
              <div className="text-lg mb-2">No students found</div>
              <button
                onClick={() => setShowAddModal(true)}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Add your first student
              </button>
            </div>
          )}
        </div>

        {/* Student Detail Modal */}
        {selectedStudent && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-700 p-6 md:p-8 rounded-t-2xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                      {selectedStudent.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div>
                      <h2 className="text-2xl md:text-3xl font-bold text-white">{selectedStudent.name}</h2>
                      <p className="text-blue-100">Student Profile</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedStudent(null)}
                    className="text-white hover:bg-white/20 p-2 rounded-full transition self-end md:self-auto"
                  >
                    <CloseIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 md:p-8 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Personal Info */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <UserIcon className="w-5 h-5" /> Personal Information
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="text-gray-600">Full Name</span>
                        <span className="font-medium">{selectedStudent.name}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="text-gray-600">Email</span>
                        <span className="font-medium">{selectedStudent.email}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="text-gray-600">Phone</span>
                        <span className="font-medium">{selectedStudent.phone}</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-gray-600">Enrollment Date</span>
                        <span className="font-medium">
                          {new Date(selectedStudent.enrollmentDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Course Info */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <BookIcon className="w-5 h-5" /> Course Details
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="text-gray-600">Course Name</span>
                        <span className="font-medium">{selectedStudent.courseName || getCourseName(selectedStudent.selectedCourse)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="text-gray-600">Duration</span>
                        <span className="font-medium">
                          {courses.find(c => c.id === parseInt(selectedStudent.selectedCourse))?.duration}
                        </span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-gray-600">Course Fee</span>
                        <span className="font-medium text-green-600">
                          ₹{selectedStudent.totalFees?.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Financial Overview */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 md:p-8">
                  <h3 className="text-xl font-bold mb-6 text-center">Financial Summary</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-8">
                    <div className="text-center">
                      <div className="text-2xl md:text-3xl font-bold text-green-600 mb-2">
                        ₹{selectedStudent.paidFees?.toLocaleString()}
                      </div>
                      <p className="text-gray-600 text-sm">Amount Paid</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl md:text-3xl font-bold text-blue-600 mb-2">
                        ₹{selectedStudent.totalFees?.toLocaleString()}
                      </div>
                      <p className="text-gray-600 text-sm">Total Fees</p>
                    </div>
                    <div className="text-center">
                      <div className={`text-2xl md:text-3xl font-bold mb-2 ${selectedStudent.pendingFees > 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                        ₹{selectedStudent.pendingFees?.toLocaleString() || 0}
                      </div>
                      <p className="text-gray-600 text-sm">Pending Balance</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => addReminder(selectedStudent)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                  >
                    <BellIcon className="w-4 h-4" />
                    Add Fee Reminder
                  </button>
                  <button
                    onClick={() => setSelectedStudent(null)}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition"
                  >
                    Close Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Student Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-gray-800">Add New Student</h3>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <CloseIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleAddStudent} className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={newStudent.name}
                      onChange={(e) => handleInputChange(e, false)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter student name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={newStudent.email}
                      onChange={(e) => handleInputChange(e, false)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter email address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={newStudent.phone}
                      onChange={(e) => handleInputChange(e, false)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter phone number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Course *
                    </label>
                    <select
                      name="selectedCourse"
                      value={newStudent.selectedCourse}
                      onChange={(e) => handleInputChange(e, false)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Choose a course</option>
                      {courses.map(course => (
                        <option key={course.id} value={course.id}>
                          {course.name} - ₹{course.fee.toLocaleString()}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Fees
                    </label>
                    <input
                      type="number"
                      name="totalFees"
                      value={newStudent.totalFees}
                      onChange={(e) => handleInputChange(e, false)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter total fees"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Paid Fees
                    </label>
                    <input
                      type="number"
                      name="paidFees"
                      value={newStudent.paidFees}
                      onChange={(e) => handleInputChange(e, false)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter paid amount"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-semibold transition"
                  >
                    Add Student
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Student Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-gray-800">Edit Student</h3>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <CloseIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleEditStudent} className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={editStudent.name}
                      onChange={(e) => handleInputChange(e, true)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={editStudent.email}
                      onChange={(e) => handleInputChange(e, true)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={editStudent.phone}
                      onChange={(e) => handleInputChange(e, true)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Course *
                    </label>
                    <select
                      name="selectedCourse"
                      value={editStudent.selectedCourse}
                      onChange={(e) => handleInputChange(e, true)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Choose a course</option>
                      {courses.map(course => (
                        <option key={course.id} value={course.id}>
                          {course.name} - ₹{course.fee.toLocaleString()}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Fees
                    </label>
                    <input
                      type="number"
                      name="totalFees"
                      value={editStudent.totalFees}
                      onChange={(e) => handleInputChange(e, true)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Paid Fees
                    </label>
                    <input
                      type="number"
                      name="paidFees"
                      value={editStudent.paidFees}
                      onChange={(e) => handleInputChange(e, true)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      name="status"
                      value={editStudent.status}
                      onChange={(e) => handleInputChange(e, true)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-semibold transition"
                  >
                    Update Student
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && studentToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-800">Confirm Delete</h3>
              </div>
              <div className="p-6">
                <p className="text-gray-600 mb-4">
                  Are you sure you want to delete <strong>{studentToDelete.name}</strong>? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteStudent}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-semibold transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentManagement;