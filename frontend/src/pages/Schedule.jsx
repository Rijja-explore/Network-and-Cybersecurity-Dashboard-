import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { scheduleAPI } from '../services/api';
import { Clock, Calendar, AlertCircle, Plus, Edit2, Trash2, ToggleLeft, ToggleRight, RefreshCw } from 'lucide-react';

const Schedule = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    website: '',
    start_time: '',
    end_time: '',
    days_of_week: [],
    reason: ''
  });

  const daysOfWeek = [
    { value: 0, label: 'Mon' },
    { value: 1, label: 'Tue' },
    { value: 2, label: 'Wed' },
    { value: 3, label: 'Thu' },
    { value: 4, label: 'Fri' },
    { value: 5, label: 'Sat' },
    { value: 6, label: 'Sun' }
  ];

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await scheduleAPI.getAllBlocks();
      setSchedules(response.data);
    } catch (err) {
      console.error('Error fetching schedules:', err);
      setError('Failed to load schedules. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.website || !formData.start_time || !formData.end_time || formData.days_of_week.length === 0) {
      alert('Please fill in all required fields');
      return;
    }

    if (formData.start_time >= formData.end_time) {
      alert('End time must be after start time');
      return;
    }

    try {
      const username = localStorage.getItem('username') || 'admin';
      
      if (editingId) {
        await scheduleAPI.updateBlock(editingId, formData);
      } else {
        await scheduleAPI.createBlock({ ...formData, created_by: username });
      }
      
      await fetchSchedules();
      resetForm();
      setShowForm(false);
    } catch (err) {
      console.error('Error saving schedule:', err);
      alert('Failed to save schedule. Please try again.');
    }
  };

  const handleEdit = (schedule) => {
    setFormData({
      website: schedule.website,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      days_of_week: schedule.days_of_week,
      reason: schedule.reason || ''
    });
    setEditingId(schedule.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this schedule?')) {
      return;
    }

    try {
      await scheduleAPI.deleteBlock(id);
      await fetchSchedules();
    } catch (err) {
      console.error('Error deleting schedule:', err);
      alert('Failed to delete schedule. Please try again.');
    }
  };

  const handleToggle = async (id) => {
    try {
      await scheduleAPI.toggleBlock(id);
      await fetchSchedules();
    } catch (err) {
      console.error('Error toggling schedule:', err);
      alert('Failed to toggle schedule. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      website: '',
      start_time: '',
      end_time: '',
      days_of_week: [],
      reason: ''
    });
    setEditingId(null);
  };

  const toggleDay = (day) => {
    setFormData(prev => ({
      ...prev,
      days_of_week: prev.days_of_week.includes(day)
        ? prev.days_of_week.filter(d => d !== day)
        : [...prev.days_of_week, day]
    }));
  };

  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getDayName = (dayNum) => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days[dayNum];
  };

  return (
    <div className="flex-1 ml-64">
      <Navbar title="Schedule Management" />

      <div className="p-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-soc-text mb-2">Time-Based Website Blocking</h3>
            <p className="text-sm text-gray-400">
              Schedule when specific websites should be blocked automatically
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchSchedules}
              disabled={loading}
              className="px-4 py-2 bg-cyber-card hover:bg-gray-700 border border-cyber-border text-soc-text rounded-lg transition-colors duration-200 font-medium disabled:opacity-50 flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="px-4 py-2 bg-neon-blue hover:bg-blue-500 text-white rounded-lg transition-colors duration-200 font-medium flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>New Schedule</span>
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-900/20 border border-red-500/30 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-red-400">Error</h3>
                <p className="text-sm text-red-300 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-cyber-card border border-cyber-border rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold text-soc-text mb-4">
                {editingId ? 'Edit Schedule' : 'Create New Schedule'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Website */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Website/Domain <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="e.g., facebook.com, youtube.com"
                    className="w-full px-4 py-2 bg-gray-800 border border-cyber-border rounded-lg text-soc-text focus:outline-none focus:border-neon-blue"
                    required
                  />
                </div>

                {/* Time Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Start Time <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800 border border-cyber-border rounded-lg text-soc-text focus:outline-none focus:border-neon-blue"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      End Time <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800 border border-cyber-border rounded-lg text-soc-text focus:outline-none focus:border-neon-blue"
                      required
                    />
                  </div>
                </div>

                {/* Days of Week */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Days <span className="text-red-400">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {daysOfWeek.map((day) => (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => toggleDay(day.value)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          formData.days_of_week.includes(day.value)
                            ? 'bg-neon-blue text-white'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Reason (Optional)
                  </label>
                  <textarea
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="e.g., Study hours, Class time"
                    rows="3"
                    className="w-full px-4 py-2 bg-gray-800 border border-cyber-border rounded-lg text-soc-text focus:outline-none focus:border-neon-blue resize-none"
                  />
                </div>

                {/* Buttons */}
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setShowForm(false);
                    }}
                    className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-neon-blue hover:bg-blue-500 text-white rounded-lg transition-colors duration-200"
                  >
                    {editingId ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Schedules List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-cyber-card border border-cyber-border rounded-xl p-6 animate-pulse">
                <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
                <div className="h-4 bg-gray-700 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : schedules.length === 0 ? (
          <div className="bg-cyber-card border border-cyber-border rounded-xl p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg mb-2">No schedules created yet</p>
            <p className="text-gray-500 text-sm mb-6">
              Create your first schedule to start blocking websites at specific times
            </p>
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="px-6 py-3 bg-neon-blue hover:bg-blue-500 text-white rounded-lg transition-colors duration-200 font-medium inline-flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Create Schedule</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {schedules.map((schedule) => (
              <div
                key={schedule.id}
                className={`bg-cyber-card border rounded-xl p-6 transition-all ${
                  schedule.is_active ? 'border-cyber-border' : 'border-gray-700 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h4 className="text-lg font-bold text-soc-text">{schedule.website}</h4>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          schedule.is_active
                            ? 'bg-green-900/30 text-green-400 border border-green-500/30'
                            : 'bg-gray-700 text-gray-400'
                        }`}
                      >
                        {schedule.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      <div className="flex items-center space-x-2 text-gray-400">
                        <Clock className="w-4 h-4 text-neon-blue" />
                        <span className="text-sm">
                          {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-400">
                        <Calendar className="w-4 h-4 text-neon-cyan" />
                        <span className="text-sm">
                          {schedule.days_of_week.map(d => getDayName(d).substring(0, 3)).join(', ')}
                        </span>
                      </div>
                    </div>

                    {schedule.reason && (
                      <p className="text-sm text-gray-400 mb-2">
                        <span className="font-medium text-gray-300">Reason:</span> {schedule.reason}
                      </p>
                    )}

                    <p className="text-xs text-gray-500">
                      Created by {schedule.created_by} on {new Date(schedule.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleToggle(schedule.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        schedule.is_active
                          ? 'bg-green-900/20 hover:bg-green-900/30 text-green-400'
                          : 'bg-gray-700 hover:bg-gray-600 text-gray-400'
                      }`}
                      title={schedule.is_active ? 'Disable' : 'Enable'}
                    >
                      {schedule.is_active ? (
                        <ToggleRight className="w-5 h-5" />
                      ) : (
                        <ToggleLeft className="w-5 h-5" />
                      )}
                    </button>
                    <button
                      onClick={() => handleEdit(schedule)}
                      className="p-2 bg-blue-900/20 hover:bg-blue-900/30 text-neon-blue rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(schedule.id)}
                      className="p-2 bg-red-900/20 hover:bg-red-900/30 text-red-400 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Schedule;
