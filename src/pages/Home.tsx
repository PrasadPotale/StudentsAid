import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Heart } from 'lucide-react';

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Supporting Students in Urban Areas
        </h1>
        <p className="text-xl text-gray-600">
          Connect students in need with generous donors who want to make a difference
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <div className="flex items-center mb-4">
            <GraduationCap className="h-8 w-8 text-indigo-600 mr-3" />
            <h2 className="text-2xl font-semibold">For Students</h2>
          </div>
          <p className="text-gray-600 mb-6">
            Register with your academic details and documents to request support for food,
            books, room rent, or medical needs.
          </p>
          <Link
            to="/register"
            className="block w-full text-center bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700"
          >
            Register as Student
          </Link>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-md">
          <div className="flex items-center mb-4">
            <Heart className="h-8 w-8 text-rose-600 mr-3" />
            <h2 className="text-2xl font-semibold">For Donors</h2>
          </div>
          <p className="text-gray-600 mb-6">
            Browse verified student requests and contribute directly to their education
            and well-being through secure UPI payments.
          </p>
          <Link
            to="/donations"
            className="block w-full text-center bg-rose-600 text-white py-2 px-4 rounded-md hover:bg-rose-700"
          >
            View Donation Requests
          </Link>
        </div>
      </div>

      <div className="bg-gray-50 p-8 rounded-lg border border-gray-200">
        <h3 className="text-xl font-semibold mb-4">How It Works</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <div className="text-lg font-medium text-indigo-600 mb-2">1. Register</div>
            <p className="text-gray-600">
              Students register with their academic details and upload necessary documents
              for verification.
            </p>
          </div>
          <div>
            <div className="text-lg font-medium text-indigo-600 mb-2">2. Request</div>
            <p className="text-gray-600">
              Create specific donation requests for educational needs with required amounts.
            </p>
          </div>
          <div>
            <div className="text-lg font-medium text-indigo-600 mb-2">3. Receive</div>
            <p className="text-gray-600">
              Donors review requests and contribute directly through UPI payments.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}