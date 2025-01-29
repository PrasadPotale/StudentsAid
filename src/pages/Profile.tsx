import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Upload, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

type Profile = {
  full_name: string;
  email: string;
  phone: string;
  is_student: boolean;
  upi_id: string;
  current_institution: string;
  course: string;
};

type Document = {
  id: string;
  document_type: 'admission_bill' | 'twelfth_marksheet' | 'graduation_marksheet' | 'other';
  file_path: string;
  verified: boolean;
};

type DonationRequest = {
  id: string;
  donation_type: 'food' | 'books' | 'room_rent' | 'medical';
  amount: number;
  description: string;
  status: 'open' | 'in_progress' | 'approved' | 'completed';
};

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [requests, setRequests] = useState<DonationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewRequestForm, setShowNewRequestForm] = useState(false);
  const [newRequest, setNewRequest] = useState({
    donation_type: 'food' as const,
    amount: 0,
    description: '',
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    fetchProfile();
    fetchDocuments();
    fetchRequests();
  }, [user, navigate]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      toast.error('Failed to load profile');
    }
  };

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('profile_id', user?.id);

      if (error) throw error;
      setDocuments(data || []);
    } catch (error: any) {
      toast.error('Failed to load documents');
    }
  };

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('donation_requests')
        .select('*')
        .eq('student_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error: any) {
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, documentType: Document['document_type']) => {
    if (!e.target.files || !e.target.files[0]) return;

    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${user?.id}/${documentType}-${Math.random()}.${fileExt}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from('documents')
        .insert({
          profile_id: user?.id,
          document_type: documentType,
          file_path: fileName,
        });

      if (dbError) throw dbError;

      toast.success('Document uploaded successfully');
      fetchDocuments();
    } catch (error: any) {
      toast.error('Failed to upload document');
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('donation_requests')
        .insert({
          student_id: user?.id,
          ...newRequest,
          remaining_amount: newRequest.amount,
          status: 'open',
        });

      if (error) throw error;

      toast.success('Donation request created successfully');
      setShowNewRequestForm(false);
      setNewRequest({ donation_type: 'food', amount: 0, description: '' });
      fetchRequests();
    } catch (error: any) {
      toast.error('Failed to create request');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-gray-600">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Complete Your Profile</h1>
        <p className="text-gray-600 mb-6">
          Please complete your registration to access all features.
        </p>
        <button
          onClick={() => navigate('/register')}
          className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700"
        >
          Complete Registration
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Profile</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Full Name</h3>
            <p className="mt-1 text-lg text-gray-900">{profile.full_name}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Email</h3>
            <p className="mt-1 text-lg text-gray-900">{profile.email}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Phone</h3>
            <p className="mt-1 text-lg text-gray-900">{profile.phone}</p>
          </div>

          {profile.is_student && (
            <>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Institution</h3>
                <p className="mt-1 text-lg text-gray-900">{profile.current_institution}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Course</h3>
                <p className="mt-1 text-lg text-gray-900">{profile.course}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">UPI ID</h3>
                <p className="mt-1 text-lg text-gray-900">{profile.upi_id}</p>
              </div>
            </>
          )}
        </div>
      </div>

      {profile.is_student && (
        <>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Documents</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {(['admission_bill', 'twelfth_marksheet', 'graduation_marksheet', 'other'] as const).map((type) => {
                const existingDoc = documents.find(d => d.document_type === type);
                return (
                  <div key={type} className="border rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">
                      {type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </h3>
                    {existingDoc ? (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Uploaded</span>
                        {existingDoc.verified && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Verified
                          </span>
                        )}
                      </div>
                    ) : (
                      <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-500">
                        <div className="space-y-1 text-center">
                          <Upload className="mx-auto h-8 w-8 text-gray-400" />
                          <div className="text-sm text-gray-600">Upload Document</div>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileUpload(e, type)}
                        />
                      </label>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Your Donation Requests</h2>
              <button
                onClick={() => setShowNewRequestForm(!showNewRequestForm)}
                className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                <Plus className="h-5 w-5" />
                <span>New Request</span>
              </button>
            </div>

            {showNewRequestForm && (
              <form onSubmit={handleCreateRequest} className="mb-8 bg-gray-50 p-6 rounded-lg">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Type</label>
                    <select
                      value={newRequest.donation_type}
                      onChange={(e) => setNewRequest(prev => ({ ...prev, donation_type: e.target.value as any }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      <option value="food">Food</option>
                      <option value="books">Books</option>
                      <option value="room_rent">Room Rent</option>
                      <option value="medical">Medical</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Amount (₹)</label>
                    <input
                      type="number"
                      value={newRequest.amount}
                      onChange={(e) => setNewRequest(prev => ({ ...prev, amount: parseFloat(e.target.value) }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      min="0"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      value={newRequest.description}
                      onChange={(e) => setNewRequest(prev => ({ ...prev, description: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      rows={3}
                      required
                    />
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowNewRequestForm(false)}
                      className="bg-white text-gray-700 px-4 py-2 rounded-md border hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                    >
                      Create Request
                    </button>
                  </div>
                </div>
              </form>
            )}

            <div className="space-y-4">
              {requests.map((request) => (
                <div key={request.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      {request.donation_type.replace('_', ' ')}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {request.status}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">{request.description}</p>
                  <div className="text-sm text-gray-500">
                    Amount: ₹{request.amount}
                  </div>
                </div>
              ))}

              {requests.length === 0 && !showNewRequestForm && (
                <p className="text-center text-gray-600 py-4">
                  No donation requests yet. Create one to get started!
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}