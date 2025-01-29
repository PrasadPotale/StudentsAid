/*
  # Initial Schema Setup for Student Donation Platform

  1. New Tables
    - `profiles`
      - Student profiles with personal and academic details
    - `documents`
      - Student documents (admission bills, marksheets)
    - `donation_requests`
      - Donation requests with type and amount
    - `donations`
      - Actual donations made by donors
    
  2. Enums
    - `request_status`
    - `document_type`
    - `donation_type`
    
  3. Security
    - RLS policies for all tables
    - Secure access patterns for students and donors
*/

-- Create custom types
CREATE TYPE request_status AS ENUM ('open', 'in_progress', 'approved', 'completed');
CREATE TYPE document_type AS ENUM ('admission_bill', 'twelfth_marksheet', 'graduation_marksheet', 'other');
CREATE TYPE donation_type AS ENUM ('food', 'books', 'room_rent', 'medical');

-- Profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  is_student BOOLEAN DEFAULT true,
  upi_id TEXT,
  current_institution TEXT,
  course TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) NOT NULL,
  document_type document_type NOT NULL,
  file_path TEXT NOT NULL,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Donation requests table
CREATE TABLE donation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id) NOT NULL,
  donation_type donation_type NOT NULL,
  amount DECIMAL NOT NULL,
  remaining_amount DECIMAL,
  status request_status DEFAULT 'open',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Donations table
CREATE TABLE donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES donation_requests(id) NOT NULL,
  donor_id UUID REFERENCES profiles(id) NOT NULL,
  amount DECIMAL NOT NULL,
  transaction_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE donation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Documents policies
CREATE POLICY "Students can manage their own documents"
  ON documents FOR ALL
  USING (profile_id = auth.uid());

CREATE POLICY "Donors can view verified documents"
  ON documents FOR SELECT
  USING (verified = true);

-- Donation requests policies
CREATE POLICY "Students can manage their own requests"
  ON donation_requests FOR ALL
  USING (student_id = auth.uid());

CREATE POLICY "Everyone can view donation requests"
  ON donation_requests FOR SELECT
  TO authenticated
  USING (true);

-- Donations policies
CREATE POLICY "Donors can create donations"
  ON donations FOR INSERT
  WITH CHECK (auth.uid() = donor_id);

CREATE POLICY "Users can view related donations"
  ON donations FOR SELECT
  USING (
    auth.uid() = donor_id OR 
    auth.uid() IN (
      SELECT student_id 
      FROM donation_requests 
      WHERE id = donations.request_id
    )
  );