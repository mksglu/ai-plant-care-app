CREATE TABLE IF NOT EXISTS plant (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100),
    weekly_water_need DECIMAL(5, 2), -- Assuming weekly need in Liters, e.g., 10.50 L
    expected_humidity INT, -- Assuming percentage, e.g., 60
    latitude DECIMAL(9, 6) NOT NULL, -- Sufficient precision for locations
    longitude DECIMAL(9, 6) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
); 