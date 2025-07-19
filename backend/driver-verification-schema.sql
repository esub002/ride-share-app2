-- Driver Verification Schema
-- This schema supports comprehensive driver verification including SSN, license, insurance, and background checks

-- Driver verifications table
CREATE TABLE IF NOT EXISTS driver_verifications (
    id SERIAL PRIMARY KEY,
    driver_id INTEGER REFERENCES drivers(id) ON DELETE CASCADE,
    phone VARCHAR(20),
    ssn VARCHAR(11),
    license_number VARCHAR(50),
    state VARCHAR(2),
    insurance_number VARCHAR(100),
    insurance_expiry DATE,
    verification_data JSONB,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    otp VARCHAR(6),
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Enhanced drivers table with verification fields
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS verification_data JSONB;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS ssn VARCHAR(11);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS license_number VARCHAR(50);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS license_state VARCHAR(2);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS insurance_number VARCHAR(100);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS insurance_expiry DATE;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS insurance_provider VARCHAR(100);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS background_check_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS background_check_date TIMESTAMP;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS documents JSONB;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS vehicle_info JSONB;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS emergency_contact JSONB;

-- Driver documents table
CREATE TABLE IF NOT EXISTS driver_documents (
    id SERIAL PRIMARY KEY,
    driver_id INTEGER REFERENCES drivers(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL,
    file_name VARCHAR(255),
    file_url TEXT,
    file_size INTEGER,
    mime_type VARCHAR(100),
    verification_status VARCHAR(20) DEFAULT 'pending',
    uploaded_at TIMESTAMP DEFAULT NOW(),
    verified_at TIMESTAMP,
    verified_by INTEGER REFERENCES admins(id),
    notes TEXT
);

-- Background check results table
CREATE TABLE IF NOT EXISTS background_checks (
    id SERIAL PRIMARY KEY,
    driver_id INTEGER REFERENCES drivers(id) ON DELETE CASCADE,
    check_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,
    criminal_record VARCHAR(20),
    driving_record VARCHAR(20),
    drug_test VARCHAR(20),
    medical_check VARCHAR(20),
    credit_check VARCHAR(20),
    employment_history VARCHAR(20),
    references_check VARCHAR(20),
    check_date TIMESTAMP DEFAULT NOW(),
    expiry_date TIMESTAMP,
    notes TEXT,
    raw_data JSONB
);

-- Insurance verification table
CREATE TABLE IF NOT EXISTS insurance_verifications (
    id SERIAL PRIMARY KEY,
    driver_id INTEGER REFERENCES drivers(id) ON DELETE CASCADE,
    policy_number VARCHAR(100) NOT NULL,
    provider VARCHAR(100),
    coverage_type VARCHAR(50),
    liability_limit DECIMAL(10,2),
    property_limit DECIMAL(10,2),
    expiry_date DATE,
    verification_status VARCHAR(20) DEFAULT 'pending',
    verified_at TIMESTAMP,
    notes TEXT
);

-- License verification table
CREATE TABLE IF NOT EXISTS license_verifications (
    id SERIAL PRIMARY KEY,
    driver_id INTEGER REFERENCES drivers(id) ON DELETE CASCADE,
    license_number VARCHAR(50) NOT NULL,
    state VARCHAR(2) NOT NULL,
    license_type VARCHAR(50),
    expiry_date DATE,
    restrictions TEXT[],
    verification_status VARCHAR(20) DEFAULT 'pending',
    verified_at TIMESTAMP,
    dmv_response JSONB,
    notes TEXT
);

-- Phone verification table
CREATE TABLE IF NOT EXISTS phone_verifications (
    id SERIAL PRIMARY KEY,
    driver_id INTEGER REFERENCES drivers(id) ON DELETE CASCADE,
    phone_number VARCHAR(20) NOT NULL,
    otp VARCHAR(6),
    verification_status VARCHAR(20) DEFAULT 'pending',
    attempts INTEGER DEFAULT 0,
    expires_at TIMESTAMP,
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_driver_verifications_driver_id ON driver_verifications(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_verifications_type ON driver_verifications(type);
CREATE INDEX IF NOT EXISTS idx_driver_verifications_status ON driver_verifications(status);
CREATE INDEX IF NOT EXISTS idx_driver_documents_driver_id ON driver_documents(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_documents_type ON driver_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_background_checks_driver_id ON background_checks(driver_id);
CREATE INDEX IF NOT EXISTS idx_background_checks_status ON background_checks(status);
CREATE INDEX IF NOT EXISTS idx_insurance_verifications_driver_id ON insurance_verifications(driver_id);
CREATE INDEX IF NOT EXISTS idx_license_verifications_driver_id ON license_verifications(driver_id);
CREATE INDEX IF NOT EXISTS idx_phone_verifications_driver_id ON phone_verifications(driver_id);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_driver_verifications_updated_at 
    BEFORE UPDATE ON driver_verifications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Views for easy querying
CREATE OR REPLACE VIEW driver_verification_summary AS
SELECT 
    d.id as driver_id,
    d.first_name,
    d.last_name,
    d.email,
    d.phone,
    d.verification_status,
    d.background_check_status,
    pv.verification_status as phone_verified,
    lv.verification_status as license_verified,
    iv.verification_status as insurance_verified,
    bc.status as background_check_status,
    COUNT(dd.id) as documents_uploaded
FROM drivers d
LEFT JOIN phone_verifications pv ON d.id = pv.driver_id
LEFT JOIN license_verifications lv ON d.id = lv.driver_id
LEFT JOIN insurance_verifications iv ON d.id = iv.driver_id
LEFT JOIN background_checks bc ON d.id = bc.driver_id
LEFT JOIN driver_documents dd ON d.id = dd.driver_id
GROUP BY d.id, d.first_name, d.last_name, d.email, d.phone, d.verification_status, 
         d.background_check_status, pv.verification_status, lv.verification_status, 
         iv.verification_status, bc.status;

-- Insert sample data for testing
INSERT INTO driver_verifications (phone, type, status, created_at) VALUES
('+1234567890', 'phone_verification', 'completed', NOW()),
('+1234567891', 'phone_verification', 'pending', NOW());

-- Update existing drivers table structure if needed
DO $$
BEGIN
    -- Add columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'verification_status') THEN
        ALTER TABLE drivers ADD COLUMN verification_status VARCHAR(20) DEFAULT 'pending';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'verification_data') THEN
        ALTER TABLE drivers ADD COLUMN verification_data JSONB;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'documents') THEN
        ALTER TABLE drivers ADD COLUMN documents JSONB;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'vehicle_info') THEN
        ALTER TABLE drivers ADD COLUMN vehicle_info JSONB;
    END IF;
END $$; 