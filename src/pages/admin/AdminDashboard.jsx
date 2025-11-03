import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, XCircle, Clock, Mail, User, AlertCircle, Search, Filter } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [hosts, setHosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, verified, unverified
  const [searchQuery, setSearchQuery] = useState('');
  const [verifyingHost, setVerifyingHost] = useState(null);

  // Backend URL - Change if needed
  const API_URL = 'http://localhost:3002/api';

  // Check if user is admin
  if (user?.role?.toLowerCase() !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  // Fetch all hosts
  const fetchHosts = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/users/hosts`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        // Handle both response formats
        const hostsData = response.data.data?.hosts || response.data.data || [];
        setHosts(hostsData);
      }
    } catch (err) {
      console.error('Error fetching hosts:', err);
      setError(err.response?.data?.message || 'Failed to fetch hosts');
    } finally {
      setLoading(false);
    }
  };

  // Verify host
  const handleVerifyHost = async (hostId) => {
    if (!window.confirm('Are you sure you want to verify this host?')) {
      return;
    }

    try {
      setVerifyingHost(hostId);
      const token = localStorage.getItem('token');
      
      const response = await axios.put(
        `${API_URL}/users/verify-host/${hostId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        // Update local state
        setHosts(hosts.map(host => 
          host._id === hostId 
            ? { ...host, hostInfo: { ...host.hostInfo, isVerified: true }, isEmailVerified: true }
            : host
        ));
        
        alert('✅ Host verified successfully!');
      }
    } catch (err) {
      console.error('Error verifying host:', err);
      alert(err.response?.data?.message || 'Failed to verify host');
    } finally {
      setVerifyingHost(null);
    }
  };

  useEffect(() => {
    fetchHosts();
  }, []);

  // Filter hosts
  const filteredHosts = hosts.filter(host => {
    const matchesFilter = 
      filter === 'all' ? true :
      filter === 'verified' ? host.hostInfo?.isVerified :
      filter === 'unverified' ? !host.hostInfo?.isVerified :
      true;

    const matchesSearch = 
      searchQuery === '' ? true :
      host.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      host.email?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  // Stats
  const stats = {
    total: hosts.length,
    verified: hosts.filter(h => h.hostInfo?.isVerified).length,
    unverified: hosts.filter(h => !h.hostInfo?.isVerified).length,
    emailVerified: hosts.filter(h => h.isEmailVerified).length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading hosts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Shield className="h-8 w-8 text-purple-600" />
            Admin Dashboard
          </h1>
          <p className="text-gray-600 mt-2">Manage and verify hosts</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Hosts</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <User className="h-10 w-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Verified Hosts</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{stats.verified}</p>
              </div>
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Pending Verification</p>
                <p className="text-3xl font-bold text-orange-600 mt-1">{stats.unverified}</p>
              </div>
              <Clock className="h-10 w-10 text-orange-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Email Verified</p>
                <p className="text-3xl font-bold text-purple-600 mt-1">{stats.emailVerified}</p>
              </div>
              <Mail className="h-10 w-10 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-500" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Hosts ({stats.total})</option>
                <option value="verified">Verified ({stats.verified})</option>
                <option value="unverified">Unverified ({stats.unverified})</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        {/* Hosts Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {filteredHosts.length === 0 ? (
            <div className="text-center py-12">
              <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hosts found</h3>
              <p className="text-gray-500">
                {searchQuery ? 'Try adjusting your search' : 'No hosts registered yet'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Host Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Verification Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredHosts.map((host) => (
                    <tr key={host._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                            {host.name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{host.name}</div>
                            <div className="text-xs text-gray-500">ID: {host._id.slice(-6)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{host.email}</div>
                        {host.phone && (
                          <div className="text-xs text-gray-500">{host.phone}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {host.isEmailVerified ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                            <CheckCircle className="h-3 w-3" />
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                            <Clock className="h-3 w-3" />
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {host.hostInfo?.isVerified ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                            <CheckCircle className="h-3 w-3" />
                            Verified Host
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                            <Clock className="h-3 w-3" />
                            Not Verified
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {!host.hostInfo?.isVerified ? (
                          <button
                            onClick={() => handleVerifyHost(host._id)}
                            disabled={verifyingHost === host._id}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {verifyingHost === host._id ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Verifying...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4" />
                                Verify Host
                              </>
                            )}
                          </button>
                        ) : (
                          <span className="text-sm text-gray-500 font-medium">Already Verified</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center text-sm text-gray-500">
          Showing {filteredHosts.length} of {hosts.length} hosts
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;