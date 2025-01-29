import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { CheckCircle, XCircle, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

type DocumentVerification = {
  id: string;
  document_type: string;
  file_path: string;
  verified: boolean;
  profiles: {
    full_name: string;
    email: string;
    current_institution: string;
  };
};

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<DocumentVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<DocumentVerification | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchDocuments();
  }, [user, navigate]);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          profiles:profile_id (
            full_name,
            email,
            current_institution
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error: any) {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async (doc: DocumentVerification) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(doc.file_path, 60);

      if (error) throw error;
      setPreviewUrl(data.signedUrl);
      setSelectedDoc(doc);
    } catch (error: any) {
      toast.error('Failed to load preview');
    }
  };

  const handleVerify = async (docId: string, verified: boolean) => {
    try {
      const { error } = await supabase
        .from('documents')
        .update({ verified })
        .eq('id', docId);

      if (error) throw error;
      toast.success(`Document ${verified ? 'verified' : 'rejected'} successfully`);
      fetchDocuments();
    } catch (error: any) {
      toast.error('Failed to update document status');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-gray-600">Loading documents...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Document Verification</h1>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          {documents.map((doc) => (
            <div key={doc.id} className="bg-white p-4 rounded-lg shadow-md">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-medium text-gray-900">{doc.profiles.full_name}</h3>
                  <p className="text-sm text-gray-600">{doc.profiles.email}</p>
                  <p className="text-sm text-gray-600">{doc.profiles.current_institution}</p>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  doc.verified 
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {doc.verified ? 'Verified' : 'Pending'}
                </span>
              </div>

              <p className="text-sm font-medium text-gray-700 mb-2">
                {doc.document_type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </p>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePreview(doc)}
                  className="flex items-center space-x-1 text-sm text-indigo-600 hover:text-indigo-800"
                >
                  <Eye className="h-4 w-4" />
                  <span>Preview</span>
                </button>

                {!doc.verified && (
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleVerify(doc.id, true)}
                      className="flex items-center space-x-1 text-sm text-green-600 hover:text-green-800"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>Verify</span>
                    </button>
                    <button
                      onClick={() => handleVerify(doc.id, false)}
                      className="flex items-center space-x-1 text-sm text-red-600 hover:text-red-800"
                    >
                      <XCircle className="h-4 w-4" />
                      <span>Reject</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {documents.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg">
              <p className="text-gray-600">No documents to verify.</p>
            </div>
          )}
        </div>

        {previewUrl && selectedDoc && (
          <div className="bg-white p-4 rounded-lg shadow-md sticky top-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-medium text-gray-900">
                Document Preview
              </h3>
              <button
                onClick={() => setPreviewUrl(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                Close
              </button>
            </div>
            <div className="aspect-[3/4] w-full bg-gray-100 rounded-lg overflow-hidden">
              {previewUrl.endsWith('.pdf') ? (
                <iframe
                  src={previewUrl}
                  className="w-full h-full"
                  title="Document preview"
                />
              ) : (
                <img
                  src={previewUrl}
                  alt="Document preview"
                  className="w-full h-full object-contain"
                />
              )}
            </div>
            <div className="mt-4">
              <h4 className="font-medium text-gray-900 mb-1">
                {selectedDoc.profiles.full_name}
              </h4>
              <p className="text-sm text-gray-600">
                {selectedDoc.document_type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}