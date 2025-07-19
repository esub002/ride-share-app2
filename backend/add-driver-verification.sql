ALTER TABLE drivers ADD COLUMN IF NOT EXISTS verification_status VARCHAR(32) DEFAULT 'pending';
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS verification_reason TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS license_image TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS registration_image TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS insurance_image TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS background_check_status VARCHAR(32) DEFAULT 'pending'; 