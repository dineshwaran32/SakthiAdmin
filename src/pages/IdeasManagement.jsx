import React, { useState, useEffect } from 'react';
import { Search, Filter, Eye, CheckCircle, Clock, AlertTriangle, Plus, Download, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const IdeasManagement = () => {
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    department: 'all',
    priority: 'all'
  });
  const [departments, setDepartments] = useState([]);
  const [selectedIdea, setSelectedIdea] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState({
    status: '',
    reviewComments: '',
    priority: ''
  });

  const { canReviewIdeas, user } = useAuth();

  // Debug logging
  console.log('Current user:', user);
  console.log('canReviewIdeas:', canReviewIdeas);
  console.log('User role:', user?.role);

  const statusOptions = [
    { value: 'under_review', label: 'Under Review', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    { value: 'ongoing', label: 'Ongoing', color: 'bg-blue-100 text-blue-800', icon: RefreshCw },
    { value: 'approved', label: 'Approved', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    { value: 'implemented', label: 'Implemented', color: 'bg-purple-100 text-purple-800', icon: CheckCircle },
    { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800', icon: AlertTriangle }
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-800' },
    { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-800' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' }
  ];

  useEffect(() => {
    fetchIdeas();
  }, [filters]);

  const fetchIdeas = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          params.append(key, value);
        }
      });

      const response = await axios.get(`/api/ideas?${params}`);
      setIdeas(response.data.ideas);
      setDepartments(response.data.departments);
    } catch (error) {
      console.error('Failed to fetch ideas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleViewIdea = (idea) => {
    setSelectedIdea(idea);
    setStatusUpdate({
      status: idea.status,
      reviewComments: idea.reviewComments || '',
      priority: idea.priority
    });
    setShowModal(true);
  };

  const handleStatusUpdate = async () => {
    try {
      console.log('Updating idea status:', selectedIdea._id, statusUpdate);
      const response = await axios.patch(`/api/ideas/${selectedIdea._id}/status`, statusUpdate);
      console.log('Status update response:', response.data);
      
      // Update the idea in the list
      setIdeas(prev => prev.map(idea => 
        idea._id === selectedIdea._id ? response.data : idea
      ));
      
      setShowModal(false);
      setSelectedIdea(null);
    } catch (error) {
      console.error('Failed to update idea status:', error);
    }
  };

  const getStatusInfo = (status) => {
    return statusOptions.find(s => s.value === status) || statusOptions[0];
  };

  const getPriorityInfo = (priority) => {
    return priorityOptions.find(p => p.value === priority) || priorityOptions[1];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading ideas...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ideas Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Review and manage submitted ideas from employees
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={fetchIdeas}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search ideas..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            {statusOptions.map(status => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>

          {/* Department Filter */}
          <select
            value={filters.department}
            onChange={(e) => handleFilterChange('department', e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Departments</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={filters.priority}
            onChange={(e) => handleFilterChange('priority', e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Priorities</option>
            {priorityOptions.map(priority => (
              <option key={priority.value} value={priority.value}>
                {priority.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Ideas Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {ideas.map((idea) => {
          const statusInfo = getStatusInfo(idea.status);
          const priorityInfo = getPriorityInfo(idea.priority);
          const StatusIcon = statusInfo.icon;

          return (
            <div key={idea._id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                      {idea.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {idea.department} • {formatDate(idea.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusInfo.label}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityInfo.color}`}>
                      {priorityInfo.label}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-3 mb-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Problem</h4>
                    <p className="text-sm text-gray-600 line-clamp-2">{idea.problem}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Proposed Solution</h4>
                    <p className="text-sm text-gray-600 line-clamp-2">{idea.improvement}</p>
                  </div>
                </div>

                {/* Metadata */}
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>By: {idea.submittedByName}</span>
                  <span>#{idea.submittedByEmployeeNumber}</span>
                </div>

                {/* Estimated Savings */}
                {idea.estimatedSavings > 0 && (
                  <div className="bg-green-50 rounded-lg p-3 mb-4">
                    <div className="text-sm font-medium text-green-800">
                      Estimated Savings: ${idea.estimatedSavings.toLocaleString()}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleViewIdea(idea)}
                    className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </button>
                  
                  <button
                    onClick={() => handleViewIdea(idea)}
                    className="inline-flex items-center px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                  >
                    Review
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {ideas.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No ideas found</h3>
          <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
        </div>
      )}

      {/* Idea Detail Modal */}
      {showModal && selectedIdea && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Idea Details</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ×
                </button>
              </div>

              {/* Idea Information */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {selectedIdea.title}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{selectedIdea.department}</span>
                      <span>•</span>
                      <span>{formatDate(selectedIdea.createdAt)}</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Problem Statement</h4>
                    <p className="text-gray-600">{selectedIdea.problem}</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Proposed Improvement</h4>
                    <p className="text-gray-600">{selectedIdea.improvement}</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Expected Benefit</h4>
                    <p className="text-gray-600">{selectedIdea.benefit}</p>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-700 mb-2">Submission Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Submitted by:</span>
                        <span className="font-medium">{selectedIdea.submittedByName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Employee #:</span>
                        <span className="font-medium">{selectedIdea.submittedByEmployeeNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Department:</span>
                        <span className="font-medium">{selectedIdea.department}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Estimated Savings:</span>
                        <span className="font-medium">${selectedIdea.estimatedSavings.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      <select
                        value={statusUpdate.status}
                        onChange={(e) => setStatusUpdate(prev => ({ ...prev, status: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {statusOptions.map(status => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Priority
                      </label>
                      <select
                        value={statusUpdate.priority}
                        onChange={(e) => setStatusUpdate(prev => ({ ...prev, priority: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {priorityOptions.map(priority => (
                          <option key={priority.value} value={priority.value}>
                            {priority.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Review Comments
                      </label>
                      <textarea
                        value={statusUpdate.reviewComments}
                        onChange={(e) => setStatusUpdate(prev => ({ ...prev, reviewComments: e.target.value }))}
                        rows={4}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Add your review comments..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handleStatusUpdate}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Update Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IdeasManagement;