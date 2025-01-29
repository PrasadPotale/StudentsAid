import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Eye, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

type DonationRequest = {
  id: string;
  student_id: string;
  donation_type: 'food' | 'books' | 'room_rent' | 'medical';
  amount: number;
  remaining_amount: number;
  status: 'open' | 'in_progress' | 'approved' | 'completed';
  description: string;
  created_at: string;
  profiles: {
    full_name: string;
    current_institution: string;
    upi_id: string;
  };
  documents: {
    id: string;
    document_type: string;
    file_path: string;
    verified: boolean;
  }[];
};

export default function DonationRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<DonationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<DonationRequest | null>(null);
  const [donationAmount, setDonationAmount] = useState<number>(0);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('donation_requests')
        .select(`
          *,
          profiles:student_id (
            full_name,
            current_institution,
            upi_id
          ),
          documents:student_id (
            id,
            document_type,
            file_path,
            verified
          )
        `)
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error: any) {
      toast.error('Failed to load donation requests');
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewDocument = async (doc: DonationRequest['documents'][0]) => {
    if (previewUrls[doc.id]) {
      return;
    }

    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(doc.file_path, 60);

      if (error) throw error;
      setPreviewUrls(prev => ({
        ...prev,
        [doc.id]: data.signedUrl
      }));
    } catch (error: any) {
      toast.error('Failed to load document preview');
    }
  };

  const handleDonate = async (request: DonationRequest) => {
    if (!user) {
      toast.error('Please login to donate');
      return;
    }

    setSelectedRequest(request);
    setDonationAmount(0);
    setShowDonationModal(true);
  };

  const handleDonationSubmit = async () => {
    if (!selectedRequest || !user) return;

    if (donationAmount <= 0 || donationAmount > selectedRequest.remaining_amount) {
      toast.error('Invalid donation amount');
      return;
    }

    try {
      const { error: donationError } = await supabase
        .from('donations')
        .insert({
          request_id: selectedRequest.id,
          donor_id: user.id,
          amount: donationAmount,
        });

      if (donationError) throw donationError;

      const newRemainingAmount = selectedRequest.remaining_amount - donationAmount;
      const newStatus = newRemainingAmount === 0 ? 'completed' : 'in_progress';

      const { error: updateError } = await supabase
        .from('donation_requests')
        .update({
          remaining_amount: newRemainingAmount,
          status: newStatus,
        })
        .eq('id', selectedRequest.id);

      if (updateError) throw updateError;

      toast.success('Donation successful! Thank you for your contribution.');
      setShowDonationModal(false);
      fetchRequests();
    } catch (error: any) {
      toast.error('Failed to process donation');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-gray-600">Loading requests...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Open Donation Requests</h1>

      <div className="space-y-6">
        {requests.map((request) => {
          const hasVerifiedDocuments = request.documents.some(doc => doc.verified);
          
          return (
            <div key={request.id} className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {request.profiles.full_name}
                  </h3>
                  <p className="text-gray-600">{request.profiles.current_institution}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                    {request.donation_type.replace('_', ' ')}
                  </span>
                  {!hasVerifiedDocuments && (
                    <div className="text-amber-500 flex items-center" title="Documents pending verification">
                      <AlertCircle className="h-5 w-5" />
                    </div>
                  )}
                </div>
              </div>

              <p className="text-gray-700 mb-4">{request.description}</p>

              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Verification Documents</h4>
                <div className="flex flex-wrap gap-2">
                  {request.documents.map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => handlePreviewDocument(doc)}
                      className={`inline-flex items-center px-3 py-1 rounded-md text-sm ${
                        doc.verified
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      {doc.document_type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </button>
                  ))}
                </div>
                {Object.keys(previewUrls).length > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    {Object.entries(previewUrls).map(([docId, url]) => {
                      const doc = request.documents.find(d => d.id === docId);
                      if (!doc) return null;
                      
                      return (
                        <div key={docId} className="relative">
                          <h5 className="text-sm font-medium text-gray-700 mb-1">
                            {doc.document_type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                          </h5>
                          {url.endsWith('.pdf') ? (
                            <iframe
                              src={url}
                              className="w-full h-64 rounded border border-gray-200"
                              title={`Document preview - ${doc.document_type}`}
                            />
                          ) : (
                            <img
                              src={url}
                              alt={`Document preview - ${doc.document_type}`}
                              className="w-full h-64 object-cover rounded border border-gray-200"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">
                    Remaining Amount: ₹{request.remaining_amount}
                  </p>
                  <p className="text-sm text-gray-600">
                    Total Amount: ₹{request.amount}
                  </p>
                </div>
                <button
                  onClick={() => handleDonate(request)}
                  disabled={!hasVerifiedDocuments}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Contribute
                </button>
              </div>
            </div>
          );
        })}

        {requests.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-600">No open donation requests at the moment.</p>
          </div>
        )}
      </div>

      {showDonationModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Make a Donation
            </h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Recipient: {selectedRequest.profiles.full_name}
              </p>
              <p className="text-sm text-gray-600 mb-4">
                UPI ID: {selectedRequest.profiles.upi_id}
              </p>
              
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount (₹)
              </label>
              <input
                type="number"
                value={donationAmount}
                onChange={(e) => setDonationAmount(Math.min(parseFloat(e.target.value), selectedRequest.remaining_amount))}
                min="0"
                max={selectedRequest.remaining_amount}
                className="w-full px-3 py-2 border rounded-md"
              />
              <p className="text-xs text-gray-500 mt-1">
                Maximum amount: ₹{selectedRequest.remaining_amount}
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDonationModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleDonationSubmit}
                disabled={donationAmount <= 0 || donationAmount > selectedRequest.remaining_amount}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                Confirm Donation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}